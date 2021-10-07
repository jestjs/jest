import {relative} from 'path';
import {codeFrameColumns} from '@babel/code-frame';
import {
  Context,
  ErrorNode,
  FrameNode,
  PathLocatorNode,
  PrintVisitor,
  SiteNode,
  getAbsoluteSitePath,
} from '@stack-tools/node-tools';
import chalk = require('chalk');
import * as fs from 'graceful-fs';
import micromatch = require('micromatch');
import type {Config} from '@jest/types';

type Path = Config.Path;

const PATH_NODE_MODULES = `/node_modules/`;
const PATH_JEST_PACKAGES = `/jest/packages/`;
const STACK_TRACE_COLOR = chalk.dim;
const NOT_EMPTY_LINE_REGEXP = /^(?!$)/gm;

const indentLines = (lines: string, indent: string = '  ') =>
  indent ? lines.replace(NOT_EMPTY_LINE_REGEXP, indent) : lines;

export type FileFrame = FrameNode & {
  type: 'CallSiteFrame';
  callSite: {
    site: {type: 'FileSite'; locator: {type: 'FileLocator' | 'URILocator'}};
  };
};

export const getTopFrame = (frames: Array<FrameNode>): FileFrame | null => {
  return (
    frames.find((frame): frame is FileFrame => {
      const absPath = getAbsoluteSitePath(frame);

      return (
        !!absPath &&
        !(
          absPath.includes(PATH_NODE_MODULES) ||
          absPath.includes(PATH_JEST_PACKAGES)
        )
      );
    }) || null
  );
};

export type JestVisitorOptions = {
  frames: boolean;
  rootDir: string;
  testMatch: Array<string>;
  noCodeFrame: boolean;
  noStackTrace: boolean;
  relativeTestPath: Path | null;
  indentHeader: string;
  indentFrames: string;
};

export class JestVisitor<O extends JestVisitorOptions> extends PrintVisitor<O> {
  constructor(context: Context, options: O) {
    super(context, options);
  }

  ErrorBody(error: ErrorNode): string | undefined {
    const header = this.ErrorHeader(error);
    const frames = this.Frames(error.frames);

    return frames && header ? `${header}\n\n${frames}` : header || frames;
  }

  ErrorHeader(error: ErrorNode): string | undefined {
    const {options} = this;
    const name = this.visit(error.name);
    const name_ = name === 'Error' ? undefined : name;
    const message = error.message ? this.visit(error.message) : '';
    const message_ = !name && message === 'Error' ? undefined : message;
    const header =
      message_ && name_ ? `${name_}: ${message_}` : name_ || message_;
    return header && indentLines(header, options.indentHeader);
  }

  Frames(frames: Array<FrameNode> | undefined): string | undefined {
    const {options} = this;
    if (!frames || !options.frames) return undefined;

    let codeFrame;
    if (!options.noCodeFrame) {
      const topSourceFrame = getTopFrame(frames);

      const absPath = topSourceFrame && getAbsoluteSitePath(topSourceFrame);
      if (topSourceFrame && absPath) {
        const {site} = topSourceFrame.callSite;

        if (site.position) {
          const {line, column} = site.position;
          let fileContent;
          try {
            // TODO: check & read HasteFS instead of reading the filesystem:
            // see: https://github.com/facebook/jest/pull/5405#discussion_r164281696
            fileContent = fs.readFileSync(absPath, 'utf8');
            codeFrame = codeFrameColumns(
              fileContent,
              {start: {column, line}},
              {highlightCode: true},
            );
          } catch {
            // the file does not exist or is inaccessible, we ignore
          }
        }
      }
    }

    const printedFrames = frames.map(frame => this.visit(frame)).join('\n');

    const printed =
      printedFrames && codeFrame
        ? `${codeFrame || ''}\n\n${printedFrames}`
        : codeFrame || printedFrames || '';

    return printed && indentLines(printed, options.indentFrames);
  }

  Frame(frame: FrameNode): string {
    return STACK_TRACE_COLOR(super.Frame(frame).slice(2));
  }

  PathLocator(locator: PathLocatorNode): string {
    const {options} = this;
    const {path} = locator;
    if (options.rootDir && path.startsWith('/')) {
      const relPath = relative(options.rootDir, path);
      return relPath;
    }
    return super.PathLocator(locator);
  }

  Site(site: SiteNode): string {
    const {options} = this;
    const {testMatch} = options;

    const printed = super.Site(site);
    const absPath = getAbsoluteSitePath(site);
    if (absPath) {
      const projPath = relative(options.rootDir, absPath);

      const isTestPath =
        (testMatch &&
          testMatch.length &&
          micromatch([projPath], testMatch).length > 0) ||
        projPath === options.relativeTestPath;

      if (isTestPath) return chalk.cyan(printed);
    }
    return printed;
  }
}
