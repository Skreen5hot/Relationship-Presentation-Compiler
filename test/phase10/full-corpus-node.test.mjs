import assert from "node:assert/strict";
import test from "node:test";

import { parseJsonBytes } from "../../src/core/json-scan.js";
import { verifyDistributionArtifacts } from "../../src/core/verify-distribution.js";
import { buildConformanceCorpus } from "./conformance-corpus.mjs";

const { compileCore } = await import(
  "../../browser/relationship-presentation-core.bundle.mjs"
);

test("the complete positive and Section 46 corpus has its documented outcome", async (t) => {
  const corpus = await buildConformanceCorpus();
  assert.equal(corpus.length, 85);
  assert.equal(
    corpus.filter((entry) => entry.expected === "success").length,
    20,
  );
  assert.equal(
    corpus.filter((entry) => entry.expected !== "success").length,
    65,
  );
  for (const entry of corpus) {
    await t.test(entry.name, async () => {
      const result = await compileCore(entry.coreRequest);
      if (entry.expected === "success") {
        assert.equal(result.status, "success");
        await verifyDistributionArtifacts(result.artifacts);
        return;
      }
      assert.equal(result.status, "error");
      assert.equal(result.code, entry.expected);
      assert.equal(
        result.statusLine,
        `status=error code=${entry.expected}\n`,
      );
      const report = parseJsonBytes(result.errorReport).value;
      assert.equal(report.errorVersion, "error-report-v1.0");
      assert.equal(report.code, entry.expected);
    });
  }
});
