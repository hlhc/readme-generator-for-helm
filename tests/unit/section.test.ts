/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect } from "vitest";
import Section from "@lib/section.ts";
import Parameter from "@lib/parameter.ts";

describe("Section", () => {
  test("constructor initialises with given name and default level 0", () => {
    const s = new Section("My Section");
    expect(s.name).toBe("My Section");
    expect(s.level).toBe(0);
    expect(s.descriptionLines).toEqual([]);
    expect(s.parameters).toEqual([]);
  });

  test("constructor accepts an explicit level", () => {
    const s = new Section("Sub", 1);
    expect(s.level).toBe(1);
  });

  test("addDescriptionLine appends lines in order", () => {
    const s = new Section("S");
    s.addDescriptionLine("first");
    s.addDescriptionLine("second");
    expect(s.descriptionLines).toEqual(["first", "second"]);
  });

  test("description getter joins lines with CRLF", () => {
    const s = new Section("S");
    s.addDescriptionLine("line one");
    s.addDescriptionLine("line two");
    expect(s.description).toBe("line one\r\nline two");
  });

  test("description getter returns empty string when no lines added", () => {
    const s = new Section("S");
    expect(s.description).toBe("");
  });

  test("addParameter appends a parameter", () => {
    const s = new Section("S");
    const p = new Parameter("key");
    s.addParameter(p);
    expect(s.parameters).toHaveLength(1);
    expect(s.parameters[0]).toBe(p);
  });

  test("addParameter preserves insertion order", () => {
    const s = new Section("S");
    const p1 = new Parameter("a");
    const p2 = new Parameter("b");
    s.addParameter(p1);
    s.addParameter(p2);
    expect(s.parameters[0].name).toBe("a");
    expect(s.parameters[1].name).toBe("b");
  });
});
