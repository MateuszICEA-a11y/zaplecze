import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const hostGlobal = globalThis;

const sourcePath = fileURLToPath(new URL('../../tools-src/fanout-explorer.js', import.meta.url));
const source = readFileSync(sourcePath, 'utf8');
const startMarker = '  /* ---------- start ---------- */';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.has(key) ? this.values.get(key)! : null;
  }

  setItem(key: string, value: string) {
    this.values.set(String(key), String(value));
  }

  removeItem(key: string) {
    this.values.delete(String(key));
  }

  clear() {
    this.values.clear();
  }

  valuesSnapshot() {
    return Array.from(this.values.values());
  }
}

type Recorder = {
  tapStream: (body: ReadableStream<Uint8Array>, hint?: string) => Promise<void> | void;
  installStreamHook: () => void;
  load: (force?: boolean) => void;
  startLive: () => void;
  stopLive: () => void;
  build: (conversation: unknown, recorded?: unknown[]) => BuildResult;
  brandHtml: () => string;
  readQueries: (id: string) => Array<Record<string, unknown>>;
  recordBatch: (convId: string, msgId: string, queries: string[], types?: string[] | null) => void;
  state: {
    brand?: string;
    busy: boolean;
    live: boolean;
    model: unknown;
    nextReadAt?: number;
    retry?: unknown;
    capture: {
      storageError: boolean;
      handoffs?: number;
      wsConnections?: number;
      wsFrames?: number;
      wsChunks?: number;
    };
  };
};

type BuildResult = {
  turns: Array<{ rounds: Array<{ searches: Array<Record<string, unknown>> }> }>;
  rows: Array<Record<string, unknown>>;
  stats: { hidden: number; recordedRounds: number };
  waitingQueries: string[];
};

type Sandbox = Record<string, unknown> & {
  fetch: (input?: unknown, init?: unknown) => Promise<Response>;
};

type FakeSocketListener = (event: { data: unknown }) => void;

type FakeMessageEventInstance = {
  readonly data: unknown;
  readonly target: unknown;
  readonly currentTarget: unknown;
};

type FakeMessageEventClass = {
  new (data: unknown, target?: unknown, currentTarget?: unknown): FakeMessageEventInstance;
  prototype: FakeMessageEventInstance;
};

type FakeWebSocketInstance = {
  readonly url: string;
  readonly sent: unknown[][];
  readonly nativeSend: ReturnType<typeof vi.fn>;
  sendResult: unknown;
  sendError: Error | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  send: (...args: unknown[]) => unknown;
  addEventListener: (type: string, listener: FakeSocketListener) => void;
  removeEventListener: (type: string, listener: FakeSocketListener) => void;
  emit: (data: unknown) => void;
  emitNative: (
    data: unknown,
    target?: unknown,
    currentTarget?: unknown
  ) => FakeMessageEventInstance;
};

type FakeWebSocketClass = {
  new (url: string): FakeWebSocketInstance;
  instances: FakeWebSocketInstance[];
};

type Harness = {
  api: Recorder;
  sandbox: Sandbox;
  storage: MemoryStorage;
  WebSocket: FakeWebSocketClass;
  MessageEvent: FakeMessageEventClass;
};

function createFakeMessageEvent(): FakeMessageEventClass {
  class LocalFakeMessageEvent {
    readonly target: unknown;
    readonly currentTarget: unknown;
    private readonly value: unknown;

    constructor(data: unknown, target: unknown = null, currentTarget: unknown = target) {
      this.value = data;
      this.target = target;
      this.currentTarget = currentTarget;
    }
  }
  Object.defineProperty(LocalFakeMessageEvent.prototype, 'data', {
    configurable: true,
    enumerable: true,
    get() {
      return this.value;
    },
  });
  return LocalFakeMessageEvent as unknown as FakeMessageEventClass;
}

function createFakeWebSocket(MessageEvent: FakeMessageEventClass): FakeWebSocketClass {
  class LocalFakeWebSocket {
    static instances: FakeWebSocketInstance[] = [];

    readonly url: string;
    readonly sent: unknown[][] = [];
    readonly nativeSend = vi.fn((...args: unknown[]) => {
      this.sent.push(args);
      return this.sendResult;
    });
    sendResult: unknown = 'native-send-result';
    sendError: Error | null = null;
    onmessage: ((event: { data: unknown }) => void) | null = null;
    private listeners = new Map<string, Set<FakeSocketListener>>();

    constructor(url: string) {
      this.url = url;
      LocalFakeWebSocket.instances.push(this);
    }

    send(...args: unknown[]) {
      if (this.sendError) throw this.sendError;
      return this.nativeSend(...args);
    }

    addEventListener(type: string, listener: FakeSocketListener) {
      let listeners = this.listeners.get(type);
      if (!listeners) {
        listeners = new Set();
        this.listeners.set(type, listeners);
      }
      listeners.add(listener);
    }

    removeEventListener(type: string, listener: FakeSocketListener) {
      this.listeners.get(type)?.delete(listener);
    }

    emit(data: unknown) {
      const event = { data };
      this.listeners.get('message')?.forEach((listener) => listener(event));
      this.onmessage?.(event);
    }

    emitNative(data: unknown, target: unknown = this, currentTarget: unknown = target) {
      const event = new MessageEvent(data, target, currentTarget);
      this.listeners.get('message')?.forEach((listener) => listener(event));
      this.onmessage?.(event);
      return event;
    }
  }
  return LocalFakeWebSocket;
}

