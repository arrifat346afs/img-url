# AGENTS.md - Agentic Coding Guidelines

This file provides guidelines for AI agents working in this codebase.

## IMPORTANT: Always Use Bun

**NEVER use npm, pnpm, or yarn.** This project uses Bun as the package manager.

- Use `bun install` instead of `npm install`
- Use `bun run dev` instead of `npm run dev`
- Use `bun test` instead of `npm test`
- Use `bun add <package>` instead of `npm install <package>`
- Use `bun remove <package>` instead of `npm uninstall <package>`

## Project Overview

- **Framework**: React 19 + TanStack Start + Vite
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI + class-variance-authority
- **Testing**: Vitest

## Commands

### Development
```bash
npm run dev          # Start dev server on port 3000
npm run build        # Build for production
npm run start        # Start production server
npm run serve        # Preview production build
```

### Testing
```bash
npm run test                    # Run all tests
npm run test -- <file>          # Run single test file
npm run test -- --watch         # Run tests in watch mode
npm run test -- <pattern>       # Run tests matching pattern
```

### LM Studio Proxy (for Chrome PNA / static deployments)
```bash
npm run proxy                   # Start standalone proxy on :3001 → LM Studio :1234
```
The proxy adds `Access-Control-Allow-Private-Network: true` to OPTIONS preflight
and CORS headers to all responses. Enable "Direct Browser Fetch" in the app UI
to bypass the server proxy and use direct browser fetch with `targetAddressSpace: 'local'`.

## Code Style Guidelines

### TypeScript

- **Strict mode enabled**: All TypeScript strict options are on
- **Always define types** for props, function parameters, and return values
- **Avoid `any`**: Use `unknown` if type is truly uncertain
- **Use interfaces** for object shapes, type aliases for unions/intersections

### Imports & Path Aliases

- Use path alias `@/*` for src imports (e.g., `@/components/ui/button`)
- Group imports: React → external libs → internal components → utilities
- Use absolute imports, avoid relative paths (`../../`)

### Naming Conventions

- **Components**: PascalCase (e.g., `ImageCard.tsx`, `UrlInput.tsx`)
- **Hooks**: camelCase with `use` prefix (e.g., `usePromptGeneration.ts`)
- **Utilities**: camelCase (e.g., `gemini.ts`, `validation.ts`)
- **Interfaces**: PascalCase (e.g., `ImageCardProps`, `PromptResult`)
- **Constants**: SCREAMING_SNAKE_CASE (e.g., `DEFAULT_RATE_LIMIT_CONFIG`)

### Component Structure

```typescript
// 1. Imports
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 2. Types/Interfaces (inline for component-specific, separate file for shared)
interface ComponentProps {
  title: string
  onAction: () => void
}

// 3. Component definition
export function ComponentName({ title, onAction }: ComponentProps) {
  // 4. Hooks first
  const [state, setState] = useState(false)
  
  // 5. Effects
  // useEffect(() => {}, [])
  
  // 6. Render
  return (
    <div>
      <Button onClick={onAction}>{title}</Button>
    </div>
  )
}
```

### React Patterns

- Use function components with explicit props destructuring
- Prefer composition over abstraction
- Use `useState` with type inference when initial value has type
- Handle loading/error states explicitly (see `ImageCard.tsx` for patterns)
- Use early returns for conditional rendering

### Error Handling

- Wrap async operations in try/catch
- Set error state with user-friendly messages
- Display errors in UI with appropriate styling (see `promptResult?.error`)
- Log errors to console with context

### Styling (Tailwind CSS)

- Use Tailwind utility classes directly in JSX
- Follow existing patterns: `className="flex items-center gap-2 text-sm"`
- Use semantic colors: `text-muted-foreground`, `bg-primary`, `text-destructive`
- Prefer `gap-*` over margin between items
- Use `group` class for parent-child hover interactions

### File Organization

```
src/
├── components/
│   ├── ui/           # Radix UI primitives (button, dialog, etc.)
│   └── *.tsx         # Feature components
├── hooks/            # Custom React hooks
├── utils/            # Utility functions and API helpers
├── routes/           # TanStack Start route components
└── lib/              # Shared utilities (cn, utils)
```

### State Management

- Local state: `useState` for component-level state
- Server state: TanStack Query patterns (via router)
- Global state: React Context if needed (see theme-provider)

## Important Patterns

### Rate Limiting

This app uses a custom rate limiter for API calls. When modifying API utilities:
- Respect the rate limiter configuration in `gemini.ts`
- Use `withRetry` for handling 429 errors
- Configure appropriate delays between requests

### API Keys

- API keys are managed via `useApiKey` hook
- Keys stored in localStorage (user-managed)
- Validate keys before use

### Image Processing

- Images converted to base64 for API calls via `imageToBase64()`
- Handle image load errors with fallback SVG
- Use appropriate loading states during processing

## Common Issues & Solutions

- **Build fails**: Check `npm run build` for TypeScript errors
- **Type errors**: Ensure all props have types, check strict mode
- **Test failures**: Run single test file to debug
- **Import errors**: Verify path aliases in `tsconfig.json`

## Lint & Typecheck

Run before committing:
```bash
npm run build  # TypeScript + Vite build check
npm run test   # Run tests
```
