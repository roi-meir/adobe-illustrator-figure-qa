// Config merge, validation, and preset-chain resolution.
// Works in Node (for tests/build) and in ExtendScript (no import/export).

var CONFIG_REQUIRED_FIELDS = [
    "allowedFontSizes",
    "fontSizeTolerance",
    "allowedFontFamilies",
    "scaleTarget",
    "scaleTolerance",
    "minRasterPPI",
    "checkEnabled"
];

var CONFIG_CHECK_ENABLED_FIELDS = ["fontSize", "fontFamily", "scale", "lowResRaster"];

// Deep-merge override into base; arrays and primitives in override win outright.
// Objects are merged recursively. The "extends" and "name" keys are metadata, not merged.
function mergeConfig(base, override) {
    var result = {};
    var k;
    for (k in base) {
        if (Object.prototype.hasOwnProperty.call(base, k)) result[k] = base[k];
    }
    for (k in override) {
        if (!Object.prototype.hasOwnProperty.call(override, k)) continue;
        if (k === "extends" || k === "name") continue;
        var bv = result[k];
        var ov = override[k];
        if (bv !== null && typeof bv === "object" && !Array.isArray(bv) &&
            ov !== null && typeof ov === "object" && !Array.isArray(ov)) {
            result[k] = mergeConfig(bv, ov);
        } else {
            result[k] = ov;
        }
    }
    return result;
}

// Returns an array of error strings; empty means valid.
function validateConfig(config) {
    var errors = [];
    var i;
    for (i = 0; i < CONFIG_REQUIRED_FIELDS.length; i++) {
        if (!Object.prototype.hasOwnProperty.call(config, CONFIG_REQUIRED_FIELDS[i])) {
            errors.push("Missing required field: " + CONFIG_REQUIRED_FIELDS[i]);
        }
    }
    if (config.allowedFontSizes !== undefined && !Array.isArray(config.allowedFontSizes)) {
        errors.push("allowedFontSizes must be an array");
    }
    if (config.allowedFontFamilies !== undefined && !Array.isArray(config.allowedFontFamilies)) {
        errors.push("allowedFontFamilies must be an array");
    }
    if (config.checkEnabled) {
        for (i = 0; i < CONFIG_CHECK_ENABLED_FIELDS.length; i++) {
            var f = CONFIG_CHECK_ENABLED_FIELDS[i];
            if (!Object.prototype.hasOwnProperty.call(config.checkEnabled, f)) {
                errors.push("checkEnabled missing field: " + f);
            }
        }
    }
    return errors;
}

// Resolve the merge chain for a journal name given a map of { name: configObject }.
// Chain: default → (named preset if different from default) → userOverride (optional).
function loadPresetChain(presets, journalName, userOverride) {
    var base = presets["default"];
    if (!base) throw new Error("Missing default preset");

    var result = mergeConfig({}, base);

    if (journalName && journalName !== "default") {
        var preset = presets[journalName];
        if (!preset) throw new Error("Unknown journal preset: " + journalName);
        result = mergeConfig(result, preset);
    }

    if (userOverride) {
        // If user specifies a different journal, apply that first
        if (userOverride.journal && userOverride.journal !== journalName) {
            var userJournal = presets[userOverride.journal];
            if (userJournal) result = mergeConfig(result, userJournal);
        }
        result = mergeConfig(result, userOverride);
    }

    return result;
}

if (typeof module !== "undefined") {
    module.exports = { mergeConfig: mergeConfig, validateConfig: validateConfig,
        loadPresetChain: loadPresetChain };
}
