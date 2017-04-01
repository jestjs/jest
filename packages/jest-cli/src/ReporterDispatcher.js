import type BaseReporter from './reporters/BaseReporter';
import type {RunnerContext} from 'types/reporters';
import type {HasteFS} from 'types/HasteMap';
import type {Config} from 'types/Config';

class ReporterDispatcher {
  _disabled: boolean;
  _reporters: Array<BaseReporter>;
  _runnerContext: RunnerContext;

  constructor(hasteFS: HasteFS, getTestSummary: () => string) {
    this._runnerContext = {getTestSummary, hasteFS};
    this._reporters = [];

    this._requiredMethods = ['getLastError'];
  }

  register(reporter: Function): void {
    if (this._validateReporter(reporter)) {
      this._reporters.push(reporter);
    }
  }

  unregister(ReporterClass: Function) {
    this._reporters = this._reporters.filter(
      reporter => !(reporter instanceof ReporterClass),
    );
  }

  onTestResult(config: Config, testResult, results) {
    this._callReporterMethod('onTestResult', [
      config,
      testResult,
      results,
      this._runnerContext,
    ]);
  }

  onTestStart(config: Config, path) {
    this._callReporterMethod('onTestStart', [
      config,
      path,
      this._runnerContext,
    ]);
  }

  onRunStart(config: Config, results, options) {
    this._callReporterMethod('onRunStart', [
      config,
      results,
      this._runnerContext,
      options,
    ]);
  }

  onRunComplete(config: Config, results) {
    this._callReporterMethod('onRunComplete', [
      config,
      results,
      this._runnerContext,
    ]);
  }

  /**
   * Helper mehtod to call only the methods that exist
   * on a given reporter
   *
   * @  private
   * @param {string} method name of the mehtod to be called
   * @param {Array<any>} reporterArgs arguments passed in to call the reporter
   */
  _callReporterMethod(method: string, reporterArgs: Array<any>) {
    this._reporters.forEach(reporter => {
      if (reporter[method]) {
        reporter[method](...reporterArgs);
      }
    });
  }

  /**
   * _validateReporter
   * Validates the reporters to be added by checking for the required 
   * methods
   * 
   * @private
   * @param   {BaseReporter} reporter reporter to be validated
   * @returns {boolean} returns true if the reporter is validated
   */
  _validateReporter(reporter: Object | BaseReporter) {
    return this._requiredMethods.every(method => {
      if (!reporter[method]) {
        throw new Error(
          `Given method '${method}' does not exist on the reporter: ${reporter}`,
        );
      }

      return true;
    });
  }

  // Return a list of last errors for every reporter
  getErrors(): Array<Error> {
    return this._reporters.reduce(
      (list, reporter) => {
        const error = reporter.getLastError();
        return error ? list.concat(error) : list;
      },
      [],
    );
  }

  hasErrors(): boolean {
    return this.getErrors().length !== 0;
  }
}

module.exports = ReporterDispatcher;