function createHarness(): Harness {
  const storage = new MemoryStorage();
  const MessageEvent = createFakeMessageEvent();
  const WebSocket = createFakeWebSocket(MessageEvent);
  const sandbox: Sandbox = {
    URL,
    Date,
    MessageEvent,
    Request,
    Response,
    TextDecoder,
    TextEncoder,
    ReadableStream,
    setTimeout: (...args: Parameters<typeof setTimeout>) => hostGlobal.setTimeout(...args),
    clearTimeout: (...args: Parameters<typeof clearTimeout>) => hostGlobal.clearTimeout(...args),
    setInterval: (...args: Parameters<typeof setInterval>) => hostGlobal.setInterval(...args),
    clearInterval: (...args: Parameters<typeof clearInterval>) => hostGlobal.clearInterval(...args),
    localStorage: storage,
    location: {
      hostname: 'chatgpt.com',
      pathname: '/',
      href: 'https://chatgpt.com/',
      origin: 'https://chatgpt.com',
    },
    navigator: {},
    document: {
      getElementById: () => null,
      querySelector: () => null,
      createElement: () => ({ style: {}, appendChild: () => {}, remove: () => {} }),
      body: { appendChild: () => {} },
      head: { appendChild: () => {} },
      addEventListener: () => {},
      removeEventListener: () => {},
    },
    alert: vi.fn(),
    fetch: vi.fn(() => Promise.reject(new Error('unexpected network request'))),
    WebSocket,
  };
  // The bookmarklet uses window.fetch while the rest of the browser globals are
  // looked up directly. Making window the vm global keeps those references in sync.
  sandbox.window = sandbox;

  const markerAt = source.indexOf(startMarker);
  if (markerAt < 0) throw new Error('fanout explorer start marker not found');
  const testTail = `
${startMarker}
  render = function () {};
  state.busy = true;
  globalThis.__fanoutRecorderTest = { tapStream: tapStream, installStreamHook: installStreamHook, load: load, startLive: startLive, stopLive: stopLive, build: build, brandHtml: brandHtml, readQueries: readQueries, recordBatch: recordBatch, state: state };
})();
`;
  vm.runInNewContext(source.slice(0, markerAt) + testTail, sandbox, { filename: sourcePath });
  sandbox.__codexSetTimeout = sandbox.setTimeout;
  sandbox.__codexClearTimeout = sandbox.clearTimeout;
  sandbox.__codexSetInterval = sandbox.setInterval;
  sandbox.__codexClearInterval = sandbox.clearInterval;
  vm.runInNewContext(
    'globalThis.setTimeout = __codexSetTimeout; globalThis.clearTimeout = __codexClearTimeout; globalThis.setInterval = __codexSetInterval; globalThis.clearInterval = __codexClearInterval;',
    sandbox,
    { filename: sourcePath }
  );
  return {
    api: sandbox.__fanoutRecorderTest as Recorder,
    sandbox,
    storage,
    WebSocket,
    MessageEvent,
  };
}

function streamFrom(...chunks: string[]) {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      chunks.forEach((chunk) => controller.enqueue(encoder.encode(chunk)));
      controller.close();
    },
  });
}

function frame(payload: unknown, eol = '\n') {
  return `data: ${JSON.stringify(payload)}${eol}${eol}`;
}

const HANDOFF_CONVERSATION = 'conv-handoff';
const HANDOFF_TOPIC = 'conversation-turn-test';
const HANDOFF_TOKEN = 'synthetic-do-not-store';

function handoffBootstrap() {
  return streamFrom(
    frame({ type: 'delta_encoding', data: 'v1' }) +
      frame({
        type: 'resume_conversation_token',
        token: HANDOFF_TOKEN,
        conversation_id: HANDOFF_CONVERSATION,
      }) +
      frame({
        type: 'stream_handoff',
        options: [
          { type: 'subscribe_ws_topic', topic_id: HANDOFF_TOPIC },
          { type: 'resume_sse_endpoint', topic_id: HANDOFF_TOPIC },
        ],
      }) +
      'data: [DONE]\n\n'
  );
}

function rossettaMessage(topic: string, encodedItem: string) {
  return {
    type: 'message',
    topic_id: topic,
    payload: {
      type: 'conversation-turn-stream',
      payload: { type: 'stream-item', encoded_item: encodedItem },
    },
  };
}

function rossettaEnvelope(topic: string, encodedItem: string) {
  return [rossettaMessage(topic, encodedItem)];
}

function subscribeReply(topic: string, catchups: unknown[]) {
  return [{ type: 'reply', reply: { type: 'subscribe', topic_id: topic, catchups } }];
}

function subscribeCommand(topic: string) {
  return JSON.stringify([{ id: 1, command: { type: 'subscribe', topic_id: topic } }]);
}

async function bootstrapHandoff(harness: Harness) {
  await tap(harness, handoffBootstrap());
  await delay(0);
}

async function delay(ms = 0) {
  await new Promise<void>((resolve) => setTimeout(resolve, ms));
}

async function flushMicrotasks() {
  for (let i = 0; i < 20; i++) await Promise.resolve();
}

function setConversation(harness: Harness, id: string) {
  (harness.sandbox.location as { pathname: string }).pathname = `/c/${id}`;
}

function emptyConversationResponse() {
  return new Response(JSON.stringify({ mapping: {}, current_node: null }), {
    headers: { 'content-type': 'application/json' },
  });
}

function sessionResponse() {
  return { ok: true, json: () => Promise.resolve({}) } as unknown as Response;
}

function rateLimitResponse(retryAfter?: string) {
  return {
    ok: false,
    status: 429,
    headers: {
      get: (name: string) => (name.toLowerCase() === 'retry-after' ? retryAfter || null : null),
    },
  } as unknown as Response;
}

function installLoadFetch(harness: Harness, fetchSpy: ReturnType<typeof vi.fn>) {
  harness.sandbox.fetch = fetchSpy;
  harness.api.installStreamHook();
  harness.api.state.busy = false;
}

function conversationWithWebRuns(messageIds: string[]) {
  const mapping: Record<string, unknown> = {};
  const userId = 'synthetic-user';
  let parent: string | null = null;
  mapping[userId] = {
    id: userId,
    parent,
    message: { id: userId, author: { role: 'user' }, content: { parts: ['synthetic prompt'] } },
  };
  parent = userId;
  messageIds.forEach((messageId) => {
    mapping[messageId] = {
      id: messageId,
      parent,
      message: {
        id: messageId,
        author: { role: 'assistant' },
        recipient: 'web.run',
        content: { parts: [] },
      },
    };
    parent = messageId;
  });
  return { current_node: parent, mapping };
}

async function waitFor<T>(read: () => T, predicate: (value: T) => boolean, timeout = 500) {
  const deadline = Date.now() + timeout;
  let value = read();
  while (!predicate(value) && Date.now() < deadline) {
    await delay(5);
    value = read();
  }
  return value;
}

async function tap(harness: Harness, body: ReadableStream<Uint8Array>, hint?: string) {
  const result = harness.api.tapStream(body, hint);
  // Older recorder versions returned undefined and pumped asynchronously. Keep
  // the polling below so those versions fail on assertions rather than racing.
  if (result && typeof (result as Promise<void>).then === 'function') await result;
  await delay(0);
}

