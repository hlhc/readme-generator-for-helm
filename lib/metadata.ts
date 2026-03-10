/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

import type Parameter from "./parameter.ts";
import type Section from "./section.ts";

export default class Metadata {
  sections: Section[];
  parameters: Parameter[];

  constructor() {
    this.sections = [];
    this.parameters = [];
  }

  addSection(section: Section): void {
    this.sections.push(section);
  }

  addParameter(parameter: Parameter): void {
    this.parameters.push(parameter);
  }
}
