import {pathToFileURL} from 'url';
import interopRequireDefault from './interopRequireDefault';

export default async function importModule<T>(filePath: string): Promise<T> {
  let module: T;
  try {
    module = interopRequireDefault(require(filePath)).default;
  } catch (error) {
    if (error.code === 'ERR_REQUIRE_ESM') {
      const configUrl = pathToFileURL(filePath);

      // node `import()` supports URL, but TypeScript doesn't know that
      const importedConfig = await import(configUrl.href);

      if (!importedConfig.default) {
        throw new Error(
          `Jest: Failed to load ESM at ${filePath} - did you use a default export?`,
        );
      }

      module = importedConfig.default;
    } else {
      throw error;
    }
  }
  return module;
}
