# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and `app/api/*` routes.
- `components/`: Reusable UI; organized by domain (e.g., `flights/`, `dashboard/`), primitives in `components/ui/`, voice/assistant in `components/voice/` and `components/assistant/`.
- `lib/`: Shared code (`lib/services/`, `lib/config/`, `lib/utils.ts`).
- `hooks/`: Reusable React hooks (e.g., `use-auth.tsx`, `use-toast.ts`).
- `types/`: Project types (e.g., `types/assistant.ts`).
- `styles/`: Global and utility CSS (Tailwind + custom).
- `public/`: Static assets.
- `__tests__/`: Unit/integration tests; additional docs in `docs/`.

## Build, Test, and Development Commands
- `npm run dev` (or `pnpm dev`): Start dev server at http://localhost:3000.
- `npm run build`: Production build via Next.js.
- `npm start`: Run the built app.
- `npm run lint`: ESLint via `next lint`.
- `npm test`: Run Jest tests.
- `npm run test:watch` / `npm run test:coverage` / `npm run test:ci`: Watch, coverage, and CI modes.

## Coding Style & Naming Conventions
- **Languages**: TypeScript + React 19 on Next.js 15 (App Router).
- **Indentation**: 2 spaces; keep existing style; prefer functional components.
- **Files**: kebab-case for components/files (e.g., `featured-deals.tsx`); hooks start with `use-*.ts(x)`; shared types in `types/*.ts`.
- **Imports**: Use `@/*` alias from `tsconfig.json` (e.g., `import { cn } from '@/lib/utils'`).
- **Linting**: `next lint`. Prettier is not configured; avoid reformat-only diffs.

## Testing Guidelines
- **Frameworks**: Jest + `@testing-library/react` + `@testing-library/jest-dom` (jsdom env).
- **Where**: `__tests__/**/*` and any `*.test|spec.(ts|tsx)`; coverage collected from `app/`, `components/`, and `lib/`.
- **Coverage**: Global threshold 50% lines/branches (see `jest.config.js`).
- **Run**: `npm test`, `npm run test:watch`, or `npm run test:coverage`.

## Commit & Pull Request Guidelines
- **Commits**: Follow Conventional Commits (e.g., `feat: implement voice agent`).
- **PRs**: Include summary, linked issues, and screenshots/GIFs for UI changes. Ensure `npm test` passes, `npm run lint` is clean, and update relevant docs.

## Security & Configuration Tips
- Use `.env.example` to create `.env.local`; do not commit secrets.
- `next.config.mjs` currently ignores TypeScript/ESLint errors during builds—fix locally and don’t rely on this for PR acceptance.
- Prefer root-imports via `@/*`; avoid deep relative paths.

