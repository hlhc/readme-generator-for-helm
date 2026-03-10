/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import fs from "node:fs";
import { version } from "./package.json" with { type: "json" };

import { createValuesObject, parseMetadataComments } from "./lib/parser.ts";
import checkKeys from "./lib/checker.ts";
import { combineMetadataAndValues, buildParamsToRenderList } from "./lib/builder.ts";
import { insertReadmeTable, renderOpenAPISchema } from "./lib/render.ts";
import type { RunOptions } from "./lib/types.ts";

// Common alias for __dirname not available in ESM
const __dirname = import.meta.dirname;

function getParsedMetadata(valuesFilePath: string, config: import("./lib/types.ts").Config) {
  const valuesObject = createValuesObject(valuesFilePath);
  const valuesMetadata = parseMetadataComments(valuesFilePath, config);

  // Check the parsed keys are consistent with the real ones
  checkKeys(valuesObject, valuesMetadata.parameters);

  // Combine after the check
  // valuesMetadata is modified and filled with more info
  combineMetadataAndValues(valuesObject, valuesMetadata.parameters);

  return valuesMetadata;
}

export default function runReadmeGenerator(options: RunOptions): void {
  const valuesFilePath = options.values;
  const readmeFilePath = options.readme;
  const schemaFilePath = options.schema;
  const versionFlag = options.version;

  if (versionFlag) {
    console.log("Version:", version);
  } else {
    if (!readmeFilePath && !schemaFilePath) {
      throw new Error("Nothing to do. Please provide the --readme or --schema options.");
    }
    if (!valuesFilePath) {
      throw new Error("Nothing to do. You must provide the --values option");
    }
    const configPath = options.config ? options.config : `${__dirname}/config.json`;
    const config = JSON.parse(
      fs.readFileSync(configPath, "utf8"),
    ) as import("./lib/types.ts").Config;
    const parsedMetadata = getParsedMetadata(valuesFilePath, config);

    if (readmeFilePath) {
      parsedMetadata.sections.forEach((section) => {
        section.parameters = buildParamsToRenderList(section.parameters, config);
      });
      insertReadmeTable(readmeFilePath, parsedMetadata.sections, config);
    }

    if (schemaFilePath) {
      parsedMetadata.parameters = buildParamsToRenderList(parsedMetadata.parameters, config);
      renderOpenAPISchema(schemaFilePath, parsedMetadata.parameters, config);
    }
  }
}
