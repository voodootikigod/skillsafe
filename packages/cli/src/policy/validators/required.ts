import type { SkillFile } from "../../skill-io.js";
import type { SkillPolicy } from "../types.js";

/**
 * Check whether all required skills are present among discovered skill files.
 * Returns an array of { skill, satisfied } entries.
 */
export function checkRequired(
	discoveredSkills: SkillFile[],
	policy: SkillPolicy,
): Array<{ skill: string; satisfied: boolean }> {
	if (!policy.required || policy.required.length === 0) {
		return [];
	}

	return policy.required.map((req) => {
		const satisfied = discoveredSkills.some((file) => {
			const name = file.frontmatter.name;
			if (typeof name !== "string") return false;
			if (name !== req.skill) return false;

			// If source is specified in the requirement, also match source
			if (req.source) {
				const fileSource =
					typeof file.frontmatter.source === "string"
						? file.frontmatter.source
						: typeof file.frontmatter.repository === "string"
							? file.frontmatter.repository
							: null;
				if (fileSource !== req.source) return false;
			}

			return true;
		});

		return { skill: req.skill, satisfied };
	});
}
