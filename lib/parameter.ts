/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import type { TypeAnnotation } from "./typing.ts";

export type ParameterValue =
  | string
  | number
  | boolean
  | null
  | unknown[]
  | Record<string, unknown>
  | undefined;

export default class Parameter {
  name: string;
  description: string;
  value: ParameterValue;
  type: string;
  typeAnnotation: TypeAnnotation;
  nullable: boolean;
  defaultOverride?: string;
  section: string;
  validate: boolean;
  readme: boolean;
  schema: boolean;

  constructor(name: string) {
    this.name = name;
    this.description = "";
    this.value = undefined;
    this.type = "";
    this.typeAnnotation = "";
    this.nullable = false;
    this.section = "";
    this.validate = true;
    this.readme = true;
    this.schema = true;
  }

  // Extra parameters won't be checked but will be rendered on the README
  set extra(extra: boolean) {
    if (extra) {
      this.validate = false;
      this.readme = true;
    }
  }

  get extra(): boolean {
    return !this.validate && this.readme;
  }

  set skip(skip: boolean) {
    if (skip) {
      this.validate = false;
      this.readme = false;
    } else {
      this.validate = true;
      this.readme = true;
    }
  }

  get skip(): boolean {
    return !this.validate && !this.readme;
  }
}
