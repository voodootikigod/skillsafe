# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Project Is

`skillsafe` is a quality & integrity layer for Agent Skills — like `npm outdated` for skill knowledge. It detects version drift in SKILL.md files (which declare `product-version` in YAML frontmatter) by comparing against the npm registry. The repo also doubles as a reusable GitHub Action (`voodootikigod/skillsafe@v1`).

The `audit` command provides security audit & hallucination detection for skill files. Future commands (`budget`, `verify`, `test`, `policy`, `lint`) are planned to expand skillsafe further into a full quality & integrity layer for Agent Skills.

## Monorepo Structure

npm workspaces monorepo with three packages orchestrated by Turborepo:

| Package | Published As | Purpose |
|---------|-------------|---------|
| `packages/schema` | `@skillsafe/schema` | TypeScript types + generated JSON Schema for the registry format |
| `packages/cli` | `skillsafe` (npm) | CLI tool with 5 commands: `init`, `check`, `report`, `refresh`, `audit` |
| `packages/web` | Private (Vercel) | Next.js 16 marketing/docs site at skillsafe.sh |

**Build order matters**: `schema` must build first (produces `dist/schema.json` and type declarations), then `cli` and `web` consume it. Turbo handles this via `"dependsOn": ["^build"]`.

## Commands

```bash
# Install dependencies (from root)
npm install

# Build all packages (respects dependency order)
npm run build

# Run tests (cli package only, uses Vitest)
npm test

# Run a single test file
cd packages/cli && npx vitest run src/severity.test.ts

# Lint all packages (Biome)
npm run lint

# Auto-fix lint/format issues
npx biome check --write .

# Type check
npm run typecheck

# Run CLI during development
cd packages/cli && npx tsx src/index.ts check

# Dev server for web
cd packages/web && npm run dev
```

## Code Style (Biome)

- Tab indentation, 100-char line width
- Double quotes, semicolons always
- Auto-organized imports
- Config is in root `biome.json` — no ESLint or Prettier

## Architecture Notes

**CLI (`packages/cli`)**: Commander.js entry point in `src/index.ts`. Each command lives in `src/commands/`. The `refresh` command uses Vercel AI SDK (`ai` package) with optional provider SDKs (`@ai-sdk/anthropic`, `@ai-sdk/openai`, `@ai-sdk/google`) to propose LLM-powered updates to stale skill files. LLM logic is isolated in `src/llm/`.

**Audit (`packages/cli/src/audit/`)**: Security audit pipeline with a modular extractor/checker architecture. No new dependencies — uses built-in `fetch` for PyPI/crates.io and existing `fetchLatestVersion()` for npm.

```
audit/
  types.ts                         # AuditFinding, AuditReport, CheckContext, AuditChecker, AuditOptions
  index.ts                         # Orchestrator: discover → parse → extract → check → filter → aggregate
  cache.ts                         # Persistent disk cache (~/.cache/skillsafe/audit/) with 1-hour TTL
  ignore.ts                        # .skillsafeignore parsing + inline <!-- audit-ignore --> support
  extractors/
    packages.ts                    # npm/pip/cargo package references with line numbers
    commands.ts                    # Shell commands from fenced code blocks (bash/sh/shell/zsh/console)
    urls.ts                        # Markdown links + bare URLs, deduplicated
  checkers/
    registry.ts                    # Verify packages exist on npm/PyPI/crates.io (concurrency limit: 5)
    advisory.ts                    # Known hallucinated packages (Aikido Security, Socket.dev research)
    injection.ts                   # Prompt injection: override instructions, exfiltration, obfuscation
    commands.ts                    # Dangerous commands: destructive, pipe-to-shell, sensitive access
    metadata.ts                    # Frontmatter completeness (required: name, description, product-version)
    urls.ts                        # URL liveness via HEAD requests (10s timeout)
  reporters/
    terminal.ts                    # Chalk-colored, grouped by file, severity icons
    json.ts                        # JSON.stringify(report, null, 2)
    markdown.ts                    # Summary table + severity sections
    sarif.ts                       # SARIF 2.1.0 for GitHub Security tab
```

Key design: extractors run once per file, checkers consume extracted data. Findings pass through `.skillsafeignore` + inline comment filtering. Registry lookups use layered caching (in-memory Map + disk with TTL).

**Schema (`packages/schema`)**: Pure types in `src/types.ts`. The `build` script runs `tsup` then `tsx src/generate.ts` to produce a JSON Schema artifact (`dist/schema.json`) from TypeScript types via `ts-json-schema-generator`.

**Web (`packages/web`)**: Next.js App Router with CSS Modules. The `prebuild` script copies `schema/dist/schema.json` into `public/` so it's served at `/schema.json`. Components are in `components/` with colocated `.module.css` files.

**Registry file (`skillsafe.json`)**: Maps product names to npm packages, tracks verified versions, and lists associated skill/agent files. Validated by `src/registry.ts`.

## Testing

Tests are only in `packages/cli/src/` (colocated with source files). Vitest with no config file — uses defaults. No coverage thresholds configured.

## Deployment

- **CLI**: Published to npm via GitHub Actions on release (`publish.yml`), uses `npm publish --provenance`
- **Web**: Deployed to Vercel at skillsafe.sh
- **GitHub Action**: Defined in root `action.yml`, runs `npx skillsafe check --json --ci` and optionally upserts a GitHub issue via `.github/scripts/upsert-issue.sh`

## Feature Development Checklist

When adding or updating features, always update **all three surfaces**:

1. **Code** — implement in the appropriate package(s)
2. **README.md** — update CLI reference, registry format, examples as needed
3. **CLAUDE.md** — keep architecture notes, commands, and structure current
4. **Web (`packages/web`)** — update the marketing/docs site to reflect new capabilities

## Development Pitfalls

Lessons learned from building features in this codebase:

**Module-level constants break test mocks.** `vi.mock("node:os")` runs after top-level `const X = homedir()` has already evaluated. Use lazy functions instead (`function getX() { return homedir(); }`). Similarly, module-level state (e.g., `let initialized = false`) persists across tests — export a `reset()` function and call it in `beforeEach`.

**Regex groups that share words fail silently.** When writing patterns like `forget (all|your|previous) instructions`, if the input is "forget all your previous instructions", `all` matches the group but `your` and `previous` have no group to match. Make each word independently optional: `(?:all\s+)?(?:your\s+)?(?:previous\s+)?`.

**Fence detection in markdown parsers.** A regex like `/^```(\w+)?$/` matches both opening (` ```bash `) and closing (` ``` `) fences. Don't use `!openingRegex.test(line)` as an end-fence check — it will never match. Use a separate end-fence regex or track state.

**Boundary conditions in TTL checks.** Use `>=` not `>` for expiry: `Date.now() - timestamp >= ttlMs`. With `>`, a TTL of 0 doesn't expire same-millisecond entries.

**Biome formatting after multi-line edits.** Always run `npx biome check --write` on changed files before committing — line-length wrapping rules are hard to predict for template literals and chained method calls.

**Mock all network-dependent modules in integration tests.** For tests that exercise the orchestrator (`runAudit`), mock every checker that makes network calls (`registry`, `urls`, `advisory`) to avoid flaky tests and slow runs.

## Node Version

Node >= 22 required (pinned in `.node-version`).
