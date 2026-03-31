/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import * as fs from "node:fs";
import * as YAML from "yaml";

import * as utils from "./utils.ts";
import Parameter from "./parameter.ts";
import Section from "./section.ts";
import Metadata from "./metadata.ts";
import type { Config } from "./types.ts";

/*
 * Returns a Metadata object
 * The objects within that wrapper object are parsed from the comments metadata
 * See metadata.ts
 */
export function parseMetadataComments(valuesFilePath: string, config: Config): Metadata {
  const data = fs.readFileSync(valuesFilePath, "utf-8");
  const lines = data.split(/\r?\n/);

  const parsedValues = new Metadata();
  // JSDoc-style: @param {type?} name [default=value] Description
  // Groups: 1=type, 2=nullable(?), 3=name, 4=default, 5=description
  const paramRegex = new RegExp(
    `^\\s*${config.comments.format}\\s*${config.tags.param}\\s*(?:\\{(\\w*(?:\\[\\])?)(\\??)\\}\\s*)?(\\S+)\\s*(?:\\[${config.modifiers.default}=([^\\]]*)\\]\\s*)?(.*)$`,
  );
  const sectionRegex = new RegExp(
    `^\\s*${config.comments.format}\\s*${config.tags.section}\\s*(.*)$`,
  );
  const subsectionRegex = config.tags.subsection
    ? new RegExp(`^\\s*${config.comments.format}\\s*${config.tags.subsection}\\s*(.*)$`)
    : null;
  const descriptionStartRegex = new RegExp(
    `^\\s*${config.comments.format}\\s*${config.tags.descriptionStart}\\s*(.*)`,
  );
  const descriptionContentRegex = new RegExp(`^\\s*${config.comments.format}\\s?(.*)`);
  const descriptionEndRegex = new RegExp(
    `^\\s*${config.comments.format}\\s*${config.tags.descriptionEnd}\\s*(.*)`,
  );
  const skipRegex = new RegExp(
    `^\\s*${config.comments.format}\\s*${config.tags.skip}\\s*([^\\s]+)\\s*(.*)$`,
  );
  // JSDoc-style: @extra {type?} name Description
  // Groups: 1=type, 2=nullable(?), 3=name, 4=description
  const extraRegex = new RegExp(
    `^\\s*${config.comments.format}\\s*${config.tags.extra}\\s*(?:\\{(\\w*(?:\\[\\])?)(\\??)\\}\\s*)?(\\S+)\\s*(.*)$`,
  );

  // We assume there will always be a section before any parameter. At least one section is required
  let currentSection: Section | null = null;
  let descriptionParsing = false;
  lines.forEach((line) => {
    // Parse param line
    const paramMatch = line.match(paramRegex);
    if (paramMatch && paramMatch.length > 0) {
      const typeAnnotation = paramMatch[1]; // 'string', 'string[]', 'object', or ''
      const nullableMarker = paramMatch[2]; // '?' or ''
      const paramName = paramMatch[3]; // name (always plain)
      const defaultValue = paramMatch[4]; // default from [default=value]
      const description = paramMatch[5]; // description text

      const param = new Parameter(paramName);

      // Set type annotation from JSDoc {type}
      if (typeAnnotation && typeAnnotation !== "") {
        param.typeAnnotation = typeAnnotation;
      }
      // Set nullable from {?} or {?type}
      if (nullableMarker === "?") {
        param.nullable = true;
      }
      // Set default override from [name=value]
      if (defaultValue !== undefined) {
        param.defaultOverride = defaultValue;
      }

      param.description = description;
      if (currentSection) {
        param.section = currentSection.name;
        currentSection.addParameter(param);
      }
      parsedValues.addParameter(param);
    }

    // Parse section line
    const sectionMatch = line.match(sectionRegex);
    if (sectionMatch && sectionMatch.length > 0) {
      const section = new Section(sectionMatch[1]);
      parsedValues.addSection(section);
      currentSection = section;
    }

    // Parse subsection line
    const subsectionMatch = subsectionRegex ? line.match(subsectionRegex) : null;
    if (subsectionMatch && subsectionMatch.length > 0) {
      const subsection = new Section(subsectionMatch[1], 1);
      parsedValues.addSection(subsection);
      currentSection = subsection;
    }

    // Parse section description end line
    const descriptionEndMatch = line.match(descriptionEndRegex);
    if (currentSection && descriptionParsing && descriptionEndMatch) {
      descriptionParsing = false;
    }

    // Parse section description content line between start and end
    const descriptionContentMatch = line.match(descriptionContentRegex);
    if (
      currentSection &&
      descriptionParsing &&
      descriptionContentMatch &&
      descriptionContentMatch.length > 0
    ) {
      currentSection.addDescriptionLine(descriptionContentMatch[1]);
    }

    // Parse section description start line
    const descriptionStartMatch = line.match(descriptionStartRegex);
    if (currentSection && !descriptionParsing && descriptionStartMatch) {
      descriptionParsing = true;
      if (descriptionStartMatch.length > 0 && descriptionStartMatch[1] !== "") {
        currentSection.addDescriptionLine(descriptionStartMatch[1]);
      }
    }

    // Parse skip line
    const skipMatch = line.match(skipRegex);
    if (skipMatch && skipMatch.length > 0) {
      const param = new Parameter(skipMatch[1]);
      param.skip = true;
      if (currentSection) {
        param.section = currentSection.name;
        currentSection.addParameter(param);
      }
      parsedValues.addParameter(param);
    }

    // Parse extra line
    const extraMatch = line.match(extraRegex);
    if (extraMatch && extraMatch.length > 0) {
      const param = new Parameter(extraMatch[3]);
      param.description = extraMatch[4];
      param.value = ""; // Set an empty string by default since it won't have a value in the actual YAML
      param.extra = true;
      if (currentSection) {
        param.section = currentSection.name;
        currentSection.addParameter(param);
      }
      parsedValues.addParameter(param);
    }
  });

  return parsedValues;
}

