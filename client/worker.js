import config from './config.js'
import { generators } from './mock.js'

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

    function addAlert(name, alert) {
        const service = services.get(name)
        if (!service) return

        service.alerts.unshift(alert)
        if (service.alerts.length > 20) service.alerts.pop()
    }

    function getAll() {
        return Array.from(services.entries()).map(([name, data]) => ({
            name,
            ...data
        }))
    }

    return { initService, recordCheck, addAlert, getAll }
})()

async function check(service) {
    const mock = generators[service.name].next().value

    const status = mock.ok && mock.latency < service.threshold ? 'up'
        : mock.ok && mock.latency > service.threshold ? 'degraded'
            : 'down'

    if (mock.ok) {
        store.recordCheck(service.name, {
            timestamp: Date.now(),
            latency: mock.latency,
            status,
            statusCode: 200
        })
    } else {
        store.recordCheck(service.name, {
            timestamp: Date.now(),
            latency: null,
            status: 'down',
            error: 'simulated failure'
        })
    }

    if (status === 'degraded' || status === 'down') {
        store.addAlert(service.name, {
            timestamp: Date.now(),
            status,
            latency: mock.latency
        })
    }

    self.postMessage({ type: 'update', data: store.getAll() })
}

const running = new Set()

function startPolling() {
    config.forEach(service => {
        store.initService(service.name)
        running.add(service.name)

        async function loop() {
            if (!running.has(service.name)) return
            await check(service)
            setTimeout(loop, service.interval)
        }

        loop()
    })
}

self.onmessage = (event) => {
    if (event.data.type === 'stop') {
        running.delete(event.data.name)
    }
}

startPolling()