function nestedMessage(id: string, queries: string[], conversation_id?: string) {
  return {
    ...(conversation_id ? { conversation_id } : {}),
    message: {
      id,
      metadata: { search_model_queries: { queries } },
    },
  };
}

function queriesOf(batch: Record<string, unknown>) {
  return Array.isArray(batch.queries) ? batch.queries : [];
}

describe('fanout recorder SSE parser', () => {
  it('captures a query from a standard LF data frame', async () => {
    const harness = createHarness();
    const conversationId = 'conv-lf';

    await tap(
      harness,
      streamFrom(
        frame({
          conversation_id: conversationId,
          id: 'msg-lf',
          search_model_queries: { queries: ['one query'] },
        })
      )
    );
    const batches = await waitFor(
      () => harness.api.readQueries(conversationId),
      (value) => value.length === 1
    );

    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ id: 'msg-lf', queries: ['one query'] });
  });

  it('handles CRLF delimiters and JSON split across byte chunks', async () => {
    const harness = createHarness();
    const payload = JSON.stringify({
      conversation_id: 'conv-crlf',
      id: 'msg-crlf',
      search_model_queries: { queries: ['split query'] },
    });
    const split = Math.floor(payload.length / 2);

    await tap(
      harness,
      streamFrom(`data: ${payload.slice(0, split)}`, `${payload.slice(split)}\r\n\r\n`)
    );
    const batches = await waitFor(
      () => harness.api.readQueries('conv-crlf'),
      (value) => value.length === 1
    );

    expect(batches[0]).toMatchObject({ id: 'msg-crlf', queries: ['split query'] });
  });

  it('accepts data: without a space', async () => {
    const harness = createHarness();

    await tap(
      harness,
      streamFrom(
        `data:${JSON.stringify({ conversation_id: 'conv-nospace', id: 'msg-nospace', search_model_queries: { queries: ['no space'] } })}\n\n`
      )
    );
    const batches = await waitFor(
      () => harness.api.readQueries('conv-nospace'),
      (value) => value.length === 1
    );

    expect(batches[0]).toMatchObject({ id: 'msg-nospace', queries: ['no space'] });
  });

  it('handles CR and LF arriving in separate network chunks', async () => {
    const harness = createHarness();
    const payload = JSON.stringify(
      nestedMessage('msg-boundary', ['zażółć gęślą'], 'conv-boundary')
    );
    await tap(harness, streamFrom(`data: ${payload}\r`, '\n\r', '\n'));
    expect(harness.api.readQueries('conv-boundary')[0]).toMatchObject({
      id: 'msg-boundary',
      queries: ['zażółć gęślą'],
    });
  });

  it('joins multiline SSE data before parsing JSON', async () => {
    const harness = createHarness();
    const multiline = [
      'data: {',
      'data:   "conversation_id": "conv-multiline",',
      'data:   "message": {',
      'data:     "id": "msg-multiline",',
      'data:     "metadata": {"search_model_queries": {"queries": ["multiline"]}}',
      'data:   }',
      'data: }',
      '',
      '',
    ].join('\n');

    await tap(harness, streamFrom(multiline));
    const batches = await waitFor(
      () => harness.api.readQueries('conv-multiline'),
      (value) => value.length === 1
    );

    expect(batches[0]).toMatchObject({ id: 'msg-multiline', queries: ['multiline'] });
  });

  it('walks array payloads and records nested messages', async () => {
    const harness = createHarness();
    const payload = [
      { conversation_id: 'conv-array' },
      nestedMessage('msg-array', ['array query']),
    ];

    await tap(harness, streamFrom(frame(payload)));
    const batches = await waitFor(
      () => harness.api.readQueries('conv-array'),
      (value) => value.length === 1
    );

    expect(batches[0]).toMatchObject({ id: 'msg-array', queries: ['array query'] });
  });

  it('buffers a query seen before the conversation_id in a new chat', async () => {
    const harness = createHarness();

    await tap(
      harness,
      streamFrom(
        frame(nestedMessage('msg-buffered', ['buffered query'])),
        frame({ conversation_id: 'conv-buffered' })
      )
    );
    const batches = await waitFor(
      () => harness.api.readQueries('conv-buffered'),
      (value) => value.length === 1
    );

    expect(batches[0]).toMatchObject({ id: 'msg-buffered', queries: ['buffered query'] });
    expect(harness.api.readQueries('')).toEqual([]);
  });

  it('uses the enclosing message id for metadata and updates one batch per message', async () => {
    const harness = createHarness();
    const first = nestedMessage('msg-parent', ['first query'], 'conv-parent');
    const update = nestedMessage('msg-parent', ['updated query'], 'conv-parent');

    await tap(harness, streamFrom(frame(first), frame(update)));
    const batches = await waitFor(
      () => harness.api.readQueries('conv-parent'),
      (value) => value.length === 1 && queriesOf(value[0]).includes('updated query')
    );

    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({
      id: 'msg-parent',
      queries: ['first query', 'updated query'],
    });
  });

  it('associates path updates with the message id captured earlier in the stream', async () => {
    const harness = createHarness();
    const fullMessage = nestedMessage('msg-path', ['full query'], 'conv-path');
    const metadataUpdate = {
      conversation_id: 'conv-path',
      p: '/message/metadata/search_model_queries',
      o: 'add',
      v: { queries: ['path query'] },
    };
    const queriesUpdate = {
      conversation_id: 'conv-path',
      p: '/message/metadata/search_model_queries/queries',
      o: 'add',
      v: ['path array query'],
    };

    await tap(harness, streamFrom(frame(fullMessage), frame(metadataUpdate), frame(queriesUpdate)));
    const batches = await waitFor(
      () => harness.api.readQueries('conv-path'),
      (value) => value.length === 1 && queriesOf(value[0]).length === 3
    );

    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({
      id: 'msg-path',
      queries: ['full query', 'path query', 'path array query'],
    });
  });

  it('keeps same-query batches separate when message ids differ', async () => {
    const harness = createHarness();
    const payload = [
      nestedMessage('msg-a', ['identical query'], 'conv-ids'),
      nestedMessage('msg-b', ['identical query'], 'conv-ids'),
    ]
      .map((value) => frame(value))
      .join('');

    await tap(harness, streamFrom(payload));
    const batches = await waitFor(
      () => harness.api.readQueries('conv-ids'),
      (value) => value.length === 2
    );

    expect(batches.map((batch) => batch.id)).toEqual(['msg-a', 'msg-b']);
    expect(batches.map((batch) => batch.queries)).toEqual([
      ['identical query'],
      ['identical query'],
    ]);
  });
});

