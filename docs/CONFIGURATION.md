# Configuration

Figure QA uses a layered configuration system. Settings are resolved in this order (later layers win):

```
default.json → journal preset → ~/.figure-qa/config.json → env FIGURE_QA_USER_CONFIG
```

## Config fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `allowedFontSizes` | `number[]` | `[5,6,7,8]` | Allowed font sizes in pt |
| `fontSizeTolerance` | `number` | `0.05` | ±pt tolerance for size matching |
| `allowedFontFamilies` | `string[]` | `["Arial","Arial MT"]` | Allowed font family names (style suffixes stripped) |
| `scaleTarget` | `number` | `100` | Target horizontal/vertical scale percentage |
| `scaleTolerance` | `number` | `0.1` | ±% tolerance for scale matching |
| `minRasterPPI` | `number` | `300` | Minimum effective PPI for raster/placed images |
| `highlightLayerName` | `string` | `"_QA_HIGHLIGHTS"` | Name of the non-printing overlay layer |
| `highlightStrokePt` | `number` | `1` | Stroke width of highlight rectangles in pt |
| `highlightPaddingPt` | `number` | `2` | Padding around each highlight rectangle in pt |
| `highlightColor` | `[R,G,B]` | `[255,0,0]` | RGB color (0–255) for highlight strokes |
| `checkEnabled.fontSize` | `boolean` | `true` | Enable/disable font-size check |
| `checkEnabled.fontFamily` | `boolean` | `true` | Enable/disable font-family check |
| `checkEnabled.scale` | `boolean` | `true` | Enable/disable scale check |
| `checkEnabled.lowResRaster` | `boolean` | `true` | Enable/disable raster PPI check |

## User override file

Copy `configs/user.example.json` to `~/.figure-qa/config.json` and edit.
All fields are optional — only provide what you want to override.

```json
{
  "journal": "nature",
  "allowedFontSizes": [7, 8]
}
```

To use a custom path for the override file:

```bash
export FIGURE_QA_USER_CONFIG=/path/to/my-overrides.json
```

## Selecting a journal at the CLI

```bash
FIGURE_QA_JOURNAL=nature npm run test:integration
```

## Disabling individual checks

```json
{
  "checkEnabled": {
    "lowResRaster": false
  }
}
```
