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

const configWithAnchors: Config = {
  ...config,
  readme: {
    anchors: {
      start: "<!--readme-generateor-->",
      end: "<!--end-readme-generateor-->",
    },
  },
};

const configWithBothTargets: Config = {
  ...config,
  readme: {
    paramsSectionTitle: "Parameters",
    anchors: {
      start: "<!--readme-generateor-->",
      end: "<!--end-readme-generateor-->",
    },
  },
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
    const content = ["# Chart", "", "## Parameters", "", "## Other Section", "", "Some text."].join(
      "\n",
    );
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

  test("replaces content between configured anchors", () => {
    const file = writeTempReadme(
      [
        "# Chart",
        "",
        "## Parameters",
        "",
        "<!--readme-generateor-->",
        "old content",
        "<!--end-readme-generateor-->",
        "",
        "## Next",
      ].join("\n"),
    );
    const p = makeParam("anchor.key", "Anchor description", "anchor-value");
    insertReadmeTable(file, [makeSection("Config", [p])], configWithAnchors);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("anchor.key");
    expect(result).not.toContain("old content");
    expect(result).toContain("<!--readme-generateor-->");
    expect(result).toContain("<!--end-readme-generateor-->");
    temp.cleanupSync();
  });

  test("throws when configured anchors are missing", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("anchor.key", "Anchor description", "anchor-value");
    expect(() => insertReadmeTable(file, [makeSection("Config", [p])], configWithAnchors)).toThrow(
      "ERROR: error getting current anchors section from README",
    );
    temp.cleanupSync();
  });

  test("throws when both section title and anchors are configured", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("anchor.key", "Anchor description", "anchor-value");
    expect(() =>
      insertReadmeTable(file, [makeSection("Config", [p])], configWithBothTargets),
    ).toThrow(
      "ERROR: invalid README target configuration. Use either readme.paramsSectionTitle or readme.anchors.start/end",
    );
    temp.cleanupSync();
  });
});

describe("insertReadmeTable (HTML mode)", () => {
  test("emits an HTML table structure", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("config.key", "A scalar value", "hello");
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("<table>");
    expect(result).toContain("<thead>");
    expect(result).toContain("<tbody>");
    expect(result).toContain("</table>");
    temp.cleanupSync();
  });

  test("wraps scalar value in <code>", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("my.param", "Some description", "scalar-value");
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("<code>scalar-value</code>");
    temp.cleanupSync();
  });

  test("renders empty-string value as <code>\"\"</code>", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("my.param", "Empty value param", "");
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain(`<code>""</code>`);
    temp.cleanupSync();
  });

  test("pretty-prints object value as multiline JSON in <pre><code>", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("my.obj", "An object", { key: "val", num: 1 });
    p.type = "object";
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain(`<pre><code class="language-json">`);
    // multiline: should contain a newline inside the JSON block
    expect(result).toMatch(/<pre><code class="language-json">[\s\S]*\n[\s\S]*<\/code><\/pre>/);
    temp.cleanupSync();
  });

  test("pretty-prints array value as multiline JSON in <pre><code>", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("my.arr", "An array", ["a", "b"]);
    p.type = "array";
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain(`<pre><code class="language-json">`);
    expect(result).toMatch(/<pre><code class="language-json">[\s\S]*\n[\s\S]*<\/code><\/pre>/);
    temp.cleanupSync();
  });

  test("HTML-escapes name and description to prevent XSS", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("<script>alert(1)</script>", "<b>desc</b> & more", "val");
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
    expect(result).toContain("&lt;b&gt;desc&lt;/b&gt; &amp; more");
    temp.cleanupSync();
  });

  test("HTML-escapes scalar value to prevent XSS", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("safe.key", "desc", `<img src=x onerror="alert(1)">`);
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).not.toContain("<img");
    expect(result).toContain("&lt;img");
    temp.cleanupSync();
  });

  test("HTML-escapes JSON object values to prevent XSS", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("my.obj", "desc", { key: "<script>evil()</script>" });
    p.type = "object";
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).not.toContain("<script>");
    expect(result).toContain("&lt;script&gt;");
    temp.cleanupSync();
  });

  test("renders empty value cell for extra parameters", () => {
    const file = writeTempReadme("# Chart\n\n## Parameters\n");
    const p = makeParam("extra.key", "An extra param", "some-value");
    p.extra = true;
    insertReadmeTable(file, [makeSection("Config", [p])], config, true);
    const result = fs.readFileSync(file, "utf-8");
    // value cell should be empty — no <code>some-value</code>
    expect(result).not.toContain("<code>some-value</code>");
    temp.cleanupSync();
  });

  test("works with anchor-based config", () => {
    const file = writeTempReadme(
      [
        "# Chart",
        "",
        "## Parameters",
        "",
        "<!--readme-generateor-->",
        "old html content",
        "<!--end-readme-generateor-->",
      ].join("\n"),
    );
    const p = makeParam("anchor.key", "Anchor description", "anchor-value");
    insertReadmeTable(file, [makeSection("Config", [p])], configWithAnchors, true);
    const result = fs.readFileSync(file, "utf-8");
    expect(result).toContain("<table>");
    expect(result).toContain("anchor.key");
    expect(result).not.toContain("old html content");
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
    p.nullable = false; // not nullable
    expect(() => renderOpenAPISchema(file, [p], config)).toThrow("Invalid type 'nil'");
    temp.cleanupSync();
  });
});