describe('fanout recorder recorded batch matching', () => {
  it('keeps an unmatched new batch out of a cached old empty round', () => {
    const harness = createHarness();
    const result = harness.api.build(conversationWithWebRuns(['msg-cached-old']), [
      { id: 'msg-new-unmatched', queries: ['new live query'] },
    ]);

    expect(result.turns[0].rounds[0].searches[0]).toMatchObject({ hidden: true });
    expect(result.stats.hidden).toBe(1);
    expect(result.rows.some((row: { query: string }) => row.query === 'new live query')).toBe(
      false
    );
    expect(result.waitingQueries).toEqual(['new live query']);
  });

  it('matches recorded batches by message id even when recording order is reversed', () => {
    const harness = createHarness();
    const result = harness.api.build(conversationWithWebRuns(['msg-round-a', 'msg-round-b']), [
      { id: 'msg-round-b', queries: ['query for b'] },
      { id: 'msg-round-a', queries: ['query for a'] },
    ]);

    expect(
      result.turns[0].rounds.map(
        (round: { searches: Array<{ query: string }> }) => round.searches[0].query
      )
    ).toEqual(['query for a', 'query for b']);
    expect(result.stats.recordedRounds).toBe(2);
  });

  it('ignores a batch whose message id belongs to an inactive branch', () => {
    const harness = createHarness();
    const conversation = conversationWithWebRuns(['msg-active']);
    const inactive = {
      id: 'msg-inactive',
      parent: 'synthetic-user',
      message: {
        id: 'msg-inactive',
        author: { role: 'assistant' },
        recipient: 'web.run',
        content: { parts: [] },
      },
    };
    conversation.mapping['msg-inactive'] = inactive;
    const result = harness.api.build(conversation, [
      { id: 'msg-inactive', queries: ['inactive branch query'] },
    ]);

    expect(result.turns[0].rounds[0].searches[0]).toMatchObject({ hidden: true });
    expect(
      result.rows.some((row: { query: string }) => row.query === 'inactive branch query')
    ).toBe(false);
    expect(result.waitingQueries).toEqual([]);
  });
});

