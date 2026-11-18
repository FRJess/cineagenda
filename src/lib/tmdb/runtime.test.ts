import { describe, expect, it } from "vitest";
import { details, tr } from "@/test/tmdb-fixtures";
import { runtimeOf } from "./runtime";

describe("runtimeOf", () => {
  it("uses the film's own running time", () => {
    const film = details({
      runtime: 99,
      translations: { translations: [tr("it", "IT", { runtime: 50 })] },
    });

    expect(runtimeOf(film)).toBe(99);
  });

  it("falls back to the first translation with a running time", () => {
    // TMDB id 1826483: runtime 0, 50 minutes on the Italian translation only.
    const film = details({
      runtime: 0,
      translations: {
        translations: [tr("en", "US", { runtime: 0 }), tr("it", "IT", { runtime: 50 })],
      },
    });

    expect(runtimeOf(film)).toBe(50);
  });

  it("is null when no page has one", () => {
    expect(runtimeOf(details({ runtime: null }))).toBeNull();
    expect(runtimeOf(details({ translations: { translations: [tr("it", "IT", {})] } }))).toBeNull();
  });
});
