import {Injectable} from '@angular/core';

@Injectable()
export class SubService {
  public getTitle() {
    return 'Angular App with Jest';
  }
}
