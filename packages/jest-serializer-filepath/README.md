# jest-serializer-filepath

Replaces local filepaths with a generic string to ensure your snapshots will
work in other places.

```json
- { "filepath": "/Users/username/projects/project/fixtures/file.js" }
+ { "filepath": "/../fixtures/file.js" }
```

## Installation

```sh
yarn add --dev jest-serializer-filepath
```

## Usage

Inside your `package.json`, add the following to your `jest` config:

```json
{
  "jest": {
    "snapshotSerializers": [
      "jest-serializer-filepath"
    ]
  }
}
```
