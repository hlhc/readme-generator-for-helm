/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import Parameter from "./parameter.ts";

type PathSegment = string | number;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/*
 * Returns an array prefix in a dot notation path
 * Example:
 *  - a.b[0] -> a.b
 *  - a.b; a.b[0].c[0] -> a.b[0].c
 */
export function getArrayPrefix(array: string): string {
  const splittedArray = array.split("[");
  return splittedArray.slice(0, splittedArray.length - 1).join("[");
}

/*
 * Returns a dot notation sanitized property name
 * in case it is an array the base of the array name without the index
 * Example:
 *  someArray[0] -> someArray
 *  someArray[0].nested[0] -> someArray[0].nested
 *  someValue -> someValue
 */
export function sanitizeProperty(property: string): string {
  const splitted = property.split("[");
  if (splitted.length > 1) {
    return getArrayPrefix(property);
  }
  return property;
}

/*
 * Check if the specifier modifier in on the modifiers list of the parameter
 */
export function containsModifier(parameter: Parameter, modifier: string): boolean {
  return !!parameter.modifiers.find((m) => m === modifier);
}

export function cloneParameters(parameters: Parameter[]): Parameter[] {
  return parameters.map((parameter) => {
    const clone = new Parameter(parameter.name);
    return Object.assign(clone, structuredClone(parameter));
  });
}

export function getValueByPath(obj: unknown, path: string | PathSegment[]): unknown {
  const segments = Array.isArray(path) ? path : parsePath(path);
  let current = obj;

  for (const segment of segments) {
    if (typeof segment === "number") {
      if (!Array.isArray(current)) {
        return undefined;
      }
      current = current[segment];
      continue;
    }

    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

export function flattenObject(value: unknown, prefix = ""): Record<string, unknown> {
  const flattened: Record<string, unknown> = {};

  if (Array.isArray(value)) {
    if (value.length === 0 && prefix) {
      flattened[prefix] = value;
      return flattened;
    }

    value.forEach((item, index) => {
      const nextPrefix = `${prefix}[${index}]`;
      if (Array.isArray(item) || isRecord(item)) {
        Object.assign(flattened, flattenObject(item, nextPrefix));
      } else {
        flattened[nextPrefix] = item;
      }
    });

    return flattened;
  }

  if (isRecord(value)) {
    const entries = Object.entries(value);
    if (entries.length === 0 && prefix) {
      flattened[prefix] = value;
      return flattened;
    }

    entries.forEach(([key, item]) => {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      if (Array.isArray(item) || isRecord(item)) {
        Object.assign(flattened, flattenObject(item, nextPrefix));
      } else {
        flattened[nextPrefix] = item;
      }
    });
  }

  return flattened;
}

function parsePath(path: string): PathSegment[] {
  const segments: PathSegment[] = [];
  const segmentRegex = /([^.[\]]+)|\[(\d+)\]/g;

  for (const match of path.matchAll(segmentRegex)) {
    if (match[1] !== undefined) {
      segments.push(match[1]);
    } else if (match[2] !== undefined) {
      segments.push(Number.parseInt(match[2], 10));
    }
  }

  return segments;
}

/*
 * Returns the value when the keys contain complex strings that cannot
 * be indexed with a dot notation.
 * Returned array path is compatible with lodash format.
 */
export function getArrayPath(
  obj: unknown,
  path: string,
  index: number | string = 0,
): (string | number)[] {
  let fullPath: (string | number)[] = [];
  if (path !== "" && obj !== undefined) {
    if (Array.isArray(obj)) {
      const idx = typeof index === "string" ? parseInt(index, 10) : index;
      fullPath.push(idx);
      fullPath = fullPath.concat(getArrayPath((obj as unknown[])[idx], path));
    } else if (obj !== null && typeof obj === "object") {
      for (const key of Object.keys(obj as Record<string, unknown>)) {
        if (path === key) {
          fullPath.push(key);
        } else {
          const keyRegex = new RegExp(`^${key}(?:\\[(\\d+)\\])*\\.`);
          const subKeys = path.split(keyRegex);
          if (subKeys.length > 1 && path.startsWith(key)) {
            fullPath.push(key);
            fullPath = fullPath.concat(
              getArrayPath((obj as Record<string, unknown>)[key], subKeys[2] ?? "", subKeys[1]),
            );
          }
        }
      }
    }
  }
  return fullPath;
}
