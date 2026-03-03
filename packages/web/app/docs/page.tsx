import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import styles from "./docs.module.css";

export const metadata: Metadata = {
	title: "Docs",
	description:
		"CLI reference for skillsafe: init, check, report, and refresh commands. Registry format, SKILL.md frontmatter spec, AI-assisted refresh, and CI integration guide.",
	alternates: {
		canonical: "https://skillsafe.sh/docs",
	},
};

export default function DocsPage() {
	return (
		<>
			<Header />
			<main className={styles.main}>
				<article className={styles.article}>
					<h1>Documentation</h1>

					<section>
						<h2 id="overview">Overview</h2>
						<p>
							<code>skillsafe</code> is a quality & integrity layer for Agent Skills. It compares
							the <code>product-version</code> in your SKILL.md frontmatter against the npm registry
							and flags stale skills.
						</p>
					</section>

					<section>
						<h2 id="install">Installation</h2>
						<p>No installation required. Run directly with npx:</p>
						<pre>
							<code>npx skillsafe check</code>
						</pre>
						<p>Or install globally:</p>
						<pre>
							<code>npm install -g skillsafe</code>
						</pre>
					</section>

					<section>
						<h2 id="commands">Commands</h2>

						<h3>
							<code>init [dir]</code>
						</h3>
						<p>
							Scan a skills directory for SKILL.md files and generate a <code>skillsafe.json</code>{" "}
							registry.
						</p>
						<pre>
							<code>
								{`# Interactive mode (prompts for package mappings)
npx skillsafe init ./skills

# Non-interactive mode (auto-detect mappings)
npx skillsafe init ./skills -y`}
							</code>
						</pre>

						<h3>
							<code>check</code>
						</h3>
						<p>Check all products against the npm registry.</p>
						<pre>
							<code>
								{`# Human-readable output
npx skillsafe check

# JSON output
npx skillsafe check --json

# CI mode (exit code 1 if stale)
npx skillsafe check --ci

# Check a single product
npx skillsafe check -p ai-sdk`}
							</code>
						</pre>

						<h3>
							<code>report</code>
						</h3>
						<p>Generate a full staleness report.</p>
						<pre>
							<code>
								{`# Markdown report
npx skillsafe report

# JSON report
npx skillsafe report --format json`}
							</code>
						</pre>

						<h3>
							<code>refresh [skills-dir]</code>
						</h3>
						<p>
							Use an LLM to propose targeted updates to stale skill files. Fetches changelogs,
							generates diffs, and optionally applies changes.
						</p>
						<pre>
							<code>
								{`# Interactive mode — review each change
npx skillsafe refresh ./skills

# Auto-apply all changes
npx skillsafe refresh -y

# Preview only (no writes)
npx skillsafe refresh --dry-run

# Use a specific provider/model
npx skillsafe refresh --provider anthropic --model claude-sonnet-4-20250514

# Refresh a single product
npx skillsafe refresh -p ai-sdk`}
							</code>
						</pre>
						<p>
							<strong>Provider setup:</strong> Install one of the provider SDKs and set the
							corresponding API key:
						</p>
						<pre>
							<code>
								{`# Anthropic (Claude)
npm install @ai-sdk/anthropic
export ANTHROPIC_API_KEY=sk-...

# OpenAI
npm install @ai-sdk/openai
export OPENAI_API_KEY=sk-...

# Google (Gemini)
npm install @ai-sdk/google
export GOOGLE_GENERATIVE_AI_API_KEY=...`}
							</code>
						</pre>
					</section>

					<section>
						<h2 id="registry">Registry Format</h2>
						<p>
							The <code>skillsafe.json</code> file follows a{" "}
							<Link href="/schema.json">JSON Schema</Link> that editors can validate against:
						</p>
						<pre>
							<code>
								{`{
  "$schema": "https://skillsafe.sh/schema.json",
  "version": 1,
  "products": {
    "ai-sdk": {
      "displayName": "Vercel AI SDK",
      "package": "ai",
      "verifiedVersion": "4.2.0",
      "verifiedAt": "2026-01-15T00:00:00Z",
      "skills": ["ai-sdk-core", "ai-sdk-tools"],
      "agents": ["ai-sdk-engineer"]
    }
  }
}`}
							</code>
						</pre>
					</section>

					<section>
						<h2 id="frontmatter">SKILL.md Frontmatter</h2>
						<p>
							Each SKILL.md file should include a <code>product-version</code> field in its YAML
							frontmatter:
						</p>
						<pre>
							<code>
								{`---
name: ai-sdk-core
product-version: "4.2.0"
---

# AI SDK Core

Your skill content here...`}
							</code>
						</pre>
					</section>

					<section>
						<h2 id="ci">CI Integration</h2>

						<h3>GitHub Action</h3>
						<p>
							Use the reusable GitHub Action to check freshness and optionally open issues when
							skills drift:
						</p>
						<pre>
							<code>
								{`- uses: voodootikigod/skillsafe@v1
  with:
    registry: skillsafe.json  # default
    open-issues: "true"            # create/update issue on staleness
    fail-on-stale: "false"         # set "true" to block PRs`}
							</code>
						</pre>
						<p>
							The action requires <code>issues: write</code> permission when{" "}
							<code>open-issues</code> is enabled. It deduplicates issues using the{" "}
							<code>issue-label</code> input (default: <code>skill-staleness</code>).
						</p>

						<h4>Inputs</h4>
						<table>
							<thead>
								<tr>
									<th>Input</th>
									<th>Default</th>
									<th>Description</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										<code>registry</code>
									</td>
									<td>
										<code>skillsafe.json</code>
									</td>
									<td>Path to registry file</td>
								</tr>
								<tr>
									<td>
										<code>node-version</code>
									</td>
									<td>
										<code>20</code>
									</td>
									<td>Node.js version</td>
								</tr>
								<tr>
									<td>
										<code>open-issues</code>
									</td>
									<td>
										<code>true</code>
									</td>
									<td>Open/update GitHub issue on staleness</td>
								</tr>
								<tr>
									<td>
										<code>issue-label</code>
									</td>
									<td>
										<code>skill-staleness</code>
									</td>
									<td>Label for issue deduplication</td>
								</tr>
								<tr>
									<td>
										<code>fail-on-stale</code>
									</td>
									<td>
										<code>false</code>
									</td>
									<td>Exit non-zero when stale</td>
								</tr>
								<tr>
									<td>
										<code>token</code>
									</td>
									<td>
										{/* biome-ignore lint/suspicious/noTemplateCurlyInString: GitHub Actions expression syntax */}
										<code>{"${{ github.token }}"}</code>
									</td>
									<td>
										GitHub token (needs <code>issues: write</code>)
									</td>
								</tr>
							</tbody>
						</table>

						<h4>Outputs</h4>
						<table>
							<thead>
								<tr>
									<th>Output</th>
									<th>Description</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>
										<code>stale-count</code>
									</td>
									<td>Number of stale products (0 if current)</td>
								</tr>
								<tr>
									<td>
										<code>issue-number</code>
									</td>
									<td>Issue number created/updated (empty if none)</td>
								</tr>
								<tr>
									<td>
										<code>report</code>
									</td>
									<td>Full markdown report</td>
								</tr>
							</tbody>
						</table>

						<h4>Weekly cron example</h4>
						<pre>
							<code>
								{`name: Skill Staleness Check
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
          fail-on-stale: "false"`}
							</code>
						</pre>

						<h3>Inline check</h3>
						<p>
							For simpler setups, use the CLI directly with the <code>--ci</code> flag:
						</p>
						<pre>
							<code>
								{`- name: Check skill freshness
  run: npx skillsafe check --ci`}
							</code>
						</pre>
						<p>This exits with code 1 if any skills are stale, failing the pipeline.</p>
					</section>
				</article>
			</main>
			<Footer />
		</>
	);
}
