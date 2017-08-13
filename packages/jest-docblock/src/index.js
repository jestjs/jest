/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

type DocblockNode =
  | {
      type: 'comment',
      value: string,
    }
  | {
      name: string,
      type: 'directive',
      value: string,
    };

class Docblock {
  code: string;
  nodes: Array<DocblockNode>;
  restOfTheFile: string;
  originalDocblock: string;
  docblock: string;

  constructor(code: string) {
    this.code = code;
    const {nodes, restOfTheFile, docblock, originalDocblock} = Docblock.parse(
      code,
    );

    this.nodes = nodes;
    this.restOfTheFile = restOfTheFile;
    this.docblock = docblock;
    this.originalDocblock = originalDocblock;
  }

  printFileContent() {
    const docblock = this.printDocblock();
    const restOfTheFile = this.restOfTheFile.replace(/^\s+/g, '');
    const separator = docblock ? '\n\n' : '';
    return docblock + separator + restOfTheFile;
  }

  printDocblock() {
    if (!this.nodes.length) {
      return '';
    }

    const content = this.nodes.map(node => {
      switch (node.type) {
        case 'directive': {
          const value = node.value
            .split('\n')
            .map(
              (line, index) =>
                // If it's a multiline directive we force add indentation for
                // other lines if there isn't any already.
                index > 0 && !line.match(/^\s+/) ? `  ${line}` : line,
            )
            .join('\n * ');
          return ` * @${node.name}${value ? ' ' + value : ''}`;
        }
        case 'comment': {
          return ` *${node.value ? ' ' + node.value : ''}`;
        }
        default:
          throw new Error(`unrecognized type ${node.type}`);
      }
    });

    return '/**\n' + content.join('\n') + '\n */';
  }

  setDirective(name: string, value: string = '') {
    const existingDirective = this.nodes.find(
      node => node.type === 'directive' && node.name === name,
    );

    existingDirective
      ? (existingDirective.value = value)
      : this.nodes.push({
          name,
          type: 'directive',
          value,
        });
  }

  deleteDirective(name: string) {
    // $FlowFixMe
    this.nodes = this.nodes.filter(node => node.name !== name);
  }

  getDirectives(): {[name: string]: string} {
    return this.nodes
      .filter(node => node.type === 'directive')
      .reduce((directives, node) => {
        // $FlowFixMe filter
        directives[node.name] = node.value;
        return directives;
      }, {});
  }

  static parse(code: string) {
    const DOCBLOCK_RE = /^(\s*)(\/\*\*?(.|\r?\n)*?\*\/)/;

    const docblockMatch = code.match(DOCBLOCK_RE);
    const originalDocblock = docblockMatch ? docblockMatch[0] || '' : '';
    const restOfTheFile = docblockMatch
      ? // $FlowFixMe match object is weird
        code.slice(docblockMatch.index + docblockMatch[0].length, code.length)
      : code;

    // only text, without `*` or `/**` or `*/`
    const docblock = originalDocblock
      .trim()
      // leading ` /**` or ` /*`
      .replace(/^\s*\/\*\*? */g, '')
      // leading ` * ` in ` * Some content`
      .replace(/^\s+\*\/? ?/gm, '')
      .replace(/\*\/$/, '')
      .trim();

    const nodes = docblock ? Docblock._parseNodes(docblock) : [];

    return {
      docblock,
      nodes,
      originalDocblock,
      restOfTheFile,
    };
  }

  static _parseNodes(docblock: string): Array<DocblockNode> {
    const nodes: Array<DocblockNode> = [];

    for (const line of docblock.trim().split('\n')) {
      const matchDirective = line.match(/^\s*@([\w\-]+)/);

      // It it starts from `@` we always assume that this is a new directive
      if (matchDirective) {
        const name = matchDirective[1];
        // THIS WONT WORK if theres a leading space
        const value = line
          // $FlowFixMe match object is weird
          .slice(matchDirective.index + matchDirective[0].length, line.length)
          .trim();
        nodes.push({
          name,
          type: 'directive',
          value,
        });
      } else if (
        // if the previous node was a directive and the next line is indented,
        // we assume that this is a multiline directive declaration.
        nodes.length &&
        nodes[nodes.length - 1].type === 'directive' &&
        line.match(/^\s+/)
      ) {
        nodes[nodes.length - 1].value += '\n' + line;
      } else {
        nodes.push({
          type: 'comment',
          value: line,
        });
      }
    }

    return nodes;
  }
}

module.exports = Docblock;
