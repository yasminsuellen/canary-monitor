# Canary Monitor
A real-time service health monitoring dashboard built with vanilla JavaScript and Node.js. **[Click here to live demo.](https://canary-monitor.vercel.app)**

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)
![WebSocket](https://img.shields.io/badge/WebSocket-real--time-6EE7B7?style=flat-square)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![No Framework](https://img.shields.io/badge/No_Framework-vanilla-6EE7B7?style=flat-square)

<div align="center">
  <img src="https://github.com/user-attachments/assets/d71ee915-fa80-42ad-b02e-06bd3d36eb48" alt="Canary Monitor Dashboard" width="100%"/>
</div>

## Features

- Poll multiple API endpoints on configurable intervals
- Real-time latency measurement and p95 calculation
- Threshold-based alerting: UP, DEGRADED, and DOWN status per service
- Live incident log with timestamps sorted by most recent breach
- Avg response time chart across all services
- Per-service uptime map with last 60 checks
- WebSocket broadcast: server pushes updates to all connected clients
- Responsive layout for desktop and mobile

## Tech Stack

- **Node.js** - HTTP server and health check engine
- **WebSocket (ws)** - real-time push from server to connected clients
- **Express** - serves the `/health` endpoint
- **Vanilla JavaScript (ES2022)** - ES Modules, async/await, closures
- **CSS3** - custom dark theme with grid layout, no utility framework
- **HTML5** - semantic markup, module scripts

## Architecture

```
server/config.js    → service list with URLs, intervals and thresholds
server/engine.js    → polling engine + in-memory store (runs on Node.js)
server/index.js     → HTTP + WebSocket server, broadcasts results every tick
      ↓ WebSocket
client/index.html   → connects to WebSocket, calls startUI() on each message
client/ui.js        → pure rendering layer (summary, endpoints, incidents, charts)
client/style.css    → dark theme, responsive grid layout
```

### Server-side polling

The health check engine runs entirely on the server. On every tick, `engine.js` fetches all configured endpoints concurrently, measures latency, and classifies each result as UP, DEGRADED, or DOWN based on the configured threshold. The full state is then broadcast to all connected WebSocket clients.

### WebSocket push

`server/index.js` creates an HTTP server and attaches a WebSocket server to it. After every polling cycle, the updated state is serialized and sent to every active client connection. The client never needs to request data — it just listens and re-renders on each message.

### Decoupled rendering

`ui.js` has no knowledge of `fetch` or WebSocket. It receives a plain array of service objects and renders the full dashboard. Summary cards, the endpoints table, the incidents panel, the avg response time chart and the per-service uptime map are all computed from that single data snapshot.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone git@github.com:yasminsuellen/canary-monitor.git
cd canary-monitor/server
npm install
node index.js
```

Open `client/index.html` in your browser or serve the `client/` folder with any static file server.

### Configuration

Edit `server/config.js` to add or modify monitored services:

```js
const config = [
  {
    name: "Auth API",
    url: "https://your-service.com/health",
    interval: 10000,   // polling interval in ms
    threshold: 200     // latency threshold in ms: above this is DEGRADED
  }
]
```

## Project Structure

```
canary-monitor/
├── client/
│   ├── index.html   # entry point: connects to WebSocket and starts UI
│   ├── style.css    # dark theme, responsive grid, panel components
│   └── ui.js        # pure rendering layer: summary, table, charts, uptime map
└── server/
    ├── config.js    # service list with URLs, intervals and thresholds
    ├── engine.js    # polling engine and in-memory store
    └── index.js     # HTTP + WebSocket server
```

## How Monitoring Works

1. `server/index.js` starts an HTTP and WebSocket server on port 3001
2. On startup, `tick()` calls `engine.js` which fetches all endpoints concurrently
3. Each check measures latency and classifies the result: UP if under threshold, DEGRADED if over threshold but server responded, DOWN if no response
4. The full store state is broadcast to all connected WebSocket clients
5. `client/index.html` receives the message and calls `startUI()` with the updated data
6. `ui.js` re-renders the entire dashboard on every update

---

**Yasmin Suellen** - [GitHub](https://github.com/yasminsuellen) · [LinkedIn](https://www.linkedin.com/in/yasminsuellen/) · [Portfolio](https://yasminsuellendev.vercel.app/)
