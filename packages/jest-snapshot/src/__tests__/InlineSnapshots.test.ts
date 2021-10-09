/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

jest.mock(require.resolve('prettier'), () => require('../__mocks__/prettier'));

import {tmpdir} from 'os';
import * as path from 'path';
const prettier = require(require.resolve('prettier'));
import * as fs from 'graceful-fs';
import {Frame} from 'jest-message-util';
import {saveInlineSnapshots} from '../InlineSnapshots';

let dir;
beforeEach(() => {
  (prettier.resolveConfig.sync as jest.Mock).mockReset();
});

beforeEach(() => {
  dir = path.join(tmpdir(), `jest-inline-snapshot-test-${Date.now()}`);
  fs.mkdirSync(dir);
});

test('saveInlineSnapshots() replaces empty function call with a template literal', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(filename, `expect(1).toMatchInlineSnapshot();\n`);

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1} as Frame,
        snapshot: `1`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    'expect(1).toMatchInlineSnapshot(`1`);\n',
  );
});

test('saveInlineSnapshots() without prettier leaves formatting outside of snapshots alone', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    `
const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`an out-of-date and also multi-line
snapshot\`);
expect(a).toMatchInlineSnapshot();
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [2, 4, 5].map(line => ({
      frame: {column: 11, file: filename, line} as Frame,
      snapshot: `[1, 2]`,
    })),
    null,
  );

  expect(fs.readFileSync(filename, 'utf8')).toBe(
    `const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`,
  );
});

test('saveInlineSnapshots() with bad prettier path leaves formatting outside of snapshots alone', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    `
const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`an out-of-date and also multi-line
snapshot\`);
expect(a).toMatchInlineSnapshot();
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [2, 4, 5].map(line => ({
      frame: {column: 11, file: filename, line} as Frame,
      snapshot: `[1, 2]`,
    })),
    'bad-prettier',
  );

  expect(fs.readFileSync(filename, 'utf8')).toBe(
    `const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`,
  );
});

test('saveInlineSnapshots() can handle typescript without prettier', () => {
  const filename = path.join(dir, 'my.test.ts');
  fs.writeFileSync(
    filename,
    `
interface Foo {
  foo: string
}
const a: [Foo, Foo] = [{ foo: 'one' },            { foo: 'two' }];
expect(a).toMatchInlineSnapshot();
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 5} as Frame,
        snapshot: `[{ foo: 'one' }, { foo: 'two' }]`,
      },
    ],
    null,
  );

  expect(fs.readFileSync(filename, 'utf8')).toBe(
    `
interface Foo {
  foo: string
}
const a: [Foo, Foo] = [{ foo: 'one' },            { foo: 'two' }];
expect(a).toMatchInlineSnapshot(\`[{ foo: 'one' }, { foo: 'two' }]\`);
`.trim() + '\n',
  );
});

test('saveInlineSnapshots() can handle tsx without prettier', () => {
  const filename = path.join(dir, 'my.test.tsx');
  fs.writeFileSync(
    filename,
    `
it('foos', async () => {
  const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
  const a = await Foo({ foo: "hello" });
  expect(a).toMatchInlineSnapshot();
})
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 13, file: filename, line: 4} as Frame,
        snapshot: `<div>hello</div>`,
      },
    ],
    null,
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    `
it('foos', async () => {
  const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
  const a = await Foo({ foo: "hello" });
  expect(a).toMatchInlineSnapshot(\`<div>hello</div>\`);
})
`.trim() + '\n',
  );
});

test('saveInlineSnapshots() can handle flow and jsx without prettier', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    `
const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
const a = Foo({ foo: "hello" });
expect(a).toMatchInlineSnapshot();
`.trim() + '\n',
  );
  fs.writeFileSync(
    path.join(dir, '.babelrc'),
    JSON.stringify({
      presets: [
        require.resolve('@babel/preset-flow'),
        require.resolve('@babel/preset-react'),
      ],
    }),
  );

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 3} as Frame,
        snapshot: `<div>hello</div>`,
      },
    ],
    null,
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    `
const Foo = (props: { foo: string }) => <div>{props.foo}</div>;
const a = Foo({ foo: "hello" });
expect(a).toMatchInlineSnapshot(\`<div>hello</div>\`);
`.trim() + '\n',
  );
});

