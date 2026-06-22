# Journal Presets

A journal preset is a named JSON file in `configs/journals/` that extends the `default` preset
with journal-specific rules.

## Built-in presets

| Preset | Sizes (pt) | Families | Min PPI |
|--------|-----------|----------|---------|
| `default` | 5, 6, 7, 8 | Arial, Arial MT | 300 |
| `nature` | 7, 8 | Arial, Arial MT, Helvetica, Helvetica Neue | 300 |
| `cell` | 6, 7, 8 | Arial, Arial MT | 300 |

## Adding a new preset

1. Create `configs/journals/<name>.json`:

```json
{
  "name": "science",
  "extends": "default",
  "allowedFontSizes": [6, 7, 8],
  "allowedFontFamilies": ["Arial", "Arial MT", "Helvetica"]
}
```

2. Only include fields that differ from `default`.
3. Run `npm run build` — the build validates all presets against `configs/schema.json`.

## Field reference

See [CONFIGURATION.md](CONFIGURATION.md) for the full field reference.

## Selecting a preset

- **CLI / tests:** set `"journal": "science"` in `~/.figure-qa/config.json`,
  or pass `FIGURE_QA_JOURNAL=science` as an environment variable (see `run-tests.sh`).
- **Illustrator panel (v1):** the panel uses whatever `loadQAConfig()` returns.
  A dropdown selector is planned for v1.1.
