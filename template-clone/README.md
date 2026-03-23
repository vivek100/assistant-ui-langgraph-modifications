## Assistant UI LangGraph Template

This repo is a **Next.js + LangGraph starter** built on top of
[`assistant-ui`](https://github.com/Yonom/assistant-ui), with a more opinionated
UI layer and integrations:

- Enhanced **thread UI** (auto-scroll fix, welcome suggestions, action bars)
- **Canvas** system for rich tool outputs (panel + inline preview)
- **Streamdown** code-block extensions for custom renderers
- Central **assistant state context** with error boundary + error banner
- Updated **thread list** and **tool fallback** UI

It is wired to a LangGraph backend via `@assistant-ui/react-langgraph` and a
`MyAssistant` wrapper component.

---

## Getting Started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Configure environment**

   Create `.env.local` and set your LangGraph + LangSmith details:

   ```bash
   LANGCHAIN_API_KEY=your_langchain_api_key
   LANGGRAPH_API_URL=your_langgraph_api_url
   NEXT_PUBLIC_LANGGRAPH_ASSISTANT_ID=your_assistant_id_or_graph_id
   ```

3. **Run the dev server**

   ```bash
   npm run dev
   ```

   Then open http://localhost:3000 in your browser.

---

## Key Files

- `components/MyAssistant.tsx`
  - Wraps `AssistantRuntimeProvider`, `AssistantStateProvider`, and `CanvasProvider`
  - Exposes `<MyAssistant suggestions={...} customContext={...} />`

- `components/assistant-ui/thread.tsx`
  - Main chat UI (messages, composer, auto-scroll, canvas previews)

- `components/assistant-ui/canvas-*`
  - Canvas context, panel, and inline preview for rich tool results

- `components/assistant-ui/streamdown-text.tsx`
  - Streamdown renderer with pluggable code-block handlers

- `components/assistant-ui/assistant-state-context.tsx`
  - Global assistant state + error handling and hooks

You can customize the look & feel primarily in `components/assistant-ui` and
`components/ui`.

---

## User-Based Thread Filtering & Metadata

This template supports per-user threads and metadata, similar to v0.02.

- Threads are created with optional `user_id` and custom metadata:

  ```ts
  <MyAssistant
    userId={currentUserId}
    threadMetadata={{ connection_id: "conn_123" }}
  />
  ```

- `lib/chatApi.ts`:

  - `createThread(userId, metadata)` → stores `user_id` and arbitrary fields in thread metadata
  - `sendMessage({ threadId, userId, customConfig })` → passes `user_id` and config in `configurable` for the agent
  - `listThreadsByUser({ userId, additionalMetadata })` → fetches only that user’s threads
  - `updateThreadMetadata` / `generateThreadTitle` → used to auto-title threads from the first message

- `lib/thread-list-runtime.tsx`:

  - `useLangGraphThreadList({ userId })` → filters the thread list by `user_id`

- `components/assistant-ui/thread-list.tsx`:

  - Receives `userId` and only shows that user’s threads in the sidebar.

On the backend, your LangGraph agent can access `config.configurable.user_id`
to personalize behavior and enforce access control.
