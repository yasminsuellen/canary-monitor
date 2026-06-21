import config from './config.js'
import store from './store.js'

function createMonitor(service) {
  let isRunning = false

  async function check() {
    const start = Date.now()

    try {
      const response = await fetch(service.url)
      const latency = Date.now() - start

      store.recordCheck(service.name, {
        timestamp: Date.now(),
        latency,
        status: response.ok ? 'up' : 'down',
        statusCode: response.status
      })
      window.dispatchEvent(new CustomEvent('argus:update'))
    } catch (error) {
      store.recordCheck(service.name, {
        timestamp: Date.now(),
        latency: null,
        status: 'down',
        error: error.message
      })
      window.dispatchEvent(new CustomEvent('argus:update'))
    }
  }

  function start() {
    if (isRunning) return
    isRunning = true
    store.initService(service.name)

    async function loop() {
      if (!isRunning) return
      await check()
      setTimeout(loop, service.interval)
    }

    loop()
  }

  function stop() {
    isRunning = false
  }

  return { start, stop }
}

config.forEach(service => {
  const monitor = createMonitor(service)
  monitor.start()
})