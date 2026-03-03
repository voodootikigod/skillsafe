import { describe, expect, it } from "vitest";
import type { AuditReport } from "../types.js";
import { formatSarif } from "./sarif.js";

function makeReport(overrides?: Partial<AuditReport>): AuditReport {
	return {
		files: 1,
		findings: [],
		summary: { critical: 0, high: 0, medium: 0, low: 0, total: 0 },
		generatedAt: "2026-03-03T00:00:00.000Z",
		...overrides,
	};
}

describe("formatSarif", () => {
	it("produces valid SARIF JSON", () => {
		const output = formatSarif(makeReport());
		const parsed = JSON.parse(output);
		expect(parsed.version).toBe("2.1.0");
		expect(parsed.$schema).toContain("sarif");
		expect(parsed.runs).toHaveLength(1);
	});

	it("includes tool information", () => {
		const output = formatSarif(makeReport());
		const parsed = JSON.parse(output);
		expect(parsed.runs[0].tool.driver.name).toBe("skillsafe");
	});

	it("maps findings to results", () => {
		const report = makeReport({
			findings: [
				{
					file: "test/SKILL.md",
					line: 42,
					severity: "critical",
					category: "hallucinated-package",
					message: "Package not found",
					evidence: "bad-pkg",
				},
			],
			summary: { critical: 1, high: 0, medium: 0, low: 0, total: 1 },
		});

		const parsed = JSON.parse(formatSarif(report));
		expect(parsed.runs[0].results).toHaveLength(1);

		const result = parsed.runs[0].results[0];
		expect(result.ruleId).toBe("skillsafe/hallucinated-package");
		expect(result.level).toBe("error");
		expect(result.message.text).toBe("Package not found");
		expect(result.locations[0].physicalLocation.region.startLine).toBe(42);
	});

	it("maps severity to SARIF levels correctly", () => {
		const report = makeReport({
			findings: [
				{
					file: "a.md",
					line: 1,
					severity: "critical",
					category: "hallucinated-package",
					message: "a",
					evidence: "",
				},
				{
					file: "b.md",
					line: 2,
					severity: "high",
					category: "dangerous-command",
					message: "b",
					evidence: "",
				},
				{
					file: "c.md",
					line: 3,
					severity: "medium",
					category: "metadata-incomplete",
					message: "c",
					evidence: "",
				},
				{
					file: "d.md",
					line: 4,
					severity: "low",
					category: "metadata-incomplete",
					message: "d",
					evidence: "",
				},
			],
			summary: { critical: 1, high: 1, medium: 1, low: 1, total: 4 },
		});

		const parsed = JSON.parse(formatSarif(report));
		const levels = parsed.runs[0].results.map((r: { level: string }) => r.level);
		expect(levels).toEqual(["error", "error", "warning", "note"]);
	});

	it("deduplicates rules", () => {
		const report = makeReport({
			findings: [
				{
					file: "a.md",
					line: 1,
					severity: "critical",
					category: "hallucinated-package",
					message: "a",
					evidence: "",
				},
				{
					file: "b.md",
					line: 2,
					severity: "critical",
					category: "hallucinated-package",
					message: "b",
					evidence: "",
				},
			],
			summary: { critical: 2, high: 0, medium: 0, low: 0, total: 2 },
		});

		const parsed = JSON.parse(formatSarif(report));
		expect(parsed.runs[0].tool.driver.rules).toHaveLength(1);
	});

	it("includes invocation timestamp", () => {
		const report = makeReport({ generatedAt: "2026-03-03T12:00:00.000Z" });
		const parsed = JSON.parse(formatSarif(report));
		expect(parsed.runs[0].invocations[0].endTimeUtc).toBe("2026-03-03T12:00:00.000Z");
	});
});
