// Figure-size (artboard dimension) rules. All functions accept a config object so they are testable in Node.

var PT_PER_INCH = 72;
var MM_PER_INCH = 25.4;

// Converts Illustrator points to millimetres (1 inch = 72 pt = 25.4 mm).
function ptToMm(pt) {
    return (pt / PT_PER_INCH) * MM_PER_INCH;
}

// Returns true when dimensionMm does not exceed limitMm + toleranceMm.
// Passing null/undefined for limitMm means "no constraint".
function isDimensionOk(dimensionMm, limitMm, toleranceMm) {
    if (limitMm === null || limitMm === undefined) { return true; }
    return dimensionMm <= limitMm + toleranceMm;
}

function _tolerance(config) {
    return config.figureSizeTolerance !== undefined ? config.figureSizeTolerance : 0.5;
}

// Returns true when widthMm is within config.maxFigureWidthMm (or no limit is configured).
function isFigureWidthOk(widthMm, config) {
    if (!config.maxFigureWidthMm) { return true; }
    return isDimensionOk(widthMm, config.maxFigureWidthMm, _tolerance(config));
}

// Returns true when heightMm is within config.maxFigureHeightMm (or no limit is configured).
function isFigureHeightOk(heightMm, config) {
    if (!config.maxFigureHeightMm) { return true; }
    return isDimensionOk(heightMm, config.maxFigureHeightMm, _tolerance(config));
}

// Returns true when both dimensions are within configured limits.
function isFigureSizeOk(widthMm, heightMm, config) {
    return isFigureWidthOk(widthMm, config) && isFigureHeightOk(heightMm, config);
}

if (typeof module !== "undefined") {
    module.exports = {
        ptToMm: ptToMm,
        isDimensionOk: isDimensionOk,
        isFigureWidthOk: isFigureWidthOk,
        isFigureHeightOk: isFigureHeightOk,
        isFigureSizeOk: isFigureSizeOk
    };
}
