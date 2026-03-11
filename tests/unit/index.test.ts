/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import * as tempModule from "temp";
import { describe, test, expect } from "vitest";
import runReadmeGenerator from "../../index.ts";

const temp = tempModule.track();

// Path to the test values fixture used by integration tests
const __dirname = import.meta.dirname;
const testValuesPath = `${__dirname}/../assets/test-values.yaml`;

describe("runReadmeGenerator", () => {
  test("logs version and returns when version flag is true", () => {
    // Covers index.ts line 40: console.log("Version:", version)
    const logs: unknown[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args);
    try {
      runReadmeGenerator({ version: true });
    } finally {
      console.log = originalLog;
    }
    const versionLog = logs.find(
      (entry) => Array.isArray(entry) && (entry as unknown[])[0] === "Version:",
    );
    expect(versionLog).toBeDefined();
  });

  test("throws when neither readme nor schema option is provided", () => {
    // Covers index.ts line 43: throw new Error("Nothing to do. Please provide...")
    expect(() => runReadmeGenerator({})).toThrow(
      "Nothing to do. Please provide the --readme or --schema options.",
    );
  });

  test("throws when readme is provided but values option is missing", () => {
    // Covers index.ts line 46: throw new Error("Nothing to do. You must provide the --values option")
    expect(() => runReadmeGenerator({ readme: "/some/path/README.md" })).toThrow(
      "Nothing to do. You must provide the --values option",
    );
  });

  test("throws when schema is provided but values option is missing", () => {
    expect(() => runReadmeGenerator({ schema: "/some/path/schema.json" })).toThrow(
      "Nothing to do. You must provide the --values option",
    );
  });

  test("successfully updates README when valid options are provided", () => {
    const tempFile = temp.path({ prefix: "readme-index-unit" });
    fs.writeFileSync(tempFile, "# Chart\n\n## Parameters\n");
    runReadmeGenerator({ readme: tempFile, values: testValuesPath });
    const result = fs.readFileSync(tempFile, "utf-8");
    expect(result).toContain("## Parameters");
    temp.cleanupSync();
  });
});
