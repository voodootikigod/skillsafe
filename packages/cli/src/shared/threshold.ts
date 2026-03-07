/**
 * Generic threshold comparison for severity/level-based filtering.
 *
 * Used by audit (critical/high/medium/low), policy (blocked/violation/warning),
 * and lint (error/warning) commands to avoid duplicating threshold logic.
 */

/**
 * Create a threshold checker for a given severity ordering.
 *
 * @param order - Map of severity labels to numeric priority (lower = more severe)
 * @returns Object with `meetsThreshold` and `validValues`
 */
export function createThresholdChecker<T extends string>(order: Record<T, number>) {
	const validValues = new Set(Object.keys(order) as T[]);

	return {
		/** Returns true if `severity` is at or above the `threshold` level. */
		meetsThreshold(severity: T, threshold: T): boolean {
			return (order[severity] ?? Number.MAX_SAFE_INTEGER) <= (order[threshold] ?? 0);
		},
		/** Set of valid severity/level values for input validation. */
		validValues,
	};
}

/** Audit severity threshold checker. */
export const auditThreshold = createThresholdChecker({
	critical: 0,
	high: 1,
	medium: 2,
	low: 3,
});

/** Policy severity threshold checker. */
export const policyThreshold = createThresholdChecker({
	blocked: 0,
	violation: 1,
	warning: 2,
});

/** Lint level threshold checker. */
export const lintThreshold = createThresholdChecker({
	error: 0,
	warning: 1,
});
