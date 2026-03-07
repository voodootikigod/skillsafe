import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock dependencies to avoid filesystem/network
vi.mock("../scanner.js", () => ({
	scanSkills: vi.fn(),
	groupSkills: vi.fn(),
}));

vi.mock("../registry.js", () => ({
	saveRegistry: vi.fn(),
}));

import { saveRegistry } from "../registry.js";
import { groupSkills, scanSkills } from "../scanner.js";
import type { ScannedSkill } from "../types.js";
import { initCommand } from "./init.js";

const mockedScanSkills = vi.mocked(scanSkills);
const mockedGroupSkills = vi.mocked(groupSkills);
const mockedSaveRegistry = vi.mocked(saveRegistry);

function makeSkill(overrides?: Partial<ScannedSkill>): ScannedSkill {
	return {
		name: "nextjs-routing",
		path: "./skills/nextjs-routing/SKILL.md",
		productVersion: "14.0.0",
		...overrides,
	};
}

describe("initCommand", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockedSaveRegistry.mockResolvedValue("skills-check.json");
		vi.spyOn(console, "log").mockImplementation(() => {
			/* intentionally empty */
		});
		vi.spyOn(console, "error").mockImplementation(() => {
			/* intentionally empty */
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns 2 when no SKILL.md files found", async () => {
		mockedScanSkills.mockResolvedValue([]);
		const code = await initCommand("./skills", { yes: true });
		expect(code).toBe(2);
	});

	it("returns 2 when no products can be mapped", async () => {
		// Skill with unknown name won't auto-detect
		mockedScanSkills.mockResolvedValue([
			makeSkill({ name: "unknown-thing", productVersion: "1.0.0" }),
		]);
		mockedGroupSkills.mockReturnValue(
			new Map([["unknown-thing", [makeSkill({ name: "unknown-thing", productVersion: "1.0.0" })]]])
		);
		const code = await initCommand("./skills", { yes: true });
		expect(code).toBe(2);
	});

	it("auto-detects known packages in non-interactive mode", async () => {
		const skill = makeSkill({ name: "nextjs-routing", productVersion: "14.0.0" });
		mockedScanSkills.mockResolvedValue([skill]);
		mockedGroupSkills.mockReturnValue(new Map([["nextjs", [skill]]]));

		const code = await initCommand("./skills", { yes: true });
		expect(code).toBe(0);
		expect(mockedSaveRegistry).toHaveBeenCalledWith(
			expect.objectContaining({
				products: expect.objectContaining({
					nextjs: expect.objectContaining({
						displayName: "Next.js",
						package: "next",
						verifiedVersion: "14.0.0",
					}),
				}),
			}),
			undefined
		);
	});

	it("saves to custom output path", async () => {
		const skill = makeSkill({ name: "nextjs-routing", productVersion: "14.0.0" });
		mockedScanSkills.mockResolvedValue([skill]);
		mockedGroupSkills.mockReturnValue(new Map([["nextjs", [skill]]]));

		await initCommand("./skills", { yes: true, output: "custom.json" });
		expect(mockedSaveRegistry).toHaveBeenCalledWith(expect.anything(), "custom.json");
	});

	it("skips skills without product-version", async () => {
		const withVersion = makeSkill({ name: "nextjs-routing", productVersion: "14.0.0" });
		const withoutVersion = makeSkill({ name: "general-tips", productVersion: undefined });
		mockedScanSkills.mockResolvedValue([withVersion, withoutVersion]);
		mockedGroupSkills.mockReturnValue(new Map([["nextjs", [withVersion]]]));

		await initCommand("./skills", { yes: true });

		const logCalls = vi.mocked(console.log).mock.calls.map((c) => String(c[0]));
		expect(logCalls.some((c) => c.includes("Skipping 1 without"))).toBe(true);
	});

	it("merges skills that map to the same npm package", async () => {
		const skill1 = makeSkill({ name: "nextjs-routing", productVersion: "14.0.0" });
		const skill2 = makeSkill({ name: "nextjs-api", productVersion: "14.0.0" });
		mockedScanSkills.mockResolvedValue([skill1, skill2]);
		mockedGroupSkills.mockReturnValue(
			new Map([
				["nextjs", [skill1]],
				["nextjs-api", [skill2]],
			])
		);

		const code = await initCommand("./skills", { yes: true });
		expect(code).toBe(0);

		// Both skills should be merged under nextjs since they map to "next" package
		const savedRegistry = mockedSaveRegistry.mock.calls[0][0];
		const nextjsProduct = savedRegistry.products.nextjs;
		expect(nextjsProduct).toBeDefined();
		expect(nextjsProduct.skills).toContain("nextjs-routing");
		expect(nextjsProduct.skills).toContain("nextjs-api");
	});

	it("creates registry with correct schema", async () => {
		const skill = makeSkill({ name: "nextjs-routing", productVersion: "14.0.0" });
		mockedScanSkills.mockResolvedValue([skill]);
		mockedGroupSkills.mockReturnValue(new Map([["nextjs", [skill]]]));

		await initCommand("./skills", { yes: true });

		const savedRegistry = mockedSaveRegistry.mock.calls[0][0];
		expect(savedRegistry.$schema).toBe("https://skillscheck.ai/schema.json");
		expect(savedRegistry.version).toBe(1);
		expect(savedRegistry.lastCheck).toBeDefined();
	});

	it("auto-detects ai-sdk package", async () => {
		const skill = makeSkill({ name: "ai-sdk-basics", productVersion: "3.0.0" });
		mockedScanSkills.mockResolvedValue([skill]);
		mockedGroupSkills.mockReturnValue(new Map([["ai-sdk", [skill]]]));

		await initCommand("./skills", { yes: true });

		const savedRegistry = mockedSaveRegistry.mock.calls[0][0];
		expect(savedRegistry.products["ai-sdk"]).toBeDefined();
		expect(savedRegistry.products["ai-sdk"].package).toBe("ai");
		expect(savedRegistry.products["ai-sdk"].displayName).toBe("Vercel AI SDK");
	});

	it("auto-detects turborepo package", async () => {
		const skill = makeSkill({ name: "turborepo", productVersion: "2.0.0" });
		mockedScanSkills.mockResolvedValue([skill]);
		mockedGroupSkills.mockReturnValue(new Map([["turborepo", [skill]]]));

		await initCommand("./skills", { yes: true });

		const savedRegistry = mockedSaveRegistry.mock.calls[0][0];
		expect(savedRegistry.products.turborepo.package).toBe("turbo");
	});
});
