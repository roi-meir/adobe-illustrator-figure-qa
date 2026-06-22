import { describe, it, expect } from "vitest";
import { parseBounds, padBounds, mergeBounds, boundsToArray, copyBounds } from "../../core/bounds.js";

// Illustrator coordinate system: top > bottom, right > left.
const NORMAL = [10, 100, 110, 50]; // left=10 top=100 right=110 bottom=50

describe("parseBounds", () => {
    it("returns the standard [left,top,right,bottom] format", () => {
        const b = parseBounds(NORMAL);
        expect(b).toEqual({ left: 10, top: 100, right: 110, bottom: 50 });
    });

    it("handles swapped PDF-style input [top,left,bottom,right]", () => {
        // Heuristic: raw[2] > raw[0] and raw[3] < raw[1] must hold for normal format.
        // Provide a case that fails the heuristic → swapped path.
        const swapped = [100, 10, 50, 110]; // top,left,bottom,right
        const b = parseBounds(swapped);
        // After swap: left=10 top=100 right=110 bottom=50
        expect(b.left).toBe(10);
        expect(b.top).toBe(100);
        expect(b.right).toBe(110);
        expect(b.bottom).toBe(50);
    });

    it("returns zero bounds for empty input", () => {
        expect(parseBounds(null)).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
        expect(parseBounds([])).toEqual({ left: 0, top: 0, right: 0, bottom: 0 });
    });

    it("cross-checks against item.left / item.top when provided", () => {
        const item = { left: 10, top: 100 };
        const b = parseBounds(NORMAL, item);
        expect(b).toEqual({ left: 10, top: 100, right: 110, bottom: 50 });
    });
});

describe("copyBounds", () => {
    it("returns a new array equal to the input", () => {
        const copy = copyBounds(NORMAL);
        expect(copy).toEqual(NORMAL);
        expect(copy).not.toBe(NORMAL);
    });
});

describe("boundsToArray", () => {
    it("converts a bounds object back to [left,top,right,bottom]", () => {
        const arr = boundsToArray({ left: 10, top: 100, right: 110, bottom: 50 });
        expect(arr).toEqual([10, 100, 110, 50]);
    });
});

describe("padBounds", () => {
    it("expands all sides by the pad amount", () => {
        const padded = padBounds(NORMAL, 5);
        // left-5, top+5, right+5, bottom-5
        expect(padded).toEqual([5, 105, 115, 45]);
    });

    it("handles zero padding", () => {
        expect(padBounds(NORMAL, 0)).toEqual(NORMAL);
    });
});

describe("mergeBounds", () => {
    it("returns a bounding box containing both inputs", () => {
        const a = [0, 100, 50, 50];
        const b = [30, 80, 90, 20];
        const merged = mergeBounds(a, b);
        const result = parseBounds(merged);
        expect(result.left).toBe(0);
        expect(result.top).toBe(100);
        expect(result.right).toBe(90);
        expect(result.bottom).toBe(20);
    });

    it("returns a copy of b when a is null/undefined", () => {
        const b = [10, 100, 110, 50];
        expect(mergeBounds(null, b)).toEqual(b);
    });
});
