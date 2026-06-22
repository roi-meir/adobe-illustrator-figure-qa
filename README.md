# adobe-illustrator-figure-qa

An Adobe Illustrator ExtendScript utility that checks figures for common submission errors:

- **Font size** — flags text outside allowed pt sizes (default: 5–8 pt)
- **Font family** — flags non-approved fonts (default: Arial / Arial MT)
- **Scale** — flags text or images with non-100% horizontal/vertical scale (auto-fixable)
- **Raster PPI** — flags embedded or linked images below the minimum resolution (default: 300 PPI)

Issues are highlighted on a non-printing `_QA_HIGHLIGHTS` layer. A ScriptUI panel lets you
review, fix, skip, export a JSON report, and re-scan.

---

## Quick start

### 1. Install

```bash
git clone https://github.com/roi-meir/adobe-illustrator-figure-qa.git
cd adobe-illustrator-figure-qa
npm install
npm run build
bash scripts/install.sh   # symlinks into Illustrator's Scripts folder
```

Restart Adobe Illustrator. The script appears under **File → Scripts → figure_qa**.

Or run without installing: **File → Scripts → Other Script…** and pick `illustrator/figure_qa.jsx`.

### 2. Run on a figure

1. Open your `.ai` file in Illustrator.
2. **File → Scripts → figure_qa**
3. If issues are found, red highlight boxes appear on the `_QA_HIGHLIGHTS` layer.
4. The QA panel lists all issues. Use:
   - **Fix Selected** — apply auto-fix to the selected issue
   - **Fix All Auto** — fix all scale issues in one step
   - **Skip** — dismiss an issue without fixing
   - **Export Report** — save `<filename>.figure-qa.json` beside the `.ai` file
   - **Re-scan** — re-run all checks after manual edits
   - **Clear Highlights** — remove the overlay layer

---

## Journal presets

Journals define per-publication rules. The default preset is used unless overridden.

| Preset | Sizes | Families | Min PPI |
|--------|-------|----------|---------|
| `default` | 5–8 pt | Arial, Arial MT | 300 |
| `nature` | 7–8 pt | Arial, Arial MT, Helvetica, Helvetica Neue | 300 |
| `cell` | 6–8 pt | Arial, Arial MT | 300 |

**Set your journal** by creating `~/.figure-qa/config.json`:

```json
{ "journal": "nature" }
```

See [docs/JOURNALS.md](docs/JOURNALS.md) to add custom presets.

---

## Configuration

All settings are in `configs/journals/default.json` and can be overridden per journal
or via `~/.figure-qa/config.json`. See [docs/CONFIGURATION.md](docs/CONFIGURATION.md).

---

## Running tests

```bash
npm test                   # build + Node unit tests (no Illustrator needed)
npm run test:integration   # macOS + Illustrator running required
```

See [docs/TESTING.md](docs/TESTING.md).

---

## Known PDF/Illustrator quirks

See [docs/PDF_QUIRKS.md](docs/PDF_QUIRKS.md) for empty font names, GFKU errors,
ghost text off the artboard, and raster PPI edge cases.

---

## Contributing

1. Fork and create a branch.
2. Add/modify core logic in `core/*.js` with matching unit tests in `tests/unit/`.
3. Run `npm test` — all tests must pass.
4. Open a pull request.

See [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) for architecture details.

---

## Roadmap

- Journal preset dropdown in the ScriptUI panel
- HTML export directly from the panel
- Windows CLI (VBScript/COM instead of AppleScript)
- Self-hosted CI runner with Illustrator for integration tests
- Stroke / hairline checks
- RGB vs CMYK detection
- Outlined-text detection
- "Round font size to nearest allowed" semi-auto fix
