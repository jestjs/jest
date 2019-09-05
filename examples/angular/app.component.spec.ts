import { TestBed, async } from '@angular/core/testing';

import { AppComponent } from './app.component';
import { DataService } from './shared/data.service';

const title = 'Test';
const getTitleFn = jest.fn()
  .mockReturnValue(title);
const dataServiceSpy = jest.fn()
  .mockImplementation((): Partial<DataService> => ({
    getTitle: getTitleFn
  }))

describe('AppComponent', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppComponent],
      providers: [
        { provide: DataService, useClass: dataServiceSpy }
      ]
    }).compileComponents();
  }));

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'angular'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app.title).toEqual(title);
  });

  it('should render title in a h1 tag', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.debugElement.nativeElement;
    expect(compiled.querySelector('h1').textContent).toContain(
      `Welcome to ${title}!`
    );
  });
});