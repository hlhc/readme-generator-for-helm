/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect } from "vitest";
import Parameter from "@lib/parameter.ts";

describe("Parameter", () => {
  test("constructor sets default field values", () => {
    const p = new Parameter("myKey");
    expect(p.name).toBe("myKey");
    expect(p.description).toBe("");
    expect(p.value).toBeUndefined();
    expect(p.type).toBe("");
    expect(p.typeAnnotation).toBe("");
    expect(p.nullable).toBe(false);
    expect(p.defaultOverride).toBeUndefined();
    expect(p.section).toBe("");
    expect(p.validate).toBe(true);
    expect(p.readme).toBe(true);
    expect(p.schema).toBe(true);
  });

  describe("extra getter/setter", () => {
    test("setting extra=true makes validate=false, readme=true", () => {
      const p = new Parameter("k");
      p.extra = true;
      expect(p.validate).toBe(false);
      expect(p.readme).toBe(true);
    });

    test("extra getter returns true when validate=false and readme=true", () => {
      const p = new Parameter("k");
      p.extra = true;
      expect(p.extra).toBe(true);
    });

    test("setting extra=false is a no-op (does not change defaults)", () => {
      const p = new Parameter("k");
      p.extra = false;
      expect(p.validate).toBe(true);
      expect(p.readme).toBe(true);
      expect(p.extra).toBe(false);
    });

    test("extra getter returns false for a default parameter", () => {
      const p = new Parameter("k");
      expect(p.extra).toBe(false);
    });
  });

  describe("skip getter/setter", () => {
    test("setting skip=true makes both validate and readme false", () => {
      const p = new Parameter("k");
      p.skip = true;
      expect(p.validate).toBe(false);
      expect(p.readme).toBe(false);
    });

    test("skip getter returns true when both are false", () => {
      const p = new Parameter("k");
      p.skip = true;
      expect(p.skip).toBe(true);
    });

    test("setting skip=false restores both validate and readme to true", () => {
      const p = new Parameter("k");
      p.skip = true;
      p.skip = false;
      expect(p.validate).toBe(true);
      expect(p.readme).toBe(true);
    });

    test("skip getter returns false for a default parameter", () => {
      const p = new Parameter("k");
      expect(p.skip).toBe(false);
    });
  });
});
