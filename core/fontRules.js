// Font-family rules. All functions accept a config object so they are testable in Node.

// Strip common weight/style suffixes for comparison.
function normalizeFontFamily(name) {
    if (!name) return "";
    var n = String(name);
    n = n.replace(/\s+(Bold|Italic|Bold Italic|Regular|Medium|Light|Semibold|Black|Oblique)$/i, "");
    n = n.replace(/^\[|\]$/g, "");
    return n.toLowerCase();
}

function fontFamilyKey(name) {
    return normalizeFontFamily(name).replace(/[\s-]+/g, "");
}

// PDF-subset fonts embed a 6-letter uppercase prefix separated by "+".
function stripPdfSubsetPrefix(name) {
    if (!name) return "";
    return String(name).replace(/^[A-Z]{6}\+/, "");
}

// Resolve displayable font metadata from an ExtendScript TextFont object.
// Falls back gracefully when properties throw (PDF-imported text often has empty .name).
function resolveFontLabel(textFont) {
    var name = "";
    var family = "";
    var style = "";
    try { name = stripPdfSubsetPrefix(textFont.name || ""); } catch (e) {}
    try { family = stripPdfSubsetPrefix(textFont.family || ""); } catch (e) {}
    try { style = textFont.style || ""; } catch (e2) {}

    var label = name || family;
    if (!label && style) label = style;
    var isUnavailable = !label || label.replace(/\s/g, "") === "";

    return {
        name: name,
        family: family,
        style: style,
        label: label || "(unavailable)",
        isUnavailable: isUnavailable
    };
}

// Empty / unavailable fonts (e.g. from PDF import) are treated as allowed — do not flag them.
function isAllowedFontFamily(fontName, fontFamily, config) {
    if ((!fontName || String(fontName).replace(/\s/g, "") === "") &&
        (!fontFamily || String(fontFamily).replace(/\s/g, "") === "")) {
        return true;
    }
    var allowed = config.allowedFontFamilies;
    if (fontFamily) {
        var familyKey = fontFamilyKey(fontFamily);
        for (var i = 0; i < allowed.length; i++) {
            if (familyKey === fontFamilyKey(allowed[i])) return true;
        }
    }
    if (!fontName || fontName.indexOf("[") === 0) return false;
    var key = fontFamilyKey(fontName);
    for (var j = 0; j < allowed.length; j++) {
        if (key === fontFamilyKey(allowed[j])) return true;
    }
    return false;
}

if (typeof module !== "undefined") {
    module.exports = { normalizeFontFamily: normalizeFontFamily, fontFamilyKey: fontFamilyKey,
        stripPdfSubsetPrefix: stripPdfSubsetPrefix, resolveFontLabel: resolveFontLabel,
        isAllowedFontFamily: isAllowedFontFamily };
}
