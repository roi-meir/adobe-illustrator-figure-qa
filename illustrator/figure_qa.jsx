#target illustrator

// Figure QA — main entry point.
// Usage: File → Scripts → figure_qa  (or drag to Illustrator)

#include "lib/core.generated.jsx"
#include "lib/configLoader.jsx"
#include "lib/dom/traverse.jsx"
#include "lib/dom/checks.jsx"
#include "lib/dom/highlight.jsx"
#include "lib/dom/fix.jsx"
#include "lib/report.jsx"
#include "lib/dom/panel.jsx"

// Global config — must be set before any DOM function runs.
var QA_CONFIG = loadQAConfig();

function runFigureQA() {
    if (app.documents.length === 0) {
        alert("No document open. Please open a document to run the script.");
        return;
    }

    var doc = app.activeDocument;
    var issues = collectAllIssues(doc);

    if (issues.length === 0) {
        alert("Success! No issues found.");
        return;
    }

    drawHighlights(doc, issues);
    showQAPanel(doc, issues);
}

runFigureQA();
