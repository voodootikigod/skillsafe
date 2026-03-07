import { writeFile } from "node:fs/promises";
import chalk from "chalk";

/**
 * Format a report using the given formatters and write to output or stdout.
 *
 * Centralises the format-switch + file-write-or-stdout pattern used by
 * every command (audit, budget, lint, policy, verify).
 */
export async function formatAndOutput<T>(
	report: T,
	options: { format?: string; output?: string; quiet?: boolean },
	formatters: Record<string, (report: T) => string>,
	defaultFormat = "terminal"
): Promise<void> {
	const format = options.format ?? defaultFormat;
	const formatter = formatters[format] ?? formatters[defaultFormat];

	if (!formatter) {
		throw new Error(`No formatter found for format "${format}"`);
	}

	const output = formatter(report);

	if (options.output) {
		await writeFile(options.output, output, "utf-8");
		if (!options.quiet) {
			console.error(chalk.green(`Report written to ${options.output}`));
		}
	} else if (!options.quiet) {
		console.log(output);
	}
}