describe('fanout recorder fetch hook', () => {
  it.each([
    [
      'a URL object',
      () => ({
        input: new URL('https://chatgpt.com/backend-api/f/conversation'),
        init: { method: 'POST' },
      }),
    ],
    [
      'a Request object',
      () => ({
        input: new Request('https://chatgpt.com/backend-api/conversation', { method: 'POST' }),
        init: undefined,
      }),
    ],
    [
      'a trailing slash and query string',
      () => ({ input: '/backend-api/f/conversation/?mode=test', init: { method: 'POST' } }),
    ],
  ])('matches POST conversation requests passed as %s', async (_label, makeInput) => {
    const harness = createHarness();
    const body = frame({
      conversation_id: 'conv-hook',
      id: 'msg-hook',
      search_model_queries: { queries: ['hook query'] },
    });
    const original = new Response(body, { headers: { 'content-type': 'text/event-stream' } });
    const originalFetch = vi.fn(() => Promise.resolve(original));
    harness.sandbox.fetch = originalFetch;
    harness.api.installStreamHook();

    const request = makeInput();
    const returned = await harness.sandbox.fetch(request.input, request.init);
    expect(returned).toBe(original);
    expect(await returned.text()).toBe(body);
    const batches = await waitFor(
      () => harness.api.readQueries('conv-hook'),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({ id: 'msg-hook', queries: ['hook query'] });
    expect(originalFetch).toHaveBeenCalledTimes(1);
  });

  it('preserves a rejected fetch promise', async () => {
    const harness = createHarness();
    const error = new Error('fetch failed');
    harness.sandbox.fetch = vi.fn(() => Promise.reject(error));
    harness.api.installStreamHook();

    await expect(
      harness.sandbox.fetch('/backend-api/f/conversation', { method: 'POST' })
    ).rejects.toBe(error);
  });

  it('leaves a cross-origin conversation response untouched', async () => {
    const harness = createHarness();
    const original = new Response(
      frame({
        conversation_id: 'conv-cross-origin',
        id: 'msg-cross-origin',
        search_model_queries: { queries: ['ignore me'] },
      }),
      {
        headers: { 'content-type': 'text/event-stream' },
      }
    );
    harness.sandbox.fetch = vi.fn(() => Promise.resolve(original));
    harness.api.installStreamHook();

    const returned = await harness.sandbox.fetch('https://other.example/backend-api/conversation', {
      method: 'POST',
    });
    expect(returned).toBe(original);
    expect(await returned.text()).toContain('ignore me');
    await delay(20);
    expect(harness.api.readQueries('conv-cross-origin')).toEqual([]);
  });

  it('leaves a non-SSE conversation response untouched', async () => {
    const harness = createHarness();
    const original = new Response(JSON.stringify({ conversation_id: 'conv-json' }), {
      headers: { 'content-type': 'application/json' },
    });
    harness.sandbox.fetch = vi.fn(() => Promise.resolve(original));
    harness.api.installStreamHook();

    const returned = await harness.sandbox.fetch('/backend-api/f/conversation', { method: 'POST' });
    expect(returned).toBe(original);
    expect(await returned.json()).toEqual({ conversation_id: 'conv-json' });
    expect(harness.api.readQueries('conv-json')).toEqual([]);
  });

  it('marks storage failures in capture diagnostics without throwing from fetch', async () => {
    const harness = createHarness();
    harness.storage.setItem = () => {
      throw new Error('quota exceeded');
    };

    await tap(
      harness,
      streamFrom(
        frame({
          conversation_id: 'conv-storage',
          id: 'msg-storage',
          search_model_queries: { queries: ['cannot save'] },
        })
      )
    );

    expect(harness.api.state.capture.storageError).toBe(true);
    expect(harness.api.readQueries('conv-storage')).toEqual([]);
  });

  it('decides capture from live mode when the request starts', async () => {
    const harness = createHarness();
    let resolveResponse!: (response: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    harness.sandbox.fetch = vi.fn(() => pendingResponse);
    harness.api.installStreamHook();
    harness.api.state.live = false;

    const pending = harness.sandbox.fetch('/backend-api/f/conversation', { method: 'POST' });
    harness.api.state.live = true;
    resolveResponse(
      new Response(
        frame({
          conversation_id: 'conv-live-off',
          id: 'msg-live-off',
          search_model_queries: { queries: ['should stay out'] },
        }),
        { headers: { 'content-type': 'text/event-stream' } }
      )
    );
    const returned = await pending;
    await returned.text();
    await delay(20);
    expect(harness.api.readQueries('conv-live-off')).toEqual([]);
  });

  it('captures a request that started live even if live mode is toggled off while pending', async () => {
    const harness = createHarness();
    let resolveResponse!: (response: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    harness.sandbox.fetch = vi.fn(() => pendingResponse);
    harness.api.installStreamHook();
    harness.api.state.live = true;

    const pending = harness.sandbox.fetch('/backend-api/f/conversation', { method: 'POST' });
    harness.api.state.live = false;
    resolveResponse(
      new Response(
        frame({
          conversation_id: 'conv-live-on',
          id: 'msg-live-on',
          search_model_queries: { queries: ['capture me'] },
        }),
        { headers: { 'content-type': 'text/event-stream' } }
      )
    );
    const returned = await pending;
    await returned.text();
    const batches = await waitFor(
      () => harness.api.readQueries('conv-live-on'),
      (value) => value.length === 1
    );

    expect(batches[0]).toMatchObject({ id: 'msg-live-on', queries: ['capture me'] });
  });
});

describe('fanout recorder WebSocket stream handoff', () => {
  it('continues from DONE through an existing socket subscribe and records the matching topic', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    const fetchSpy = vi.fn(() => Promise.reject(new Error('unexpected network request')));
    harness.sandbox.fetch = fetchSpy;
    harness.api.installStreamHook();

    await bootstrapHandoff(harness);
    expect(harness.api.state.capture.handoffs).toBeGreaterThan(0);

    const sendResult = socket.send(subscribeCommand(HANDOFF_TOPIC));
    expect(sendResult).toBe('native-send-result');
    expect(socket.sent).toEqual([[subscribeCommand(HANDOFF_TOPIC)]]);

    socket.emit(JSON.stringify([{ type: 'heartbeat' }]));
    socket.emit(JSON.stringify(subscribeReply(HANDOFF_TOPIC, [])));
    socket.emit(
      JSON.stringify(
        rossettaEnvelope(
          HANDOFF_TOPIC,
          frame(nestedMessage('msg-handoff', ['handoff query'], HANDOFF_CONVERSATION))
        )
      )
    );

    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({ id: 'msg-handoff', queries: ['handoff query'] });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(harness.WebSocket.instances).toHaveLength(1);
  });

  it('replays catchups and joins encoded SSE split across WebSocket frames', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);
    socket.send(subscribeCommand(HANDOFF_TOPIC));

    const catchup = rossettaMessage(
      HANDOFF_TOPIC,
      frame(nestedMessage('msg-catchup', ['catchup query'], HANDOFF_CONVERSATION))
    );
    socket.emit(JSON.stringify(subscribeReply(HANDOFF_TOPIC, [catchup])));

    const splitPayload = frame(
      nestedMessage('msg-split', ['split WS query'], HANDOFF_CONVERSATION)
    );
    const splitAt = Math.floor(splitPayload.length / 2);
    socket.emit(JSON.stringify(rossettaEnvelope(HANDOFF_TOPIC, splitPayload.slice(0, splitAt))));
    socket.emit(JSON.stringify(rossettaEnvelope(HANDOFF_TOPIC, splitPayload.slice(splitAt))));

    const catchupBatches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 2
    );
    expect(catchupBatches.map((batch) => batch.id)).toEqual(['msg-catchup', 'msg-split']);
    expect(catchupBatches.map((batch) => batch.queries)).toEqual([
      ['catchup query'],
      ['split WS query'],
    ]);
    expect(harness.api.state.capture.wsChunks).toBeGreaterThan(1);
  });

  it('preserves native send behavior and existing WebSocket listeners', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    const existingListener = vi.fn();
    const existingOnMessage = vi.fn();
    socket.addEventListener('message', existingListener);
    socket.onmessage = existingOnMessage;
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);

    const command = subscribeCommand(HANDOFF_TOPIC);
    expect(socket.send(command)).toBe('native-send-result');
    expect(socket.nativeSend).toHaveBeenCalledWith(command);
    expect(socket.sent).toEqual([[command]]);

    const error = new Error('synthetic socket failure');
    socket.sendError = error;
    expect(() => socket.send(command, 'extra-arg')).toThrow(error);
    expect(socket.nativeSend).toHaveBeenCalledTimes(1);

    const event = JSON.stringify([{ type: 'heartbeat' }]);
    socket.emit(event);
    expect(existingListener).toHaveBeenCalledWith({ data: event });
    expect(existingOnMessage).toHaveBeenCalledWith({ data: event });
  });

  it('filters by the handoff topic and WebSocket origin', async () => {
    const harness = createHarness();
    const matchingSocket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    const otherOriginSocket = new harness.WebSocket('wss://other.invalid/synthetic-stream');
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);
    matchingSocket.send(subscribeCommand(HANDOFF_TOPIC));
    otherOriginSocket.send(subscribeCommand(HANDOFF_TOPIC));

    const matchingPayload = frame(
      nestedMessage('msg-topic', ['accepted topic'], HANDOFF_CONVERSATION)
    );
    matchingSocket.emit(JSON.stringify(rossettaEnvelope('other-topic', matchingPayload)));
    matchingSocket.emit(JSON.stringify(rossettaEnvelope(HANDOFF_TOPIC, matchingPayload)));
    const otherOriginPayload = frame(
      nestedMessage('msg-origin', ['rejected origin'], HANDOFF_CONVERSATION)
    );
    otherOriginSocket.emit(JSON.stringify(rossettaEnvelope(HANDOFF_TOPIC, otherOriginPayload)));

    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ id: 'msg-topic', queries: ['accepted topic'] });
  });

  it('buffers a matching frame observed before handoff metadata and replays it after bootstrap', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    harness.api.installStreamHook();
    socket.send(subscribeCommand(HANDOFF_TOPIC));

    socket.emit(
      JSON.stringify(
        rossettaEnvelope(
          'other-topic',
          frame(nestedMessage('msg-race-ignore', ['wrong race topic'], HANDOFF_CONVERSATION))
        )
      )
    );
    socket.emit(
      JSON.stringify(
        rossettaEnvelope(
          HANDOFF_TOPIC,
          frame(nestedMessage('msg-race', ['buffered race query'], HANDOFF_CONVERSATION))
        )
      )
    );

    await bootstrapHandoff(harness);
    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({ id: 'msg-race', queries: ['buffered race query'] });
    expect(
      harness.api.readQueries(HANDOFF_CONVERSATION).some((batch) => batch.id === 'msg-race-ignore')
    ).toBe(false);
    expect(harness.api.state.capture.wsFrames).toBeGreaterThan(0);
  });

  it('does not persist the resume token or create a fetch/socket subscription during handoff', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    const fetchSpy = vi.fn(() => Promise.reject(new Error('unexpected network request')));
    harness.sandbox.fetch = fetchSpy;
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);

    expect(harness.storage.valuesSnapshot().join('\n')).not.toContain(HANDOFF_TOKEN);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(harness.WebSocket.instances).toEqual([socket]);
    expect(socket.nativeSend).not.toHaveBeenCalled();
  });

  it('captures an existing socket whose own send bypasses the prototype wrapper', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    const originalSend = socket.send;
    socket.send = originalSend.bind(socket);
    socket.addEventListener('message', (event) => void event.data);
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);

    const command = subscribeCommand(HANDOFF_TOPIC);
    socket.send(command);
    expect(socket.nativeSend).toHaveBeenCalledWith(command);
    socket.emitNative(
      JSON.stringify(
        rossettaEnvelope(
          HANDOFF_TOPIC,
          frame(nestedMessage('msg-owned-send', ['owned send query'], HANDOFF_CONVERSATION))
        )
      )
    );

    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({ id: 'msg-owned-send', queries: ['owned send query'] });
  });

  it('returns the original MessageEvent data and deduplicates repeated accessor reads', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    socket.addEventListener('message', (event) => void event.data);
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);

    const data = JSON.stringify(
      rossettaEnvelope(
        HANDOFF_TOPIC,
        frame(nestedMessage('msg-accessor', ['accessor query'], HANDOFF_CONVERSATION))
      )
    );
    const event = socket.emitNative(data);
    expect(event.data).toBe(data);
    expect(event.data).toBe(data);
    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({ id: 'msg-accessor', queries: ['accessor query'] });
    expect(harness.api.state.capture.wsFrames).toBe(1);
  });

  it('ignores MessageEvents whose target is unrelated to the native WebSocket', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    socket.addEventListener('message', (event) => void event.data);
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);

    const unrelated = {};
    socket.emitNative(
      JSON.stringify(
        rossettaEnvelope(
          HANDOFF_TOPIC,
          frame(
            nestedMessage('msg-unrelated-event', ['unrelated event query'], HANDOFF_CONVERSATION)
          )
        )
      ),
      unrelated,
      unrelated
    );
    await delay(20);
    expect(harness.api.readQueries(HANDOFF_CONVERSATION)).toEqual([]);
  });

  it('propagates an exception from the original MessageEvent data getter', () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    const error = new Error('synthetic data getter failure');
    Object.defineProperty(harness.MessageEvent.prototype, 'data', {
      configurable: true,
      get() {
        throw error;
      },
    });
    harness.api.installStreamHook();
    const event = new harness.MessageEvent('synthetic payload', socket, socket);
    expect(() => event.data).toThrow(error);
  });
});

