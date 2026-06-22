// Auto-fix handlers for issues that are safe to correct automatically.
// Depends on: core.generated.jsx, highlight.jsx, QA_CONFIG global.

function fixIssue(doc, issue) {
    if (!issue || !issue.autoFixable || issue.dismissed) return false;
    if (issue.check === "scale") return fixScaleIssue(issue);
    return false;
}

function fixScaleIssue(issue) {
    try {
        if (issue.item.typename === "TextFrame") return fixTextScale(issue);
        if (issue.item.typename === "RasterItem" || issue.item.typename === "PlacedItem") {
            issue.item.horizontalScale = QA_CONFIG.scaleTarget;
            issue.item.verticalScale = QA_CONFIG.scaleTarget;
            return true;
        }
    } catch (e) { return false; }
    return false;
}

function fixTextScale(issue) {
    var tf = issue.item;
    var start = issue.charStart !== undefined ? issue.charStart : 0;
    var end = issue.charEnd !== undefined ? issue.charEnd : tf.characters.length - 1;
    for (var i = start; i <= end; i++) {
        var attrs = tf.characters[i].characterAttributes;
        if (!isScaleOk(attrs.horizontalScale, QA_CONFIG)) attrs.horizontalScale = QA_CONFIG.scaleTarget;
        if (!isScaleOk(attrs.verticalScale, QA_CONFIG))   attrs.verticalScale = QA_CONFIG.scaleTarget;
    }
    return true;
}

function fixAllAutoIssues(doc, issues) {
    var fixed = 0;
    for (var i = 0; i < issues.length; i++) {
        if (issues[i].dismissed || !issues[i].autoFixable) continue;
        if (fixIssue(doc, issues[i])) {
            issues[i].dismissed = true;
            removeIssueHighlight(issues[i]);
            fixed++;
        }
    }
    return fixed;
}

function dismissIssue(issue) {
    issue.dismissed = true;
    removeIssueHighlight(issue);
}
