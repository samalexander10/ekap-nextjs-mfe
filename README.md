# EKAP Next.js MFE — Enterprise Knowledge & Action Platform

> **Integration pattern:** Next.js 14 App Router shell + Webpack 5 Module Federation remote (React props callback)

An enterprise HR chat assistant where the Next.js shell consumes a standalone Webpack 5 MFE remote using `@module-federation/nextjs-mf`. The HR service is powered by **Spring AI 1.0** (instead of a direct Anthropic SDK call) and the shell is built on the Next.js App Router with React Server Components. The HR name-change mini-app is loaded with `next/dynamic` (`ssr: false`) and receives a typed `onComplete` callback prop directly.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component diagrams and data-flow walkthroughs.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Shell | Next.js 14 App Router, React 18, Tailwind CSS, TypeScript |
| HR Mini-App | React 18, Webpack 5, TypeScript (MFE remote, `remoteEntry.js`) |
| Chat Service | Python 3.12, FastAPI, Anthropic SDK, SSE streaming |
| HR Service | Java 21, Spring Boot 3.3, **Spring AI 1.0**, Spring WebFlux, R2DBC |
| Doc Processor | Python 3.12, FastAPI, aiokafka, fastembed (ONNX) |
| Vector DB | Weaviate 1.27.0 (BM25 keyword search, `none` vectorizer) |
| Relational DB | PostgreSQL 16 |
| Cache | Redis 7 (conversation context) |
| Message Queue | Apache Kafka 7.6 (Confluent) + Zookeeper |
| LLM | `claude-sonnet-4-6` via Anthropic API |

---

## Prerequisites

- **Docker Desktop** (Apple Silicon arm64 or amd64)
- An **[Anthropic API key](https://console.anthropic.com/)**
- Python ≥ 3.10 on the host (for the one-time Weaviate seed scripts)

---

## Running the App

### 1 — Environment

```bash
cp .env.example .env
# Open .env and set ANTHROPIC_API_KEY=sk-ant-...
```

### 2 — Start all services

```bash
docker compose up -d
```

Wait ~90 s (the Spring AI service takes longer to start):

```bash
docker compose ps   # all should show "healthy" or "Up"
```

### 3 — Seed Weaviate *(first run only, or after `down -v`)*

```bash
python3 infra/weaviate/setup.py
python3 infra/weaviate/ingest.py
```

> **Apple Silicon:** use `/opt/homebrew/bin/python3.13` if the above fails.

### 4 — Open the app

| URL | What it is |
|---|---|
| **http://localhost:3000** | Next.js shell |
| http://localhost:3000/chat | Chat page (main UI) |
| http://localhost:3000/hr/name-change | Name change page (standalone route) |
| http://localhost:3001/remoteEntry.js | Webpack 5 MFE remote entry |
| http://localhost:8080/docs | Chat Service OpenAPI docs |
| http://localhost:8082/actuator/health | HR Service (Spring AI) health |

### 5 — Try it

1. Open **http://localhost:3000/chat**
2. Ask: *"I would like to change my last name"*
3. The assistant replies with guidance and a **Start Name Change Request** chip
4. Click the chip → the `NameChangeSidePanel` slides open alongside the chat
5. The Webpack 5 MFE remote loads into the panel; fill in the form and submit
6. `onComplete(requestId)` fires → the panel shows a success state and closes

### 6 — Stop

```bash
docker compose down          # stop, keep volumes
docker compose down -v       # stop + wipe all data
```

---

## Key Architectural Differences vs. the Other Versions

| Aspect | ekap-iframe | ekap-react-mfe | **ekap-nextjs-mfe** |
|---|---|---|---|
| Shell framework | React + Vite | React + Webpack | **Next.js 14 App Router** |
| Mini-app loading | `<iframe>` | MFE remote (lazy import) | **MFE remote (next/dynamic, ssr:false)** |
| Shell↔mini-app comms | `postMessage` | React props | **React props** |
| HR service AI layer | Direct Anthropic SDK | Direct Anthropic SDK | **Spring AI 1.0** |
| Routing | SPA (React Router) | SPA (React Router) | **File-system routing (App Router)** |

---

## Mini-App Integration Pattern

The shell declares the remote in `next.config.js`:

```js
new NextFederationPlugin({
  name: 'shell',
  remotes: {
    hrNamechange: `hrNamechange@${process.env.NEXT_PUBLIC_REMOTE_HR_NAMECHANGE_URL}/remoteEntry.js`,
  },
})
```

It consumes the component with `next/dynamic` to skip SSR (the remote is a browser-only Webpack bundle):

```tsx
const NameChangeApp = dynamic(
  () => import('hrNamechange/NameChangeApp'),
  { ssr: false }
);

// In the side panel:
<NameChangeApp onComplete={(requestId) => handleComplete(requestId)} />
```

---

## Project Structure

```
ekap-nextjs-mfe/
├── backend/
│   ├── chat-service/        # Python FastAPI — RAG chat, SSE streaming, intent detection
│   ├── hr-service/          # Java Spring Boot + Spring AI — HR vertical
│   └── doc-processor/       # Python FastAPI — document chunking + Weaviate indexing
├── frontend/
│   ├── shell/               # Next.js 14 App Router shell
│   │   ├── app/             # File-system routes (chat, hr/name-change, documents)
│   │   ├── components/      # ChatWindow, NameChangeSidePanel, MessageBubble, …
│   │   ├── services/        # chatService.ts (SSE streaming)
│   │   └── types/           # chat.ts, remotes.d.ts
│   └── remotes/
│       └── hr-namechange/   # Webpack 5 MFE remote — exposes NameChangeApp
├── infra/
│   ├── postgres/migrations/ # SQL schema
│   ├── kafka/               # Topic init scripts
│   └── weaviate/            # setup.py + ingest.py
└── docker-compose.yml
```
