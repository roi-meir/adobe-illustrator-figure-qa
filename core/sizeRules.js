// Font-size rules. All functions accept a config object so they are testable in Node.

function floatEq(a, b, tolerance) {
    return Math.abs(a - b) <= tolerance;
}

function round1(n) {
    return parseFloat(n.toFixed(1));
}

// Returns true when size (in pt) matches one of config.allowedFontSizes within tolerance.
function isAllowedFontSize(size, config) {
    var rounded = round1(size);
    var allowed = config.allowedFontSizes;
    var tol = config.fontSizeTolerance;
    for (var i = 0; i < allowed.length; i++) {
        if (floatEq(rounded, allowed[i], tol)) {
            return true;
        }
    }
    return false;
}

function allowedFontSizesLabel(config) {
    var parts = [];
    for (var i = 0; i < config.allowedFontSizes.length; i++) {
        parts.push(config.allowedFontSizes[i]);
    }
    return parts.join(", ");
}

if (typeof module !== "undefined") {
    module.exports = { floatEq: floatEq, round1: round1,
        isAllowedFontSize: isAllowedFontSize, allowedFontSizesLabel: allowedFontSizesLabel };
}
