/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect } from "vitest";
import checkKeys from "@lib/checker.ts";
import Parameter from "@lib/parameter.ts";

function param(name: string): Parameter {
  return new Parameter(name);
}

describe("checkKeys", () => {
  test("passes without error when all keys match", () => {
    const valuesObject = [param("a"), param("b.x"), param("b.y")];
    const valuesMetadata = [param("a"), param("b.x"), param("b.y")];
    expect(() => checkKeys(valuesObject, valuesMetadata)).not.toThrow();
  });

  test("throws when a key exists in values but is missing from metadata", () => {
    // Covers the error path: lines 90, 93, 98 in checker.ts
    const valuesObject = [param("a"), param("b")];
    const valuesMetadata = [param("a")]; // "b" is missing
    expect(() => checkKeys(valuesObject, valuesMetadata)).toThrow("ERROR: Wrong metadata!");
  });

  test("throws when metadata has a key not present in values", () => {
    // Covers the notFoundKeys branch
    const valuesObject = [param("a")];
    const valuesMetadata = [param("a"), param("ghost")]; // "ghost" does not exist
    expect(() => checkKeys(valuesObject, valuesMetadata)).toThrow("ERROR: Wrong metadata!");
  });

  test("throws when both missing and extra metadata keys are present", () => {
    const valuesObject = [param("a"), param("b")];
    const valuesMetadata = [param("a"), param("c")]; // "b" missing, "c" extra
    expect(() => checkKeys(valuesObject, valuesMetadata)).toThrow("ERROR: Wrong metadata!");
  });

  test("skips check for parameters with type annotations and their children", () => {
    // "obj" has type annotation {object} → sanitizeProperty("obj") returns "obj" (plain branch, utils line 37)
    // "obj.x" and "obj.y" are children → skipped
    const valuesObject = [param("a"), param("obj.x"), param("obj.y")];
    const paramA = param("a");
    const paramObj = param("obj");
    paramObj.typeAnnotation = "object";
    const valuesMetadata = [paramA, paramObj];
    expect(() => checkKeys(valuesObject, valuesMetadata)).not.toThrow();
  });

  test("skips check for parameters marked with skip flag and their children", () => {
    const valuesObject = [param("a"), param("skipMe"), param("skipMe.child")];
    const paramA = param("a");
    const paramSkip = param("skipMe");
    paramSkip.skip = true;
    const valuesMetadata = [paramA, paramSkip];
    expect(() => checkKeys(valuesObject, valuesMetadata)).not.toThrow();
  });

  test("allows extra parameters in metadata without error", () => {
    const valuesObject = [param("a")];
    const paramA = param("a");
    const paramExtra = param("extraKey");
    paramExtra.extra = true; // extra params are excluded from validation
    const valuesMetadata = [paramA, paramExtra];
    expect(() => checkKeys(valuesObject, valuesMetadata)).not.toThrow();
  });
});
