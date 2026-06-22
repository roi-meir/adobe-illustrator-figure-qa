// Optional JSON report export for the QA panel.
// Writes <documentName>.figure-qa.json beside the open .ai file.

function buildReportPayload(doc, issues) {
    var docName = doc.name || "untitled";
    var docPath = "";
    try { docPath = doc.fullName.fsName; } catch (e) {}

    var issueData = [];
    for (var i = 0; i < issues.length; i++) {
        var iss = issues[i];
        issueData.push({
            id: iss.id,
            check: iss.check,
            severity: iss.severity,
            message: iss.message,
            preview: iss.preview,
            autoFixable: iss.autoFixable,
            dismissed: iss.dismissed,
            bounds: iss.bounds || null
        });
    }

    return {
        version: "0.1.0",
        timestamp: new Date().toISOString ? new Date().toISOString() : String(new Date()),
        document: docName,
        documentPath: docPath,
        journal: QA_CONFIG.name || "default",
        issueCount: issueData.length,
        issues: issueData
    };
}

function jsonStringify(obj, indent) {
    indent = indent || 2;
    if (typeof JSON !== "undefined" && JSON.stringify) {
        return JSON.stringify(obj, null, indent);
    }
    // Minimal fallback for older ExtendScript engines.
    function serialize(val, depth) {
        if (val === null || val === undefined) return "null";
        if (typeof val === "boolean" || typeof val === "number") return String(val);
        if (typeof val === "string") {
            return '"' + val.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
                .replace(/\n/g, "\\n").replace(/\r/g, "\\r") + '"';
        }
        if (Array.isArray(val)) {
            var items = [];
            for (var i = 0; i < val.length; i++) items.push(serialize(val[i], depth + 1));
            return "[" + items.join(", ") + "]";
        }
        if (typeof val === "object") {
            var pairs = [];
            for (var k in val) {
                if (Object.prototype.hasOwnProperty.call(val, k)) {
                    pairs.push('"' + k + '": ' + serialize(val[k], depth + 1));
                }
            }
            var pad = "";
            for (var d = 0; d < depth; d++) pad += "  ";
            return "{\n" + pad + "  " + pairs.join(",\n" + pad + "  ") + "\n" + pad + "}";
        }
        return '"' + String(val) + '"';
    }
    return serialize(obj, 0);
}

function exportReport(doc, issues) {
    var reportPath = "";
    try {
        var docFile = doc.fullName;
        reportPath = docFile.fsName.replace(/\.ai$/i, "") + ".figure-qa.json";
    } catch (e) {
        var saveDialog = File.saveDialog("Save QA Report", "*.figure-qa.json");
        if (!saveDialog) return;
        reportPath = saveDialog.fsName;
    }

    var payload = buildReportPayload(doc, issues);
    var f = new File(reportPath);
    f.open("w");
    f.write(jsonStringify(payload));
    f.close();
    alert("Report saved to:\n" + reportPath);
}
