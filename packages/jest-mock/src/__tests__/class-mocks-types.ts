export default class SuperTestClass {
  static staticTestProperty = 'staticTestProperty';

  static get staticTestAccessor(): string {
    return 'staticTestAccessor';
  }

  static set staticTestAccessor(_x: string) {
    return;
  }

  static staticTestMethod(): string {
    return 'staticTestMethod';
  }

  testProperty = 'testProperty';

  get testAccessor(): string {
    return 'testAccessor';
  }
  set testAccessor(_x: string) {
    return;
  }

  testMethod(): string {
    return 'testMethod';
  }
}

export class TestClass extends SuperTestClass {}