/*
 * Returns an array of Parameters parsed from the actual YAML content
 * This object contains the actual type and value of the object
 */
export function createValuesObject(valuesFilePath: string): Parameter[] {
  const resultValues: Parameter[] = [];
  const valuesJSON = YAML.parse(fs.readFileSync(valuesFilePath, "utf8")) as Record<string, unknown>;
  const dottedFormatProperties = utils.flattenObject(valuesJSON);

  for (let valuePath in dottedFormatProperties) {
    if (Object.prototype.hasOwnProperty.call(dottedFormatProperties, valuePath)) {
      let value = utils.getValueByPath(valuesJSON, valuePath);
      // TODO(miguelaeh):
      // Variable to avoid render in the schema parameters with dots in the keys.
      // the ocurrences of this variable inside this function must be deleted after fixing it.
      let renderInSchema = true;
      if (value === undefined) {
        // If the value is not found,
        // give a try to our function for complex keys like 'annotations.prometheus.io/scrape'
        value = utils.getValueByPath(valuesJSON, utils.getArrayPath(valuesJSON, valuePath));
        renderInSchema = false;
      }
      let type: string = typeof value;

      // Check if the value is a plain array, an array that only contains strings,
      // those strings should not have metadata, the metadata must exist for the array itself
      const valuePathSplit = valuePath.split("[");
      if (valuePathSplit.length > 1) {
        // The value is inside an array
        const arrayPrefix = utils.getArrayPrefix(valuePath);
        let isPlainArray = true; // Assume it is plain until we prove the opposite
        const arrayValue = utils.getValueByPath(
          valuesJSON,
          utils.getArrayPath(valuesJSON, arrayPrefix),
        );
        if (Array.isArray(arrayValue)) {
          arrayValue.forEach((e) => {
            if (typeof e !== "string") {
              isPlainArray = false;
            }
          });
        }
        if (isPlainArray) {
          value = arrayValue;
          valuePath = arrayPrefix;
        }
      }

      // Map the javascript 'null' to golang 'nil'
      if (value === null) {
        value = "nil";
      }

      // When an element is an object it can be object or array
      if (typeof value === "object") {
        if (Array.isArray(value)) {
          type = "array";
        }
      }

      // The existence check is needed to avoid duplicate plain array keys
      if (!resultValues.find((v) => v.name === valuePath)) {
        const param = new Parameter(valuePath);
        if (!param.value) param.value = value as (typeof param)["value"];
        param.type = type;
        param.schema = renderInSchema;
        resultValues.push(param);
      }
    }
  }

  return resultValues;
}
