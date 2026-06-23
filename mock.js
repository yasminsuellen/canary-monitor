function* serviceGenerator(name, baseLatency, failureRate) {
    while (true) {
        const random = Math.random()

        if (random < failureRate) {
            yield { name, latency: null, ok: false }
        } else {
            const spike = random > 0.9 ? baseLatency * 3 : 0
            const latency = Math.round(baseLatency + (Math.random() * 50) + spike)
            yield { name, latency, ok: true }
        }
    }
}

export const generators = {
    'Auth API': serviceGenerator('Auth API', 120, 0.05),
    'User Service': serviceGenerator('User Service', 80, 0.02),
    'Posts API': serviceGenerator('Posts API', 200, 0.08)
}