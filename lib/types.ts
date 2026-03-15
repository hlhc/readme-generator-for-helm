/*
 * Copyright Cyrus Ho. All Rights Reserved.
 * Copyright Broadcom, Inc. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Config {
  comments: { format: string };
  readme?: {
    paramsSectionTitle?: string;
    anchors?: {
      start: string;
      end: string;
    };
  };
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
}

export interface RunOptions {
  values?: string;
  readme?: string;
  config?: string;
  schema?: string;
  html?: boolean;
  version?: boolean;
}
