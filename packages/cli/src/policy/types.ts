export interface SkillPolicy {
	version: number;
	sources?: { allow?: string[]; deny?: string[] };
	required?: Array<{ source?: string; skill: string }>;
	banned?: Array<{ skill: string; reason?: string }>;
	metadata?: {
		required_fields?: string[];
		require_license?: boolean;
		allowed_licenses?: string[];
	};
	content?: {
		deny_patterns?: Array<{ pattern: string; reason: string }>;
		require_patterns?: Array<{ pattern: string; reason: string }>;
	};
	freshness?: {
		max_age_days?: number;
		max_version_drift?: "major" | "minor" | "patch";
		require_product_version?: boolean;
	};
	audit?: {
		require_clean?: boolean;
		min_severity_to_block?: "critical" | "high" | "medium" | "low";
	};
}

export type PolicySeverity = "blocked" | "violation" | "warning";

export interface PolicyFinding {
	file: string;
	severity: PolicySeverity;
	rule: string;
	message: string;
	detail?: string;
	line?: number;
}

export interface PolicyReport {
	policyFile: string;
	files: number;
	findings: PolicyFinding[];
	required: Array<{ skill: string; satisfied: boolean }>;
	summary: { blocked: number; violations: number; warnings: number };
	generatedAt: string;
}

export interface PolicyOptions {
	policy?: string;
	skill?: string;
	ci?: boolean;
	format?: "terminal" | "json";
	output?: string;
	failOn?: PolicySeverity;
}
