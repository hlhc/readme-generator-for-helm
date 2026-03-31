# Readme Generator For Helm

- Autogenerate Helm Charts READMEs' tables based on values YAML file metadata.
- Autogenerate an OpenAPI compliant JSON schema defining the `values.yaml` structure of the Helm Chart. The file generated will be a JSON file formatted according to the [OpenAPIv3 SchemaObject](https://spec.openapis.org/oas/v3.1.0#schema-object) definition.

## How it works

The tool expects some metadata for the descriptions in the provided `values.yaml` file. It will parse and check the metadata against the real values.
If the metadata is consistent with the real values, it will generate and insert the values table into the provided `README.md` file.
If the metadata is not correct, it will print the full list of errors. It checks whether there is metadata for non-existing values or there is missing metadata for an existing value.

The table that will be inserted into the `readme.md` will have the following structure:

```markdown
## Parameters

### Section 1 title

| Name      | Description             | Default        |
| :-------- | :---------------------- | :------------- |
| `value_1` | Description for value 1 | `defaultValue` |
| `value_2` | Description for value 2 | `defaultValue` |
| `value_3` | Description for value 3 | `defaultValue` |

### Section 2 title

#### Subsection 2.1 title

| Name      | Description             | Default        |
| :-------- | :---------------------- | :------------- |
| `value_1` | Description for value 1 | `defaultValue` |
| `value_2` | Description for value 2 | `defaultValue` |
| `value_3` | Description for value 3 | `defaultValue` |

### Section 3 title

| Name      | Description             | Default        |
| :-------- | :---------------------- | :------------- |
| `value_1` | Description for value 1 | `defaultValue` |
| `value_2` | Description for value 2 | `defaultValue` |
| `value_3` | Description for value 3 | `defaultValue` |

...
```

The number of `#` characters needed for the section titles is dynamically calculated, and the title of the `Parameters` section can be configured via the [configuration file](#configuration-file). The `README.md` file with a `## Parameters` section must be created before running the tool, the `Parameters` section should have two `#` or more symbols.

As an alternative, you can configure start/end anchors in the [configuration file](#configuration-file) and the tool will replace the content between those anchors. Example anchors:

```html
<!--readme-generateor-->
<!--end-readme-generateor-->
```

Use only one targeting mode at a time:

- `readme.paramsSectionTitle`
- `readme.anchors.start` + `readme.anchors.end`

If both are configured, the tool fails with an error.

## Requirements

The project has been developed and tested with [Bun](https://bun.sh/) version `1.x`.

## Install

Execute the following commands to install the tool:

```console
git clone https://github.com/bitnami/readme-generator-for-helm
cd ./readme-generator-for-helm
bun install
```

## Single Binary

Execute the following commands to create a single executable binary for the tool:

```console
git clone https://github.com/bitnami/readme-generator-for-helm
cd ./readme-generator-for-helm
bun install
bun build ./bin/index.ts --compile --outfile readme-generator-for-helm
```

## Test

We use [Vitest](https://vitest.dev) to implement the tests. In order to test your changes, execute the following command:

```console
bun run test
```

### Lint

After modifying the code execute the following command to pass the linter:

```console
bun run lint
```

## Basic usage

```console
Usage: readme-generator [options]

Options:
  -v, --values <path>  Path to the values.yaml file
  -r, --readme <path>  Path to the README.md file
  -c, --config <path>  Path to the config file
  -s, --schema <path>  Path for the OpenAPI Schema output file
  --version            Show Readme Generator version
  -h, --help           display help for command
```

## values.yaml Metadata

For the tool to work, you need to add some metadata to your `values.yaml` file.

By default we use a format similar to Javadoc, using `@xxx` for tags followed by the tag structure.

The following are the tags supported at this very moment:

- For a parameter: `## @param {type?} fullKeyPath Description`.
- For a parameter with a default value override: `## @param {type?} fullKeyPath [default=DEFAULT] Description`.
- For a section: `## @section Section Title"`.
- For a subsection: `## @subsection Subsection Title`.
- To skip an object and all its children: `## @skip fullKeyPath Description?`.
- To add a description for an intermediate object (i.e. not final in the YAML tree): `## @extra fullkeyPath Description`.

All the tags as well as the two initial `#` characters for the comments style can be configured in the [configuration file](#configuration-file).

> [!IMPORTANT]
> tags' order or position in the file is NOT important except for the @section and @subsection tags. A @section includes all parameters after it until a new @section or @subsection is found. A @subsection includes all parameters after it until a new @section or @subsection is found.

Type annotations use curly braces and are optional. They control how the parameter is processed. Nullable is indicated with a trailing `?`, TypeScript-style.

Supported type annotations:

- `{object}` Sets the value to `{}`.
- `{string}` Sets the value to `""`.
- `{string[]}` Sets the value to `[]` (array of strings). Any element type is supported (e.g. `{number[]}`, `{object[]}`).
- `{type?}` Marks the parameter as nullable, e.g. `{string?}`, `{string[]?}`, `{?}` (nullable only).

Default value overrides use the `[default=VALUE]` modifier after the parameter name:

- `fullKeyPath [default=DEFAULT_VALUE]` Sets the displayed default value to `DEFAULT_VALUE`.

The `default` keyword is customizable via the `modifiers.default` option in the [configuration file](#configuration-file).

Examples:

```yaml
## @param {string} configuration haproxy configuration
## @param {?} nullable Nullable parameter
## @param {string[]?} nullableArray Nullable array parameter
## @param image.registry [default=REGISTRY_NAME] Kubewatch image registry
## @param {string} image.tag [default=latest] Image tag with type and default override
```

## Configuration file

The configuration file has the following structure:

```json
{
  "comments": {
    "format": "##"                               <-- Which is the comments format in the values YAML
  },
  "readme": {
    "paramsSectionTitle": "Parameters",          <-- Optional: title of the section to replace in README.md
    "anchors": {
      "start": "<!--readme-generateor-->",       <-- Optional: start anchor in README.md for generated content
      "end": "<!--end-readme-generateor-->"      <-- Optional: end anchor in README.md for generated content
    }
  },
  "tags": {
    "param": "@param",                           <-- Tag that indicates a parameter
    "section": "@section",                       <-- Tag that indicates a section
    "subsection": "@subsection",                 <-- Tag that indicates a subsection
    "descriptionStart": "@descriptionStart",     <-- Tag that indicates the beginning of a section description
    "descriptionEnd": "@descriptionEnd",         <-- Tag that indicates the end of a section description
    "skip": "@skip",                             <-- Tag that indicates the object must be skipped
    "extra": "@extra"                            <-- Tag to add a description for an intermediate object
  },
  "modifiers": {
    "default": "default"                           <-- Modifier keyword for default value overrides
  }
}
```

## Pre-commit

Add this to your `.pre-commit-config.yaml`:

```yaml
- repo: https://github.com/bitnami/readme-generator-for-helm
  rev: "main"
  hooks:
    - id: helm-readme-generator
      # in order to run helm-readme-generator only once
      pass_filenames: false
      always_run: true
      # default args are [--readme=chart/README.md, --values=chart/values.yaml]
      args: [--readme=path/to/README.md, --values=path/to/values.yaml]
```

## Versions

### 5.0.0

**Breaking Changes** — This release overhauls the typing and modifier system. If you are upgrading from 4.x, you must update your `values.yaml` annotations and configuration file.

#### Typing System

Type annotations now use **TypeScript-style** syntax inside curly braces. The old bracket-style modifiers (`[array]`, `[object]`, `[string]`, `[nullable]`) and the JSDoc-style leading nullable (`{?type}`) are no longer supported.

**New syntax:** `@param {type?} name Description`

| Annotation    | Type set      | Default value | Description                 |
| :------------ | :------------ | :------------ | :-------------------------- |
| `{string}`    | `string`      | `""`          | Force the type to string    |
| `{object}`    | `object`      | `{}`          | Force the type to object    |
| `{string[]}`  | `array`       | `[]`          | Array of strings            |
| `{number[]}`  | `array`       | `[]`          | Array of numbers            |
| `{object[]}`  | `array`       | `[]`          | Array of objects            |
| `{?}`         | _(unchanged)_ | `nil`         | Nullable (no type override) |
| `{string?}`   | `string`      | `nil`         | Nullable string             |
| `{string[]?}` | `array`       | `nil`         | Nullable array of strings   |

Any element type is supported with `[]` — the tool maps it to the OpenAPI `array` type.

Nullable is indicated with a **trailing `?`** (TypeScript-style), not a leading one.

**Default value override** uses the `[default=VALUE]` modifier after the parameter name:

```yaml
## @param image.registry [default=REGISTRY_NAME] Image registry with custom default
## @param {string} image.tag [default=latest] Image tag with type and custom default
```

#### Migration from 4.x

**1. Update type annotations in `values.yaml`:**

| 4.x syntax               | 5.x syntax                                         |
| :----------------------- | :------------------------------------------------- |
| `[array]` or `{array}`   | `{string[]}` (or `{number[]}`, `{object[]}`, etc.) |
| `[object]` or `{object}` | `{object}`                                         |
| `[string]` or `{string}` | `{string}`                                         |
| `[nullable]` or `{?}`    | `{?}`                                              |
| `[string,nullable]`      | `{string?}`                                        |
| `[array,nullable]`       | `{string[]?}`                                      |

**2. Update default value override syntax in `values.yaml`:**

The default value override now uses the `[default=VALUE]` modifier after the parameter name instead of wrapping the name in brackets:

| 4.x syntax                       | 5.x syntax                               |
| :------------------------------- | :--------------------------------------- |
| `[image.registry=REGISTRY_NAME]` | `image.registry [default=REGISTRY_NAME]` |
| `{string} [image.tag=latest]`    | `{string} image.tag [default=latest]`    |

**3. Update your configuration file:**

The `modifiers` section now only contains the `default` keyword. If you have a custom config, ensure it includes the `modifiers` block:

```json
"modifiers": {
  "default": "default"
}
```

## License

Copyright &copy; 2026 Cyrus Ho.
Copyright &copy; 2025 Broadcom. The term "Broadcom" refers to Broadcom Inc. and/or its subsidiaries.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

<http://www.apache.org/licenses/LICENSE-2.0>

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
