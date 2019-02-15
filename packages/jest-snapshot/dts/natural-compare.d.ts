// TODO Replace with @types/natural-compare when it is merged https://github.com/DefinitelyTyped/DefinitelyTyped/pull/33084
declare module 'natural-compare' {
  const NaturalCompare: (a: string, b: string) => number;
  export default NaturalCompare;
}
