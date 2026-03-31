/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import * as tempModule from "temp";
import { describe, test, expect } from "vitest";
import { parseMetadataComments, createValuesObject } from "@lib/parser.ts";
import type { Config } from "@lib/types.ts";

const temp = tempModule.track();

const config: Config = {
  comments: { format: "#" },
  readme: { paramsSectionTitle: "Parameters" },
  tags: {
    param: "@param",
    section: "@section",
    descriptionStart: "@descriptionStart",
    descriptionEnd: "@descriptionEnd",
    skip: "@skip",
    extra: "@extra",
  },
  modifiers: {
    default: "default",
  },
};

function writeTempYaml(content: string): string {
  const file = temp.path({ suffix: ".yaml" });
  fs.writeFileSync(file, content);
  return file;
}

describe("parseMetadataComments", () => {
  test("parses a section tag", () => {
    const file = writeTempYaml("# @section My Section\n");
    const metadata = parseMetadataComments(file, config);
    expect(metadata.sections).toHaveLength(1);
    expect(metadata.sections[0].name).toBe("My Section");
    temp.cleanupSync();
  });

  test("parses a param tag inside a section", () => {
    const file = writeTempYaml(
      ["# @section Config", "# @param key.value Description text", "key:", "  value: hello"].join(
        "\n",
      ),
    );
    const metadata = parseMetadataComments(file, config);
    expect(metadata.parameters).toHaveLength(1);
    expect(metadata.parameters[0].name).toBe("key.value");
    expect(metadata.parameters[0].description).toBe("Description text");
    expect(metadata.parameters[0].section).toBe("Config");
    temp.cleanupSync();
  });

  test("parses a param tag with array type annotation", () => {
    const file = writeTempYaml("# @section S\n# @param {string[]} arr An array\n");
    const metadata = parseMetadataComments(file, config);
    expect(metadata.parameters[0].typeAnnotation).toBe("string[]");
    temp.cleanupSync();
  });

  test("parses a nullable type annotation {?}", () => {
    const file = writeTempYaml("# @section S\n# @param {?} nul Nullable param\n");
    const metadata = parseMetadataComments(file, config);
    expect(metadata.parameters[0].name).toBe("nul");
    expect(metadata.parameters[0].nullable).toBe(true);
    expect(metadata.parameters[0].description).toBe("Nullable param");
    temp.cleanupSync();
  });

  test("parses a nullable type annotation {string?}", () => {
    const file = writeTempYaml("# @section S\n# @param {string?} val Nullable string\n");
    const metadata = parseMetadataComments(file, config);
    expect(metadata.parameters[0].typeAnnotation).toBe("string");
    expect(metadata.parameters[0].nullable).toBe(true);
    temp.cleanupSync();
  });

  test("parses a default value override [default=value]", () => {
    const file = writeTempYaml("# @section S\n# @param key [default=MY_DEFAULT] Description\nkey: real\n");
    const metadata = parseMetadataComments(file, config);
    expect(metadata.parameters[0].name).toBe("key");
    expect(metadata.parameters[0].defaultOverride).toBe("MY_DEFAULT");
    expect(metadata.parameters[0].description).toBe("Description");
    temp.cleanupSync();
  });

  test("parses type annotation with default value override", () => {
    const file = writeTempYaml(
      "# @section S\n# @param {string} key [default=FALLBACK] Description\nkey: real\n",
    );
    const metadata = parseMetadataComments(file, config);
    expect(metadata.parameters[0].name).toBe("key");
    expect(metadata.parameters[0].typeAnnotation).toBe("string");
    expect(metadata.parameters[0].defaultOverride).toBe("FALLBACK");
    temp.cleanupSync();
  });

  test("parses param with no type annotation (plain name)", () => {
    const file = writeTempYaml("# @section S\n# @param plain.name Simple desc\nplain:\n  name: v\n");
    const metadata = parseMetadataComments(file, config);
    expect(metadata.parameters[0].name).toBe("plain.name");
    expect(metadata.parameters[0].typeAnnotation).toBe("");
    expect(metadata.parameters[0].nullable).toBe(false);
    expect(metadata.parameters[0].defaultOverride).toBeUndefined();
    expect(metadata.parameters[0].description).toBe("Simple desc");
    temp.cleanupSync();
  });

  test("parses a skip tag", () => {
    const file = writeTempYaml("# @section S\n# @skip skipMe\n");
    const metadata = parseMetadataComments(file, config);
    const skipParam = metadata.parameters.find((p) => p.name === "skipMe");
    expect(skipParam).toBeDefined();
    expect(skipParam?.skip).toBe(true);
    temp.cleanupSync();
  });

  test("parses an extra tag", () => {
    const file = writeTempYaml("# @section S\n# @extra extraKey Extra description\n");
    const metadata = parseMetadataComments(file, config);
    const extraParam = metadata.parameters.find((p) => p.name === "extraKey");
    expect(extraParam).toBeDefined();
    expect(extraParam?.extra).toBe(true);
    expect(extraParam?.description).toBe("Extra description");
    temp.cleanupSync();
  });

  test("parses section description between start/end tags", () => {
    const file = writeTempYaml(
      [
        "# @section Desc Section",
        "# @descriptionStart Some description line",
        "# continued here",
        "# @descriptionEnd",
      ].join("\n"),
    );
    const metadata = parseMetadataComments(file, config);
    expect(metadata.sections[0].descriptionLines).toContain("Some description line");
    expect(metadata.sections[0].descriptionLines).toContain("continued here");
    temp.cleanupSync();
  });

  test("parses a subsection tag when configured", () => {
    const configWithSubsection: Config = {
      ...config,
      tags: { ...config.tags, subsection: "@subsection" },
    };
    const file = writeTempYaml(
      "# @section Main\n# @subsection Sub Section\n# @param k Desc\nk: v\n",
    );
    const metadata = parseMetadataComments(file, configWithSubsection);
    const sub = metadata.sections.find((s) => s.name === "Sub Section");
    expect(sub).toBeDefined();
    expect(sub?.level).toBe(1);
    temp.cleanupSync();
  });

  test("ignores subsection tag when subsection config is absent", () => {
    const file = writeTempYaml("# @section Main\n# @subsection Sub\n");
    const metadata = parseMetadataComments(file, config); // no subsection tag in config
    // Only the main section should be found; @subsection treated as plain comment
    expect(metadata.sections).toHaveLength(1);
    temp.cleanupSync();
  });
});

