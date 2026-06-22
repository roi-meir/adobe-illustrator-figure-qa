# Development

## Setup

```bash
git clone https://github.com/roi-meir/adobe-illustrator-figure-qa.git
cd adobe-illustrator-figure-qa
npm install
npm run build
npm test
```

## Architecture

```
core/              Node-testable ES5 modules (pure logic, no DOM)
configs/           JSON journal presets + JSON Schema
illustrator/       ExtendScript (Illustrator DOM layer)
  lib/
    core.generated.jsx   ← built from core/*.js (do not edit)
    configLoader.jsx     reads JSON presets + user override
    dom/                 Illustrator-specific checks/highlight/fix/panel
scripts/           Build + install + test orchestration (Node)
tests/
  unit/            Vitest tests for core/
  integration/     ExtendScript integration runner + expected outputs
  reports/         Generated (gitignored)
docs/              This folder
```

## Build pipeline

`scripts/build.js` does two things:

1. **Concatenate** `core/*.js` → `illustrator/lib/core.generated.jsx`
   Strips the `if (typeof module !== 'undefined') { module.exports = ... }` guards
   so the file is valid ExtendScript.

2. **Validate** `configs/journals/*.json` against `configs/schema.json` using `ajv`.
   Build fails on schema errors.

Run before every release:

```bash
npm run build
```

## Adding a core function

1. Add to the relevant `core/*.js` file.
2. Export it in the `module.exports` object at the bottom of the file.
3. Add a unit test in `tests/unit/`.
4. Run `npm run build` to regenerate `core.generated.jsx`.
5. Reference the function from `illustrator/lib/dom/*.jsx` using the global name.

## ExtendScript quirks

- No `import`/`export` — use `#include` (already set up in `figure_qa.jsx`).
- `JSON.parse` is not available in older engines — use `eval("(" + content + ")")` for trusted files.
- `Array.isArray` is available in modern ExtendScript (CS6+) but not ES3; safe to use.
- `$.fileName` gives the path of the currently executing script — useful for path resolution.
- `new File(path).fsName` returns the platform path; `path` may be a URI on some versions.
