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

  return { initService, recordCheck, getService, getAll }
})()

export default store