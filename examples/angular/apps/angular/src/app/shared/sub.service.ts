import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SubService {

  constructor() { }

  public getTitle() {
    return 'Angular App with Jest24';
  }
}
