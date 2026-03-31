/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Parameter from "./parameter.ts";
import type { Config } from "./types.ts";
import { cloneParameters } from "./utils.ts";
import { applyTypeAnnotation } from "./typing.ts";
import { applyDefaultOverride } from "./modifier.ts";

/*
 * Applies type annotation, nullable handling, and default override to a parameter.
 */
function applyAnnotations(param: Parameter): void {
  applyTypeAnnotation(param);

  if (param.nullable && param.value === undefined) {
    param.value = "nil";
  }

  applyDefaultOverride(param);
}

/*
 * Returns the array of Parameters after combining the information from the actual YAML with
 * the parsed from the comments:
 * Params:
 *   - valuesObject: object with the real values built from the YAML.
 *   - valuesMetadata: full metadata object parsed from comments
 * Returns: array of Parameters with all the needed information about them
 * IMPORTANT: the array returned will have fields that should not be rendered on the README and
 *            fields that should not be rendered in the schema. They will be selected later.
 */
export function combineMetadataAndValues(
  valuesObject: Parameter[],
  valuesMetadata: Parameter[],
): void {
  for (const param of valuesMetadata) {
    // The parameters with extra do not appear in the actual object and don't have a value
    if (!param.extra) {
      const paramIndex = valuesObject.findIndex((e) => e.name === param.name);
      if (paramIndex !== -1) {
        // Set the value from actual object if not set before
        if (!param.value) param.value = valuesObject[paramIndex].value;
        param.type = valuesObject[paramIndex].type;
        // TODO(miguelaeh): Hack to avoid render parameters with dots in keys into the schema.
        // Must be removed once fixed
        param.schema = valuesObject[paramIndex].schema;
      }
    }
  }

  // Add missing parameters to the metadata.
  // For example, the skip parameters are not parsed from metadata but must be in the array
  // to be rendered in the OpenAPI schema
  for (const param of valuesObject) {
    let paramIndex = valuesMetadata.findIndex((e) => e.name === param.name);
    if (paramIndex === -1) {
      // Find the position of the skip parameter
      paramIndex = valuesObject.findIndex((e) => e.name.startsWith(param.name));
      param.skip = true; // Avoid to render it on the READMEs
      param.schema = true;
      // Push the parameter after the skip object
      valuesMetadata.splice(paramIndex + 1, 0, param);
    }
  }
}

/*
 * Returns the Parameter list that will be rendered in the README
 */
export function buildParamsToRenderList(parametersList: Parameter[], config: Config): Parameter[] {
  let returnList = cloneParameters(parametersList);
  for (const param of returnList) {
    if (param.typeAnnotation || param.nullable || param.defaultOverride !== undefined) {
      applyAnnotations(param);
    }
    // The skip parameters must not be rendered in the README
    returnList = returnList.filter((p) => !p.skip);
  }

  return returnList;
}