describe('fanout recorder fetch continuation after stream handoff', () => {
  it('captures a known-topic SSE continuation while preserving the original Response', async () => {
    const harness = createHarness();
    const original = new Response(
      frame(
        nestedMessage('msg-fetch-continuation', ['fetch continuation query'], HANDOFF_CONVERSATION)
      ),
      { headers: { 'content-type': 'text/event-stream' } }
    );
    const fetchSpy = vi.fn(() => Promise.resolve(original));
    harness.sandbox.fetch = fetchSpy;
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);

    const returned = await harness.sandbox.fetch(
      `/backend-api/synthetic-resume?topic_id=${encodeURIComponent(HANDOFF_TOPIC)}`,
      { method: 'GET' }
    );
    expect(returned).toBe(original);
    expect(await returned.text()).toContain('fetch continuation query');
    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({
      id: 'msg-fetch-continuation',
      queries: ['fetch continuation query'],
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('ignores continuation responses from another origin or an unknown topic', async () => {
    const harness = createHarness();
    const foreign = new Response(
      frame(nestedMessage('msg-foreign', ['foreign continuation'], HANDOFF_CONVERSATION)),
      { headers: { 'content-type': 'text/event-stream' } }
    );
    const unknown = new Response(
      frame(nestedMessage('msg-unknown', ['unknown continuation'], HANDOFF_CONVERSATION)),
      { headers: { 'content-type': 'text/event-stream' } }
    );
    const fetchSpy = vi.fn((input: unknown) =>
      Promise.resolve(String(input).startsWith('https://other.invalid/') ? foreign : unknown)
    );
    harness.sandbox.fetch = fetchSpy;
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);

    const foreignReturned = await harness.sandbox.fetch(
      `https://other.invalid/backend-api/synthetic-resume?topic_id=${encodeURIComponent(HANDOFF_TOPIC)}`,
      { method: 'GET' }
    );
    const unknownReturned = await harness.sandbox.fetch(
      '/backend-api/synthetic-resume?topic_id=conversation-turn-unknown',
      { method: 'GET' }
    );
    expect(foreignReturned).toBe(foreign);
    expect(unknownReturned).toBe(unknown);
    expect(await foreignReturned.text()).toContain('foreign continuation');
    expect(await unknownReturned.text()).toContain('unknown continuation');
    await delay(20);
    expect(harness.api.readQueries(HANDOFF_CONVERSATION)).toEqual([]);
  });

  it('captures a continuation whose request starts before bootstrap finishes', async () => {
    const harness = createHarness();
    let resolveResponse!: (response: Response) => void;
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve;
    });
    const fetchSpy = vi.fn(() => pendingResponse);
    harness.sandbox.fetch = fetchSpy;
    harness.api.installStreamHook();

    const pending = harness.sandbox.fetch(
      `/backend-api/synthetic-resume?topic_id=${encodeURIComponent(HANDOFF_TOPIC)}`,
      { method: 'GET' }
    );
    await bootstrapHandoff(harness);
    const original = new Response(
      frame(nestedMessage('msg-fetch-race', ['fetch race query'], HANDOFF_CONVERSATION)),
      { headers: { 'content-type': 'text/event-stream' } }
    );
    resolveResponse(original);
    const returned = await pending;
    expect(returned).toBe(original);
    await returned.text();

    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({ id: 'msg-fetch-race', queries: ['fetch race query'] });
  });

  it('holds a continuation response that arrives before the bootstrap clone records handoff', async () => {
    const harness = createHarness();
    const original = new Response(
      frame(
        nestedMessage(
          'msg-fetch-before-handoff',
          ['early continuation query'],
          HANDOFF_CONVERSATION
        )
      ),
      { headers: { 'content-type': 'text/event-stream' } }
    );
    const fetchSpy = vi.fn(() => Promise.resolve(original));
    harness.sandbox.fetch = fetchSpy;
    harness.api.installStreamHook();

    const pending = harness.sandbox.fetch(
      `/backend-api/synthetic-resume?topic_id=${encodeURIComponent(HANDOFF_TOPIC)}`,
      { method: 'GET' }
    );
    await delay(0);
    const returned = await pending;
    expect(returned).toBe(original);
    await returned.text();

    await bootstrapHandoff(harness);
    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1
    );
    expect(batches[0]).toMatchObject({
      id: 'msg-fetch-before-handoff',
      queries: ['early continuation query'],
    });
  });
});

