import type { AuditChecker, AuditFinding, CheckContext } from "../types.js";

interface Pattern {
	regex: RegExp;
	message: string;
	severity: "critical" | "high" | "medium";
}

const OVERRIDE_PATTERNS: Pattern[] = [
	{
		regex: /ignore\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
		message: "Override instruction detected: attempts to override prior instructions",
		severity: "critical",
	},
	{
		regex: /disregard\s+(?:all\s+)?(?:previous|prior|above)\s+instructions/i,
		message: "Override instruction detected: disregard prior instructions",
		severity: "critical",
	},
	{
		regex: /you\s+are\s+now\s+(?:a|an)\s+/i,
		message: "Role hijacking detected: attempts to redefine agent identity",
		severity: "critical",
	},
	{
		regex:
			/forget\s+(?:all\s+)?(?:your\s+)?(?:previous\s+|prior\s+)?(?:instructions|rules|constraints)/i,
		message: "Override instruction detected: forget constraints",
		severity: "critical",
	},
	{
		regex: /do\s+not\s+follow\s+(?:any|your)\s+(?:previous|prior|original)\s+/i,
		message: "Override instruction detected: do not follow prior instructions",
		severity: "critical",
	},
];

const EXFILTRATION_PATTERNS: Pattern[] = [
	{
		regex: /(?:curl|wget|fetch)\s+.*(?:\$\{?\w+|`.*`)/i,
		message: "Potential data exfiltration: dynamic URL with variable interpolation",
		severity: "high",
	},
	{
		regex: /(?:send|post|upload|exfil)\s+.*(?:secret|key|token|password|credential)/i,
		message: "Potential data exfiltration: references sending sensitive data",
		severity: "high",
	},
	{
		regex: /send\s+the\s+contents?\s+of\b/i,
		message: "Potential data exfiltration: instruction to send file contents",
		severity: "high",
	},
	{
		regex:
			/(?:upload|post|transmit)\s+(?:to|the)\b.*(?:\.ssh|\.env|\.aws|credentials|private.key)/i,
		message: "Potential data exfiltration: instruction to upload sensitive files",
		severity: "high",
	},
];

const OBFUSCATION_PATTERNS: Pattern[] = [
	{
		regex: /(?:echo|printf)\s+.*\|\s*base64\s+(?:-d|--decode)/i,
		message: "Obfuscation detected: base64 decode in pipeline",
		severity: "high",
	},
	{
		regex: /\beval\s*\(\s*(?:atob|Buffer\.from)\b/i,
		message: "Obfuscation detected: eval with base64 decoding",
		severity: "high",
	},
	{
		regex: /[\u200B-\u200F\u2028-\u202F\uFEFF]/,
		message: "Obfuscation detected: zero-width or invisible Unicode characters",
		severity: "medium",
	},
];

const ALL_PATTERNS = [...OVERRIDE_PATTERNS, ...EXFILTRATION_PATTERNS, ...OBFUSCATION_PATTERNS];

export const injectionChecker: AuditChecker = {
	name: "prompt-injection",
	async check(context: CheckContext): Promise<AuditFinding[]> {
		const findings: AuditFinding[] = [];
		const lines = context.file.raw.split("\n");

		for (let i = 0; i < lines.length; i++) {
			const line = lines[i];
			const lineNumber = i + 1;

			for (const pattern of ALL_PATTERNS) {
				if (pattern.regex.test(line)) {
					findings.push({
						file: context.file.path,
						line: lineNumber,
						severity: pattern.severity,
						category: "prompt-injection",
						message: pattern.message,
						evidence: line.trim().slice(0, 120),
					});
				}
			}
		}

		return findings;
	},
};
