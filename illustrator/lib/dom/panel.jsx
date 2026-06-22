// ScriptUI panel for reviewing and fixing Figure QA issues.
// Depends on: checks.jsx, highlight.jsx, fix.jsx, traverse.jsx, QA_CONFIG global.

var QA_PANEL_STATE = {
    doc: null,
    issues: null,
    filterType: "all",
    selectedIndex: -1,
    dialog: null,
    listBox: null,
    summaryText: null
};

function selectAndZoomToItem(doc, issue) {
    if (!issue || !issue.item) return;
    try {
        doc.selection = null;
        issue.item.selected = true;
        issue.bounds = getIssueBounds(issue);
        app.executeMenuCommand("fitin");
    } catch (e) {
        try {
            var bounds = getIssueBounds(issue);
            var b = parseBounds(bounds, issue.item);
            var view = doc.views[0];
            view.centerPoint = [(b.left + b.right) / 2, (b.top + b.bottom) / 2];
        } catch (e2) {}
    }
}

function showQAPanel(doc, issues) {
    QA_PANEL_STATE.doc = doc;
    QA_PANEL_STATE.issues = issues;
    QA_PANEL_STATE.filterType = "all";
    QA_PANEL_STATE.selectedIndex = -1;

    var dlg = new Window("dialog", "Figure QA");
    dlg.orientation = "column";
    dlg.alignChildren = ["fill", "top"];
    dlg.preferredSize.width = 520;

    QA_PANEL_STATE.dialog = dlg;
    QA_PANEL_STATE.summaryText = dlg.add("statictext", undefined, buildSummaryText(issues), { multiline: true });
    QA_PANEL_STATE.summaryText.preferredSize.height = 36;

    var filterRow = dlg.add("group");
    filterRow.orientation = "row";
    filterRow.add("statictext", undefined, "Filter:");
    var filterDropdown = filterRow.add("dropdownlist", undefined,
        ["All", "fontSize", "fontFamily", "scale", "lowResRaster"]);
    filterDropdown.selection = 0;

    QA_PANEL_STATE.listBox = dlg.add("listbox", undefined, [],
        { numberOfColumns: 1, showHeaders: false, multiselect: false });
    QA_PANEL_STATE.listBox.preferredSize = [500, 260];

    var btnRow1 = dlg.add("group");
    btnRow1.orientation = "row";
    var fixSelectedBtn = btnRow1.add("button", undefined, "Fix Selected");
    var fixAllBtn     = btnRow1.add("button", undefined, "Fix All Auto");
    var skipBtn       = btnRow1.add("button", undefined, "Skip");

    var btnRow2 = dlg.add("group");
    btnRow2.orientation = "row";
    var exportBtn  = btnRow2.add("button", undefined, "Export Report");
    var clearBtn   = btnRow2.add("button", undefined, "Clear Highlights");
    var rescanBtn  = btnRow2.add("button", undefined, "Re-scan");
    var closeBtn   = btnRow2.add("button", undefined, "Close");

    refreshListBox();

    if (QA_PANEL_STATE.listBox.items.length > 0) {
        QA_PANEL_STATE.listBox.selection = 0;
        selectAndZoomToItem(doc, getSelectedIssue());
    }

    QA_PANEL_STATE.listBox.onChange = function () {
        var issue = getSelectedIssue();
        if (!issue) return;
        QA_PANEL_STATE.selectedIndex = QA_PANEL_STATE.listBox.selection.index;
        selectAndZoomToItem(doc, issue);
    };

    filterDropdown.onChange = function () {
        var labels = ["all", "fontSize", "fontFamily", "scale", "lowResRaster"];
        QA_PANEL_STATE.filterType = labels[filterDropdown.selection.index];
        refreshListBox();
    };

    fixSelectedBtn.onClick = function () {
        var issue = getSelectedIssue();
        if (!issue) { alert("Select an issue first."); return; }
        if (!issue.autoFixable) { alert("This issue must be fixed manually.\n\n" + issue.message); return; }
        if (fixIssue(doc, issue)) {
            issue.dismissed = true;
            removeIssueHighlight(issue);
            refreshListBox(); updateSummary();
        } else { alert("Could not apply fix."); }
    };

    fixAllBtn.onClick = function () {
        var autoCount = countAutoFixable(QA_PANEL_STATE.issues);
        if (autoCount === 0) { alert("No auto-fixable issues remaining."); return; }
        if (!confirm("Fix " + autoCount + " auto-fixable issue(s)?")) return;
        var fixed = fixAllAutoIssues(doc, QA_PANEL_STATE.issues);
        refreshListBox(); updateSummary();
        alert("Fixed " + fixed + " issue(s).");
    };

    skipBtn.onClick = function () {
        var issue = getSelectedIssue();
        if (!issue) { alert("Select an issue first."); return; }
        dismissIssue(issue); refreshListBox(); updateSummary();
    };

    exportBtn.onClick = function () {
        exportReport(doc, QA_PANEL_STATE.issues);
    };

    clearBtn.onClick = function () {
        clearAllHighlights(doc); alert("Highlights cleared.");
    };

    rescanBtn.onClick = function () {
        QA_PANEL_STATE.issues = collectAllIssues(doc);
        QA_PANEL_STATE.selectedIndex = -1;
        refreshHighlights(doc, QA_PANEL_STATE.issues);
        refreshListBox(); updateSummary();
        if (QA_PANEL_STATE.issues.length === 0) alert("Re-scan complete: no issues found.");
    };

    closeBtn.onClick = function () { dlg.close(); };

    dlg.center();
    dlg.show();
}

function buildSummaryText(issues) {
    var active = activeIssues(issues, "all");
    var autoCount = countAutoFixable(issues);
    if (active.length === 0) return "No active issues.";
    return "Found " + active.length + " issue(s) (" + autoCount + " auto-fixable)";
}

function updateSummary() {
    if (QA_PANEL_STATE.summaryText) {
        QA_PANEL_STATE.summaryText.text = buildSummaryText(QA_PANEL_STATE.issues);
    }
}

function issueListLabel(issue) {
    var preview = issue.preview ? "\"" + issue.preview + "\"" : "";
    return "#" + issue.id + " [" + checkTypeLabel(issue.check) + "] " + preview + " - " + issue.message;
}

function refreshListBox() {
    var listBox = QA_PANEL_STATE.listBox;
    var issues = activeIssues(QA_PANEL_STATE.issues, QA_PANEL_STATE.filterType);
    listBox.removeAll();
    for (var i = 0; i < issues.length; i++) {
        listBox.add("item", issueListLabel(issues[i]));
    }
    if (issues.length > 0) listBox.selection = 0;
}

function getSelectedIssue() {
    var listBox = QA_PANEL_STATE.listBox;
    if (!listBox.selection) return null;
    var label = String(listBox.selection.text);
    var idMatch = label.match(/^#(\d+)/);
    if (!idMatch) return null;
    var targetId = parseInt(idMatch[1], 10);
    for (var i = 0; i < QA_PANEL_STATE.issues.length; i++) {
        if (QA_PANEL_STATE.issues[i].id === targetId && !QA_PANEL_STATE.issues[i].dismissed) {
            return QA_PANEL_STATE.issues[i];
        }
    }
    return null;
}
