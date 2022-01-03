export default class Memory {
  current: number;

  constructor() {
    this.current = 0;
  }

  add(entry: number):number {
    this.current += entry;

    return this.current;
  }

  subtract(entry: number):number {
    this.current -= entry;

    return this.current;
  }

  reset():void {
    this.current = 0;
  }
}
