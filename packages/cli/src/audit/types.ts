import type { SkillFile } from "../skill-io.js";

export type AuditSeverity = "critical" | "high" | "medium" | "low";

export type AuditCategory =
	| "hallucinated-package"
	| "prompt-injection"
	| "dangerous-command"
	| "metadata-incomplete"
	| "url-liveness"
	| "advisory-match";

export interface AuditFinding {
	file: string;
	line: number;
	severity: AuditSeverity;
	category: AuditCategory;
	message: string;
	evidence: string;
}

export interface AuditSummary {
	critical: number;
	high: number;
	medium: number;
	low: number;
	total: number;
}

export interface AuditReport {
	files: number;
	findings: AuditFinding[];
	summary: AuditSummary;
	generatedAt: string;
}

export interface ExtractedPackage {
	name: string;
	ecosystem: "npm" | "pypi" | "crates";
	line: number;
	source: string;
}

export interface ExtractedCommand {
	command: string;
	line: number;
}

export interface ExtractedUrl {
	url: string;
	line: number;
	text?: string;
}

export interface CheckContext {
	file: SkillFile;
	packages: ExtractedPackage[];
	commands: ExtractedCommand[];
	urls: ExtractedUrl[];
}

export interface AuditChecker {
	name: string;
	check(context: CheckContext): Promise<AuditFinding[]>;
}

export interface AuditOptions {
	format?: "terminal" | "json" | "markdown" | "sarif";
	output?: string;
	failOn?: AuditSeverity;
	packagesOnly?: boolean;
	skipUrls?: boolean;
	ignorePath?: string;
}
