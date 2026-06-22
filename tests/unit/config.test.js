import { describe, it, expect } from "vitest";
import { mergeConfig, validateConfig, loadPresetChain } from "../../core/config.js";

const DEFAULT = {
    name: "default",
    allowedFontSizes: [5, 6, 7, 8],
    fontSizeTolerance: 0.05,
    allowedFontFamilies: ["Arial", "Arial MT"],
    scaleTarget: 100,
    scaleTolerance: 0.1,
    minRasterPPI: 300,
    checkEnabled: { fontSize: true, fontFamily: true, scale: true, lowResRaster: true }
};

describe("mergeConfig", () => {
    it("returns a copy of base when override is empty", () => {
        const result = mergeConfig(DEFAULT, {});
        expect(result.allowedFontSizes).toEqual([5, 6, 7, 8]);
    });

    it("override replaces top-level arrays", () => {
        const result = mergeConfig(DEFAULT, { allowedFontSizes: [7, 8] });
        expect(result.allowedFontSizes).toEqual([7, 8]);
    });

    it("override merges nested objects", () => {
        const result = mergeConfig(DEFAULT, { checkEnabled: { scale: false } });
        expect(result.checkEnabled.fontSize).toBe(true);
        expect(result.checkEnabled.scale).toBe(false);
    });

    it("skips 'extends' and 'name' keys from override", () => {
        const result = mergeConfig(DEFAULT, { extends: "default", name: "nature", minRasterPPI: 600 });
        expect(result.name).toBe("default");
        expect(result.minRasterPPI).toBe(600);
    });

    it("does not mutate base or override", () => {
        const base = { a: 1, b: { c: 2 } };
        const override = { b: { c: 99 } };
        mergeConfig(base, override);
        expect(base.b.c).toBe(2);
        expect(override.b.c).toBe(99);
    });
});

describe("validateConfig", () => {
    it("returns no errors for a valid config", () => {
        expect(validateConfig(DEFAULT)).toHaveLength(0);
    });

    it("reports missing required fields", () => {
        const errors = validateConfig({});
        expect(errors.length).toBeGreaterThan(0);
        expect(errors.some(e => e.includes("allowedFontSizes"))).toBe(true);
    });

    it("reports when allowedFontSizes is not an array", () => {
        const bad = { ...DEFAULT, allowedFontSizes: 8 };
        const errors = validateConfig(bad);
        expect(errors.some(e => e.includes("allowedFontSizes"))).toBe(true);
    });
});

describe("loadPresetChain", () => {
    const NATURE = { name: "nature", extends: "default", allowedFontSizes: [7, 8], minRasterPPI: 300 };
    const presets = { default: DEFAULT, nature: NATURE };

    it("returns default config when journal is 'default'", () => {
        const result = loadPresetChain(presets, "default");
        expect(result.allowedFontSizes).toEqual([5, 6, 7, 8]);
    });

    it("merges nature preset over default", () => {
        const result = loadPresetChain(presets, "nature");
        expect(result.allowedFontSizes).toEqual([7, 8]);
        expect(result.scaleTarget).toBe(100); // inherited from default
    });

    it("applies user override on top", () => {
        const result = loadPresetChain(presets, "nature", { fontSizeTolerance: 0.5 });
        expect(result.fontSizeTolerance).toBe(0.5);
        expect(result.allowedFontSizes).toEqual([7, 8]);
    });

    it("throws when preset is unknown", () => {
        expect(() => loadPresetChain(presets, "unknown")).toThrow("Unknown journal preset");
    });

    it("throws when default preset is missing", () => {
        expect(() => loadPresetChain({}, "default")).toThrow("Missing default preset");
    });
});
