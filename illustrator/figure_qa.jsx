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

function runFigureQA() {
    if (app.documents.length === 0) {
        alert("No document open. Please open a document to run the script.");
        return;
    }

    // Load config (default journal; user can override via ~/.figure-qa/config.json).
    var QA_CONFIG = loadQAConfig();

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
