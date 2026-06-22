import { describe, it, expect } from "vitest";
import { floatEq, round1, isAllowedFontSize, allowedFontSizesLabel } from "../../core/sizeRules.js";

const CONFIG = { allowedFontSizes: [5, 6, 7, 8], fontSizeTolerance: 0.05 };

describe("floatEq", () => {
    it("returns true when difference is within tolerance", () => {
        expect(floatEq(8.0, 8.0, 0.05)).toBe(true);
        expect(floatEq(8.04, 8.0, 0.05)).toBe(true);
    });
    it("returns false when difference exceeds tolerance", () => {
        expect(floatEq(8.1, 8.0, 0.05)).toBe(false);
    });
});

describe("round1", () => {
    it("rounds to one decimal place", () => {
        expect(round1(7.96)).toBe(8.0);
        expect(round1(7.94)).toBe(7.9);
        expect(round1(6)).toBe(6);
    });
});

describe("isAllowedFontSize", () => {
    it("accepts exact allowed sizes", () => {
        for (const size of [5, 6, 7, 8]) {
            expect(isAllowedFontSize(size, CONFIG)).toBe(true);
        }
    });

    it("accepts sizes within tolerance", () => {
        expect(isAllowedFontSize(8.04, CONFIG)).toBe(true);
        expect(isAllowedFontSize(7.96, CONFIG)).toBe(true);
    });

    it("rejects sizes outside tolerance", () => {
        expect(isAllowedFontSize(9, CONFIG)).toBe(false);
        expect(isAllowedFontSize(4, CONFIG)).toBe(false);
        expect(isAllowedFontSize(8.1, CONFIG)).toBe(false);
    });
});

describe("allowedFontSizesLabel", () => {
    it("returns comma-separated list of allowed sizes", () => {
        expect(allowedFontSizesLabel(CONFIG)).toBe("5, 6, 7, 8");
    });
});
