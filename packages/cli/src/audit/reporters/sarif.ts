import type { AuditFinding, AuditReport, AuditSeverity } from "../types.js";

interface SarifLevel {
	level: "error" | "warning" | "note";
}

function toSarifLevel(severity: AuditSeverity): SarifLevel["level"] {
	switch (severity) {
		case "critical":
		case "high":
			return "error";
		case "medium":
			return "warning";
		case "low":
			return "note";
	}
}

function toRuleId(finding: AuditFinding): string {
	return `skillsafe/${finding.category}`;
}

function buildRules(findings: AuditFinding[]): object[] {
	const seen = new Set<string>();
	const rules: object[] = [];

	for (const f of findings) {
		const ruleId = toRuleId(f);
		if (!seen.has(ruleId)) {
			seen.add(ruleId);
			rules.push({
				id: ruleId,
				shortDescription: { text: f.category.replace(/-/g, " ") },
				defaultConfiguration: { level: toSarifLevel(f.severity) },
			});
		}
	}

	return rules;
}

function buildResults(findings: AuditFinding[]): object[] {
	return findings.map((f) => ({
		ruleId: toRuleId(f),
		level: toSarifLevel(f.severity),
		message: { text: f.message },
		locations: [
			{
				physicalLocation: {
					artifactLocation: { uri: f.file },
					region: { startLine: f.line },
				},
			},
		],
		properties: {
			severity: f.severity,
			evidence: f.evidence,
		},
	}));
}

export function formatSarif(report: AuditReport): string {
	const sarif = {
		$schema: "https://json.schemastore.org/sarif-2.1.0.json",
		version: "2.1.0",
		runs: [
			{
				tool: {
					driver: {
						name: "skillsafe",
						informationUri: "https://skillsafe.sh",
						rules: buildRules(report.findings),
					},
				},
				results: buildResults(report.findings),
				invocations: [
					{
						executionSuccessful: true,
						endTimeUtc: report.generatedAt,
					},
				],
			},
		],
	};

	return JSON.stringify(sarif, null, 2);
}
