import config from './config.js'
import store from './store.js'

function createMonitor(service) {
  let isRunning = false

  async function check() {
    const start = Date.now()

    try {
      const response = await fetch(service.url)
      const latency = Date.now() - start

      const status = response.ok && latency < service.threshold ? 'up'
        : response.ok && latency > service.threshold ? 'degraded'
          : 'down'

      store.recordCheck(service.name, {
        timestamp: Date.now(),
        latency,
        status,
        statusCode: response.status
      })

      if (status === 'degraded' || status === 'down') {
        store.addAlert(service.name, {
          timestamp: Date.now(),
          status,
          latency
        })
      }

      window.dispatchEvent(new CustomEvent('argus:update'))

    } catch (error) {
      store.recordCheck(service.name, {
        timestamp: Date.now(),
        latency: null,
        status: 'down',
        error: error.message
      })

      store.addAlert(service.name, {
        timestamp: Date.now(),
        status: 'down',
        latency: null
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