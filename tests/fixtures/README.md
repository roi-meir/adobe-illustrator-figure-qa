# Test Fixtures

This folder holds small committed `.ai` fixture files for integration tests.

## Adding a local fixture from Downloads

To run the integration tests against `~/Downloads/Test.ai`:

```bash
FIGURE_QA_FIXTURE=~/Downloads/Test.ai npm run test:integration
```

If you want to commit expected issue counts for that fixture, add a file at:

```
tests/integration/expected/local_test_ai.json
```

with the same schema as other expected files:

```json
{
  "issueCount": { "min": 1 },
  "checks": {
    "fontSize": { "min": 2 }
  }
}
```

This file can be gitignored (private fixture) or committed (if the figure is anonymized / synthetic).

## Keeping fixtures small

Commit only files generated programmatically in ExtendScript or stripped-down single-layer figures.
Avoid committing full production figures with embedded fonts or proprietary content.
