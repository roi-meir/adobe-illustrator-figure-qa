#!/usr/bin/env bash
# Install Figure QA into Adobe Illustrator's Scripts folder.
# Usage: bash scripts/install.sh [--year 2025]

set -euo pipefail

YEAR="${1:-}"
if [[ "$YEAR" == "--year" ]]; then YEAR="$2"; fi
if [[ -z "$YEAR" ]]; then YEAR="2025"; fi

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ILLUSTRATOR_APP=""

# Locate Illustrator app
for Y in "$YEAR" "2024" "2023"; do
    CANDIDATE="/Applications/Adobe Illustrator ${Y}/Adobe Illustrator.app"
    if [[ -d "$CANDIDATE" ]]; then
        ILLUSTRATOR_APP="$CANDIDATE"
        YEAR="$Y"
        break
    fi
done

if [[ -z "$ILLUSTRATOR_APP" ]]; then
    echo "ERROR: Could not find Adobe Illustrator in /Applications/."
    echo "  Tried years: ${YEAR} 2024 2023"
    echo "  Run: bash scripts/install.sh --year <year>"
    exit 1
fi

# Illustrator Scripts folder (user-level Presets)
SCRIPTS_FOLDER="${HOME}/Library/Application Support/Adobe/Adobe Illustrator ${YEAR}/en_US/Scripts"
mkdir -p "$SCRIPTS_FOLDER"

LINK_TARGET="${SCRIPTS_FOLDER}/figure_qa.jsx"
ILLUSTRATOR_LIB="${SCRIPTS_FOLDER}/figure_qa_lib"

# Symlink the main script
if [[ -L "$LINK_TARGET" ]]; then rm "$LINK_TARGET"; fi
ln -s "${REPO_ROOT}/illustrator/figure_qa.jsx" "$LINK_TARGET"

# Symlink the lib/ folder so #include resolves
if [[ -L "$ILLUSTRATOR_LIB" ]]; then rm "$ILLUSTRATOR_LIB"; fi
ln -s "${REPO_ROOT}/illustrator/lib" "$ILLUSTRATOR_LIB"

# Write install.path.txt so configLoader.jsx can resolve configs/
HINT_FILE="${REPO_ROOT}/illustrator/install.path.txt"
echo "$REPO_ROOT" > "$HINT_FILE"

echo ""
echo "✓ Installed to:"
echo "  ${LINK_TARGET}"
echo ""
echo "In Illustrator: File → Scripts → figure_qa"
echo "Or:             File → Scripts → Other Script… and pick the .jsx directly."
echo ""
echo "Illustrator must be restarted (or reloaded) for the Scripts menu to refresh."
