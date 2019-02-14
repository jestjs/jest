import diff from './diff';
import format from './format';
import {
  DeepDiffOptions,
  DiffPlugin,
  FormatPlugin,
  SerializePlugin,
} from './types';
import prettyFormat = require('pretty-format');
import {wrappedCircularSerializer} from './complex/circularObjects';
import reactElementPlugin from './plugins/reactElement';

const createSerialize = (plugins: Array<prettyFormat.NewPlugin>) => (
  val: unknown,
) =>
  prettyFormat(val, {
    plugins,
  });

function formatAndDiff(a: unknown, b: unknown, opts?: DeepDiffOptions): string {
  const providedPlugins = (opts && opts.plugins) || [reactElementPlugin];
  const formatPlugins: Array<FormatPlugin> = [];
  const diffPlugins: Array<DiffPlugin> = [];
  const serializePlugins: Array<SerializePlugin> = [wrappedCircularSerializer];
  for (const plugin of providedPlugins) {
    formatPlugins.push({
      format: plugin.format,
      test: plugin.test,
    });
    diffPlugins.push({
      diff: plugin.diff,
      test: plugin.test,
    });
    serializePlugins.push({
      serialize: plugin.serialize,
      test: plugin.test,
    });
  }

  return format(diff(a, b, undefined, undefined, diffPlugins), {
    serialize: createSerialize(serializePlugins),
    ...opts,
    plugins: formatPlugins,
  });
}

export default formatAndDiff;
