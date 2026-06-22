import { describe, it, expect } from "vitest";
import { normalizeFontFamily, fontFamilyKey, stripPdfSubsetPrefix,
         resolveFontLabel, isAllowedFontFamily } from "../../core/fontRules.js";

const CONFIG = { allowedFontFamilies: ["Arial", "Arial MT"] };

describe("stripPdfSubsetPrefix", () => {
    it("strips 6-letter uppercase PDF subset prefix", () => {
        expect(stripPdfSubsetPrefix("ABCDEF+ArialMT")).toBe("ArialMT");
    });
    it("leaves names without prefix unchanged", () => {
        expect(stripPdfSubsetPrefix("ArialMT")).toBe("ArialMT");
    });
    it("handles empty/null input", () => {
        expect(stripPdfSubsetPrefix("")).toBe("");
        expect(stripPdfSubsetPrefix(null)).toBe("");
    });
});

describe("normalizeFontFamily", () => {
    it("strips Bold suffix", () => {
        expect(normalizeFontFamily("Arial Bold")).toBe("arial");
    });
    it("strips Italic suffix", () => {
        expect(normalizeFontFamily("Times Italic")).toBe("times");
    });
    it("removes bracket markers", () => {
        expect(normalizeFontFamily("[Arial MT]")).toBe("arial mt");
    });
    it("lowercases the result", () => {
        expect(normalizeFontFamily("Helvetica Neue")).toBe("helvetica neue");
    });
});

describe("fontFamilyKey", () => {
    it("collapses spaces and hyphens", () => {
        expect(fontFamilyKey("Arial MT")).toBe("arialmt");
        expect(fontFamilyKey("Arial-MT")).toBe("arialmt");
    });
});

describe("resolveFontLabel", () => {
    it("resolves name from a mock TextFont object", () => {
        const tf = { name: "ArialMT", family: "Arial", style: "Regular" };
        const result = resolveFontLabel(tf);
        expect(result.name).toBe("ArialMT");
        expect(result.family).toBe("Arial");
        expect(result.isUnavailable).toBe(false);
    });

    it("marks font as unavailable when name and family are empty", () => {
        const tf = { name: "", family: "", style: "" };
        const result = resolveFontLabel(tf);
        expect(result.isUnavailable).toBe(true);
        expect(result.label).toBe("(unavailable)");
    });

    it("strips PDF subset prefix from name", () => {
        const tf = { name: "ABCDEF+ArialMT", family: "Arial", style: "" };
        const result = resolveFontLabel(tf);
        expect(result.name).toBe("ArialMT");
    });

    it("falls back to family when name is empty", () => {
        const tf = { name: "", family: "Arial", style: "" };
        const result = resolveFontLabel(tf);
        expect(result.label).toBe("Arial");
        expect(result.isUnavailable).toBe(false);
    });
});

describe("isAllowedFontFamily", () => {
    it("allows Arial by name", () => {
        expect(isAllowedFontFamily("ArialMT", "Arial", CONFIG)).toBe(true);
    });

    it("allows Arial Bold by family (strips suffix)", () => {
        expect(isAllowedFontFamily("Arial-BoldMT", "Arial", CONFIG)).toBe(true);
    });

    it("rejects Helvetica", () => {
        expect(isAllowedFontFamily("Helvetica", "Helvetica", CONFIG)).toBe(false);
    });

    it("allows empty font name/family (PDF import case)", () => {
        expect(isAllowedFontFamily("", "", CONFIG)).toBe(true);
        expect(isAllowedFontFamily(null, null, CONFIG)).toBe(true);
    });

    it("rejects a font with a missing-font bracket marker", () => {
        expect(isAllowedFontFamily("[TimesNewRoman]", "", CONFIG)).toBe(false);
    });
});
