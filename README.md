# API Canvas

A web-based API documentation tool that combines a live editor with beautiful documentation rendering. Think "Figma for API Documentation" — a developer-first experience that merges the power of Swagger with the editing UX of Notion.

## About

API Canvas lets developers view, edit, and share API documentation in real-time. It features a dual-pane interface with a markup editor on the left and a live-rendered preview on the right, providing instant visual feedback as you write.

### Key Features

- **Dual Pane Editor** — OpenAPI (YAML/JSON) editor with syntax highlighting and live preview
- **Three View Modes** — Docs view, Edit mode, and Split view via a tab system
- **API Documentation Viewer** — Endpoint grouping, request/response examples, and code snippets
- **Try-It-Out** — Send HTTP requests and view responses directly in the browser
- **Import/Export** — Import OpenAPI JSON/YAML or Postman collections; export as static HTML, JSON/YAML, or shareable links
- **Theming** — Dark/light mode with brand customization options

## Tech Stack

- **Framework:** Next.js 16 with React 19
- **Editor:** Monaco Editor (VS Code editor)
- **Styling:** Tailwind CSS
- **Parsing:** js-yaml, swagger-parser
- **Icons:** Lucide React
- **Language:** TypeScript

## Prerequisites

- Node.js 18+
- npm

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for production

```bash
npm run build
```

### Start the production server

```bash
npm start
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Main application page
│   └── globals.css       # Global styles
├── components/
│   ├── Editor.tsx        # Monaco-based OpenAPI editor
│   ├── ApiPreview.tsx    # Live API documentation preview
│   ├── Header.tsx        # App header with project name, save, share
│   ├── TabBar.tsx        # Docs / Edit / Split view tabs
│   └── TryItOut.tsx      # In-browser API request testing
├── lib/
│   └── openapi-parser.ts # OpenAPI spec parsing and validation
└── types/
    └── openapi.ts        # TypeScript type definitions
```

## Roadmap

- **Phase 1** — Editor + live preview, basic rendering, import/export
- **Phase 2** — API testing, theming, sharing via link
- **Phase 3** — Real-time collaboration, version history, AI-assisted features
