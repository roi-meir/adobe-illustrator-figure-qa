#!/usr/bin/env bash
# Full test orchestrator: build → unit → integration (macOS + Illustrator required).
# Usage: npm run test:integration
#        FIGURE_QA_JOURNAL=nature npm run test:integration
#        FIGURE_QA_FIXTURE=~/Downloads/Test.ai npm run test:integration

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── 1. Build core.generated.jsx ───────────────────────────────────────────────
echo "==> Building…"
node scripts/build.js

# ── 2. Unit tests ────────────────────────────────────────────────────────────
echo "==> Unit tests…"
npx vitest run

# ── 3. Integration tests (macOS only) ────────────────────────────────────────
if [[ "$(uname)" != "Darwin" ]]; then
    echo "SKIP: Integration tests require macOS + Adobe Illustrator."
    exit 0
fi

if ! osascript -e 'tell application "System Events" to (name of processes) contains "Adobe Illustrator"' 2>/dev/null | grep -q true; then
    echo "SKIP: Adobe Illustrator is not running."
    echo "  Start Illustrator, then re-run: npm run test:integration"
    exit 0
fi

echo "==> Integration tests (Illustrator)…"
RUN_JSX="${REPO_ROOT}/tests/integration/run.jsx"
osascript -e "tell application \"Adobe Illustrator\" to do javascript file \"${RUN_JSX}\""

echo "==> Generating HTML report…"
node scripts/lib/report-html.js

echo ""
echo "Report: tests/reports/report.html"
echo "Done."
