export interface SectionBudget {
	/** The heading text of the section. Empty string for preamble. */
	heading: string;
	/** Number of tokens in this section. */
	tokens: number;
	/** Percentage of the skill's total tokens. */
	percentage: number;
}

export interface SkillBudget {
	/** Path to the skill file. */
	path: string;
	/** Name from frontmatter, or filename fallback. */
	name: string;
	/** Total token count for the entire skill. */
	totalTokens: number;
	/** Per-section token breakdown. */
	sections: SectionBudget[];
}

export interface RedundancyMatch {
	/** Path to the first skill. */
	skillA: string;
	/** Path to the second skill. */
	skillB: string;
	/** Name of the first skill. */
	nameA: string;
	/** Name of the second skill. */
	nameB: string;
	/** Jaccard similarity score (0-1). */
	similarity: number;
	/** Estimated number of overlapping tokens. */
	overlapTokens: number;
	/** Actionable suggestion for the user. */
	suggestion: string;
}

export interface CostEstimate {
	/** Model name used for pricing. */
	model: string;
	/** Cost per 1,000 skill loads (input tokens only). */
	costPer1KLoads: number;
	/** Number of tokens priced. */
	tokens: number;
}

export interface BudgetReport {
	/** Individual skill budgets. */
	skills: SkillBudget[];
	/** Total tokens across all skills. */
	totalTokens: number;
	/** Context window size used for percentage calculations. */
	contextWindow: number;
	/** Cost estimate for the total. */
	cost: CostEstimate;
	/** Redundancy matches above threshold. */
	redundancy: RedundancyMatch[];
	/** ISO timestamp of report generation. */
	generatedAt: string;
}

export interface BudgetSnapshot {
	/** Skill budgets at the time of the snapshot. */
	skills: SkillBudget[];
	/** Total tokens at the time of the snapshot. */
	totalTokens: number;
	/** Model used for cost estimation. */
	model: string;
	/** ISO timestamp of the snapshot. */
	generatedAt: string;
}

export interface BudgetDiff {
	/** Skill name. */
	skill: string;
	/** Token count before. */
	before: number;
	/** Token count after. */
	after: number;
	/** Absolute change in tokens. */
	delta: number;
	/** Percentage change. */
	percentChange: number;
}

export interface BudgetOptions {
	/** Filter to a specific skill by name. */
	skill?: string;
	/** Show per-section breakdown. */
	detailed?: boolean;
	/** Output format. */
	format?: "terminal" | "json" | "markdown";
	/** Write output to this file. */
	output?: string;
	/** Maximum tokens threshold for CI. */
	maxTokens?: number;
	/** Save snapshot to this path. */
	save?: string;
	/** Compare against a snapshot at this path. */
	compare?: string;
	/** Model for cost estimation. */
	model?: string;
}
