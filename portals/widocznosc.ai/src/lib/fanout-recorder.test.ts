import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

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
  readQueries: (id: string) => Array<Record<string, unknown>>;
  recordBatch: (convId: string, msgId: string, queries: string[], types?: string[] | null) => void;
  state: {
    busy: boolean;
    live: boolean;
    capture: {
      storageError: boolean;
      handoffs?: number;
      wsConnections?: number;
      wsFrames?: number;
      wsChunks?: number;
    };
  };
};

type Sandbox = Record<string, unknown> & {
  fetch: (input?: unknown, init?: unknown) => Promise<Response>;
};

type FakeSocketListener = (event: { data: unknown }) => void;

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
};

function createFakeWebSocket(): FakeWebSocketClass {
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
  }
  return LocalFakeWebSocket;
}

function createHarness(): Harness {
  const storage = new MemoryStorage();
  const WebSocket = createFakeWebSocket();
  const sandbox: Sandbox = {
    URL,
    Request,
    Response,
    TextDecoder,
    TextEncoder,
    ReadableStream,
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
  load = function () {};
  state.busy = true;
  globalThis.__fanoutRecorderTest = { tapStream: tapStream, installStreamHook: installStreamHook, readQueries: readQueries, recordBatch: recordBatch, state: state };
})();
`;
  vm.runInNewContext(source.slice(0, markerAt) + testTail, sandbox, { filename: sourcePath });
  return { api: sandbox.__fanoutRecorderTest as Recorder, sandbox, storage, WebSocket };
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
