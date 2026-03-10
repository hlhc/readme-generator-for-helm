import { rm, cp, chmod } from "node:fs/promises";
import { join } from "node:path";

const rootDir = import.meta.dirname + "/..";
const distDir = join(rootDir, "dist");

// Clean dist
await rm(distDir, { recursive: true, force: true });

// Build all entrypoints
await Bun.build({
  entrypoints: [join(rootDir, "index.ts"), join(rootDir, "bin/index.ts")],
  outdir: distDir,
  target: "node",
  format: "esm",
  splitting: true,
  external: ["commander", "markdown-table", "yaml"],
});

// Copy config.json into dist so runtime can find it
await cp(join(rootDir, "config.json"), join(distDir, "config.json"));

// Ensure the published CLI is directly executable by Node.
const cliPath = join(distDir, "bin/index.js");
const cliContent = await Bun.file(cliPath).text();
const normalizedCliContent = cliContent.startsWith("#!/")
  ? cliContent.replace(/^#!.*\n/, "")
  : cliContent;
await Bun.write(cliPath, `#!/usr/bin/env node\n${normalizedCliContent}`);
await chmod(cliPath, 0o755);

console.log("Build complete → dist/");
