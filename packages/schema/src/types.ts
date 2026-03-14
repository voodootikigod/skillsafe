/**
 * Registry format: skills-check.json
 */
export interface Registry {
	$schema?: string;
	lastCheck?: string;
	products: Record<string, RegistryProduct>;
	skillsDir?: string;
	version: number;
}

export interface RegistryProduct {
	agents?: string[];
	changelog?: string;
	displayName: string;
	package: string;
	skills: string[];
	verifiedAt: string;
	verifiedVersion: string;
}

/**
 * Detection method used to identify a skill fingerprint.
 * Ordered by confidence level (highest to lowest).
 */
export type DetectionMethod =
	| "watermark"
	| "frontmatter_hash"
	| "content_hash"
	| "prefix_hash"
	| "tool_schema"
	| "function_signature";

/**
 * Telemetry event emitted when a skill is detected in an LLM request.
 * Flat structure — aligned with skills-trace runtime output.
 */
export interface SkillTelemetryEvent {
	/** Agent identifier */
	agentId?: string;
	/** Confidence score between 0 and 1 */
	confidence: number;
	/** Detection method that matched */
	detection: DetectionMethod;
	/** Deployment environment */
	environment?: string;
	/** Detection latency in milliseconds */
	latencyMs?: number;
	/** Model being targeted */
	model?: string;
	/** Project identifier */
	project?: string;
	/** Registry source identifier */
	registry?: string;
	/** Request identifier for deduplication */
	requestId?: string;
	/** Schema version for forward compatibility */
	schemaVersion: 1;
	/** Skill identity URI, e.g. "react" or "skill://acme/pr-review" */
	skillId: string;
	/** Skill tokens consumed in this request */
	skillTokens?: number;
	/** Team identifier */
	team?: string;
	/** Tenant identifier */
	tenantId?: string;
	/** ISO 8601 timestamp */
	timestamp: string;
	/** Total prompt tokens in the request */
	totalPromptTokens?: number;
	/** User identifier */
	user?: string;
	/** Skill version */
	version: string;
}

/**
 * A registry of fingerprints for installed skills.
 */
export interface FingerprintRegistry {
	/** Array of fingerprint entries */
	entries: FingerprintEntry[];
	/** ISO 8601 timestamp of when the registry was generated */
	generatedAt: string;
	/** Base64-encoded Ed25519 signature over canonical form */
	signature?: string;
	/** Key identifier for the signing key */
	signedBy?: string;
	/** Schema version (always 1) */
	version: 1;
}

export interface FingerprintEntry {
	/** SHA-256 of normalized full content */
	contentHash?: string;
	/** SHA-256 of raw YAML frontmatter */
	frontmatterHash?: string;
	/** Function signatures for detection */
	functionSignatures?: string[];
	/** File path (set by skills-check, omitted in runtime registries) */
	path?: string;
	/** SHA-256 of first 500 tokens of normalized content */
	prefixHash?: string;
	/** Registry source identifier */
	registry?: string;
	/** Skill identity URI */
	skillId: string;
	/** Source origin (e.g. "@acme/react") */
	source?: string;
	/** Token count of the full skill content */
	tokenCount?: number;
	/** Tool schemas for detection */
	toolSchemas?: Array<{
		name: string;
		parametersHash: string;
	}>;
	/** Skill version */
	version: string;
	/** Watermark string if present */
	watermark?: string;
}
