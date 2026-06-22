// Figure QA checks — Illustrator DOM layer.
// Depends on: core.generated.jsx, traverse.jsx, QA_CONFIG global.

function previewText(text, maxLen) {
    maxLen = maxLen || 30;
    if (!text) return "";
    var s = String(text).replace(/[\r\n]/g, " ");
    if (s.length > maxLen) return s.substring(0, maxLen) + "...";
    return s;
}

function getTextPreviewAtIndex(tf, charIndex) {
    var text = tf.contents || "";
    if (text.length === 0) return "";
    var start = Math.max(0, charIndex - 5);
    var end = Math.min(text.length, charIndex + 25);
    return previewText(text.substring(start, end), 30);
}

function makeIssue(id, check, severity, message, preview, item, options) {
    options = options || {};
    var bounds = options.bounds;
    if (!bounds && item) {
        try { bounds = copyBounds(item.geometricBounds); } catch (e) { bounds = [0, 0, 0, 0]; }
    }
    return {
        id: id,
        check: check,
        severity: severity || "error",
        message: message,
        preview: preview || "",
        item: item,
        charStart: options.charStart,
        charEnd: options.charEnd,
        autoFixable: options.autoFixable === true,
        dismissed: false,
        bounds: bounds,
        highlightItems: []
    };
}

function nextIssueId(issues) {
    var maxId = 0;
    for (var i = 0; i < issues.length; i++) {
        if (issues[i].id > maxId) maxId = issues[i].id;
    }
    return maxId + 1;
}

function getCharacterRangeBounds(tf, startIndex, endIndex) {
    var left = Infinity, top = -Infinity, right = -Infinity, bottom = Infinity, found = false;
    try {
        var lines = tf.lines;
        for (var li = 0; li < lines.length; li++) {
            var chars = lines[li].characters;
            for (var ci = 0; ci < chars.length; ci++) {
                var idx = chars[ci].index;
                if (idx >= startIndex && idx <= endIndex) {
                    var b = parseBounds(chars[ci].geometricBounds, chars[ci]);
                    if (b.left < left) left = b.left;
                    if (b.top > top) top = b.top;
                    if (b.right > right) right = b.right;
                    if (b.bottom < bottom) bottom = b.bottom;
                    found = true;
                }
            }
        }
    } catch (e) {}
    if (found) return boundsToArray({ left: left, top: top, right: right, bottom: bottom });
    return copyBounds(tf.geometricBounds);
}

function getIssueBounds(issue) {
    if (!issue || !issue.item) return issue.bounds || [0, 0, 0, 0];
    var item = issue.item;
    try {
        if (item.typename === "TextFrame" &&
            issue.charStart !== undefined && issue.charEnd !== undefined) {
            var rangeBounds = getCharacterRangeBounds(item, issue.charStart, issue.charEnd);
            if (boundsArePlausible(rangeBounds, item)) return rangeBounds;
        }
    } catch (e) {}
    try { return copyBounds(item.geometricBounds); } catch (e2) {}
    try { return copyBounds(item.visibleBounds); } catch (e3) {}
    return issue.bounds || [0, 0, 0, 0];
}

function collectAllIssues(doc) {
    var issues = [];
    var nextId = 1;
    if (QA_CONFIG.checkEnabled.fontSize)    nextId = checkFontSizes(doc, issues, nextId);
    if (QA_CONFIG.checkEnabled.fontFamily)  nextId = checkFontFamilies(doc, issues, nextId);
    if (QA_CONFIG.checkEnabled.scale)       nextId = checkScales(doc, issues, nextId);
    if (QA_CONFIG.checkEnabled.lowResRaster) nextId = checkLowResRasters(doc, issues, nextId);
    return issues;
}

