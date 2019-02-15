import {StackData} from 'stack-utils';

export interface Frame extends StackData {
  file: string;
}
