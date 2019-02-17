import output from '..';
import {Writable} from 'stream';

describe('@jest/output', () => {
  beforeEach(() => {
    output.setLogStream(process.stdout);
    output.setErrorStream(process.stderr);
  });
  describe('error', () => {
    it('writes to process.stderr by default', () => {
      const spy = jest.spyOn(process.stderr, 'write');
      // @ts-ignore
      spy.mockImplementation(() => {});
      output.error('error-test');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toEqual('error-test');
      spy.mockRestore();
    });
  });
  describe('log', () => {
    it('writes to process.stdout by default', () => {
      const spy = jest.spyOn(process.stdout, 'write');
      // @ts-ignore
      spy.mockImplementation(() => {});
      output.log('log-test');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toEqual('log-test');
      spy.mockRestore();
    });
  });
  describe('isTTY', () => {
    it('returns isTTY or undefined based on the current log stream', () => {
      expect(output.isTTY).toEqual(process.stdout.isTTY);
      const customStream = new Writable();
      output.setLogStream(customStream);
      expect(output.isTTY).toBeUndefined();
    });
  });
  describe('setErrorStream', () => {
    it('sets the error stream', () => {
      let data = '';
      const write = chunk => (data += chunk.toString());
      const stream = new Writable({write});
      const spy = jest.spyOn(process.stderr, 'write');
      output.setErrorStream(stream);
      output.error('error-test');
      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual('error-test');
    });
  });
  describe('setLogStream', () => {
    it('sets the log stream', () => {
      let data = '';
      const write = chunk => (data += chunk.toString());
      const stream = new Writable({write});
      const spy = jest.spyOn(process.stdout, 'write');
      output.setLogStream(stream);
      output.log('log-test');
      expect(spy).not.toHaveBeenCalled();
      expect(data).toEqual('log-test');
    });
  });
});
