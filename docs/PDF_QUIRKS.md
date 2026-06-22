# PDF & Illustrator Quirks

## Empty font names on PDF import

When you open a PDF in Illustrator, text frames often have `textFont.name === ""`.
This is because PDF-imported text uses embedded font subsets; Illustrator may not map
them back to installed fonts.

**Behaviour:** `isAllowedFontFamily("", "", config)` returns `true` — empty names are
treated as allowed to avoid false positives.

**How to fix in your figure:** In Illustrator, select the text, choose the correct font
in the Character panel, and re-run Figure QA.

## PDF subset prefix (`ABCDEF+ArialMT`)

Embedded PDF fonts often carry a 6-letter uppercase prefix followed by `+`.
`stripPdfSubsetPrefix("ABCDEF+ArialMT")` returns `"ArialMT"` before comparison.

## GFKU errors when reading fonts

On some Illustrator versions, accessing `characterAttributes.textFont` on certain text
frames throws a JavaScript error with the message containing "GFKU". This is an internal
Illustrator error.

**Behaviour:** The font check wraps access in `try/catch`. A GFKU error causes the run
to return `{ isUnavailable: true }`, which is treated as allowed (same as empty font).

**Workaround:** Update Illustrator or flatten/re-create the affected text frames.

## Ghost text off the artboard

PDF-imported documents sometimes contain duplicate or ghost text frames positioned far
off the artboard. These are currently not filtered by artboard bounds — they are checked
and reported.

**Workaround:** Delete off-artboard text frames before running Figure QA, or add a user
config with `"checkEnabled": { "fontFamily": false }` for files with many such artefacts.

## Raster PPI detection

The effective PPI calculation divides pixel dimensions by the displayed size in inches
(using 72 pt/inch). For `PlacedItem`, pixel dimensions are read from the linked file via
`sips` on macOS. For `RasterItem` (embedded), the `item.image` property is used.

If neither source is available, the item is **skipped** (not flagged).

## Scale check on placed images

`PlacedItem.horizontalScale` and `verticalScale` reflect the scale applied in Illustrator,
not any scaling baked into the linked file. A placed image at 98% horizontal scale will be
flagged even if the underlying file has the correct resolution.
