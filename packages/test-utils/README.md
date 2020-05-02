# test-utils

Private package exports utilities for multiple end-to-end tests or packages.

## alignedAnsiStyleSerializer

Display colors concisely and clearly so we can review changes quickly and confidently:

- reports when matchers fail
- annotation and comparison lines from differences

Raw snapshot avoids distracting `\\` or `\"` escape sequences from default string serialization.

Tag names have consistent length to align columns like `Expected` and `Received` or comparison lines:

|     | style      |
| --: | :--------- |
| `b` | `bold`     |
| `d` | `dim`      |
| `g` | `green`    |
| `i` | `inverse`  |
| `r` | `red`      |
| `y` | `yellow`   |
| `Y` | `bgYellow` |

```js
import {alignedAnsiStyleSerializer} from '@jest/test-utils';

expect.addSnapshotSerializer(alignedAnsiStyleSerializer);
```
