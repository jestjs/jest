/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { DataService } from './data.service';
import { SubService } from './sub.service';

const getTitleFn = jest.fn()
  .mockReturnValue('Test');
const subServiceSpy = jest.fn()
  .mockImplementation(() => ({
    getTitle: getTitleFn
  }))

describe('Service: DataService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DataService,
        // { provide: SubService, useValue: subServiceSpy() } this works
        { provide: SubService, useClass: subServiceSpy }
      ]
    });
  });

  it('should ...', inject([DataService], (service: DataService) => {
    expect(service).toBeTruthy();
  }));

});
