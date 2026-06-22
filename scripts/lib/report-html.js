#!/usr/bin/env node
// Generates tests/reports/report.html from tests/reports/run_results.json
// and comparison against tests/integration/expected/*.json.

"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "../..");
const REPORTS_DIR = path.join(ROOT, "tests", "reports");
const EXPECTED_DIR = path.join(ROOT, "tests", "integration", "expected");
const RUN_RESULTS = path.join(REPORTS_DIR, "run_results.json");
const OUT_HTML = path.join(REPORTS_DIR, "report.html");

function loadJson(p) {
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf8"));
}

// Returns { passed: bool, diffs: string[] }
function compareResult(result, expected) {
    const diffs = [];
    if (expected.issueCount !== undefined) {
        const ec = expected.issueCount;
        if (typeof ec === "number") {
            if (result.issueCount !== ec) diffs.push(`issueCount: expected ${ec}, got ${result.issueCount}`);
        } else if (ec.min !== undefined && result.issueCount < ec.min) {
            diffs.push(`issueCount: expected ≥${ec.min}, got ${result.issueCount}`);
        }
    }
    if (expected.checks) {
        for (const [check, exp] of Object.entries(expected.checks)) {
            const got = (result.checks && result.checks[check]) || 0;
            if (typeof exp === "number") {
                if (got !== exp) diffs.push(`checks.${check}: expected ${exp}, got ${got}`);
            } else if (exp.min !== undefined && got < exp.min) {
                diffs.push(`checks.${check}: expected ≥${exp.min}, got ${got}`);
            }
        }
    }
    return { passed: diffs.length === 0, diffs };
}

function escape(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(runData) {
    const cases = runData.cases || [];
    let passed = 0, failed = 0;
    const rows = [];

    for (const c of cases) {
        const expectedFile = path.join(EXPECTED_DIR, c.name + ".json");
        const expected = loadJson(expectedFile);
        let status = "❓ no expected";
        let diffs = [];

        if (c.status === "error") {
            status = "💥 error";
        } else if (expected) {
            const cmp = compareResult(c.result, expected);
            status = cmp.passed ? "✅ pass" : "❌ fail";
            diffs = cmp.diffs;
            cmp.passed ? passed++ : failed++;
        }

        const issueRows = (c.result && c.result.issues || []).map(i =>
            `<tr><td>${i.id}</td><td>${escape(i.check)}</td><td>${escape(i.severity)}</td>` +
            `<td>${escape(i.message)}</td><td>${escape(i.preview)}</td><td>${i.autoFixable ? "✓" : ""}</td></tr>`
        ).join("");

        const detailId = "detail_" + c.name;
        rows.push(`
<tr>
  <td>${escape(c.name)}</td>
  <td>${status}</td>
  <td>${c.result ? c.result.issueCount : "—"}</td>
  <td>${diffs.length > 0 ? "<ul>" + diffs.map(d => `<li>${escape(d)}</li>`).join("") + "</ul>" : ""}</td>
  <td><button onclick="toggle('${detailId}')">Issues ▾</button></td>
</tr>
<tr id="${detailId}" style="display:none"><td colspan="5">
  <table border="1" cellpadding="4">
    <tr><th>#</th><th>check</th><th>severity</th><th>message</th><th>preview</th><th>autoFix</th></tr>
    ${issueRows || "<tr><td colspan=6>No issues</td></tr>"}
  </table>
</td></tr>`);
    }

    const timestamp = new Date().toISOString();
    return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>Figure QA Report</title>
<style>
  body { font-family: sans-serif; margin: 2em; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid #ccc; padding: 6px 10px; text-align: left; vertical-align: top; }
  th { background: #f0f0f0; }
  .summary { margin-bottom: 1.5em; }
</style>
</head>
<body>
<h1>Figure QA — Integration Test Report</h1>
<div class="summary">
  <strong>Generated:</strong> ${timestamp}<br>
  <strong>Passed:</strong> ${passed} &nbsp; <strong>Failed:</strong> ${failed} &nbsp; <strong>Total:</strong> ${cases.length}
</div>
<table>
  <tr><th>Case</th><th>Status</th><th>Issues</th><th>Diffs</th><th>Detail</th></tr>
  ${rows.join("\n")}
</table>
<script>
  function toggle(id) {
    var el = document.getElementById(id);
    el.style.display = el.style.display === "none" ? "" : "none";
  }
</script>
</body></html>`;
}

function main() {
    const runData = loadJson(RUN_RESULTS);
    if (!runData) {
        console.error("No run_results.json found. Run: npm run test:integration first.");
        process.exit(1);
    }
    const html = buildHtml(runData);
    fs.mkdirSync(REPORTS_DIR, { recursive: true });
    fs.writeFileSync(OUT_HTML, html, "utf8");
    console.log("Report written to " + path.relative(ROOT, OUT_HTML));
}

main();
