/**
 * Copyright (c) Facebook, Inc. and its affiliates. All Rights Reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {pathToFileURL} from 'url';
import {requireOrImportModule} from 'jest-util';
import type {
  Options,
  ReducedTransformOptions,
  RequireAndTranspileModuleOptions,
} from './types';
import type {ScriptTransformer, TransformResult} from '.';

// https://nodejs.org/api/esm.html#loadurl-context-nextload
interface NodeEsmLoader {
  load(
    url: string,
    context: {
      format: string;
      importAssertions: Record<string, string>;
    },
    defaultLoad: NodeEsmLoader['load'],
  ): Promise<{
    format: string;
    source: string | ArrayBuffer | SharedArrayBuffer | Uint8Array;
  }>;
}

const reLoader =
  /--loader\s+((@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*)/;

class NodeEsmLoaderTransformer implements ScriptTransformer {
  private readonly _loader: NodeEsmLoader;

  constructor(loader: NodeEsmLoader) {
    this._loader = loader;
  }

  transformSource(
    _: string,
    __: string,
    ___: ReducedTransformOptions,
  ): TransformResult {
    throw new Error(
      'Synchrnous transforms are not supported when using --loader',
    );
  }

  async transformSourceAsync(
    _: string,
    __: string,
    ___: ReducedTransformOptions,
  ): Promise<TransformResult> {
    return Promise.reject(
      new Error(
        '`transformSourceAsync` should not be called when using --loader',
      ),
    );
  }

  transform(_: string, __: Options, ___?: string): TransformResult {
    throw new Error(
      'Synchrnous transforms are not supported when using --loader',
    );
  }

  transformJson(_: string, __: any, fileSource: string): string {
    return fileSource;
  }

  async transformAsync(
    filename: string,
    _: unknown,
    fileSource: string,
  ): Promise<TransformResult> {
    const url = pathToFileURL(filename).href;

    const result = await this._loader.load(
      url,
      {format: 'module', importAssertions: {}},
      async () => {
        return Promise.resolve({format: 'module', source: fileSource});
      },
    );

    return {
      code:
        typeof result.source === 'string'
          ? result.source
          : new TextDecoder().decode(result.source),
      originalCode: fileSource,
      sourceMapPath: null,
    };
  }

  async requireAndTranspileModule<ModuleType = unknown>(
    moduleName: string,
    callback?: (module: ModuleType) => void | Promise<void>,
    options?: RequireAndTranspileModuleOptions,
  ): Promise<ModuleType> {
    if (callback) {
      throw new Error(
        '`requireAndTranspileModule` with a callback should not be called when using --loader',
      );
    }

    if (options) {
      throw new Error(
        '`requireAndTranspileModule` with options should not be called when using --loader',
      );
    }

    return requireOrImportModule(moduleName);
  }
}

export async function createNodeEsmLoaderTransformer(): Promise<ScriptTransformer | null> {
  const match = reLoader.exec(process.env.NODE_OPTIONS ?? '');
  if (match == null) return null;

  const loaderName = match[1];
  const loader = (await import(loaderName)) as NodeEsmLoader;

  return new NodeEsmLoaderTransformer(loader);
}
