import {Injectable} from '@angular/core';

@Injectable()
export class SubService {
  public getTitle(): string {
    return 'Angular App with Jest24';
  }
}
