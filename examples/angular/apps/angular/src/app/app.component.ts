import { Component } from '@angular/core';
import { DataService } from './shared/data.service';

@Component({
  selector: 'angular-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  public title: string;

  constructor(dataService: DataService) {
    this.title = dataService.getTitle();
  }
}
