import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import * as tempModule from "temp";
import { test, expect, beforeAll } from "vitest";

// Initialize temp package
const temp = tempModule.track();

const __dirname = import.meta.dirname;
const assetsDir = path.resolve(__dirname, "../assets");
const binPath = path.resolve(__dirname, "../../bin/index.ts");

function runCLI(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("bun", ["run", binPath, ...args], { encoding: "utf8" });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? 1,
  };
}

function copyToTemp(srcPath: string): string {
  const dest = temp.path({ suffix: path.extname(srcPath) });
  fs.copyFileSync(srcPath, dest);
  return dest;
}

beforeAll(() => {
  temp.track();
});

test("--version prints version and exits 0", () => {
  const { stdout, exitCode } = runCLI(["--version"]);
  expect(exitCode).toBe(0);
  expect(stdout).toMatch(/Version: \d+\.\d+\.\d+/);
});

test("exits non-zero and errors when no options are provided", () => {
  const { exitCode } = runCLI([]);
  expect(exitCode).not.toBe(0);
});

test("exits non-zero when --readme is given but --values is missing", () => {
  const { exitCode } = runCLI(["--readme", "README.md"]);
  expect(exitCode).not.toBe(0);
});

test("exits non-zero when --schema is given but --values is missing", () => {
  const { exitCode } = runCLI(["--schema", "schema.json"]);
  expect(exitCode).not.toBe(0);
});

test("generates README table from first execution (empty Parameters section)", () => {
  const tempFile = temp.path({ suffix: ".md" });
  fs.writeFileSync(tempFile, "# Example\r\n\n## Parameters");

  const { exitCode } = runCLI([
    "--readme", tempFile,
    "--values", path.join(assetsDir, "test-values.yaml"),
  ]);

  expect(exitCode).toBe(0);
  expect(fs.readFileSync(tempFile)).toEqual(
    fs.readFileSync(path.join(assetsDir, "expected-readme.first-execution.md")),
  );
});

test("updates existing README with parameters table", () => {
  const tempReadme = copyToTemp(path.join(assetsDir, "test-readme.md"));

  const { exitCode } = runCLI([
    "--readme", tempReadme,
    "--values", path.join(assetsDir, "test-values.yaml"),
  ]);

  expect(exitCode).toBe(0);
  expect(fs.readFileSync(tempReadme)).toEqual(
    fs.readFileSync(path.join(assetsDir, "expected-readme.md")),
  );
});

test("updates README when Parameters is the last section", () => {
  const tempReadme = copyToTemp(path.join(assetsDir, "test-readme.last-section.md"));

  const { exitCode } = runCLI([
    "--readme", tempReadme,
    "--values", path.join(assetsDir, "test-values.yaml"),
  ]);

  expect(exitCode).toBe(0);
  expect(fs.readFileSync(tempReadme)).toEqual(
    fs.readFileSync(path.join(assetsDir, "expected-readme.last-section.md")),
  );
});

test("updates README when Parameters is last section but has text below", () => {
  const tempReadme = copyToTemp(path.join(assetsDir, "test-readme.last-section-text-below.md"));

  const { exitCode } = runCLI([
    "--readme", tempReadme,
    "--values", path.join(assetsDir, "test-values.yaml"),
  ]);

  expect(exitCode).toBe(0);
  expect(fs.readFileSync(tempReadme)).toEqual(
    fs.readFileSync(path.join(assetsDir, "expected-readme.last-section-text-below.md")),
  );
});

test("generates OpenAPI schema file", () => {
  const tempSchema = copyToTemp(path.join(assetsDir, "test-schema.json"));

  const { exitCode } = runCLI([
    "--schema", tempSchema,
    "--values", path.join(assetsDir, "test-values.yaml"),
  ]);

  expect(exitCode).toBe(0);
  expect(fs.readFileSync(tempSchema)).toEqual(
    fs.readFileSync(path.join(assetsDir, "expected-schema.json")),
  );
});

test("uses custom --config file", () => {
  const tempReadme = copyToTemp(path.join(assetsDir, "test-readme.config.md"));

  const { exitCode } = runCLI([
    "--readme", tempReadme,
    "--values", path.join(assetsDir, "test-values.yaml"),
    "--config", path.join(assetsDir, "test-config.json"),
  ]);

  expect(exitCode).toBe(0);
  expect(fs.readFileSync(tempReadme)).toEqual(
    fs.readFileSync(path.join(assetsDir, "expected-readme.config.md")),
  );
});

test("generates README with subsection metadata", () => {
  const tempFile = temp.path({ suffix: ".md" });
  fs.writeFileSync(tempFile, "# Example\r\n\n## Parameters");

  const { exitCode } = runCLI([
    "--readme", tempFile,
    "--values", path.join(assetsDir, "test-values.subsection.yaml"),
  ]);

  expect(exitCode).toBe(0);
  expect(fs.readFileSync(tempFile)).toEqual(
    fs.readFileSync(path.join(assetsDir, "expected-readme.subsection.md")),
  );
});

test("uses anchor-based README replacement via --config", () => {
  const tempReadme = copyToTemp(path.join(assetsDir, "test-readme-anchor.md"));

  const { exitCode } = runCLI([
    "--readme", tempReadme,
    "--values", path.join(assetsDir, "test-values.yaml"),
    "--config", path.join(assetsDir, "test-config-anchor.json"),
  ]);

  expect(exitCode).toBe(0);
  const result = fs.readFileSync(tempReadme, "utf8");
  expect(result).toContain("<!--readme-generateor-->");
  expect(result).toContain("<!--end-readme-generateor-->");
  expect(result).toContain("image.registry");
  expect(result).not.toContain("stale generated content");
});
