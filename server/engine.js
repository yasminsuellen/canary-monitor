const store = (() => {
  const services = new Map()

  function initService(name, threshold) {
    if (!services.has(name)) {
      services.set(name, {
        name,
        threshold,
        history: [],
        uptime: { total: 0, up: 0 },
        alerts: []
      })
    }
  }

  function recordCheck(name, result) {
    const service = services.get(name)
    if (!service) return

    service.history.push(result)
    if (service.history.length > 100) service.history.shift()

    service.uptime.total++
    if (result.status === 'up') service.uptime.up++

    if (result.status === 'degraded' || result.status === 'down') {
      service.alerts.unshift({
        timestamp: result.timestamp,
        status: result.status,
        latency: result.latency
      })
      if (service.alerts.length > 20) service.alerts.pop()
    }
  }

  function getAll() {
    return Array.from(services.values())
  }

  return { initService, recordCheck, getAll }
})()

export async function runChecks(config) {
  const checks = config.map(async (service) => {
    store.initService(service.name, service.threshold)
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

    } catch (error) {
      store.recordCheck(service.name, {
        timestamp: Date.now(),
        latency: null,
        status: 'down',
        error: error.message
      })
    }
  })

  await Promise.all(checks)
  return store.getAll()
}