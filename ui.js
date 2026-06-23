function renderServiceCard(service) {
  const uptimePercent = service.uptime.total === 0
    ? 100
    : Math.round((service.uptime.up / service.uptime.total) * 100)

  const lastCheck = service.history.at(-1)
  const status = lastCheck ? lastCheck.status : 'pending'
  const latency = lastCheck?.latency ?? 'N/A'

  const latencies = service.history
    .map(c => c.latency)
    .filter(l => l !== null)
    .sort((a, b) => a - b)

  const p95 = latencies.length > 0
    ? latencies[Math.floor(latencies.length * 0.95)]
    : null

  return `
    <div class="card card--${status}">
      <div class="card__name">${service.name}</div>
      <div class="card__status">${status.toUpperCase()}</div>
      <div class="card__latency">${latency}${latency !== 'N/A' ? 'ms' : ''}</div>
      <div class="card__p95">p95: ${p95 !== null ? p95 + 'ms' : 'collecting...'}</div>
      <div class="card__uptime">Uptime: ${uptimePercent}%</div>
    </div>
  `
}

function renderAlertLog(services) {
  const allAlerts = services
    .flatMap(service => service.alerts.map(alert => ({
      ...alert,
      serviceName: service.name
    })))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 20)

  if (allAlerts.length === 0) return ''

  const rows = allAlerts.map(alert => `
    <tr>
      <td>${new Date(alert.timestamp).toLocaleTimeString()}</td>
      <td>${alert.serviceName}</td>
      <td class="status--${alert.status}">${alert.status.toUpperCase()}</td>
      <td>${alert.latency !== null ? alert.latency + 'ms' : 'timeout'}</td>
    </tr>
  `).join('')

  return `
    <section class="alert-log">
      <h2>Alert Log</h2>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Service</th>
            <th>Status</th>
            <th>Latency</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>
  `
}

export function startUI(services) {
  const container = document.getElementById('dashboard')
  container.innerHTML = services.map(renderServiceCard).join('')

  const timestamp = document.getElementById('last-updated')
  timestamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`

  const log = document.getElementById('alert-log')
  log.innerHTML = renderAlertLog(services)
} 