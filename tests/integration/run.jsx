#target illustrator

// Integration test runner — invoked via AppleScript from scripts/run-tests.sh.
// Reads case manifests from tests/integration/cases/*.json,
// creates synthetic documents, runs collectAllIssues, and writes JSON reports
// to tests/reports/case_<name>.json.

#include "../../illustrator/lib/core.generated.jsx"
#include "../../illustrator/lib/configLoader.jsx"
#include "../../illustrator/lib/dom/traverse.jsx"
#include "../../illustrator/lib/dom/checks.jsx"

var CASES_DIR_PATH = "";
var REPORTS_DIR_PATH = "";

function initPaths() {
    var scriptFile = new File($.fileName);
    var testsDir = scriptFile.parent.parent;
    CASES_DIR_PATH = testsDir.fsName + "/integration/cases";
    REPORTS_DIR_PATH = testsDir.fsName + "/reports";

    var reportsDir = new Folder(REPORTS_DIR_PATH);
    if (!reportsDir.exists) reportsDir.create();
}

function readJsonFile(path) {
    var f = new File(path);
    if (!f.exists) return null;
    f.open("r");
    var content = f.read();
    f.close();
    return eval("(" + content + ")");
}

function writeJsonFile(path, obj) {
    var f = new File(path);
    f.open("w");
    f.write(JSON.stringify ? JSON.stringify(obj, null, 2) : String(obj));
    f.close();
}

function createSyntheticDoc(setup) {
    var doc = app.documents.add(DocumentColorSpace.RGB, 400, 300);
    var frames = setup.textFrames || [];
    for (var i = 0; i < frames.length; i++) {
        var spec = frames[i];
        var tf = doc.textFrames.add();
        tf.contents = spec.contents || "Text";
        tf.position = [50, 250 - i * 40];
        tf.textRange.characterAttributes.size = spec.size || 7;
        if (spec.hScale !== undefined) tf.textRange.characterAttributes.horizontalScale = spec.hScale;
        if (spec.vScale !== undefined) tf.textRange.characterAttributes.verticalScale = spec.vScale;
        if (spec.font) {
            try { tf.textRange.characterAttributes.textFont = app.textFonts.getByName(spec.font); } catch (e) {}
        }
    }
    return doc;
}

function runCase(caseDef) {
    var QA_CONFIG = loadQAConfig(caseDef.journal || "default");
    var doc = createSyntheticDoc(caseDef.setup || {});
    var issues = collectAllIssues(doc);

    var counts = { fontSize: 0, fontFamily: 0, scale: 0, lowResRaster: 0 };
    var issueData = [];
    for (var i = 0; i < issues.length; i++) {
        var iss = issues[i];
        if (counts[iss.check] !== undefined) counts[iss.check]++;
        issueData.push({
            id: iss.id,
            check: iss.check,
            severity: iss.severity,
            message: iss.message,
            preview: iss.preview,
            autoFixable: iss.autoFixable
        });
    }

    doc.close(SaveOptions.DONOTSAVECHANGES);

    return {
        case: caseDef.name,
        journal: caseDef.journal || "default",
        issueCount: issues.length,
        checks: counts,
        issues: issueData
    };
}

function runAllCases() {
    initPaths();

    var casesFolder = new Folder(CASES_DIR_PATH);
    if (!casesFolder.exists) {
        alert("Cases folder not found: " + CASES_DIR_PATH);
        return;
    }

    var caseFiles = casesFolder.getFiles("*.json");
    var results = [];

    for (var i = 0; i < caseFiles.length; i++) {
        var caseDef = readJsonFile(caseFiles[i].fsName);
        if (!caseDef || !caseDef.name) continue;

        try {
            var result = runCase(caseDef);
            results.push({ name: caseDef.name, status: "ok", result: result });
            writeJsonFile(REPORTS_DIR_PATH + "/case_" + caseDef.name + ".json", result);
        } catch (e) {
            results.push({ name: caseDef.name, status: "error", error: String(e) });
        }
    }

    writeJsonFile(REPORTS_DIR_PATH + "/run_results.json", { cases: results });
}

runAllCases();
