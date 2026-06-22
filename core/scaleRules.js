// Scale rules. Accepts a config object so it is testable in Node.

function isScaleOk(value, config) {
    return Math.abs(value - config.scaleTarget) <= config.scaleTolerance;
}

if (typeof module !== "undefined") {
    module.exports = { isScaleOk: isScaleOk };
}
