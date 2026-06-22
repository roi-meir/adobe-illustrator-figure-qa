import { describe, it, expect } from "vitest";
import {
    ptToMm,
    isDimensionOk,
    isFigureWidthOk,
    isFigureHeightOk,
    isFigureSizeOk
} from "../../core/figureSizeRules.js";

// Representative configs based on journal guidelines.
const NATURE = { maxFigureWidthMm: 180, maxFigureHeightMm: 170, figureSizeTolerance: 0.5 };
const CELL   = { maxFigureWidthMm: 174, maxFigureHeightMm: 203, figureSizeTolerance: 0.5 };
const NO_LIMIT = {};

describe("ptToMm", () => {
    it("converts 72 pt (one inch) to 25.4 mm", () => {
        expect(ptToMm(72)).toBeCloseTo(25.4, 5);
    });

    it("converts 0 pt to 0 mm", () => {
        expect(ptToMm(0)).toBe(0);
    });

    it("converts 510.24 pt to approximately 180 mm (Nature double column)", () => {
        expect(ptToMm(510.24)).toBeCloseTo(180, 0);
    });

    it("is proportional — doubling points doubles mm", () => {
        expect(ptToMm(144)).toBeCloseTo(ptToMm(72) * 2, 5);
    });
});

describe("isDimensionOk", () => {
    it("accepts a dimension exactly at the limit", () => {
        expect(isDimensionOk(180, 180, 0.5)).toBe(true);
    });

    it("accepts a dimension within tolerance", () => {
        expect(isDimensionOk(180.4, 180, 0.5)).toBe(true);
    });

    it("rejects a dimension that exceeds limit + tolerance", () => {
        expect(isDimensionOk(180.6, 180, 0.5)).toBe(false);
    });

    it("returns true when limitMm is null (no constraint)", () => {
        expect(isDimensionOk(999, null, 0.5)).toBe(true);
    });

    it("returns true when limitMm is undefined (no constraint)", () => {
        expect(isDimensionOk(999, undefined, 0.5)).toBe(true);
    });

    it("accepts a dimension well under the limit", () => {
        expect(isDimensionOk(89, 180, 0.5)).toBe(true);
    });
});

describe("isFigureWidthOk", () => {
    it("accepts a standard Nature single-column width (89 mm)", () => {
        expect(isFigureWidthOk(89, NATURE)).toBe(true);
    });

    it("accepts a figure at the Nature double-column limit (180 mm)", () => {
        expect(isFigureWidthOk(180, NATURE)).toBe(true);
    });

    it("rejects a figure wider than the Nature maximum", () => {
        expect(isFigureWidthOk(185, NATURE)).toBe(false);
    });

    it("accepts Cell single-column (85 mm)", () => {
        expect(isFigureWidthOk(85, CELL)).toBe(true);
    });

    it("rejects a figure wider than the Cell maximum (174 mm)", () => {
        expect(isFigureWidthOk(175, CELL)).toBe(false);
    });

    it("always passes when config has no maxFigureWidthMm", () => {
        expect(isFigureWidthOk(500, NO_LIMIT)).toBe(true);
    });
});

describe("isFigureHeightOk", () => {
    it("accepts a figure within Nature max depth (170 mm)", () => {
        expect(isFigureHeightOk(165, NATURE)).toBe(true);
    });

    it("accepts a figure exactly at the Nature max depth", () => {
        expect(isFigureHeightOk(170, NATURE)).toBe(true);
    });

    it("rejects a figure taller than the Nature maximum", () => {
        expect(isFigureHeightOk(175, NATURE)).toBe(false);
    });

    it("accepts a figure within Cell max height (203 mm)", () => {
        expect(isFigureHeightOk(200, CELL)).toBe(true);
    });

    it("always passes when config has no maxFigureHeightMm", () => {
        expect(isFigureHeightOk(500, NO_LIMIT)).toBe(true);
    });
});

describe("isFigureSizeOk", () => {
    it("passes when both dimensions are within bounds", () => {
        expect(isFigureSizeOk(89, 120, NATURE)).toBe(true);
    });

    it("fails when width exceeds the limit", () => {
        expect(isFigureSizeOk(185, 120, NATURE)).toBe(false);
    });

    it("fails when height exceeds the limit", () => {
        expect(isFigureSizeOk(89, 175, NATURE)).toBe(false);
    });

    it("fails when both dimensions exceed limits", () => {
        expect(isFigureSizeOk(200, 200, NATURE)).toBe(false);
    });

    it("always passes when config has no limits", () => {
        expect(isFigureSizeOk(9999, 9999, NO_LIMIT)).toBe(true);
    });

    it("uses 0.5 mm default tolerance when figureSizeTolerance is not set", () => {
        const config = { maxFigureWidthMm: 180, maxFigureHeightMm: 170 };
        expect(isFigureSizeOk(180.3, 170.3, config)).toBe(true);
        expect(isFigureSizeOk(180.6, 170, config)).toBe(false);
    });
});
