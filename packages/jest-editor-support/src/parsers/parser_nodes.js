/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 */

import type {Location} from '../types';

export type NodeType = 'expect' | 'describe' | 'it' | 'ROOT';

export class Node {
  type: NodeType;
  start: Location;
  end: Location;
  file: string;
  children: ?Array<Node>;

  constructor(type: NodeType, file: string) {
    this.type = type;
    this.file = file;
  }
  addChild(type: NodeType): NodeClass {
    let child: Node;

    switch (type) {
      case 'describe':
        child = new DescribeBlock(type, this.file);
        break;
      case 'it':
        child = new ItBlock(type, this.file);
        break;
      case 'expect':
        child = new Expect(type, this.file);
        break;
      default:
        throw TypeError(`unexpected child node type: ${type}`);
    }
    if (!this.children) {
      this.children = [child];
    } else {
      this.children.push(child);
    }
    return child;
  }
}

export class Expect extends Node {}

export class NamedBlock extends Node {
  name: string;
}

export class ItBlock extends NamedBlock {};
export class DescribeBlock extends NamedBlock {}

export type NodeClass = Node | Expect | ItBlock | DescribeBlock;

export class ParseResult {
  describeBlocks: Array<DescribeBlock>;
  expects: Array<Expect>;
  itBlocks: Array<ItBlock>;
  root: Node;

  constructor(file: string) {
    this.file = file;
    this.root = new Node('ROOT', file);

    this.describeBlocks = [];
    this.expects = [];
    this.itBlocks = [];
  }
  addNode(node: NodeClass, dedup = false) {
    if (node instanceof DescribeBlock) {
      this.describeBlocks.push(node);
    } else if (node instanceof ItBlock) {
      this.itBlocks.push(node);
    } else if (node instanceof Expect) {
      if (
        dedup &&
        this.expects.some(
          e =>
            e.start.line === node.start.line &&
            e.start.column === node.start.column,
        )
      ) {
        //found dup, return
        return;
      }

      this.expects.push(node);
    } else {
      throw new TypeError(`unexpected node class: ${node}`);
    }
  }
}
