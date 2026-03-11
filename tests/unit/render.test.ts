/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import * as tempModule from "temp";
import { describe, test, expect } from "vitest";
import { insertReadmeTable, renderOpenAPISchema } from "@lib/render.ts";
import Parameter from "@lib/parameter.ts";
import type { Config } from "@lib/types.ts";

const temp = tempModule.track();

const config: Config = {
  comments: { format: "#" },
  tags: {
    param: "@param",
    section: "@section",
    descriptionStart: "@descriptionStart",
    descriptionEnd: "@descriptionEnd",
    skip: "@skip",
    extra: "@extra",
  },
  modifiers: {
    array: "array",
    object: "object",
    string: "string",
    nullable: "nullable",
    default: "default",
  },
  regexp: { paramsSectionTitle: "Parameters" },
};

function writeTempReadme(content: string): string {
  const file = temp.path({ suffix: ".md" });
  fs.writeFileSync(file, content);
  return file;
}

function makeSection(
  name: string,
  params: Parameter[],
  description = "",
  level?: number,
): { name: string; description: string; parameters: Parameter[]; level?: number } {
  return { name, description, parameters: params, level };
}

function makeParam(name: string, description = "", value: unknown = ""): Parameter {
  const p = new Parameter(name);
  p.description = description;
  p.value = value as (typeof p)["value"];
  p.type = "string";
  return p;
}

describe("insertReadmeTable", () => {
  test("throws when README has no Parameters section", () => {
    // Covers line 157: throw new Error("ERROR: error getting current Parameters section from README")
    const file = writeTempReadme("# My Chart\n\nSome content without a parameters section.\n");
    const sections = [makeSection("General", [])];
    expect(() => insertReadmeTable(file, sections, config)).toThrow(
      "ERROR: error getting current Parameters section from README",
    );
    temp.cleanupSync();
  });

  test("inserts table into a fresh Parameters section (no existing table)", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("key.value", "A value", "hello");
    const sections = [makeSection("Config", [p])];
    insertReadmeTable(file, sections, config);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("key.value");
    expect(result).toContain("A value");
    temp.cleanupSync();
  });

  test("replaces an existing table in the Parameters section", () => {
    const existingContent = [
      "# Chart",
      "",
      "## Parameters",
      "",
      "| Name | Description | Value |",
      "| --- | --- | --- |",
      "| `old.key` | Old description | `old` |",
      "",
    ].join("\n");
    const file = writeTempReadme(existingContent);
    const p = makeParam("new.key", "New description", "new");
    const sections = [makeSection("Config", [p])];
    insertReadmeTable(file, sections, config);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("new.key");
    expect(result).not.toContain("old.key");
    temp.cleanupSync();
  });

  test("handles Parameters section that is not the last section", () => {
    const content = [
      "# Chart",
      "",
      "## Parameters",
      "",
      "## Other Section",
      "",
      "Some text.",
    ].join("\n");
    const file = writeTempReadme(content);
    const p = makeParam("my.param", "Desc", "val");
    const sections = [makeSection("Config", [p])];
    insertReadmeTable(file, sections, config);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("my.param");
    expect(result).toContain("## Other Section");
    temp.cleanupSync();
  });

  test("renders subsection with deeper heading level", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("sub.key", "A sub key", "value");
    const sections = [makeSection("Main", [], "", 0), makeSection("Sub", [p], "", 1)];
    insertReadmeTable(file, sections, config);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("#### Sub"); // ## + # (level 0 gets ###, level 1 gets ####)
    temp.cleanupSync();
  });
});

describe("renderOpenAPISchema", () => {
  test("writes a valid JSON schema file", () => {
    const file = temp.path({ suffix: ".json" });
    const p = makeParam("key", "A key", "hello");
    p.type = "string";
    renderOpenAPISchema(file, [p], config);
    const result = JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, unknown>;
    expect(result.title).toBe("Chart Values");
    expect(result.type).toBe("object");
    temp.cleanupSync();
  });

  test("throws when a non-nullable nil value is present", () => {
    const file = temp.path({ suffix: ".json" });
    const p = makeParam("nilKey", "Nil key", "nil");
    p.type = "null";
    p.modifiers = []; // not nullable
    expect(() => renderOpenAPISchema(file, [p], config)).toThrow("Invalid type 'nil'");
    temp.cleanupSync();
  });
});
