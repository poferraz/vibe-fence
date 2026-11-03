/**
 * src/framework/sam-guard.test.ts — SAM comma-guard contract test (GEM-07)
 * S-13/GEM-07: SAM_SINGLE_CONCEPT_VIOLATION — comma in concept throws.
 * S-14 deterministic fence decides; SAM is geometry not semantics; out-of-critical-path.
 *
 * Run: bun test src/framework/sam-guard.test.ts
 * CI: fails if comma-guard is missing or SAM accepts multi-concept strings.
 */

import { describe, it, expect } from "bun:test";
import { assertSingleConcept, callSam, SamSingleConceptViolation } from "./sam";

describe("SAM contract — GEM-07 one-concept-per-request (S-13/S-14/GEM-07/08/09)", () => {
  it("throws SAM_SINGLE_CONCEPT_VIOLATION when concept contains a comma", () => {
    expect(() => assertSingleConcept("navbar, sidebar")).toThrow(SamSingleConceptViolation);
    expect(() => assertSingleConcept("button, card")).toThrow(SamSingleConceptViolation);
    expect(() => assertSingleConcept("a,b")).toThrow(SamSingleConceptViolation);
    // Error message must contain code so CI grep works
    expect(() => assertSingleConcept("navbar, sidebar")).toThrow("SAM_SINGLE_CONCEPT_VIOLATION");
  });

  it("does not throw for single clean concepts", () => {
    expect(() => assertSingleConcept("button")).not.toThrow();
    expect(() => assertSingleConcept("navbar")).not.toThrow();
    expect(() => assertSingleConcept("checkout button")).not.toThrow();
    expect(() => assertSingleConcept("hero image")).not.toThrow();
  });

  it("callSam rejects comma concepts with SAM_SINGLE_CONCEPT_VIOLATION (fail-closed on contract)", async () => {
    await expect(callSam({ imagePath: "/tmp/mock.png", concept: "navbar, sidebar", task: "click-to-teach" })).rejects.toThrow(SamSingleConceptViolation);
    await expect(callSam({ imagePath: "/tmp/mock.png", concept: "navbar, sidebar", task: "click-to-teach" })).rejects.toThrow("SAM_SINGLE_CONCEPT_VIOLATION");
  });

  it("error code is stable for harness detection (GEM-07)", () => {
    let caught: unknown;
    try { assertSingleConcept("a,b"); } catch (e) { caught = e; }
    expect(caught).toBeInstanceOf(SamSingleConceptViolation);
    expect((caught as SamSingleConceptViolation).code).toBe("SAM_SINGLE_CONCEPT_VIOLATION");
    expect((caught as SamSingleConceptViolation).name).toBe("SamSingleConceptViolation");
  });

  it("empty concept throws same violation class", () => {
    expect(() => assertSingleConcept("   ")).toThrow(SamSingleConceptViolation);
  });
});
