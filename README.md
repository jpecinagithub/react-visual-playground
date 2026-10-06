# React Visual Playground

An interactive laboratory for learning React: edit real components and **watch what happens inside** — props, state, renders, events, effects — visualized live as you interact.

Not a course, not an IDE. The core loop is: **code → interact → visualize → understand**.

## How it works

- **Code panel** — JSX editor (syntax highlighting, autocomplete, bracket matching, `Ctrl+Enter` to run).
- **Preview panel** — your component running for real, inside a sandboxed iframe so errors can't break the app. Live mode recompiles as you type.
- **What's happening panel** — an instrumented React runtime reports everything:
  - **Components**: live component tree; nodes flash when they render; click any node for props / state / render count.
  - **State**: before → after transitions on every `setState`, plus the event → setState → render → UI chain.
  - **Props**: parent → child flow with animated diffs.
  - **Renders**: per-component render counter + optional render highlighting in the preview.
  - **Events**: captured event → handler → state → render chains.
  - **Timeline**: chronological session story (mounts, events, state changes, renders, effects, real DOM updates via MutationObserver).
  - **Flow**: the interaction loop as nodes that light up step by step with your last real interaction.
  - **JSX**: JSX → React element → DOM inspector.
  - **Console**: captured `console.log/warn/error`.

Plus: **Learn mode** (guided steps per example with code highlighting), **"What just happened?"** summaries after each interaction, 15 guided examples, a **"How React works"** mind map, friendly educational errors (no raw stack traces), shareable URLs (`#c=…`), full ES/EN UI, PWA support, and localStorage persistence.

## Tech

Vite + React 18 + TypeScript + Tailwind CSS 4. No backend, no database, no auth.

- **CodeMirror 6** for editing, **@babel/standalone** (lazy-loaded) for in-browser JSX compilation.
- **Instrumented React**: the preview iframe runs user code against a wrapped React that tracks renders, component tree, hook state (variable names extracted from the AST), props diffs, events, and effects — all reported to the host via `postMessage`.
- **PWA** via `vite-plugin-pwa`; **Vercel Analytics** (anonymous events only — user code is never sent anywhere).

## Develop

```bash
npm install
npm run dev
```

## Verify the runtime

```bash
node scripts/runtime-test.mjs     # instrumented React: 28 assertions in jsdom
node scripts/transform-test.mjs   # host Babel pipeline
node scripts/examples-test.mjs    # all 15 examples compile + mount
```

## Deploy

Push to GitHub and import in Vercel (static). Enable **Vercel Web Analytics** in the project dashboard for the analytics events.

## Author

Created by Jon Peciña — an interactive project designed to make React easier to understand through experimentation and visual feedback.
