/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect } from "vitest";
import { combineMetadataAndValues, buildParamsToRenderList } from "@lib/builder.ts";
import Parameter from "@lib/parameter.ts";
import type { Config } from "@lib/types.ts";

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

function makeParam(name: string, value?: unknown, type = "string"): Parameter {
  const p = new Parameter(name);
  p.value = value as (typeof p)["value"];
  p.type = type;
  return p;
}

describe("combineMetadataAndValues", () => {
  test("fills metadata value and type from valuesObject", () => {
    const valuesObject = [makeParam("key", "hello", "string")];
    const metaParam = new Parameter("key");
    metaParam.description = "A key";
    const valuesMetadata = [metaParam];
    combineMetadataAndValues(valuesObject, valuesMetadata);
    expect(valuesMetadata[0].value).toBe("hello");
    expect(valuesMetadata[0].type).toBe("string");
  });

  test("does not overwrite an already-set metadata value", () => {
    const valuesObject = [makeParam("key", "fromYaml", "string")];
    const metaParam = new Parameter("key");
    metaParam.value = "alreadySet";
    const valuesMetadata = [metaParam];
    combineMetadataAndValues(valuesObject, valuesMetadata);
    expect(valuesMetadata[0].value).toBe("alreadySet");
  });

  test("skips value lookup for extra parameters", () => {
    const valuesObject = [makeParam("real", "v", "string")];
    const extraParam = new Parameter("extraKey");
    extraParam.extra = true;
    const valuesMetadata = [extraParam];
    combineMetadataAndValues(valuesObject, valuesMetadata);
    // extraKey should not be looked up in valuesObject and keeps its default value
    expect(valuesMetadata[0].value).toBeUndefined();
  });

  test("adds missing valuesObject params as skip to metadata", () => {
    const valuesObject = [makeParam("a", 1, "number"), makeParam("skipMe", true, "boolean")];
    const metaParam = new Parameter("a");
    const valuesMetadata = [metaParam];
    combineMetadataAndValues(valuesObject, valuesMetadata);
    // "skipMe" should be injected as skip=true
    const skipMe = valuesMetadata.find((p) => p.name === "skipMe");
    expect(skipMe).toBeDefined();
    expect(skipMe?.skip).toBe(true);
  });
});

describe("buildParamsToRenderList", () => {
  test("returns a new list without mutating the original", () => {
    const param = makeParam("myKey", "val", "string");
    const original = [param];
    const result = buildParamsToRenderList(original, config);
    expect(result).not.toBe(original);
    expect(result[0]).not.toBe(param);
  });

  test("filters out skip parameters", () => {
    const p1 = makeParam("visible", "v", "string");
    const p2 = makeParam("hidden", "h", "string");
    p2.skip = true;
    const result = buildParamsToRenderList([p1, p2], config);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("visible");
  });

  test("applies array modifier: sets type and value to []", () => {
    const p = makeParam("arr", undefined, "");
    p.modifiers = ["array"];
    const result = buildParamsToRenderList([p], config);
    expect(result[0].type).toBe("array");
    expect(result[0].value).toBe("[]");
  });

  test("applies object modifier: sets type and value to {}", () => {
    const p = makeParam("obj", undefined, "");
    p.modifiers = ["object"];
    const result = buildParamsToRenderList([p], config);
    expect(result[0].type).toBe("object");
    expect(result[0].value).toBe("{}");
  });

  test("applies string modifier: sets type and value to empty string", () => {
    const p = makeParam("str", undefined, "");
    p.modifiers = ["string"];
    const result = buildParamsToRenderList([p], config);
    expect(result[0].type).toBe("string");
    expect(result[0].value).toBe('""');
  });

  test("applies nullable modifier: sets value to nil when undefined", () => {
    const p = makeParam("nul", undefined, "");
    p.modifiers = ["nullable"];
    const result = buildParamsToRenderList([p], config);
    expect(result[0].value).toBe("nil");
  });

  test("applies default modifier: sets value to the provided default", () => {
    const p = makeParam("def", undefined, "");
    p.modifiers = ["default: myDefault"];
    const result = buildParamsToRenderList([p], config);
    expect(result[0].value).toBe("myDefault");
  });

  test("throws on unknown modifier", () => {
    const p = makeParam("bad", undefined, "");
    p.modifiers = ["unknownModifier"];
    expect(() => buildParamsToRenderList([p], config)).toThrow(
      "Unknown modifier: unknownModifier for parameter bad",
    );
  });

  test("nullable as last modifier preserves type from array but does not overwrite value", () => {
    const p = makeParam("combo", undefined, "");
    p.modifiers = ["array", "nullable"];
    const result = buildParamsToRenderList([p], config);
    // array sets type but NOT value (because nullable is last)
    expect(result[0].type).toBe("array");
    // nullable sets value to nil since it was still undefined
    expect(result[0].value).toBe("nil");
  });
});
