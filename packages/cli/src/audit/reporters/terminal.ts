import chalk from "chalk";
import type { AuditFinding, AuditReport, AuditSeverity } from "../types.js";

function severityColor(severity: AuditSeverity) {
	switch (severity) {
		case "critical":
			return chalk.red.bold;
		case "high":
			return chalk.red;
		case "medium":
			return chalk.yellow;
		case "low":
			return chalk.blue;
	}
}

function severityIcon(severity: AuditSeverity): string {
	switch (severity) {
		case "critical":
			return "!!";
		case "high":
			return "! ";
		case "medium":
			return "* ";
		case "low":
			return "- ";
	}
}

function groupByFile(findings: AuditFinding[]): Map<string, AuditFinding[]> {
	const groups = new Map<string, AuditFinding[]>();
	for (const f of findings) {
		const existing = groups.get(f.file) ?? [];
		existing.push(f);
		groups.set(f.file, existing);
	}
	return groups;
}

export function formatTerminal(report: AuditReport): string {
	const lines: string[] = [];

	lines.push("");
	lines.push(chalk.bold("skillsafe audit"));
	lines.push("=".repeat(50));
	lines.push("");

	if (report.findings.length === 0) {
		lines.push(chalk.green("No findings. All skill files look clean."));
		lines.push("");
		lines.push(`  ${report.files} file(s) scanned`);
		lines.push("");
		return lines.join("\n");
	}

	// Group findings by file
	const grouped = groupByFile(report.findings);

	for (const [file, findings] of grouped) {
		lines.push(chalk.bold.underline(file));
		lines.push("");

		// Sort by severity (critical first), then by line number
		const severityOrder: Record<AuditSeverity, number> = {
			critical: 0,
			high: 1,
			medium: 2,
			low: 3,
		};
		findings.sort(
			(a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.line - b.line,
		);

		for (const f of findings) {
			const color = severityColor(f.severity);
			const icon = severityIcon(f.severity);
			lines.push(
				`  ${color(icon)} ${color(f.severity.toUpperCase().padEnd(8))} line ${String(f.line).padStart(4)} ${chalk.dim("|")} ${f.message}`,
			);
			if (f.evidence) {
				lines.push(`    ${chalk.dim(f.evidence)}`);
			}
		}
		lines.push("");
	}

	// Summary
	lines.push(chalk.bold("Summary"));
	lines.push("=".repeat(50));
	const { summary } = report;
	if (summary.critical > 0) lines.push(chalk.red.bold(`  Critical: ${summary.critical}`));
	if (summary.high > 0) lines.push(chalk.red(`  High:     ${summary.high}`));
	if (summary.medium > 0) lines.push(chalk.yellow(`  Medium:   ${summary.medium}`));
	if (summary.low > 0) lines.push(chalk.blue(`  Low:      ${summary.low}`));
	lines.push(`  Total:    ${summary.total}`);
	lines.push("");
	lines.push(`  ${report.files} file(s) scanned`);
	lines.push("");

	return lines.join("\n");
}
