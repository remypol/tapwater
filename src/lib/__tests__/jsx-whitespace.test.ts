import { describe, it, expect, beforeAll } from "vitest";
import { createRequire } from "module";

// Next 16.2's SWC JSX transform dropped the leading space of any JSX text that
// both spans a line break and contains an HTML entity (&pound;, &mdash;, ...),
// so "<strong>Frizzlife PD600</strong> does 90% of\n ... &pound;{x}" shipped as
// "Frizzlife PD600does 90% of". 26 spots across the guides were affected. Fixed
// in Next 16.3; this compiles through the same SWC build `next build` uses so a
// downgrade or a regression in a future release fails here, not in production.
const require = createRequire(import.meta.url);
type Swc = {
  loadBindings: () => Promise<unknown>;
  transform: (src: string, opts: object) => Promise<{ code: string }>;
};
const swc: Swc = require("next/dist/build/swc/index.js");

async function childrenOf(jsx: string): Promise<string[]> {
  const { code } = await swc.transform(`const a = ${jsx};`, {
    filename: "x.tsx",
    jsc: {
      parser: { syntax: "typescript", tsx: true },
      transform: { react: { runtime: "automatic" } },
      target: "es2020",
    },
  });
  return [...code.matchAll(/^\s*("(?:[^"\\]|\\.)*"),?$/gm)].map((m) => JSON.parse(m[1]));
}

describe("JSX whitespace around entities", () => {
  beforeAll(async () => {
    await swc.loadBindings();
  });

  it("keeps the space after an element when the text wraps and has &pound;", async () => {
    const children = await childrenOf(`<p>
      the <strong>Frizzlife PD600</strong> does 90% of
      what the Waterdrop does for &pound;100 less.
    </p>`);
    expect(children).toContain(" does 90% of what the Waterdrop does for £100 less.");
  });

  it("keeps the space before an &mdash; on a wrapped line", async () => {
    const children = await childrenOf(`<li>
      <strong>PFAS</strong> &mdash; carbon filters reduce PFAS partially,
      but RO removes them
    </li>`);
    expect(children).toContain(" — carbon filters reduce PFAS partially, but RO removes them");
  });
});
