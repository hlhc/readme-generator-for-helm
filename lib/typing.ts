/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Parameter from "./parameter.ts";

export type TypeAnnotation = string;

/*
 * Returns true if the type annotation represents an array type (e.g. "string[]", "object[]").
 */
export function isArrayType(typeAnnotation: TypeAnnotation): boolean {
  return typeAnnotation.endsWith("[]");
}

/*
 * Returns the element type of an array annotation (e.g. "string[]" → "string").
 */
export function getArrayElementType(typeAnnotation: TypeAnnotation): string {
  return typeAnnotation.slice(0, -2);
}

/*
 * Applies the type annotation to a parameter, setting its type and default value.
 * When the parameter is also nullable, only the type is set (value left for nullable handling).
 */
export function applyTypeAnnotation(param: Parameter): void {
  if (!param.typeAnnotation) return;

  if (isArrayType(param.typeAnnotation)) {
    param.type = "array";
    if (!param.nullable) {
      param.value = "[]";
    }
  } else if (param.typeAnnotation === "object") {
    param.type = "object";
    if (!param.nullable) {
      param.value = "{}";
    }
  } else if (param.typeAnnotation === "string") {
    param.type = "string";
    if (!param.nullable) {
      param.value = '""';
    }
  } else {
    param.type = param.typeAnnotation;
  }
}
