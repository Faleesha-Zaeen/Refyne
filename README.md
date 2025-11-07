# Refyne – The Evolving AI Engineer

Refyne analyzes complete codebases to uncover architectural bottlenecks, summarize structural patterns, and prepare focused refactor suggestions powered by Gemini.

## Project Structure

```
Refyne2/
├── server/     # Express backend, Gemini integration stubs, analysis pipeline
├── client/     # React + Vite + Tailwind single-page interface
├── data/       # Persistent storage (analysis history)
└── README.md
```

## Quick Start

1. **Install dependencies**
   ```bash
   cd server
   npm install
   cd ../client
   npm install
   ```

2. **Environment variables**
   - Copy `server/.env.example` to `server/.env`
   - Set `GEMINI_API_KEY` (required for future Gemini calls)

3. **Run the backend**
   ```bash
   cd server
   npm run dev
   ```

4. **Run the frontend**
   ```bash
   cd client
   npm run dev
   ```

The backend listens on port `5000` by default and the Vite dev server uses port `5173`. Tailwind styling and chart placeholders make it easy to extend the UI with richer visualizations later.