function checkFontSizes(doc, issues, startId) {
    var id = startId;
    walkTextFrames(doc, function (tf) {
        if (tf.characters.length === 0) return;
        var runStart = 0;
        var runSize = round1(tf.characters[0].characterAttributes.size);
        for (var i = 1; i <= tf.characters.length; i++) {
            var size = i < tf.characters.length
                ? round1(tf.characters[i].characterAttributes.size) : null;
            if (i === tf.characters.length || size !== runSize) {
                if (!isAllowedFontSize(runSize, QA_CONFIG)) {
                    var endIndex = i - 1;
                    issues.push(makeIssue(id++, "fontSize", "error",
                        runSize + " pt (allowed: " + allowedFontSizesLabel(QA_CONFIG) + ")",
                        getTextPreviewAtIndex(tf, runStart), tf,
                        { charStart: runStart, charEnd: endIndex,
                          bounds: getCharacterRangeBounds(tf, runStart, endIndex), autoFixable: false }));
                }
                if (i < tf.characters.length) { runStart = i; runSize = size; }
            }
        }
    });
    return id;
}

function checkFontFamilies(doc, issues, startId) {
    var id = startId;
    walkTextFrames(doc, function (tf) {
        if (tf.characters.length === 0) return;

        function getCharFont(charIndex) {
            try { return resolveFontLabel(tf.characters[charIndex].characterAttributes.textFont); }
            catch (e) { return { isUnavailable: true, label: "" }; }
        }
        function fontKey(resolved) {
            if (!resolved || resolved.isUnavailable) return "__unavailable__";
            return resolved.name + "|" + resolved.family;
        }

        var runStart = 0;
        var runResolved = getCharFont(0);
        var runFontKey = fontKey(runResolved);

        for (var i = 1; i <= tf.characters.length; i++) {
            var resolved = i < tf.characters.length ? getCharFont(i) : null;
            var key = resolved ? fontKey(resolved) : null;
            if (i === tf.characters.length || key !== runFontKey) {
                if (!runResolved.isUnavailable &&
                    !isAllowedFontFamily(runResolved.name, runResolved.family, QA_CONFIG)) {
                    var endIndex = i - 1;
                    issues.push(makeIssue(id++, "fontFamily", "error",
                        "Font: \"" + runResolved.label + "\"",
                        getTextPreviewAtIndex(tf, runStart), tf,
                        { charStart: runStart, charEnd: endIndex,
                          bounds: getCharacterRangeBounds(tf, runStart, endIndex), autoFixable: false }));
                }
                if (i < tf.characters.length) {
                    runStart = i; runResolved = resolved; runFontKey = key;
                }
            }
        }
    });
    return id;
}

function checkScales(doc, issues, startId) {
    var id = startId;
    walkTextFrames(doc, function (tf) {
        if (tf.characters.length === 0) return;
        var runStart = 0;
        var runH = tf.characters[0].characterAttributes.horizontalScale;
        var runV = tf.characters[0].characterAttributes.verticalScale;
        for (var i = 1; i <= tf.characters.length; i++) {
            var hScale = i < tf.characters.length
                ? tf.characters[i].characterAttributes.horizontalScale : null;
            var vScale = i < tf.characters.length
                ? tf.characters[i].characterAttributes.verticalScale : null;
            if (i === tf.characters.length || hScale !== runH || vScale !== runV) {
                var badParts = [];
                if (!isScaleOk(runH, QA_CONFIG)) badParts.push("H " + round1(runH) + "%");
                if (!isScaleOk(runV, QA_CONFIG)) badParts.push("V " + round1(runV) + "%");
                if (badParts.length > 0) {
                    var endIndex = i - 1;
                    issues.push(makeIssue(id++, "scale", "error",
                        badParts.join(", "), getTextPreviewAtIndex(tf, runStart), tf,
                        { charStart: runStart, charEnd: endIndex,
                          bounds: getCharacterRangeBounds(tf, runStart, endIndex), autoFixable: true }));
                }
                if (i < tf.characters.length) { runStart = i; runH = hScale; runV = vScale; }
            }
        }
    });

    walkAllPageItems(doc, function (item) {
        if (item.typename !== "RasterItem" && item.typename !== "PlacedItem") return;
        var badParts = [];
        try {
            if (!isScaleOk(item.horizontalScale, QA_CONFIG)) badParts.push("H " + round1(item.horizontalScale) + "%");
            if (!isScaleOk(item.verticalScale, QA_CONFIG))   badParts.push("V " + round1(item.verticalScale) + "%");
        } catch (e) { return; }
        if (badParts.length > 0) {
            var label = item.typename === "PlacedItem" ? "Placed image" : "Raster image";
            issues.push(makeIssue(id++, "scale", "error", badParts.join(", "), label, item, { autoFixable: true }));
        }
    });
    return id;
}

