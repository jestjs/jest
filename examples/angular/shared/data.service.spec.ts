import {TestBed} from '@angular/core/testing';
import {beforeEach, describe, expect, it, jest} from '@jest/globals';
import {DataService} from './data.service';
import {SubService} from './sub.service';

const title = 'SubTest';
const getTitleFn = jest.fn().mockReturnValue(title);
const subServiceMock: Partial<SubService> = {
  getTitle: getTitleFn,
};

describe('Service: DataService', () => {
  let service: DataService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [DataService, {provide: SubService, useValue: subServiceMock}],
    });

    service = TestBed.inject(DataService);
  });

  it('should create service', () => {
    expect(service).toBeTruthy();
  });

  it('should return the right title', () => {
    expect(service.getTitle()).toEqual(title);
  });
});
