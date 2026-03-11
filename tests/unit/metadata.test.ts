/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, test, expect } from "vitest";
import Metadata from "@lib/metadata.ts";
import Section from "@lib/section.ts";
import Parameter from "@lib/parameter.ts";

describe("Metadata", () => {
  test("constructor creates empty sections and parameters arrays", () => {
    const m = new Metadata();
    expect(m.sections).toEqual([]);
    expect(m.parameters).toEqual([]);
  });

  test("addSection appends the section", () => {
    const m = new Metadata();
    const s = new Section("My Section");
    m.addSection(s);
    expect(m.sections).toHaveLength(1);
    expect(m.sections[0]).toBe(s);
  });

  test("addSection preserves insertion order", () => {
    const m = new Metadata();
    const s1 = new Section("First");
    const s2 = new Section("Second");
    m.addSection(s1);
    m.addSection(s2);
    expect(m.sections[0].name).toBe("First");
    expect(m.sections[1].name).toBe("Second");
  });

  test("addParameter appends the parameter", () => {
    const m = new Metadata();
    const p = new Parameter("key");
    m.addParameter(p);
    expect(m.parameters).toHaveLength(1);
    expect(m.parameters[0]).toBe(p);
  });

  test("addParameter preserves insertion order", () => {
    const m = new Metadata();
    const p1 = new Parameter("a");
    const p2 = new Parameter("b");
    m.addParameter(p1);
    m.addParameter(p2);
    expect(m.parameters[0].name).toBe("a");
    expect(m.parameters[1].name).toBe("b");
  });
});
