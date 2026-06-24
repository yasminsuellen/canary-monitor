function calcGlobalUptime(services) {
  const total = services.reduce((sum, s) => sum + s.uptime.total, 0)
  const up = services.reduce((sum, s) => sum + s.uptime.up, 0)
  return total === 0 ? 100 : Math.round((up / total) * 100 * 10) / 10
}

function calcAvgLatency(services) {
  const latencies = services.flatMap(s =>
    s.history.map(c => c.latency).filter(l => l !== null)
  )
  if (latencies.length === 0) return null
  return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
}

function calcP95All(services) {
  const latencies = services.flatMap(s =>
    s.history.map(c => c.latency).filter(l => l !== null)
  ).sort((a, b) => a - b)
  if (latencies.length === 0) return null
  return latencies[Math.floor(latencies.length * 0.95)]
}

function calcAlertsToday(services) {
  const midnight = new Date().setHours(0, 0, 0, 0)
  return services.flatMap(s => s.alerts)
    .filter(a => a.timestamp >= midnight).length
}

function renderSummary(services) {
  const online = services.filter(s => s.history.at(-1)?.status === 'up').length
  const total = services.length
  const incidents = services.filter(s => {
    const last = s.history.at(-1)
    return last && (last.status === 'down' || last.status === 'degraded')
  }).length
  const uptime = calcGlobalUptime(services)
  const avgLatency = calcAvgLatency(services)
  const p95 = calcP95All(services)
  const alertsToday = calcAlertsToday(services)

  return `
    <div class="summary-row">
      <div class="summary-card">
        <div class="summary-label">Services Online</div>
        <div class="summary-value green">${online} / ${total}</div>
        <div class="summary-sub">${incidents} incident${incidents !== 1 ? 's' : ''} active</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Global Uptime (30d)</div>
        <div class="summary-value ${uptime >= 99 ? 'green' : uptime >= 95 ? 'yellow' : 'red'}">${uptime}%</div>
        <div class="summary-sub">SLA threshold: 99.0%</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Avg Response Time</div>
        <div class="summary-value ${avgLatency < 300 ? 'green' : avgLatency < 800 ? 'yellow' : 'red'}">${avgLatency !== null ? avgLatency + 'ms' : 'N/A'}</div>
        <div class="summary-sub">p95: ${p95 !== null ? p95 + 'ms' : 'collecting...'}</div>
      </div>
      <div class="summary-card">
        <div class="summary-label">Alerts Today</div>
        <div class="summary-value ${alertsToday === 0 ? 'green' : alertsToday < 5 ? 'yellow' : 'red'}">${alertsToday}</div>
        <div class="summary-sub">${services.flatMap(s => s.alerts).filter(a => a.status === 'up').length} resolved</div>
      </div>
    </div>
  `
}

function renderSparkline(history) {
  const bars = history.slice(-10)
  return `<div class="spark">${bars.map(c => {
    const h = c.latency ? Math.min(Math.round((c.latency / 1000) * 20), 20) : 2
    const color = c.status === 'up' ? '#6ee7b7' : c.status === 'degraded' ? '#fbbf24' : '#f87171'
    return `<div class="spark-bar" style="height:${Math.max(h,3)}px;background:${color}"></div>`
  }).join('')}</div>`
}

function renderEndpointsTable(services) {
  const rows = services.map(service => {
    const last = service.history.at(-1)
    const status = last ? last.status : 'pending'
    const latency = last?.latency ?? null
    const uptimePct = service.uptime.total === 0 ? 100
      : Math.round((service.uptime.up / service.uptime.total) * 100 * 10) / 10

    return `
      <tr>
        <td>
          <div class="service-name">${service.name}</div>
        </td>
        <td><span class="status-pill status-${status}">${status.toUpperCase()}</span></td>
        <td><span class="latency ${status}">${latency !== null ? latency + 'ms' : 'timeout'}</span></td>
        <td><span class="uptime-pct">${uptimePct}%</span></td>
        <td>${renderSparkline(service.history)}</td>
      </tr>
    `
  }).join('')

  return `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Endpoints</span>
        <span class="panel-badge">${services.length} monitored</span>
      </div>
      <table>
        <thead>
          <tr>
            <th>Service</th>
            <th>Status</th>
            <th>Latency</th>
            <th>Uptime</th>
            <th>Last 10 checks</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `
}

function renderIncidents(services) {
  const allAlerts = services
    .flatMap(s => s.alerts.map(a => ({ ...a, serviceName: s.name })))
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)

  const items = allAlerts.length === 0
    ? '<div class="no-incidents">No incidents recorded</div>'
    : allAlerts.map(alert => `
      <div class="incident-item">
        <div class="incident-dot ${alert.status}"></div>
        <div>
          <div class="incident-text">
            <span class="incident-service">${alert.serviceName}</span>
            ${alert.latency !== null ? `latency ${alert.latency}ms` : 'no response'}
          </div>
          <div class="incident-time">${new Date(alert.timestamp).toLocaleTimeString()} · ${alert.status}</div>
        </div>
      </div>
    `).join('')

  return `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Incidents</span>
        <span class="panel-badge">${allAlerts.length} recent</span>
      </div>
      ${items}
    </div>
  `
}

function renderLatencyChart(services) {
  const minLen = services.length ? Math.min(...services.map(s => s.history.length)) : 0
  if (minLen === 0) return `
    <div class="panel">
      <div class="panel-header"><span class="panel-title">Avg Response Time</span></div>
      <div class="chart-empty">collecting data...</div>
    </div>
  `

  const points = Array.from({ length: minLen }, (_, i) => {
    const latencies = services.map(s => s.history[i].latency).filter(l => l !== null)
    return latencies.length ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0
  })

  const max = Math.max(...points) || 1
  const min = Math.min(...points.filter(p => p > 0)) || 0
  const range = max - min || 1
  const w = 400
  const h = 80

  const coords = points.map((v, i) => {
    const x = (i / (points.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 10)
    return `${x},${y}`
  })

  const areaPath = `M 0,${h} L ${coords.join(' L ')} L ${w},${h} Z`

  return `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Avg Response Time (last ${points.length} checks)</span>
      </div>
      <div class="chart-area">
        <svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="width:100%;height:80px;overflow:visible">
          <path d="${areaPath}" fill="rgba(110,231,183,0.07)"/>
          <polyline points="${coords.join(' ')}" fill="none" stroke="#6ee7b7" stroke-width="1.5"/>
        </svg>
      </div>
    </div>
  `
}

function renderUptimeMap(services) {
  if (!services.length) return ''

  const rows = services.map(service => {
    const cells = service.history.slice(-60).map(c => `
      <div class="uptime-cell ${c.status === 'down' ? 'down' : c.status === 'degraded' ? 'degraded' : ''}"></div>
    `).join('')
    return `
      <div class="uptime-row">
        <span class="uptime-label">${service.name}</span>
        <div class="uptime-grid">${cells}</div>
      </div>
    `
  }).join('')

  return `
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">Uptime Map (last 60 checks)</span>
      </div>
      <div class="uptime-rows">${rows}</div>
    </div>
  `
}

export function startUI(services) {
  document.getElementById('summary').innerHTML = renderSummary(services)
  document.getElementById('endpoints').innerHTML = renderEndpointsTable(services)
  document.getElementById('incidents').innerHTML = renderIncidents(services)
  document.getElementById('charts').innerHTML = `
    ${renderLatencyChart(services)}
    ${renderUptimeMap(services)}
  `
  document.getElementById('last-updated').textContent =
    `Updated: ${new Date().toLocaleTimeString()}`
} 