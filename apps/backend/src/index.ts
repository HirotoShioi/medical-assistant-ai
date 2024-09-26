import OpenAI from 'openai'
import { streamSSE } from 'hono/streaming'
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs'
import { openai } from './llm/openai'
import { createHono } from './factory'
import { authMiddleWare } from './middleware/auth'
import { logger } from 'hono/logger'
import { ChatConfig, EmbeddingsConfig, SupportedModels } from './config'
import { corsMiddleware } from './middleware/cors'
import { bodyLimit } from 'hono/body-limit'

const app = createHono()

app.use("/*", logger())
app.use('*', corsMiddleware)
app.use("/v1/*", authMiddleWare)

app.get('/', (c) => c.json({
  message: 'Hello World',
}))


app.get('/v1/usage', async (c) => {
  const jwtPayload = c.get('jwtPayload')
  if (!jwtPayload.sub) {
    throw new Error("Invalid token")
  }
  return c.json({
    remaining: 1000,
    resetAt: Math.floor((Date.now() + 24 * 60 * 60) / 1000),
    total: 1000,
  })
})


app.post('/v1/chat/completions', bodyLimit({
  maxSize: ChatConfig.maxBodySize,
  onError: (c) => {
    return c.json({ error: "overflow" }, { status: 413 })
  }
}), async (c) => {
  const req = (await c.req.json()) as ChatCompletionCreateParams
  if (SupportedModels.chat.indexOf(req.model) === -1) {
    return c.json({ error: `Model ${req.model} is not supported` }, { status: 400 })
  }
  const client = openai(c.env as any)
  if (req.stream) {
    const abortController = new AbortController()
    return streamSSE(c, async (stream) => {
      stream.onAbort(() => abortController.abort())
      for await (const it of client.stream(req, abortController.signal)) {
        stream.writeSSE({ data: JSON.stringify(it) })
      }
    })
  }
  return c.json(await client.invoke(req))
})

app.post('/v1/embeddings', bodyLimit({
  maxSize: EmbeddingsConfig.maxBodySize,
  onError: (c) => {
    return c.json({ error: "overflow" }, { status: 413 })
  }
}), async (c) => {
  const client = c.get('openAI')
  const req = (await c.req.json()) as OpenAI.Embeddings.EmbeddingCreateParams
  if (!SupportedModels.embeddings.find((m) => m === req.model)) {
    return c.json({ error: `Model ${req.model} is not supported` }, { status: 400 })
  }
  const res = await client.embeddings.create({
    input: req.input,
    model: req.model,
  })
  return c.json(res)
})

app.post('/v1/models', async (c) => {
  const client = c.get('openAI')
  const res = await client.models.list()
  return c.json(res)
})

export default app