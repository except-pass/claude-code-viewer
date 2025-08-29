# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a web-based viewer for Claude Code conversation history files. The application provides a UI to browse and view JSONL conversation files from Claude Code projects stored in `~/.claude/projects/`.

## Development Commands

**Start development server:**
```bash
pnpm dev
```
This runs both Next.js (port 3400) and pathpida in watch mode for type-safe routing.

**Build and type checking:**
```bash
pnpm build
pnpm typecheck
```

**Linting and formatting:**
```bash
pnpm lint       # Run all lint checks
pnpm fix        # Fix all linting and formatting issues
```

**Testing:**
```bash
pnpm test       # Run tests once
pnpm test:watch # Run tests in watch mode
```

## Architecture Overview

### Technology Stack
- **Frontend**: Next.js 15 with React 19, TypeScript
- **Backend**: Hono.js API routes (served via Next.js API routes)
- **Styling**: Tailwind CSS with shadcn/ui components
- **Data fetching**: TanStack Query (React Query)
- **Validation**: Zod schemas
- **Code formatting**: Biome (replaces ESLint + Prettier)

### Key Architecture Patterns

**Monorepo Structure**: Single Next.js app with integrated backend API

**API Layer**: Hono.js app mounted at `/api` with type-safe routes:
- `/api/projects` - List all Claude projects
- `/api/projects/:projectId` - Get project details and sessions
- `/api/projects/:projectId/sessions/:sessionId` - Get session conversations

**Data Flow**:
1. Backend reads JSONL files from `~/.claude/projects/`
2. Parses and validates conversation entries with Zod schemas
3. Frontend fetches via type-safe API client with React Query

**Type Safety**: 
- Zod schemas for conversation data validation (`src/lib/conversation-schema/`)
- pathpida for type-safe routing (`src/lib/$path.ts`)
- Strict TypeScript configuration extending `@tsconfig/strictest`

### File Structure Patterns

**Conversation Schema** (`src/lib/conversation-schema/`):
- Modular Zod schemas for different conversation entry types
- Union types for flexible conversation parsing
- Separate schemas for content types, tools, and message formats

**Server Services** (`src/server/service/`):
- Project operations: `getProjects`, `getProject`, `getProjectMeta`
- Session operations: `getSessions`, `getSession`, `getSessionMeta` 
- Parsing utilities: `parseJsonl`, `parseCommandXml`

**Frontend Structure**:
- Page components in app router structure
- Reusable UI components in `src/components/ui/`
- Custom hooks for data fetching (`useProject`, `useConversations`)
- Conversation display components in nested folders

### Data Sources

The application reads Claude Code history from:
- **Primary location**: `~/.claude/projects/` (defined in `src/server/service/paths.ts:4`)
- **File format**: JSONL files containing conversation entries
- **Structure**: Project folders containing session JSONL files

### Key Components

**Conversation Parsing**: 
- JSONL parser validates each line against conversation schema
- Handles different entry types: User, Assistant, Summary, System
- Supports various content types: Text, Tool Use, Tool Result, Thinking

**Command Detection**:
- Parses XML-like command structures in conversation content
- Extracts command names and arguments for better display
- Handles different command formats (slash commands, local commands)

### Development Notes

- Uses `pathpida` for compile-time route validation
- Biome handles both linting and formatting (no ESLint/Prettier)
- Vitest for testing with global test setup
- TanStack Query for server state management with error boundaries