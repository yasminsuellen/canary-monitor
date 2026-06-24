import express from 'express'
import { WebSocketServer } from 'ws'
import { createServer } from 'http'
import config from './config.js'
import { runChecks } from './engine.js'

const app = express()
const server = createServer(app)
const wss = new WebSocketServer({ server })

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

function broadcast(data) {
  const message = JSON.stringify(data)
  wss.clients.forEach(client => {
    if (client.readyState === 1) {
      client.send(message)
    }
  })
}

wss.on('connection', (ws) => {
  console.log('client connected')
  ws.on('close', () => console.log('client disconnected'))
})

async function tick() {
  const results = await runChecks(config)
  broadcast(results)
  setTimeout(tick, 10000)
}

const PORT = process.env.PORT || 3001
server.listen(PORT, () => {
  console.log(`server running on port ${PORT}`)
  tick()
})