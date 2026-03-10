/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Parameter from "./parameter.ts";

export default class Section {
  name: string;
  level: number;
  descriptionLines: string[];
  parameters: Parameter[];

  constructor(name: string, level = 0) {
    this.name = name;
    this.level = level;
    this.descriptionLines = [];
    this.parameters = [];
  }

  addDescriptionLine(line: string): void {
    this.descriptionLines.push(line);
  }

  addParameter(parameter: Parameter): void {
    this.parameters.push(parameter);
  }

  get description(): string {
    return this.descriptionLines.join("\r\n");
  }
}
