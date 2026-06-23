const store = (() => {
  const services = new Map()

  function initService(name) {
    services.set(name, {
      history: [],
      uptime: { total: 0, up: 0 },
      alerts: []
    })
  }

  function recordCheck(name, result) {
    const service = services.get(name)
    if (!service) return

    service.history.push(result)
    if (service.history.length > 100) service.history.shift()

    service.uptime.total++
    if (result.status === 'up') service.uptime.up++
  }

  function getService(name) {
    return services.get(name)
  }

  function getAll() {
    return Array.from(services.entries()).map(([name, data]) => ({
      name,
      ...data
    }))
  }

  function getP95(name) {
    const service = services.get(name)
    if (!service) return null

    const latencies = service.history
      .map(check => check.latency)
      .filter(latency => latency !== null)
      .sort((a, b) => a - b)

    if (latencies.length === 0) return null

    const index = Math.floor(latencies.length * 0.95)
    return latencies[index]
  }

  function addAlert(name, alert) {
    const service = services.get(name)
    if (!service) return

    service.alerts.unshift(alert)
    if (service.alerts.length > 20) service.alerts.pop()
  }

  return { initService, recordCheck, getService, getAll, getP95, addAlert }
})()

export default store