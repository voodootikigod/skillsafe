import { createRequire } from "node:module";
import { Command } from "commander";
import { auditCommand } from "./commands/audit.js";
import { checkCommand } from "./commands/check.js";
import { initCommand } from "./commands/init.js";
import { refreshCommand } from "./commands/refresh.js";
import { reportCommand } from "./commands/report.js";

const require = createRequire(import.meta.url);
const { version } = require("../package.json") as { version: string };

const program = new Command();

program
	.name("skillsafe")
	.description("Quality & integrity layer for Agent Skills — like npm outdated for skill knowledge")
	.version(version);

program
	.command("check")
	.description("Check skill versions against npm registry")
	.option("-r, --registry <path>", "path to skillsafe.json")
	.option("-p, --product <name>", "check a single product")
	.option("--json", "output results as JSON")
	.option("-v, --verbose", "show all products including current")
	.option("--ci", "exit code 1 if any stale products found")
	.action(async (options) => {
		try {
			const code = await checkCommand(options);
			process.exit(code);
		} catch (error) {
			console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(2);
		}
	});

program
	.command("init")
	.description("Scan skills directory and generate a skillsafe.json registry")
	.argument("[dir]", "skills directory to scan", "./skills")
	.option("-y, --yes", "non-interactive mode, auto-detect package mappings")
	.option("-o, --output <path>", "output path for registry file")
	.action(async (dir, options) => {
		try {
			const code = await initCommand(dir, options);
			process.exit(code);
		} catch (error) {
			console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(2);
		}
	});

program
	.command("refresh")
	.description("Use an LLM to propose targeted updates to stale skill files")
	.argument("[skills-dir]", "path to skills directory")
	.option("-r, --registry <path>", "path to skillsafe.json")
	.option("-p, --product <name>", "refresh a single product")
	.option("--provider <name>", "LLM provider: anthropic, openai, google")
	.option("--model <id>", "specific model ID (e.g. claude-sonnet-4-20250514)")
	.option("-y, --yes", "auto-apply without confirmation")
	.option("--dry-run", "show proposed changes, write nothing")
	.action(async (skillsDir, options) => {
		try {
			const code = await refreshCommand(skillsDir, options);
			process.exit(code);
		} catch (error) {
			console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(2);
		}
	});

program
	.command("audit")
	.description("Security audit & hallucination detection for skill files")
	.argument("[dir]", "directory to audit", ".")
	.option("-f, --format <type>", "output format: terminal, json, markdown, or sarif", "terminal")
	.option("-o, --output <path>", "write report to file")
	.option("--fail-on <severity>", "exit code 1 threshold: critical, high, medium, low", "high")
	.option("--packages-only", "only check package registries (fast)")
	.option("--skip-urls", "skip URL liveness checks")
	.option("--ignore <path>", "path to .skillsafeignore file")
	.option("--verbose", "show progress and scan details")
	.option("--quiet", "suppress output, exit code only")
	.action(async (dir, options) => {
		try {
			const code = await auditCommand(dir, options);
			process.exit(code);
		} catch (error) {
			console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(2);
		}
	});

program
	.command("report")
	.description("Generate a full staleness report")
	.option("-r, --registry <path>", "path to skillsafe.json")
	.option("-f, --format <type>", "output format: json or markdown", "markdown")
	.action(async (options) => {
		try {
			const code = await reportCommand(options);
			process.exit(code);
		} catch (error) {
			console.error(`Error: ${error instanceof Error ? error.message : String(error)}`);
			process.exit(2);
		}
	});

program.parse();
