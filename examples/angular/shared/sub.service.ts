import {Injectable} from '@angular/core';

@Injectable({providedIn: 'root'})
export class SubService {
  public getTitle() {
    return 'Angular App with Jest';
  }
}