describe("createValuesObject", () => {
  test("returns flat parameters for a simple YAML", () => {
    const file = writeTempYaml("key: value\n");
    const result = createValuesObject(file);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("key");
    expect(result[0].value).toBe("value");
    expect(result[0].type).toBe("string");
    temp.cleanupSync();
  });

  test("returns nested parameters in dot-notation", () => {
    const file = writeTempYaml("a:\n  b: 42\n");
    const result = createValuesObject(file);
    expect(result.find((p) => p.name === "a.b")).toBeTruthy();
    expect(result.find((p) => p.name === "a.b")?.value).toBe(42);
    temp.cleanupSync();
  });

  test("returns array parameters", () => {
    const file = writeTempYaml("items:\n  - first\n  - second\n");
    const result = createValuesObject(file);
    const itemsParam = result.find((p) => p.name === "items");
    expect(itemsParam).toBeDefined();
    expect(itemsParam?.type).toBe("array");
    temp.cleanupSync();
  });

  test("maps null values to the string 'nil'", () => {
    const file = writeTempYaml("nullable: null\n");
    const result = createValuesObject(file);
    expect(result.find((p) => p.name === "nullable")?.value).toBe("nil");
    temp.cleanupSync();
  });

  test("returns empty array for empty YAML object", () => {
    const file = writeTempYaml("{}\n");
    const result = createValuesObject(file);
    expect(result).toHaveLength(0);
    temp.cleanupSync();
  });
});
