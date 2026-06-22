// Non-destructive highlight overlay on a dedicated non-printing layer.
// Depends on: core.generated.jsx, traverse.jsx, checks.jsx, QA_CONFIG global.

function rgbColor(rgb) {
    var c = new RGBColor();
    c.red = rgb[0]; c.green = rgb[1]; c.blue = rgb[2];
    return c;
}

function drawHighlights(doc, issues) {
    var layer = ensureQALayer(doc);
    var strokeColor = rgbColor(QA_CONFIG.highlightColor);
    var pad = QA_CONFIG.highlightPaddingPt;
    var strokeW = QA_CONFIG.highlightStrokePt;
    for (var i = 0; i < issues.length; i++) {
        if (issues[i].dismissed) continue;
        drawIssueHighlight(layer, issues[i], strokeColor, pad, strokeW);
    }
}

function drawIssueHighlight(layer, issue, strokeColor, pad, strokeW) {
    issue.highlightItems = [];
    var bounds = padBounds(getIssueBounds(issue), pad, issue.item);
    var b = parseBounds(bounds, issue.item);
    var width = b.right - b.left;
    var height = b.top - b.bottom;
    var rect = layer.pathItems.rectangle(b.top, b.left, width, height);
    rect.stroked = true;
    rect.filled = false;
    rect.strokeWidth = strokeW;
    rect.strokeColor = strokeColor;
    issue.highlightItems.push(rect);

    var label = layer.textFrames.add();
    label.contents = "#" + issue.id;
    label.textRange.characterAttributes.size = 6;
    label.textRange.characterAttributes.fillColor = strokeColor;
    label.textRange.characterAttributes.strokeColor = strokeColor;
    try { label.textRange.characterAttributes.textFont = app.textFonts.getByName("Arial-BoldMT"); }
    catch (e) {
        try { label.textRange.characterAttributes.textFont = app.textFonts.getByName("ArialMT"); } catch (e2) {}
    }
    label.position = [b.left, b.top];
    issue.highlightItems.push(label);
}

function removeIssueHighlight(issue) {
    if (!issue.highlightItems) return;
    for (var i = issue.highlightItems.length - 1; i >= 0; i--) {
        try { issue.highlightItems[i].remove(); } catch (e) {}
    }
    issue.highlightItems = [];
}

function clearAllHighlights(doc) {
    removeQALayer(doc);
}

function refreshHighlights(doc, issues) {
    clearAllHighlights(doc);
    drawHighlights(doc, issues);
}