describe('fanout recorder handoff deduplication', () => {
  it('keeps one batch when identical SSE data arrives through WebSocket and fetch', async () => {
    const harness = createHarness();
    const socket = new harness.WebSocket('wss://ws.chatgpt.com/synthetic-stream');
    const fetchResponse = new Response(
      frame(nestedMessage('msg-duplicate', ['duplicate query'], HANDOFF_CONVERSATION)),
      { headers: { 'content-type': 'text/event-stream' } }
    );
    const fetchSpy = vi.fn(() => Promise.resolve(fetchResponse));
    harness.sandbox.fetch = fetchSpy;
    harness.api.installStreamHook();
    await bootstrapHandoff(harness);
    socket.send(subscribeCommand(HANDOFF_TOPIC));

    const encoded = frame(
      nestedMessage('msg-duplicate', ['duplicate query'], HANDOFF_CONVERSATION)
    );
    socket.emit(JSON.stringify(rossettaEnvelope(HANDOFF_TOPIC, encoded)));
    const returned = await harness.sandbox.fetch(
      `/backend-api/synthetic-resume?topic_id=${encodeURIComponent(HANDOFF_TOPIC)}`,
      { method: 'GET' }
    );
    expect(returned).toBe(fetchResponse);
    await returned.text();

    const batches = await waitFor(
      () => harness.api.readQueries(HANDOFF_CONVERSATION),
      (value) => value.length === 1 && queriesOf(value[0]).length === 1
    );
    expect(batches).toHaveLength(1);
    expect(batches[0]).toMatchObject({ id: 'msg-duplicate', queries: ['duplicate query'] });
  });
});

