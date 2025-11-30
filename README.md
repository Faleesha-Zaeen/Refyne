# Refyne — The Evolving AI Engineer

Refyne analyzes repositories to identify architectural bottlenecks, summarize structural patterns, and produce focused refactor recommendations. It pairs an Express-based analysis backend with a React + Vite front end so teams can explore issues and act on prioritized improvements.

## Table of contents

- [What it does](#what-it-does)
- [Repository layout](#repository-layout)
- [Technology stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Local setup & quick start](#local-setup--quick-start)
- [Configuration](#configuration)
- [Development workflow](#development-workflow)
- [Build & deployment](#build--deployment)
- [Contributing](#contributing)
- [License](#license)

## What it does

Refyne provides:

- Structural analysis of codebases to surface architectural hotspots.
- High-level summaries of module and dependency structure.
- Actionable suggestions for refactoring and improving maintainability.
- A UI for exploring historical analyses and recommendations.

## Repository layout

```
Refyne/
├── server/         # Express backend, analysis pipeline, API endpoints
├── client/         # React + Vite front end (UI components, styles)
├── data/           # Persistent analysis results (history.json)
├── utils/          # Shared analysis helpers and utilities
├── README.md       # This file
└── LICENSE         # Project license (MIT)
```

## Technology stack

- Backend: Node.js, Express
- Frontend: React, Vite
- Styling: Tailwind CSS (present in client)
- Data store: JSON files under `data/` (simple persistent history)

## Prerequisites

- Node.js (LTS recommended)
- npm (included with Node.js)

## Local setup & quick start

1. Install and run the backend:

```powershell
cd server
npm install
npm run dev
```

2. Install and run the frontend:

```powershell
cd ../client
npm install
npm run dev
```

Open `http://localhost:5173` to access the UI. The backend defaults to port `5000` and the client runs on `5173` when using the Vite dev server.

## Configuration

- Copy `server/.env.example` to `server/.env` and provide required values.
- Important environment variables:
  - `GEMINI_API_KEY` — API key for Gemini (used by AI-powered recommendation features).
  - `PORT` — backend port (defaults to `5000` if unset).

If `GEMINI_API_KEY` is not set, AI integrations will be skipped and the local analysis features remain available.

## Development workflow

- Make UI changes in `client/src/components/` and styles in `client/src/styles/`.
- Update analysis code in `server/` and `utils/`.
- Analysis results and history are written to `data/history.json` for review.

Testing: there is no test suite included by default. Adding unit and integration tests is recommended prior to major changes.

## Build & deployment

1. Build frontend for production:

```powershell
cd client
npm run build
```

2. Serve the build output from a static host or integrate it with the Express backend for a single deployment artifact.

Recommended options:
- Host static files on platforms such as Vercel, Netlify, or an object storage + CDN.
- Or copy `client/dist` into the backend's static assets and serve via Express behind a reverse proxy.

## Contributing

Contributions are welcome. Suggested workflow:

1. Fork the repository and create a feature branch: `git checkout -b feature/your-feature`.
2. Implement changes and include tests where applicable.
3. Open a pull request with a clear description and motivation for the change.

Guidelines:
- Keep pull requests focused and small when possible.
- Update `README.md` and include usage examples for new features.

If you'd like help scoping a contribution, open an issue describing the goal and maintainers can help plan the work.

## License

This repository is licensed under the MIT License — see the `LICENSE` file for details.

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

## Contact

Open an issue for questions, bug reports, or feature requests.
