# skillsafe

Quality & integrity layer for [Agent Skills](https://agentskills.io) — like `npm outdated` for skill knowledge.

Skills that reference versioned products (via `product-version` in frontmatter) can drift as upstream packages ship new releases. `skillsafe` detects this drift and reports which skills need updating.

## Install

```bash
npm install -g skillsafe
```

Or run directly:

```bash
npx skillsafe check
```

## Quick Start

### 1. Initialize a registry

Scan your skills directory and map products to npm packages:

```bash
# Interactive — prompts for each mapping
skillsafe init ./skills

# Non-interactive — auto-detects common packages
skillsafe init ./skills --yes
```

This creates a `skillsafe.json` registry file.

### 2. Check for staleness

```bash
skillsafe check
```

Output:

```
skillsafe
==================================================

STALE (2):
  Vercel AI SDK            6.0.105 → 6.1.0 (minor)
    skills: ai-sdk-core, ai-sdk-tools, ai-sdk-react, ai-sdk-multimodal

  Payload CMS              3.78.0 → 3.80.0 (minor)
    skills: payload-core, payload-data, payload-admin

CURRENT (15): upstash-redis, next, turbo, ...

Run "skillsafe report --format markdown" for a full report.
```

### 3. Generate a report

```bash
# Markdown (for PRs, issues, dashboards)
skillsafe report --format markdown > STALENESS.md

# JSON (for automation)
skillsafe report --format json
```

## CLI Reference

### `skillsafe init [dir]`

Scan a skills directory and generate a `skillsafe.json` registry.

| Flag | Description |
|------|-------------|
| `-y, --yes` | Non-interactive mode, auto-detect package mappings |
| `-o, --output <path>` | Output path for registry file |

### `skillsafe check`

Check skill versions against the npm registry.

| Flag | Description |
|------|-------------|
| `-r, --registry <path>` | Path to registry file (default: `./skillsafe.json`) |
| `-p, --product <name>` | Check a single product |
| `--json` | Machine-readable JSON output |
| `-v, --verbose` | Show all products including current |
| `--ci` | Exit code 1 if any stale products found |

### `skillsafe report`

Generate a full staleness report.

| Flag | Description |
|------|-------------|
| `-r, --registry <path>` | Path to registry file |
| `-f, --format <type>` | Output format: `json` or `markdown` (default: `markdown`) |

### `skillsafe audit [dir]`

Security audit and hallucination detection for skill files. Scans for hallucinated package references, prompt injection patterns, dangerous shell commands, broken URLs, and incomplete metadata. Includes an advisory database of known hallucinated packages, persistent disk caching, and `.skillsafeignore` support.

| Flag | Description |
|------|-------------|
| `-f, --format <type>` | Output format: `terminal`, `json`, `markdown`, or `sarif` (default: `terminal`) |
| `-o, --output <path>` | Write report to file |
| `--fail-on <severity>` | Exit code 1 threshold: `critical`, `high`, `medium`, `low` (default: `high`) |
| `--packages-only` | Only check package registries (fast) |
| `--skip-urls` | Skip URL liveness checks |
| `--ignore <path>` | Path to `.skillsafeignore` file |
| `--verbose` | Show progress and scan details |
| `--quiet` | Suppress output, exit code only |

**Checkers:**

| Tier | Category | Severity | What it checks |
|------|----------|----------|----------------|
| 1 | Hallucinated packages | Critical | Verifies npm/PyPI/crates.io packages actually exist |
| 1b | Advisory database | Critical | Flags known hallucinated packages (Aikido Security, Socket.dev research) |
| 2 | Prompt injection | Critical–Medium | Override instructions, data exfiltration, obfuscation (base64, zero-width Unicode) |
| 3 | Dangerous commands | Critical–Medium | `rm -rf`, `curl \| bash`, sensitive file access (`.ssh`, `.aws`, `.env`) |
| 4 | URL liveness | Medium | Verifies linked URLs respond (HEAD requests, 10s timeout) |
| 5 | Metadata completeness | Medium–Low | Required/recommended frontmatter fields |

**Output formats:**

- `terminal` — chalk-colored, grouped by file with severity icons
- `json` — machine-readable, full report structure
- `markdown` — summary table + severity sections, suitable for PRs
- `sarif` — SARIF 2.1.0 for GitHub Security tab integration

**Ignore rules:**

Create a `.skillsafeignore` file (one rule per line):

```
# Ignore all hallucinated-package findings
hallucinated-package

# Ignore prompt-injection in a specific file
prompt-injection:skills/example/SKILL.md
```

Or use inline HTML comments in skill files:

```markdown
<!-- audit-ignore -->
This line's findings will be suppressed.

<!-- audit-ignore:dangerous-command -->
This line's dangerous-command findings only will be suppressed.
```

**Caching:**

Registry lookups are cached to `~/.cache/skillsafe/audit/` with a 1-hour TTL, so repeated runs are fast.

```bash
# Audit all skills in current directory
skillsafe audit

# JSON output for CI
skillsafe audit ./skills --format json

# SARIF for GitHub Security tab
skillsafe audit ./skills --format sarif -o results.sarif

# Write markdown report to file
skillsafe audit ./skills --format markdown -o audit-report.md

# Only check package registries (fastest)
skillsafe audit ./skills --packages-only

# Skip slow URL checks
skillsafe audit ./skills --skip-urls

# Fail only on critical findings
skillsafe audit --fail-on critical

# Quiet mode for CI (exit code only)
skillsafe audit --quiet --fail-on high
```

### `skillsafe refresh [skills-dir]`

Use an LLM to propose targeted updates to stale skill files. Fetches changelogs, generates diffs, and optionally applies changes.

| Flag | Description |
|------|-------------|
| `-r, --registry <path>` | Path to registry file |
| `-p, --product <name>` | Refresh a single product |
| `--provider <name>` | LLM provider: `anthropic`, `openai`, `google` |
| `--model <id>` | Specific model ID (e.g. `claude-sonnet-4-20250514`) |
| `-y, --yes` | Auto-apply without confirmation |
| `--dry-run` | Show proposed changes, write nothing |

**Provider setup:** Install a provider SDK and set the API key:

```bash
# Anthropic (Claude)
npm install @ai-sdk/anthropic
export ANTHROPIC_API_KEY=sk-...

# OpenAI
npm install @ai-sdk/openai
export OPENAI_API_KEY=sk-...

# Google (Gemini)
npm install @ai-sdk/google
export GOOGLE_GENERATIVE_AI_API_KEY=...
```

The skills directory is resolved in priority order:
1. CLI argument: `skillsafe refresh ./my-skills`
2. Registry field: `"skillsDir": "./skills"` in skillsafe.json
3. Default: `./skills`

## Exit Codes

| Code | Meaning |
|------|---------|
| `0` | All products current / audit clean (below threshold) |
| `1` | Stale products found (with `--ci` flag) / audit findings at or above `--fail-on` threshold |
| `2` | Configuration error (missing registry, bad format) |

## Registry Format

The `skillsafe.json` file maps products to npm packages:

```json
{
  "$schema": "https://skillsafe.sh/schema.json",
  "version": 1,
  "lastCheck": "2026-02-28T00:00:00Z",
  "products": {
    "ai-sdk": {
      "displayName": "Vercel AI SDK",
      "package": "ai",
      "verifiedVersion": "6.0.105",
      "verifiedAt": "2026-02-28T00:00:00Z",
      "changelog": "https://github.com/vercel/ai/releases",
      "skills": ["ai-sdk-core", "ai-sdk-tools", "ai-sdk-react"],
      "agents": ["ai-sdk-engineer"]
    }
  }
}
```

## Skill Frontmatter

Skills declare their product version in YAML frontmatter:

```yaml
---
name: ai-sdk-core
description: "Generate text with Vercel AI SDK..."
product-version: "6.0.105"
---
```

The `init` command reads this field and groups skills by shared version + name prefix.

## CI Integration

### GitHub Action

Add `skillsafe` as a reusable action in your workflow:

```yaml
- uses: voodootikigod/skillsafe@v1
  with:
    registry: skillsafe.json  # default
    open-issues: "true"            # create/update issue on staleness
    fail-on-stale: "false"         # set "true" to block PRs
```

The action requires `issues: write` permission when `open-issues` is enabled.

#### Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `registry` | `skillsafe.json` | Path to registry file |
| `node-version` | `22` | Node.js version |
| `open-issues` | `true` | Open/update GitHub issue on staleness |
| `issue-label` | `skill-staleness` | Label for issue deduplication |
| `fail-on-stale` | `false` | Exit non-zero when stale |
| `token` | `${{ github.token }}` | GitHub token (needs `issues: write`) |

#### Outputs

| Output | Description |
|--------|-------------|
| `stale-count` | Number of stale products (0 if current) |
| `issue-number` | Issue number created/updated (empty if none) |
| `report` | Full markdown report |

#### Weekly cron example

```yaml
name: Skill Staleness Check
on:
  schedule:
    - cron: "0 9 * * 1"   # Monday 09:00 UTC
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  staleness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: voodootikigod/skillsafe@v1
        with:
          fail-on-stale: "false"
```

#### PR gate example

```yaml
- uses: voodootikigod/skillsafe@v1
  with:
    open-issues: "false"
    fail-on-stale: "true"
```

#### Setup

Create the deduplication label once:

```bash
gh label create skill-staleness --color "#e4e669" --description "Skill version drift detected"
```

### Inline check

For simpler setups, use the CLI directly:

```yaml
- name: Check skill freshness
  run: npx skillsafe check --ci
```

## Roadmap

Future commands planned for skillsafe:

| Command | Purpose |
|---------|---------|
| ~~`audit`~~ | ~~Security & quality audit for skill files~~ **Shipped!** |
| `budget` | Context budget analysis and optimization |
| `verify` | Verify skill integrity and correctness |
| `test` | Run skill test suites |
| `policy` | Enforce organizational skill policies |
| `lint` | Lint skill files for best practices |

## Complementary Tools

- [`npx skills`](https://skills.sh) — registry + installer for Agent Skills
- `skillsafe` — quality & integrity layer (this tool)
- [`skills`](https://github.com/anthropics/skills) — official Agent Skills reference

## License

MIT
