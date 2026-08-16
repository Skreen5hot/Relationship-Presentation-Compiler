# Vendored ontology evidence

These files are release evidence for the Node host. They are not runtime
imports, are not core inputs, and are not included in the browser bundle.

| Local file | Upstream repository path | Pinned commit | Git blob |
|---|---|---|---|
| `bfo-core.ttl` | `BFO-ontology/BFO-2020:src/owl/bfo-core.ttl` | `044490fc5100ffed6df7d4d15cbc167698b6fdee` | `768c070a9075613f157be0811028ade83d318891` |
| `AgentOntology.ttl` | `CommonCoreOntology/CommonCoreOntologies:src/cco-modules/AgentOntology.ttl` | `510dad76be0ef710b65a421075af912af25342b7` | `0a24b3fd3b04d3b5dd456ef74216225b02a44054` |
| `InformationEntityOntology.ttl` | `CommonCoreOntology/CommonCoreOntologies:src/cco-modules/InformationEntityOntology.ttl` | `510dad76be0ef710b65a421075af912af25342b7` | `4728723e8b6854115a3b00cbd07c1c9424708635` |

The BFO file declares CC BY 4.0 in its ontology header. The CCO files declare
the BSD 3-Clause license in their ontology headers; the pinned upstream license
text is preserved at `licenses/CCO-BSD-3-Clause.txt` (Git blob
`26826d5784bbeda05e196f4c7538b30b85544b92`). Exact file hashes and the two
intentionally unusual version IRIs are enforced by `ontology.lock.json` and the
Phase 1 tests.
