# Testing

Figure QA has two test layers.

## Layer 1 — Node unit tests (CI-safe)

```bash
npm test          # build + unit tests
npm run test:unit # unit tests only (no build step)
```

Tests live in `tests/unit/`. They cover:
- `bounds.test.js` — bounds parsing, padding, merging
- `config.test.js` — config merge, validation, preset chain
- `fontRules.test.js` — font family matching, PDF subset stripping
- `sizeRules.test.js` — font size matching with tolerance

These run in Node (via Vitest) with no Illustrator required and are executed by GitHub Actions
on every push.

## Layer 2 — Illustrator integration tests (macOS only)

```bash
npm run test:integration
```

Requirements:
- macOS
- Adobe Illustrator 2024 or 2025 running (not just installed)

What it does:
1. Builds `core.generated.jsx`
2. Runs Node unit tests
3. Sends `tests/integration/run.jsx` to Illustrator via AppleScript
4. Illustrator creates synthetic documents, runs `collectAllIssues`, writes per-case JSON to `tests/reports/`
5. Node generates `tests/reports/report.html` comparing actual vs expected

## Adding a new integration test case

1. Add a case manifest to `tests/integration/cases/<name>.json`:

```json
{
  "name": "synthetic_fail_family",
  "description": "Helvetica text should trigger fontFamily issues.",
  "journal": "default",
  "setup": {
    "textFrames": [
      { "contents": "Bad font", "size": 7, "font": "Helvetica", "hScale": 100, "vScale": 100 }
    ]
  }
}
```

2. Add the expected result to `tests/integration/expected/<name>.json`:

```json
{
  "issueCount": { "min": 1 },
  "checks": {
    "fontFamily": { "min": 1 }
  }
}
```

3. Run `npm run test:integration` and check `tests/reports/report.html`.

## Reading the HTML report

Open `tests/reports/report.html` in a browser. Each row shows:
- **Status:** ✅ pass / ❌ fail / 💥 error
- **Issues found:** total issue count
- **Diffs:** what didn't match the expected file
- **Detail:** expand to see the full issue list
