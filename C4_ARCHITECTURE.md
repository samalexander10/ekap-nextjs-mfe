# C4 Architecture — EKAP Next.js MFE

> C4 model levels: **Context → Containers → Components**
> Diagrams use [Mermaid C4](https://mermaid.js.org/syntax/c4.html) and render natively on GitHub.

---

## Level 1 — System Context

Who uses the system and what external systems does it depend on?

```mermaid
C4Context
    title System Context — EKAP Next.js MFE

    Person(employee, "Employee", "Asks HR questions and launches self-service actions from the chat interface or dedicated routes")
    Person(hr_admin, "HR Administrator", "Reviews flagged documents via the HR service API")

    System(ekap, "EKAP Platform", "AI-powered HR chat assistant. Next.js App Router shell with a Webpack 5 MFE remote for the HR mini-app. HR service uses Spring AI 1.0 for RAG")

    System_Ext(anthropic, "Anthropic Claude API", "LLM for chat synthesis, intent detection via regex, and document processing")
    System_Ext(workday, "Workday (mocked)", "HR system of record — receives confirmed name changes after verification")

    Rel(employee, ekap, "Asks HR questions, submits name change requests", "HTTPS / Browser")
    Rel(hr_admin, ekap, "Reviews flagged requests", "HTTPS")
    Rel(ekap, anthropic, "Streams chat answers, verifies documents", "HTTPS / Anthropic API")
    Rel(ekap, workday, "Updates employee records after verification", "HTTPS (mocked)")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## Level 2 — Containers

What are the independently deployable / runnable units and how do they communicate?

```mermaid
C4Container
    title Containers — EKAP Next.js MFE

    Person(employee, "Employee", "Uses chat and name-change form")
    Person(hr_admin, "HR Admin", "Reviews flagged requests")

    System_Boundary(ekap, "EKAP Platform") {

        Container(shell, "Next.js Shell", "Next.js 14 App Router, React 18, Tailwind :3000", "File-system routed shell. Chat page with split-panel layout. Loads NameChangeApp MFE via next/dynamic(ssr:false). Action chips open in-page side panel")
        Container(hr_namechange, "HR Name Change Remote", "React 18 + Webpack 5 :3001", "Webpack MFE remote. Exposes NameChangeApp via remoteEntry.js. Accepts onComplete prop. SSR-incompatible (browser-only bundle)")

        Container(chat_service, "Chat Service", "Python 3.12, FastAPI :8080", "RAG chat: embeds query, retrieves Weaviate chunks, streams Claude answer via SSE. Regex-based intent detection populates action_suggestions in done event")
        Container(hr_service, "HR Service", "Java 21, Spring Boot + Spring AI 1.0 :8082", "HR domain service. Uses Spring AI VectorStore abstraction for RAG. Manages name-change workflow. Spring Kafka producer")
        Container(doc_processor, "Doc Processor", "Python 3.12, FastAPI :8001", "Document ingestion: chunking, fastembed ONNX embeddings, Weaviate indexing. Kafka consumer for async processing")

        ContainerDb(postgres, "PostgreSQL", "postgres:16 :5432", "Chat sessions, chat messages, name-change requests, documents")
        ContainerDb(redis, "Redis", "redis:7 :6379", "Conversation context cache (per-session turn history)")
        ContainerDb(weaviate, "Weaviate", "1.27.0 :8082(H)/:50051(gRPC)", "Vector store. HRDocument collection. near_vector + BM25 search. No vectorizer module (embeddings from fastembed)")
        Container(kafka, "Apache Kafka", "Confluent 7.6.0 :29092", "Event bus: document.uploaded, hr.events, hr.namechange topics")
    }

    System_Ext(anthropic, "Anthropic Claude API", "LLM provider")

    Rel(employee, shell, "Navigates chat, clicks action chips", "HTTPS")

    Rel(shell, chat_service, "POST /chat/stream — SSE chunks + action suggestions", "HTTPS / SSE")
    Rel(shell, hr_namechange, "Fetches remoteEntry.js via NextFederationPlugin, renders <NameChangeApp onComplete={cb} />", "Webpack MFE / next/dynamic")
    Rel(hr_namechange, shell, "Calls onComplete(requestId)", "React prop callback")
    Rel(hr_namechange, hr_service, "POST /api/hr/name-change", "HTTPS")

    Rel(chat_service, weaviate, "near_vector search HRDocument", "gRPC")
    Rel(chat_service, postgres, "Persist chat sessions and messages", "asyncpg / SQLAlchemy")
    Rel(chat_service, redis, "Get/set conversation context", "Redis protocol")
    Rel(chat_service, anthropic, "Stream chat synthesis", "HTTPS")

    Rel(hr_service, postgres, "Read/write name-change requests", "R2DBC")
    Rel(hr_service, weaviate, "Spring AI VectorStore RAG queries", "gRPC")
    Rel(hr_service, kafka, "Produce HR events", "Kafka")
    Rel(hr_service, anthropic, "Spring AI ChatClient (via Spring AI Anthropic starter)", "HTTPS")

    Rel(doc_processor, kafka, "Consume document events", "Kafka")
    Rel(doc_processor, weaviate, "Index document chunks with embeddings", "gRPC")

    Rel(hr_admin, hr_service, "Review flagged requests", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Level 3 — Components: Next.js Shell

What are the major internal components of the Next.js shell and how does it integrate the MFE?

```mermaid
C4Component
    title Components — Next.js Shell (App Router)

    Container_Ext(chat_service, "Chat Service", "FastAPI :8080", "SSE streaming endpoint")
    Container_Ext(hr_remote, "HR Namechange Remote", "Webpack :3001", "Serves remoteEntry.js")

    Container_Boundary(shell_ct, "Next.js Shell :3000") {
        Component(next_cfg, "next.config.js (NextFederationPlugin)", "NextFederationPlugin + Webpack", "Declares hrNamechange remote URL. Singleton shared react/react-dom. Shell's own remoteEntry at /_next/static/chunks/remoteEntry.js")
        Component(root_layout, "Root Layout", "Next.js layout.tsx (RSC)", "Server Component. Renders SideNav + TopBar shell chrome. Wraps all page slots")
        Component(sidenav, "SideNav", "React client component", "Navigation sidebar: Chat, Documents, HR Name Change links")
        Component(topbar, "TopBar", "React client component", "Top bar with page title and user avatar")
        Component(chat_page, "Chat Page", "use client — app/chat/page.tsx", "Owns activeAction state. Renders ChatWindow + NameChangeSidePanel in a flex split layout. Passes onActionSuggestion to ChatWindow")
        Component(chat_window, "ChatWindow", "React client component", "Chat state: messages, streaming buffer, loading. Calls chatService.streamChat. Renders MessageBubble list + action chip buttons. Calls onActionSuggestion prop on chip click")
        Component(message_bubble, "MessageBubble", "React component", "Renders a single message with role-based styling, markdown support, and action chip buttons below assistant messages")
        Component(side_panel, "NameChangeSidePanel", "React client component", "Slide-over panel. Uses next/dynamic(ssr:false) to load NameChangeApp. Manages completedId state. Shows success screen with requestId on completion")
        Component(hr_page, "HR Name Change Page", "use client — app/hr/name-change/page.tsx", "Standalone route for name change. Also loads NameChangeApp via next/dynamic. On complete, router.push('/chat')")
        Component(chat_svc_client, "chatService.ts", "TypeScript fetch client", "streamChat(request, onToken, onActions). Parses SSE: type:chunk→onToken, type:done→onActions with action_suggestions array")
        Component(remotes_d_ts, "remotes.d.ts", "TypeScript declaration", "Declares module 'hrNamechange/NameChangeApp' with NameChangeAppProps interface for type-safe remote import")
    }

    Rel(root_layout, sidenav, "renders")
    Rel(root_layout, topbar, "renders")
    Rel(root_layout, chat_page, "renders (slot)")
    Rel(root_layout, hr_page, "renders (slot)")

    Rel(chat_page, chat_window, "renders, passes onActionSuggestion")
    Rel(chat_page, side_panel, "renders when activeAction != null")
    Rel(chat_window, message_bubble, "renders per message")
    Rel(chat_window, chat_svc_client, "streamChat(request, onToken, onActions)")
    Rel(chat_window, chat_page, "onActionSuggestion(action)", "prop callback")

    Rel(side_panel, next_cfg, "triggers dynamic import resolution")
    Rel(next_cfg, hr_remote, "GET /remoteEntry.js at runtime", "HTTPS")
    Rel(side_panel, chat_page, "onClose() → setActiveAction(null)", "prop callback")

    Rel(hr_page, next_cfg, "triggers dynamic import resolution")

    Rel(chat_svc_client, chat_service, "POST /chat/stream", "HTTPS / SSE")
    Rel(remotes_d_ts, side_panel, "provides TypeScript types for NameChangeApp import")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Level 3 — Components: Chat Service

```mermaid
C4Component
    title Components — Chat Service (Python FastAPI)

    Container_Ext(shell, "Next.js Shell", "Next.js :3000", "SSE consumer")
    Container_Ext(postgres, "PostgreSQL", "DB", "Session + message store")
    Container_Ext(redis, "Redis", "Cache", "Conversation context")
    Container_Ext(weaviate, "Weaviate", "Vector DB", "HR policy chunks")
    System_Ext(anthropic, "Anthropic Claude API", "LLM")

    Container_Boundary(chat_svc, "Chat Service :8080") {
        Component(chat_router, "Chat Router", "FastAPI /chat, /chat/stream", "POST /chat (sync) and POST /chat/stream (SSE). Orchestrates: embed → retrieve → detect intent → stream → persist")
        Component(intent_detector, "Intent Detector", "_detect_action_suggestions()", "Pure Python regex rules. Matches name-change phrasing patterns. Returns list of ActionSuggestion dicts. Zero latency — no LLM call required")
        Component(llm_service, "LLM Service", "Python + anthropic SDK", "generate_answer() for sync. stream_answer() async generator for SSE. get_embedding() for vector queries. Supports openai|anthropic provider switch")
        Component(weaviate_svc, "Weaviate Service", "Python + weaviate-client v4", "get_weaviate_client() lazy singleton. retrieve_relevant_chunks(): near_vector search on HRDocument. Returns SourceChunk list")
        Component(db_layer, "Database Layer", "SQLAlchemy async + asyncpg", "AsyncSessionLocal. chat_sessions and chat_messages tables. _persist_messages() and _get_conversation_history()")
        Component(session_router, "Sessions Router", "FastAPI /sessions", "Create and list chat sessions. Used by shell on first load")
        Component(health_router, "Health Router", "FastAPI /health", "Liveness check. Used by Docker Compose health gate")
        Component(config, "Config", "pydantic-settings", "Settings: postgres_*, weaviate_*, kafka_*, anthropic_api_key, llm_model, llm_provider. Cached via @lru_cache")
    }

    Rel(shell, chat_router, "POST /chat/stream", "HTTPS / SSE")
    Rel(chat_router, intent_detector, "_detect_action_suggestions(message)")
    Rel(chat_router, llm_service, "get_embedding(message)")
    Rel(chat_router, weaviate_svc, "retrieve_relevant_chunks(embedding, top_k)")
    Rel(chat_router, db_layer, "_get_conversation_history(), _persist_messages()")
    Rel(chat_router, llm_service, "stream_answer(message, history, chunks)")

    Rel(llm_service, anthropic, "messages.create(stream=True)", "HTTPS")
    Rel(weaviate_svc, weaviate, "collection.query.near_vector()", "gRPC")
    Rel(db_layer, postgres, "INSERT / SELECT chat_sessions, chat_messages", "asyncpg")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Level 3 — Components: HR Service (Spring AI)

```mermaid
C4Component
    title Components — HR Service (Java Spring Boot + Spring AI 1.0)

    Container_Ext(hr_remote, "HR Namechange Remote", "React MFE", "Submits name change form")
    Container_Ext(chat_svc, "Chat Service", "FastAPI", "Queries HR for RAG context (optional)")
    Container_Ext(postgres, "PostgreSQL", "DB", "Name change request store")
    Container_Ext(weaviate, "Weaviate", "Vector DB", "HR policy chunks")
    Container_Ext(kafka, "Kafka", "Event bus", "HR event stream")
    System_Ext(anthropic, "Anthropic Claude API", "LLM via Spring AI")

    Container_Boundary(hr_svc, "HR Service :8082") {
        Component(namechange_ctrl, "Name Change Controller", "Spring WebFlux @RestController", "POST /api/hr/name-change — submit request. GET /api/hr/name-change/{id} — get status. POST /api/hr/name-change/{id}/review — HR admin review")
        Component(query_ctrl, "Query Controller", "Spring WebFlux @RestController", "POST /hr/query — RAG query for HR policies. Returns chunks + system prompt for chat synthesis")
        Component(health_ctrl, "Health Controller", "Spring @RestController", "GET /actuator/health — Docker Compose health gate")
        Component(namechange_svc, "Name Change Service", "Spring @Service", "Orchestrates submission: validate → persist PENDING → publish Kafka event → return ID. Status transitions: PENDING → VERIFIED → COMPLETED or REJECTED")
        Component(rag_svc, "HR RAG Service", "Spring @Service + Spring AI VectorStore", "Queries Weaviate via Spring AI VectorStore abstraction. Similarity search returns top-k HRDocument chunks")
        Component(spring_ai_client, "Spring AI Chat Client", "ChatClient (Spring AI)", "Wraps Anthropic API via spring-ai-anthropic-spring-boot-starter. Used by HR service for document-aware responses")
        Component(kafka_producer, "HR Event Producer", "Spring Kafka KafkaTemplate", "Publishes to hr.events and hr.namechange topics. Events include request lifecycle transitions")
        Component(namechange_repo, "Name Change Repository", "Spring Data R2DBC", "Reactive PostgreSQL CRUD for NameChangeRequest entity. Non-blocking R2DBC driver")
        Component(web_config, "Web Config", "Spring @Configuration", "CORS configuration: allows all origins for dev. Reactive WebFlux pipeline setup")
    }

    Rel(hr_remote, namechange_ctrl, "POST /api/hr/name-change", "HTTPS multipart")
    Rel(chat_svc, query_ctrl, "POST /hr/query", "HTTP")

    Rel(namechange_ctrl, namechange_svc, "submitRequest() / getStatus() / reviewRequest()")
    Rel(query_ctrl, rag_svc, "queryPolicies(message)")

    Rel(namechange_svc, namechange_repo, "save() / findById()", "R2DBC")
    Rel(namechange_svc, kafka_producer, "publishEvent(NameChangeEvent)")
    Rel(namechange_repo, postgres, "INSERT / SELECT name_change_requests", "R2DBC / asyncpg")
    Rel(kafka_producer, kafka, "Produce hr.namechange topic", "Kafka")
    Rel(rag_svc, weaviate, "VectorStore.similaritySearch()", "gRPC via Spring AI")
    Rel(spring_ai_client, anthropic, "ChatClient.prompt().stream()", "HTTPS / Spring AI")

    UpdateLayoutConfig($c4ShapeInRow="4", $c4BoundaryInRow="1")
```

---

## Key Architectural Differentiator: next/dynamic + SSR Boundary

This diagram explains why `ssr: false` is mandatory for the MFE remote in a Next.js App Router context:

```mermaid
C4Container
    title SSR Boundary — Why next/dynamic(ssr:false) is Required

    System_Boundary(server, "Next.js Server (Node.js)") {
        Container(rsc, "React Server Components", "Node.js runtime", "Renders layout.tsx, page.tsx server-side. Has no access to browser APIs (window, document, fetch to localhost:3001)")
        Container(next_build, "Next.js Build / SSR Pass", "Node.js", "At build time, NEXT_PUBLIC_REMOTE_HR_NAMECHANGE_URL=http://localhost:3001 is baked in. At SSR time, localhost:3001 is unreachable from the Node.js process inside Docker")
    }

    System_Boundary(browser, "Browser") {
        Container(csr_boundary, "Client Component Boundary", "use client", "ChatPage, ChatWindow, NameChangeSidePanel are all 'use client' — they execute only in the browser")
        Container(dynamic_import, "next/dynamic(ssr:false)", "React lazy equivalent", "Defers import('hrNamechange/NameChangeApp') to the browser. Suspense fallback shown during fetch. If remote unreachable: .catch() renders fallback UI")
        Container(remote_bundle, "NameChangeApp Bundle", "Webpack chunks from :3001", "Downloaded by the browser, not the server. Runs in the browser JS heap alongside the shell")
    }

    Rel(rsc, csr_boundary, "serialises RSC payload, hydrates in browser")
    Rel(csr_boundary, dynamic_import, "renders when side panel opens")
    Rel(dynamic_import, remote_bundle, "fetch remoteEntry.js → download chunks", "Browser fetch from localhost:3001")
    Rel(next_build, dynamic_import, "skips SSR — marked ssr:false")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

---

## Spring AI vs. Direct SDK (C4 Component Comparison)

```mermaid
C4Component
    title RAG Pipeline Comparison — Direct Anthropic SDK vs. Spring AI 1.0

    System_Boundary(direct_sdk, "ekap-iframe / ekap-react-mfe (Direct SDK)") {
        Component(manual_embed, "Manual Embedding", "fastembed / OpenAI SDK", "Caller embeds the query text into a vector manually")
        Component(manual_weaviate, "Raw Weaviate Client", "weaviate-client / Java client v4", "Hand-crafted BM25 GraphQL string or near_vector call")
        Component(manual_llm, "Direct LLM Call", "anthropic.messages.create()", "Manual prompt construction: system prompt + chunks + history concatenated as strings")
        Component(manual_stream, "Manual SSE", "FastAPI StreamingResponse", "Token-by-token yield loop, manual chunk framing")
    }

    System_Boundary(spring_ai, "ekap-nextjs-mfe (Spring AI 1.0)") {
        Component(spring_vs, "VectorStore", "Spring AI WeaviateVectorStore", "Abstraction over Weaviate. similaritySearch(query, topK) handles embedding + retrieval in one call")
        Component(spring_chat, "ChatClient", "Spring AI ChatClient", "Fluent API: ChatClient.prompt().user(msg).advisors(rag).stream(). Automatic prompt assembly")
        Component(spring_rag, "QuestionAnswerAdvisor", "Spring AI RAG Advisor", "Auto-retrieves relevant chunks via VectorStore and injects them into the prompt context")
        Component(spring_stream, "Flux<String> → SSE", "Spring WebFlux", "Reactive stream of tokens piped directly to SSE response via Spring's built-in Flux support")
    }

    System_Ext(weaviate_ext, "Weaviate", "Vector DB")
    System_Ext(anthropic_ext, "Anthropic Claude API", "LLM")

    Rel(manual_embed, weaviate_ext, "near_vector / BM25 GQL", "gRPC")
    Rel(manual_llm, anthropic_ext, "messages.create(stream=True)", "HTTPS")
    Rel(spring_vs, weaviate_ext, "similaritySearch → embedding + query", "gRPC via Spring AI")
    Rel(spring_chat, anthropic_ext, "ChatClient stream via Spring AI Anthropic starter", "HTTPS")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```
