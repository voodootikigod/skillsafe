import { describe, expect, it } from "vitest";
import {
	auditThreshold,
	createThresholdChecker,
	lintThreshold,
	policyThreshold,
} from "./threshold.js";

describe("createThresholdChecker", () => {
	it("creates a checker with valid values", () => {
		const checker = createThresholdChecker({ a: 0, b: 1, c: 2 });
		expect(checker.validValues).toEqual(new Set(["a", "b", "c"]));
	});

	it("meetsThreshold returns true when severity is at threshold", () => {
		const checker = createThresholdChecker({ high: 0, medium: 1, low: 2 });
		expect(checker.meetsThreshold("medium", "medium")).toBe(true);
	});

	it("meetsThreshold returns true when severity is above threshold", () => {
		const checker = createThresholdChecker({ high: 0, medium: 1, low: 2 });
		expect(checker.meetsThreshold("high", "medium")).toBe(true);
	});

	it("meetsThreshold returns false when severity is below threshold", () => {
		const checker = createThresholdChecker({ high: 0, medium: 1, low: 2 });
		expect(checker.meetsThreshold("low", "medium")).toBe(false);
	});
});

describe("auditThreshold", () => {
	it("has correct valid values", () => {
		expect(auditThreshold.validValues).toEqual(new Set(["critical", "high", "medium", "low"]));
	});

	it("critical meets any threshold", () => {
		expect(auditThreshold.meetsThreshold("critical", "low")).toBe(true);
	});

	it("low only meets low threshold", () => {
		expect(auditThreshold.meetsThreshold("low", "low")).toBe(true);
		expect(auditThreshold.meetsThreshold("low", "medium")).toBe(false);
	});
});

describe("policyThreshold", () => {
	it("has correct valid values", () => {
		expect(policyThreshold.validValues).toEqual(new Set(["blocked", "violation", "warning"]));
	});

	it("blocked meets any threshold", () => {
		expect(policyThreshold.meetsThreshold("blocked", "warning")).toBe(true);
	});

	it("warning only meets warning threshold", () => {
		expect(policyThreshold.meetsThreshold("warning", "warning")).toBe(true);
		expect(policyThreshold.meetsThreshold("warning", "violation")).toBe(false);
	});
});

describe("lintThreshold", () => {
	it("has correct valid values", () => {
		expect(lintThreshold.validValues).toEqual(new Set(["error", "warning"]));
	});

	it("error meets any threshold", () => {
		expect(lintThreshold.meetsThreshold("error", "warning")).toBe(true);
	});

	it("warning does not meet error threshold", () => {
		expect(lintThreshold.meetsThreshold("warning", "error")).toBe(false);
	});
});
