/**
 * Test endpoint dla weryfikacji, że Pages Functions w ogóle działają.
 * Wszystkie metody zwracają JSON {"pong": true, "method": "..."}.
 */

export const onRequest: PagesFunction = async ({ request }) => {
  return new Response(
    JSON.stringify({
      pong: true,
      method: request.method,
      url: request.url,
      timestamp: new Date().toISOString(),
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
};