test('saveInlineSnapshots() can use prettier to fix formatting for whole file', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    `
const a = [1,            2];
expect(a).toMatchInlineSnapshot(\`an out-of-date and also multi-line
snapshot\`);
expect(a).toMatchInlineSnapshot();
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`.trim() + '\n',
  );

  saveInlineSnapshots(
    [2, 4, 5].map(line => ({
      frame: {column: 11, file: filename, line} as Frame,
      snapshot: `[1, 2]`,
    })),
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    `const a = [1, 2];
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
expect(a).toMatchInlineSnapshot(\`[1, 2]\`);
`,
  );
});

test.each([['babel'], ['flow'], ['typescript']])(
  'saveInlineSnapshots() replaces existing template literal - %s parser',
  parser => {
    const filename = path.join(dir, 'my.test.js');
    fs.writeFileSync(filename, 'expect(1).toMatchInlineSnapshot(`2`);\n');

    (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({parser});

    saveInlineSnapshots(
      [
        {
          frame: {column: 11, file: filename, line: 1} as Frame,
          snapshot: `1`,
        },
      ],
      'prettier',
    );

    expect(
      (prettier.resolveConfig.sync as jest.Mock).mock.results[0].value,
    ).toEqual({parser});

    expect(fs.readFileSync(filename, 'utf-8')).toBe(
      'expect(1).toMatchInlineSnapshot(`1`);\n',
    );
  },
);

test('saveInlineSnapshots() replaces existing template literal with property matchers', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(filename, 'expect(1).toMatchInlineSnapshot({}, `2`);\n');

  saveInlineSnapshots(
    [
      {
        frame: {column: 11, file: filename, line: 1} as Frame,
        snapshot: `1`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    'expect(1).toMatchInlineSnapshot({}, `1`);\n',
  );
});

test.each(['prettier', null])(
  'saveInlineSnapshots() creates template literal with property matchers',
  prettierModule => {
    const filename = path.join(dir, 'my.test.js');
    fs.writeFileSync(filename, 'expect(1).toMatchInlineSnapshot({});\n');

    saveInlineSnapshots(
      [
        {
          frame: {column: 11, file: filename, line: 1} as Frame,
          snapshot: `1`,
        },
      ],
      prettierModule,
    );

    expect(fs.readFileSync(filename, 'utf-8')).toBe(
      'expect(1).toMatchInlineSnapshot({}, `1`);\n',
    );
  },
);

test('saveInlineSnapshots() throws if frame does not match', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(filename, 'expect(1).toMatchInlineSnapshot();\n');

  const save = () =>
    saveInlineSnapshots(
      [
        {
          frame: {
            column: 2 /* incorrect */,
            file: filename,
            line: 1,
          } as Frame,
          snapshot: `1`,
        },
      ],
      'prettier',
    );

  expect(save).toThrowError(/Couldn't locate all inline snapshots./);
});

test('saveInlineSnapshots() throws if multiple calls to to the same location', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(filename, 'expect(1).toMatchInlineSnapshot();\n');

  const frame = {column: 11, file: filename, line: 1} as Frame;
  const save = () =>
    saveInlineSnapshots(
      [
        {frame, snapshot: `1`},
        {frame, snapshot: `2`},
      ],
      'prettier',
    );

  expect(save).toThrowError(
    /Multiple inline snapshots for the same call are not supported./,
  );
});

test('saveInlineSnapshots() uses escaped backticks', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(filename, 'expect("`").toMatchInlineSnapshot();\n');

  const frame = {column: 13, file: filename, line: 1} as Frame;
  saveInlineSnapshots([{frame, snapshot: '`'}], 'prettier');

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    'expect("`").toMatchInlineSnapshot(`\\``);\n',
  );
});

test('saveInlineSnapshots() works with non-literals in expect call', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(filename, `expect({a: 'a'}).toMatchInlineSnapshot();\n`);
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 18, file: filename, line: 1} as Frame,
        snapshot: `{a: 'a'}`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    "expect({a: 'a'}).toMatchInlineSnapshot(`{a: 'a'}`);\n",
  );
});

test('saveInlineSnapshots() indents multi-line snapshots with spaces', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    "it('is a test', () => {\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot();\n" +
      '});\n',
  );
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 20, file: filename, line: 2} as Frame,
        snapshot: `\nObject {\n  a: 'a'\n}\n`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    "it('is a test', () => {\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot(`\n" +
      '    Object {\n' +
      "      a: 'a'\n" +
      '    }\n' +
      '  `);\n' +
      '});\n',
  );
});

