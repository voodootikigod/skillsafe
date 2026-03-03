import { describe, expect, it } from "vitest";
import type { AuditReport } from "../types.js";
import { formatMarkdown } from "./markdown.js";

function makeReport(overrides?: Partial<AuditReport>): AuditReport {
	return {
		files: 1,
		findings: [],
		summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
		generatedAt: "2026-03-03T00:00:00.000Z",
		...overrides,
	};
}

describe("formatMarkdown", () => {
	it("includes title and date", () => {
		const output = formatMarkdown(makeReport());
		expect(output).toContain("# Skillsafe Audit Report");
		expect(output).toMatch(/Generated: \d{4}-\d{2}-\d{2}/);
	});

	it("shows summary table", () => {
		const output = formatMarkdown(makeReport());
		expect(output).toContain("| Severity | Count |");
		expect(output).toContain("| Critical | 0 |");
	});

	it("shows clean message when no findings", () => {
		const output = formatMarkdown(makeReport());
		expect(output).toContain("No findings");
	});

	it("groups findings by severity", () => {
		const report = makeReport({
			findings: [
				{
					file: "a.md",
					line: 1,
					severity: "critical",
					category: "hallucinated-package",
					message: "Critical issue",
					evidence: "x",
				},
				{
					file: "b.md",
					line: 2,
					severity: "medium",
					category: "metadata-incomplete",
					message: "Medium issue",
					evidence: "y",
				},
			],
			summary: { critical: 1, high: 0, medium: 1, low: 0, total: 2 },
		});

		const output = formatMarkdown(report);
		expect(output).toContain("## Critical (1)");
		expect(output).toContain("## Medium (1)");
		expect(output).toContain("Critical issue");
		expect(output).toContain("Medium issue");
	});

	it("shows findings in table format", () => {
		const report = makeReport({
			findings: [
				{
					file: "test.md",
					line: 42,
					severity: "high",
					category: "dangerous-command",
					message: "Dangerous",
					evidence: "cmd",
				},
			],
			summary: { critical: 0, high: 1, medium: 0, low: 0, total: 1 },
		});

		const output = formatMarkdown(report);
		expect(output).toContain("| File | Line | Category | Message |");
		expect(output).toContain("| test.md | 42 | dangerous-command | Dangerous |");
	});

	it("shows file count", () => {
		const output = formatMarkdown(makeReport({ files: 3 }));
		expect(output).toContain("Files scanned: 3");
	});
});
