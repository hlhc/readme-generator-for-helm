/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Config {
  comments: { format: string };
  tags: {
    param: string;
    section: string;
    subsection?: string;
    descriptionStart: string;
    descriptionEnd: string;
    skip: string;
    extra: string;
  };
  modifiers: {
    array: string;
    object: string;
    string: string;
    nullable: string;
    default: string;
  };
  regexp: {
    paramsSectionTitle: string;
  };
}

export interface RunOptions {
  values?: string;
  readme?: string;
  config?: string;
  schema?: string;
  version?: boolean;
}
