#!/usr/bin/env node

/**
 * Local proxy server for LM Studio
 *
 * Solves Chrome Private Network Access (PNA) by running as a
 * local HTTP server that adds the required CORS and PNA headers
 * before forwarding requests to LM Studio.
 *
 * Usage:
 *   node local-proxy.mjs
 *   # or with custom ports:
 *   PROXY_PORT=3001 LMSTUDIO_PORT=1234 node local-proxy.mjs
 *
 * Configure your app's LM Studio URL to: http://localhost:3001/v1
 */

#!/usr/bin/env node

/**
 * Local proxy server for LM Studio
 *
 * Solves Chrome Private Network Access (PNA) by running as a
 * local HTTP server that adds the required CORS and PNA headers
 * before forwarding requests to LM Studio.
 *
 * Usage:
 *   node local-proxy.mjs
 *   PROXY_PORT=3001 LMSTUDIO_PORT=1234 node local-proxy.mjs
 *
 * Configure your app's LM Studio URL to: http://localhost:3001/v1
 */

const http = require('node:http')

const PROXY_PORT = parseInt(process.env.PROXY_PORT || '3001', 10)
const LMSTUDIO_HOST = process.env.LMSTUDIO_HOST || '127.0.0.1'
const LMSTUDIO_PORT = parseInt(process.env.LMSTUDIO_PORT || '1234', 10)

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Allow-Private-Network': 'true',
  'Access-Control-Max-Age': '86400',
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS)
    res.end()
    return
  }

  // Forward to LM Studio (preserve the request path)
  const targetUrl = `http://${LMSTUDIO_HOST}:${LMSTUDIO_PORT}${req.url}`

  // Collect request body
  const chunks = []
  for await (const chunk of req) {
    chunks.push(chunk)
  }
  const body = Buffer.concat(chunks)

  try {
    const targetResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Content-Type': req.headers['content-type'] || 'application/json',
        'Accept': req.headers['accept'] || 'application/json',
      },
      body: body.length > 0 ? body : undefined,
    })

    const responseBody = await targetResponse.arrayBuffer()

    // Merge CORS + PNA headers with LM Studio's own headers
    const responseHeaders = {
      ...CORS_HEADERS,
      'Content-Type': targetResponse.headers.get('content-type') || 'application/json',
      'Content-Length': responseBody.byteLength.toString(),
    }

    res.writeHead(targetResponse.status, responseHeaders)
    res.end(Buffer.from(responseBody))
  } catch (err) {
    console.error(`Proxy error: ${err.message}`)
    res.writeHead(502, {
      ...CORS_HEADERS,
      'Content-Type': 'application/json',
    })
    res.end(JSON.stringify({ error: `Proxy error: ${err.message}` }))
  }
})

server.listen(PROXY_PORT, '127.0.0.1', () => {
  console.log(`[lmstudio-proxy] Listening on http://127.0.0.1:${PROXY_PORT}`)
  console.log(`[lmstudio-proxy] Forwarding to LM Studio at http://${LMSTUDIO_HOST}:${LMSTUDIO_PORT}`)
  console.log(`[lmstudio-proxy] Configure your app's LM Studio URL to: http://localhost:${PROXY_PORT}/v1`)
})
