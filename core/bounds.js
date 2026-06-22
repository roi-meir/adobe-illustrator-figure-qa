// Bounds parsing and manipulation for Illustrator geometricBounds arrays.
// Illustrator uses [left, top, right, bottom] but y-axis is inverted (top > bottom).
// All functions are pure — no global state, safe to test in Node.

function copyBounds(bounds) {
    return [bounds[0], bounds[1], bounds[2], bounds[3]];
}

function boundsToArray(b) {
    return [b.left, b.top, b.right, b.bottom];
}

// Illustrator returns geometricBounds as [left, top, right, bottom] for most page items,
// but PDF-imported items occasionally swap the order. We detect and normalise here.
function parseBounds(raw, item) {
    if (!raw || raw.length < 4) {
        return { left: 0, top: 0, right: 0, bottom: 0 };
    }

    // Cross-check against item.left / item.top when available.
    if (item) {
        try {
            if (Math.abs(raw[0] - item.left) < 2 && Math.abs(raw[1] - item.top) < 2) {
                return { left: raw[0], top: raw[1], right: raw[2], bottom: raw[3] };
            }
            if (Math.abs(raw[0] - item.top) < 2 && Math.abs(raw[1] - item.left) < 2) {
                return { left: raw[1], top: raw[0], right: raw[3], bottom: raw[2] };
            }
        } catch (e) {}
    }

    // Heuristic: in Illustrator coordinates right > left and top > bottom.
    if (raw[2] > raw[0] && raw[3] < raw[1]) {
        return { left: raw[0], top: raw[1], right: raw[2], bottom: raw[3] };
    }

    return { left: raw[1], top: raw[0], right: raw[3], bottom: raw[2] };
}

function padBounds(bounds, pad, item) {
    var b = parseBounds(bounds, item);
    return boundsToArray({
        left: b.left - pad,
        top: b.top + pad,
        right: b.right + pad,
        bottom: b.bottom - pad
    });
}

function mergeBounds(a, b, item) {
    if (!a) return copyBounds(b);
    var ba = parseBounds(a, item);
    var bb = parseBounds(b, item);
    return boundsToArray({
        left: Math.min(ba.left, bb.left),
        top: Math.max(ba.top, bb.top),
        right: Math.max(ba.right, bb.right),
        bottom: Math.min(ba.bottom, bb.bottom)
    });
}

// Sanity-check: rejects degenerate or wildly off-position bounds rectangles.
function boundsArePlausible(bounds, item) {
    var b = parseBounds(bounds, item);
    var w = b.right - b.left;
    var h = b.top - b.bottom;
    if (w < 0.1 || h < 0.1 || w > 20000 || h > 20000) return false;
    if (!item) return true;

    try {
        var ib = parseBounds(item.geometricBounds, item);
        var cx = (b.left + b.right) / 2;
        var cy = (b.top + b.bottom) / 2;
        var icx = (ib.left + ib.right) / 2;
        var icy = (ib.top + ib.bottom) / 2;
        var dist = Math.sqrt(Math.pow(cx - icx, 2) + Math.pow(cy - icy, 2));
        var itemDiag = Math.sqrt(Math.pow(ib.right - ib.left, 2) + Math.pow(ib.top - ib.bottom, 2));
        return dist <= Math.max(itemDiag * 1.5, 50);
    } catch (e) {
        return false;
    }
}

if (typeof module !== "undefined") {
    module.exports = { parseBounds: parseBounds, padBounds: padBounds, mergeBounds: mergeBounds,
        boundsToArray: boundsToArray, copyBounds: copyBounds, boundsArePlausible: boundsArePlausible };
}
