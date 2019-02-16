// TODO replace with @types/co when it is merged https://github.com/DefinitelyTyped/DefinitelyTyped/pull/33120
declare module 'co' {
  type ExtractType<T> = T extends IterableIterator<infer R> ? R : never;

  interface Co {
    <F extends (...args: any[]) => Generator>(
      fn: F,
      ...args: Parameters<F>
    ): Promise<ExtractType<ReturnType<F>>>;
    default: Co;
    co: Co;
    wrap: <F extends (...args: any[]) => Generator>(
      fn: F,
    ) => (...args: Parameters<F>) => Promise<ExtractType<ReturnType<F>>>;
  }

  const co: Co;

  export = co;
}