function getPixelSizeFromFile(file) {
    if (!file || !file.exists) return null;
    if ($.os.indexOf("Mac") >= 0 && typeof system !== "undefined" && system.callSystem) {
        try {
            var cmd = 'sips -g pixelWidth -g pixelHeight "' + file.fsName + '" 2>/dev/null';
            var output = system.callSystem(cmd);
            if (!output) return null;
            var wMatch = output.match(/pixelWidth:\s*(\d+)/);
            var hMatch = output.match(/pixelHeight:\s*(\d+)/);
            if (wMatch && hMatch) return { width: parseInt(wMatch[1], 10), height: parseInt(hMatch[1], 10) };
        } catch (e) {}
    }
    return null;
}

function getRasterPixelDimensions(item) {
    try {
        if (item.file) {
            var pixels = getPixelSizeFromFile(new File(item.file));
            if (pixels) return pixels;
        }
    } catch (e) {}
    if (item.typename === "RasterItem") {
        try { if (item.image && item.image.width > 0) return { width: item.image.width, height: item.image.height }; } catch (e2) {}
    }
    return { width: 0, height: 0 };
}

function computeEffectivePPI(item) {
    try {
        var displayW = Math.abs(item.width);
        var displayH = Math.abs(item.height);
        if (displayW <= 0 || displayH <= 0) return null;
        var pixels = getRasterPixelDimensions(item);
        var pxW = pixels.width;
        var pxH = pixels.height;
        if (item.typename === "RasterItem") {
            try { if (item.image && item.image.width > 0) { pxW = item.image.width; pxH = item.image.height; } } catch (e) {}
        }
        if (pxW <= 0 || pxH <= 0) return null;
        var ppiW = pxW / (displayW / 72);
        var ppiH = pxH / (displayH / 72);
        return Math.min(ppiW, ppiH);
    } catch (e) { return null; }
}

function checkLowResRasters(doc, issues, startId) {
    var id = startId;
    walkAllPageItems(doc, function (item) {
        if (item.typename !== "RasterItem" && item.typename !== "PlacedItem") return;
        var ppi = computeEffectivePPI(item);
        if (ppi === null) return;
        if (ppi < QA_CONFIG.minRasterPPI) {
            var label = item.typename === "PlacedItem" ? "Placed image" : "Raster image";
            issues.push(makeIssue(id++, "lowResRaster", "warning",
                Math.round(ppi) + " PPI (min: " + QA_CONFIG.minRasterPPI + ")",
                label, item, { autoFixable: false }));
        }
    });
    return id;
}

function countAutoFixable(issues) {
    var count = 0;
    for (var i = 0; i < issues.length; i++) {
        if (!issues[i].dismissed && issues[i].autoFixable) count++;
    }
    return count;
}

function activeIssues(issues, filterType) {
    var result = [];
    for (var i = 0; i < issues.length; i++) {
        if (issues[i].dismissed) continue;
        if (filterType && filterType !== "all" && issues[i].check !== filterType) continue;
        result.push(issues[i]);
    }
    return result;
}

function checkTypeLabel(check) {
    var labels = { fontSize: "fontSize", fontFamily: "fontFamily",
        fontUnavailable: "noFont", scale: "scale", lowResRaster: "lowRes" };
    return labels[check] || check;
}
