export default class Memory {
  current = 0;

  add(entry: number) {
    this.current += entry;

    return this.current;
  }

  subtract(entry: number) {
    this.current -= entry;

    return this.current;
  }

  reset() {
    this.current = 0;
  }
}
