/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect } from "vitest";
import {
  getArrayPrefix,
  sanitizeProperty,
  cloneParameters,
  getValueByPath,
  flattenObject,
  getArrayPath,
} from "@lib/utils.ts";
import Parameter from "@lib/parameter.ts";

describe("getArrayPrefix", () => {
  test("returns prefix for simple array key", () => {
    expect(getArrayPrefix("a.b[0]")).toBe("a.b");
  });

  test("returns prefix for nested array key", () => {
    expect(getArrayPrefix("a.b[0].c[0]")).toBe("a.b[0].c");
  });

  test("returns prefix from top-level array", () => {
    expect(getArrayPrefix("items[2]")).toBe("items");
  });
});

describe("sanitizeProperty", () => {
  test("returns array prefix when property contains bracket", () => {
    expect(sanitizeProperty("someArray[0]")).toBe("someArray");
  });

  test("returns nested array prefix for nested bracket notation", () => {
    expect(sanitizeProperty("someArray[0].nested[0]")).toBe("someArray[0].nested");
  });

  test("returns property directly for plain property without brackets", () => {
    // Covers the `return property` branch (line 37 in utils.ts)
    expect(sanitizeProperty("someValue")).toBe("someValue");
  });

  test("returns plain dotted path unchanged when no brackets present", () => {
    expect(sanitizeProperty("a.b.c")).toBe("a.b.c");
  });
});

describe("cloneParameters", () => {
  test("returns a new array with cloned parameters", () => {
    const p = new Parameter("key");
    p.value = "original";
    p.typeAnnotation = "string[]";
    const clones = cloneParameters([p]);
    expect(clones).toHaveLength(1);
    expect(clones[0]).not.toBe(p);
    expect(clones[0].name).toBe("key");
    expect(clones[0].value).toBe("original");
  });

  test("mutations to clone do not affect original", () => {
    const p = new Parameter("key");
    p.value = "original";
    const clones = cloneParameters([p]);
    clones[0].value = "changed";
    expect(p.value).toBe("original");
  });

  test("handles empty array", () => {
    expect(cloneParameters([])).toEqual([]);
  });
});

describe("getValueByPath", () => {
  test("returns nested value via dot notation", () => {
    expect(getValueByPath({ a: { b: 42 } }, "a.b")).toBe(42);
  });

  test("returns array element via bracket notation", () => {
    expect(getValueByPath({ a: [10, 20] }, "a[1]")).toBe(20);
  });

  test("returns undefined for missing key", () => {
    expect(getValueByPath({ a: 1 }, "b")).toBeUndefined();
  });

  test("accepts path as array of segments", () => {
    expect(getValueByPath({ a: { b: 99 } }, ["a", "b"])).toBe(99);
  });

  test("returns undefined when traversing a non-record string value", () => {
    expect(getValueByPath("hello", "a")).toBeUndefined();
  });

  test("returns undefined when traversing a non-array with numeric index", () => {
    expect(getValueByPath({ a: "str" }, ["a", 0])).toBeUndefined();
  });

  test("returns top-level value", () => {
    expect(getValueByPath({ key: "val" }, "key")).toBe("val");
  });
});

describe("flattenObject", () => {
  test("flattens a nested object", () => {
    expect(flattenObject({ a: { b: 1 } })).toEqual({ "a.b": 1 });
  });

  test("flattens an array", () => {
    expect(flattenObject({ a: [1, 2] })).toEqual({ "a[0]": 1, "a[1]": 2 });
  });

  test("handles an empty object at top level", () => {
    expect(flattenObject({})).toEqual({});
  });

  test("handles an empty array at top level", () => {
    expect(flattenObject([])).toEqual({});
  });

  test("handles empty nested array with prefix", () => {
    expect(flattenObject({ a: [] })).toEqual({ a: [] });
  });

  test("handles empty nested object with prefix", () => {
    expect(flattenObject({ a: {} })).toEqual({ a: {} });
  });

  test("handles array of objects", () => {
    expect(flattenObject([{ x: 1 }])).toEqual({ "[0].x": 1 });
  });

  test("handles array of arrays", () => {
    expect(flattenObject([[1, 2]])).toEqual({ "[0][0]": 1, "[0][1]": 2 });
  });

  test("handles primitive values inside arrays", () => {
    expect(flattenObject(["a", "b"])).toEqual({ "[0]": "a", "[1]": "b" });
  });
});

describe("getArrayPath", () => {
  test("returns path for a simple key", () => {
    expect(getArrayPath({ a: 1 }, "a")).toEqual(["a"]);
  });

  test("returns empty array for empty path", () => {
    expect(getArrayPath({ a: 1 }, "")).toEqual([]);
  });

  test("returns empty array when obj is undefined", () => {
    expect(getArrayPath(undefined, "a")).toEqual([]);
  });

  test("returns nested path for dotted key", () => {
    expect(getArrayPath({ a: { b: 1 } }, "a.b")).toEqual(["a", "b"]);
  });

  test("works with array obj at top level", () => {
    expect(getArrayPath([{ b: 1 }], "b")).toEqual([0, "b"]);
  });
});
