/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Parameter from "./parameter.ts";

/*
 * Applies the default value override to a parameter.
 * This is used when the comment specifies a custom default via [default=value] syntax.
 */
export function applyDefaultOverride(param: Parameter): void {
  if (param.defaultOverride !== undefined) {
    param.value = param.defaultOverride;
  }
}
