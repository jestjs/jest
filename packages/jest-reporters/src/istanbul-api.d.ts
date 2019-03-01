declare module 'istanbul-api' {
  class Reporter {
    constructor(config?: object, options?: object);
    add(format: string): void;
    addAll(formats: string[]): void;
    write(coverageMap: object, options: object): void;
    config: object;
    dir: string;
    reports: object;
    summarizer: string;
  }

  function createReporter(config?: object, options?: object): Reporter;
}
