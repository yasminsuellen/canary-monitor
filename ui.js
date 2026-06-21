import store from './store.js'

function renderServiceCard(service) {
  const uptimePercent = service.uptime.total === 0
    ? 100
    : Math.round((service.uptime.up / service.uptime.total) * 100)

  const lastCheck = service.history.at(-1)
  const status = lastCheck ? lastCheck.status : 'pending'
  const latency = lastCheck?.latency ?? 'N/A'

  return `
    <div class="card card--${status}">
      <div class="card__name">${service.name}</div>
      <div class="card__status">${status.toUpperCase()}</div>
      <div class="card__latency">${latency}${latency !== 'N/A' ? 'ms' : ''}</div>
      <div class="card__uptime">Uptime: ${uptimePercent}%</div>
    </div>
  `
}

function render() {
  const services = store.getAll()
  const container = document.getElementById('dashboard')
  container.innerHTML = services.map(renderServiceCard).join('')
}

export function startUI() {
  window.addEventListener('argus:update', render)
}