describe('fanout recorder load cooldown and navigation guards', () => {
  it('coalesces concurrent loads and respects the 429 cooldown for manual calls', async () => {
    vi.useFakeTimers();
    try {
      const harness = createHarness();
      setConversation(harness, 'aaaaaaaaaaaaaaaaaaaa');
      let conversationCalls = 0;
      const fetchSpy = vi.fn((input: unknown) => {
        if (String(input).includes('/api/auth/session')) return Promise.resolve(sessionResponse());
        conversationCalls++;
        return Promise.resolve(rateLimitResponse());
      });
      installLoadFetch(harness, fetchSpy);

      harness.api.load(true);
      harness.api.load(true);
      await flushMicrotasks();
      expect(conversationCalls).toBe(1);

      harness.api.load(true);
      await flushMicrotasks();
      expect(conversationCalls).toBe(1);
      await vi.advanceTimersByTimeAsync(59_999);
      await flushMicrotasks();
      expect(conversationCalls).toBe(1);
      await vi.advanceTimersByTimeAsync(1);
      await flushMicrotasks();
      expect(conversationCalls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('uses Retry-After seconds to schedule the next read', async () => {
    vi.useFakeTimers();
    try {
      const harness = createHarness();
      setConversation(harness, 'bbbbbbbbbbbbbbbbbbbb');
      let conversationCalls = 0;
      const fetchSpy = vi.fn((input: unknown) => {
        if (String(input).includes('/api/auth/session')) return Promise.resolve(sessionResponse());
        conversationCalls++;
        return conversationCalls === 1
          ? Promise.resolve(rateLimitResponse('120'))
          : Promise.resolve(emptyConversationResponse());
      });
      installLoadFetch(harness, fetchSpy);

      harness.api.load(true);
      await flushMicrotasks();
      expect((harness.api.state.nextReadAt || 0) - Date.now()).toBe(120_000);
      vi.setSystemTime(new Date((harness.api.state.nextReadAt || Date.now()) - 1));
      harness.api.load(true);
      await flushMicrotasks();
      expect(conversationCalls).toBe(1);
      vi.setSystemTime(new Date((harness.api.state.nextReadAt || Date.now()) + 1));
      harness.api.load(true);
      await flushMicrotasks();
      expect(conversationCalls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not poll while ChatGPT answers and reads once after the answer ends', async () => {
    vi.useFakeTimers();
    const harness = createHarness();
    try {
      setConversation(harness, 'ffffffffffffffffffff');
      let answeringNow = true;
      const documentStub = harness.sandbox.document as {
        getElementById: (id: string) => unknown;
        querySelector: () => unknown;
      };
      documentStub.getElementById = (id) =>
        id === 'wai-fanout' ? { querySelector: () => null } : null;
      documentStub.querySelector = () => (answeringNow ? {} : null);
      let conversationCalls = 0;
      const fetchSpy = vi.fn((input: unknown) => {
        if (String(input).includes('/api/auth/session')) return Promise.resolve(sessionResponse());
        conversationCalls++;
        return Promise.resolve(emptyConversationResponse());
      });
      installLoadFetch(harness, fetchSpy);
      harness.api.state.busy = false;
      harness.api.startLive();

      await vi.advanceTimersByTimeAsync(60_000);
      await flushMicrotasks();
      expect(conversationCalls).toBe(0);
      answeringNow = false;
      await vi.advanceTimersByTimeAsync(4_000);
      await flushMicrotasks();
      expect(conversationCalls).toBe(1);
      await vi.advanceTimersByTimeAsync(60_000);
      await flushMicrotasks();
      expect(conversationCalls).toBe(1);
    } finally {
      harness.api.stopLive();
      vi.useRealTimers();
    }
  });

  it('reads queries and citations from the paged conversations endpoint', () => {
    const harness = createHarness();
    const conv = {
      mapping: {
        u: { id: 'u', parent: null, message: { id: 'u', author: { role: 'user' }, content: { parts: ['polec firme'] } } },
        w: { id: 'w', parent: 'u', message: { id: 'w', author: { role: 'assistant' }, recipient: 'web.run', content: { parts: [''] } } },
        q: { id: 'q', parent: 'w', message: { id: 'q', author: { role: 'tool' }, recipient: 'all', content: { parts: [''] }, metadata: { search_model_queries: { type: 'search_model_queries', queries: ['agencja GEO', 'site:reddit.com geo'] } } } },
        r: { id: 'r', parent: 'q', message: { id: 'r', author: { role: 'tool' }, recipient: 'all', content: { parts: [''] }, metadata: { search_result_groups: [{ entries: [{ url: 'https://geolead.pl/', ref_id: { turn_index: 0, ref_type: 'search', ref_index: 0 } }, { url: 'https://www.reddit.com/r/seo/x' }] }] } } },
        a: { id: 'a', parent: 'r', message: { id: 'a', author: { role: 'assistant' }, recipient: 'all', end_turn: true, content: { parts: ['ok'] }, metadata: { content_references: [{ type: 'url', refs: [{ turn_index: 0, ref_type: 'search', ref_index: 0 }], items: [] }] } } },
      },
      current_node: 'a',
    };
    const model = harness.api.build(conv, []);
    expect(model.rows.map((r) => r.query)).toEqual(['agencja GEO', 'site:reddit.com geo']);
    expect(model.stats.hidden).toBe(0);
    expect(model.rows[0].cited).toBe(1);
    expect(model.rows[1].lockedHost).toBe('reddit.com');
  });

  it('reports whether the configured brand was fetched, cited and mentioned', () => {
    const harness = createHarness();
    const entry = (url: string, i: number) => ({ url, title: 'T', ref_id: { turn_index: 0, ref_type: 'search', ref_index: i } });
    const conv = {
      mapping: {
        u: { id: 'u', parent: null, message: { id: 'u', author: { role: 'user' }, content: { parts: ['polec agencje'] } } },
        w: { id: 'w', parent: 'u', message: { id: 'w', author: { role: 'assistant' }, recipient: 'web.run', content: { parts: [''] } } },
        q: { id: 'q', parent: 'w', message: { id: 'q', author: { role: 'tool' }, content: { parts: [''] }, metadata: { search_model_queries: { queries: ['agencja seo poznan'] } } } },
        r: { id: 'r', parent: 'q', message: { id: 'r', author: { role: 'tool' }, content: { parts: [''] }, metadata: { search_result_groups: [{ entries: [entry('https://www.grupa-icea.pl/oferta/', 0), entry('https://other.pl/', 1)] }] } } },
        a: { id: 'a', parent: 'r', message: { id: 'a', author: { role: 'assistant' }, recipient: 'all', end_turn: true, content: { content_type: 'text', parts: ['Polecam ICEA oraz Other.'] }, metadata: { content_references: [{ type: 'url', refs: [{ turn_index: 0, ref_type: 'search', ref_index: 0 }] }] } } },
      },
      current_node: 'a',
    };
    harness.api.state.model = harness.api.build(conv, []);
    harness.api.state.brand = 'grupa-icea.pl, ICEA';
    const html = harness.api.brandHtml();
    expect(html).toContain('W wynikach: <b><span class="yes">tak, 1 strona');
    expect(html).toContain('Cytowana: <b><span class="yes">tak, 1 strona');
    expect(html).toContain('tak (1/1)');
    expect(html).toContain('agencja seo poznan');
    harness.api.state.brand = 'nieobecna.pl';
    expect(harness.api.brandHtml()).toContain('<span class="no">nie</span>');
  });

  it('uses an HTTP-date Retry-After value instead of the default backoff', async () => {
    vi.useFakeTimers();
    try {
      const harness = createHarness();
      setConversation(harness, 'cccccccccccccccccccc');
      let conversationCalls = 0;
      const retryAt = Date.now() + 120_000;
      const retryHeader = new Date(retryAt).toUTCString();
      const fetchSpy = vi.fn((input: unknown) => {
        if (String(input).includes('/api/auth/session')) return Promise.resolve(sessionResponse());
        conversationCalls++;
        return conversationCalls === 1
          ? Promise.resolve(
              new Response('', { status: 429, headers: { 'Retry-After': retryHeader } })
            )
          : Promise.resolve(emptyConversationResponse());
      });
      installLoadFetch(harness, fetchSpy);

      harness.api.load(true);
      await flushMicrotasks();
      expect(harness.api.state.nextReadAt).toBe(Date.parse(retryHeader));
      const wait = Math.max(0, Date.parse(retryHeader) - Date.now());
      vi.setSystemTime(new Date(Date.now() + Math.max(0, wait - 1)));
      harness.api.load(true);
      await flushMicrotasks();
      expect(conversationCalls).toBe(1);
      vi.setSystemTime(new Date(Date.now() + 2));
      harness.api.load(true);
      await flushMicrotasks();
      expect(conversationCalls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not apply a response for the previous conversation after navigation', async () => {
    const harness = createHarness();
    setConversation(harness, 'dddddddddddddddddddd');
    let resolveConversation!: (response: Response) => void;
    const pendingConversation = new Promise<Response>((resolve) => {
      resolveConversation = resolve;
    });
    const fetchSpy = vi.fn((input: unknown) => {
      if (String(input).includes('/api/auth/session')) return Promise.resolve(sessionResponse());
      return pendingConversation;
    });
    installLoadFetch(harness, fetchSpy);

    harness.api.load(true);
    await flushMicrotasks();
    setConversation(harness, 'eeeeeeeeeeeeeeeeeeee');
    resolveConversation(emptyConversationResponse());
    await flushMicrotasks();

    expect(harness.api.state.model).toBeNull();
  });
});
