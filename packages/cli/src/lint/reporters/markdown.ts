import type { LintFinding, LintReport } from "../types.js";

function groupByFile(findings: LintFinding[]): Map<string, LintFinding[]> {
	const groups = new Map<string, LintFinding[]>();
	for (const f of findings) {
		const existing = groups.get(f.file) ?? [];
		existing.push(f);
		groups.set(f.file, existing);
	}
	return groups;
}

export function formatLintMarkdown(report: LintReport): string {
	const lines: string[] = [];
	const now = report.generatedAt.split("T")[0];

	lines.push("# Skills Check Lint Report");
	lines.push("");
	lines.push(`Generated: ${now}`);
	lines.push("");

	// Summary table
	lines.push("## Summary");
	lines.push("");
	lines.push("| Level | Count |");
	lines.push("|-------|-------|");
	lines.push(`| Errors | ${report.errors} |`);
	lines.push(`| Warnings | ${report.warnings} |`);
	lines.push(`| Info | ${report.infos} |`);
	if (report.fixed > 0) {
		lines.push(`| Fixed | ${report.fixed} |`);
	}
	lines.push(`| **Total** | **${report.errors + report.warnings + report.infos}** |`);
	lines.push("");
	lines.push(`Files scanned: ${report.files}`);
	lines.push("");

	if (report.findings.length === 0) {
		lines.push("No findings. All skill files have valid metadata.");
		lines.push("");
		return lines.join("\n");
	}

	// Findings by file
	const grouped = groupByFile(report.findings);
	const levelOrder: Record<string, number> = { error: 0, warning: 1, info: 2 };

	for (const [file, findings] of grouped) {
		lines.push(`## ${file}`);
		lines.push("");
		lines.push("| Level | Field | Message | Fixable |");
		lines.push("|-------|-------|---------|---------|");

		findings.sort(
			(a, b) =>
				(levelOrder[a.level] ?? 2) - (levelOrder[b.level] ?? 2) || a.field.localeCompare(b.field)
		);

		for (const f of findings) {
			const escapedMessage = f.message.replace(/\|/g, "\\|");
			const fixable = f.fixable ? "Yes" : "No";
			lines.push(`| ${f.level} | ${f.field} | ${escapedMessage} | ${fixable} |`);
		}

		lines.push("");
	}

	return lines.join("\n");
}
