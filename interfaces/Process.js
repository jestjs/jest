export interface Process {
  stdout : stream$Writable | tty$WriteStream;
  exit(code? : number) : void;
};