test('saveInlineSnapshots() does not re-indent error snapshots', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    "it('is an error test', () => {\n" +
      '  expect(() => {\n' +
      "    throw new Error(['a', 'b'].join('\\n'));\n" +
      '  }).toThrowErrorMatchingInlineSnapshot(`\n' +
      '    "a\n' +
      '    b"\n' +
      '  `);\n' +
      '});\n' +
      "it('is another test', () => {\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot();\n" +
      '});\n',
  );
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 20, file: filename, line: 10} as Frame,
        snapshot: `\nObject {\n  a: 'a'\n}\n`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    "it('is an error test', () => {\n" +
      '  expect(() => {\n' +
      "    throw new Error(['a', 'b'].join('\\n'));\n" +
      '  }).toThrowErrorMatchingInlineSnapshot(`\n' +
      '    "a\n' +
      '    b"\n' +
      '  `);\n' +
      '});\n' +
      "it('is another test', () => {\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot(`\n" +
      '    Object {\n' +
      "      a: 'a'\n" +
      '    }\n' +
      '  `);\n' +
      '});\n',
  );
});

test('saveInlineSnapshots() does not re-indent already indented snapshots', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    "it('is a test', () => {\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot();\n" +
      '});\n' +
      "it('is a another test', () => {\n" +
      "  expect({b: 'b'}).toMatchInlineSnapshot(`\n" +
      '    Object {\n' +
      "      b: 'b'\n" +
      '    }\n' +
      '  `);\n' +
      '});\n',
  );
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 20, file: filename, line: 2} as Frame,
        snapshot: `\nObject {\n  a: 'a'\n}\n`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    "it('is a test', () => {\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot(`\n" +
      '    Object {\n' +
      "      a: 'a'\n" +
      '    }\n' +
      '  `);\n' +
      '});\n' +
      "it('is a another test', () => {\n" +
      "  expect({b: 'b'}).toMatchInlineSnapshot(`\n" +
      '    Object {\n' +
      "      b: 'b'\n" +
      '    }\n' +
      '  `);\n' +
      '});\n',
  );
});

test('saveInlineSnapshots() indents multi-line snapshots with tabs', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    "it('is a test', () => {\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot();\n" +
      '});\n',
  );
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
    useTabs: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 20, file: filename, line: 2} as Frame,
        snapshot: `\nObject {\n  a: 'a'\n}\n`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    "it('is a test', () => {\n" +
      "\texpect({a: 'a'}).toMatchInlineSnapshot(`\n" +
      '\t\tObject {\n' +
      "\t\t  a: 'a'\n" +
      '\t\t}\n' +
      '\t`);\n' +
      '});\n',
  );
});

test('saveInlineSnapshots() indents snapshots after prettier reformats', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    "it('is a test', () => expect({a: 'a'}).toMatchInlineSnapshot());\n",
  );
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 40, file: filename, line: 1} as Frame,
        snapshot: `\nObject {\n  a: 'a'\n}\n`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    "it('is a test', () =>\n" +
      "  expect({a: 'a'}).toMatchInlineSnapshot(`\n" +
      '    Object {\n' +
      "      a: 'a'\n" +
      '    }\n' +
      '  `));\n',
  );
});

test('saveInlineSnapshots() does not indent empty lines', () => {
  const filename = path.join(dir, 'my.test.js');
  fs.writeFileSync(
    filename,
    "it('is a test', () => expect(`hello\n\nworld`).toMatchInlineSnapshot());\n",
  );
  (prettier.resolveConfig.sync as jest.Mock).mockReturnValue({
    bracketSpacing: false,
    singleQuote: true,
  });

  saveInlineSnapshots(
    [
      {
        frame: {column: 9, file: filename, line: 3} as Frame,
        snapshot: `\nhello\n\nworld\n`,
      },
    ],
    'prettier',
  );

  expect(fs.readFileSync(filename, 'utf-8')).toBe(
    "it('is a test', () =>\n" +
      '  expect(`hello\n\nworld`).toMatchInlineSnapshot(`\n' +
      '    hello\n' +
      '\n' +
      '    world\n' +
      '  `));\n',
  );
});
