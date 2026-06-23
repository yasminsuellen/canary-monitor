# Canary Monitor
A real-time service health monitoring dashboard built with vanilla JavaScript. **[Click here to live demo.](#)** <!-- add deploy link after Phase 4 -->

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![Web Workers](https://img.shields.io/badge/Web_Workers-enabled-4B5563?style=flat-square)
![No Framework](https://img.shields.io/badge/No_Framework-vanilla-6EE7B7?style=flat-square)

<div align="center">
  <img src="https://github.com/user-attachments/assets/d71ee915-fa80-42ad-b02e-06bd3d36eb48" alt="Canary Monitor Dashboard" width="100%"/>
</div>

## Features

- Poll multiple API endpoints on configurable intervals
- Real-time latency measurement and p95 calculation
- Threshold-based alerting: UP, DEGRADED, and DOWN status per service
- Live alert log with timestamps sorted by most recent breach
- Polling engine runs in a Web Worker - UI never blocks
- Generator-based mock data simulator for offline demo and testing
- Zero dependencies, zero build tools

## Tech Stack

- **Vanilla JavaScript (ES2022)** - ES Modules, async/await, generators, closures
- **Web Workers** - polling engine runs in a dedicated thread separate from the UI
- **CSS3** - custom dark theme with grid layout, no utility framework
- **HTML5** - semantic markup, module scripts

## Architecture

The project is split into four layers that communicate through a structured message-passing system.

```
config.js         → service list and thresholds (static, no logic)
     ↓ reads config
worker.js         → polling engine + in-memory store (runs in Web Worker thread)
     ↓ postMessage
index.html        → receives updates from Worker, calls startUI()
     ↓ passes data
ui.js             → renders cards and alert log (pure rendering, no fetch)
```

### Web Worker for polling

The entire health check engine runs inside a Web Worker, which means it operates on a separate thread from the browser's main thread. The UI never freezes during network operations, even when multiple endpoints are polled simultaneously. The Worker communicates with the main thread exclusively through `postMessage` - it has no access to the DOM.

### Generator-based mock data

Instead of depending on external APIs for development and demos, the dashboard uses JavaScript generators to simulate an infinite stream of realistic check results. Each service has its own generator that produces random latency values with configurable failure rates and occasional latency spikes. The dashboard runs entirely offline.

### Decoupled rendering

`ui.js` has no knowledge of `fetch`, the Worker, or the store. It receives a plain array of service objects and renders them. This separation means the rendering layer can be replaced or tested independently without touching the data layer.

### Stop control via message passing

Monitors can be stopped individually by sending a `{ type: 'stop', name: serviceName }` message to the Worker. The Worker maintains a `Set` of active service names and exits the polling loop for any service removed from it - without restarting the Worker or affecting other monitors.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone git@github.com:yasminsuellen/canary-monitor.git
cd canary-monitor
npx serve .
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Configuration

Edit `config.js` to add or modify monitored services:

```js
const services = [
  {
    name: "Auth API",
    url: "https://your-service.com/health",
    interval: 10000,   // polling interval in ms
    threshold: 500     // latency threshold in ms — above this is DEGRADED
  }
]
```

## Project Structure

```
canary-monitor/
├── index.html       # entry point - loads Worker and starts UI
├── style.css        # dark theme, card grid, alert log table
├── config.js        # service list with URLs, intervals and thresholds
├── worker.js        # polling engine + store (runs in Web Worker)
├── mock.js          # generator-based mock data simulator
└── ui.js            # pure rendering layer - cards and alert log
```

## How Monitoring Works

1. `worker.js` reads the service list from `config.js` on startup
2. For each service, a polling loop starts using `setTimeout` chains (not `setInterval`, to avoid overlapping requests)
3. Each check calls the mock generator (or a real `fetch` in production mode) and measures latency
4. The result is classified: UP if latency is under threshold, DEGRADED if over threshold but server responded, DOWN if no response
5. The Worker sends the full store state to the main thread via `postMessage`
6. `index.html` receives the message and calls `startUI()` with the updated data
7. `ui.js` re-renders the cards and alert log on every update

---

**Yasmin Suellen** - [GitHub](https://github.com/yasminsuellen) · [LinkedIn](https://www.linkedin.com/in/yasminsuellen/) · [Portfolio](https://yasminsuellendev.vercel.app/)
