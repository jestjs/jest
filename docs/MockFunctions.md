Mock functions make it easy to test the links between functional code, both for mocked components, and when testing an API that takes a callback. Mock functions capture parameters, constructor calls, and support configurable return values.

There are two ways you get the mock functions. Either from a mocked component (See Automocks and manual mocks) or explicitly get one from 'jest-runtime':

```javascript
var f = require('mocks').getMockFunction();
f('1');
f('a', 'b');
console.log(f.mock.calls);
> [ [1], ['a', 'b'] ]
```

All mock functions have this special "mock" member, which is where data about how this function has been called is kept. The mock member also tracks the value of 'this' for each call, so

```javascript
var f = require('mocks').getMockFunction();

var a = new f();
var b = {};
var bound = f.bind(b);
bound();

console.log(f.mock.instances);
> [ <a>, <b> ]
```

These mock members are very useful in tests to assert how these functions get called, or instantiated:

```javascript
expect(someMockFunction.mock.calls.length).toBe(1);
expect(someMockFunction.mock.calls[0][0]).toBe('first arg');
expect(someMockFunction.mock.calls[0][1]).toBe('second arg');
expect(someMockFunction.mock.instances.length).toBe(2);
expect(someMockFunction.mock.instances[0].name).toEqual('test');
```

Mock functions can also be used to inject values into your test.

```javascript
var f = require('mocks').getMockFunction();
console.log( f() );
> undefined

f.mockReturnValue(10);
 .mockReturnValue('x');
 .mockDefaultReturnValue(true);

console.log(f(), f(), f(), f());
> 10, 'x', true, true
```

Mock functions can be used most effectively in code that uses functional callback or continuation passing style, rather than polymorphism and inheritance. Code written in this style eschews complicated stubs that recreate behavior of the real component they're standing in for in favor of injecting values directly into the test right before they're used.

```javascript
var Filter = require('Filter');

var f = require('mocks').getMockFunction();
// Filter constructor takes a "test" function
var filter = new Filter(f);

f.mockReturnValue(true).mockReturnValue(false);

var result = filter.run([11,12]);

console.log(result);
> [11]
console.log(f.mock.calls);
> [ [11] , [12] ]
```

Most real-world examples actually involve getting ahold of a mock function on a dependent component and configuring that, but the technique is the same. Avoid the temptation to implement logic inside of any function that's not directly under test.

Still, there are cases where it's useful to go beyond the ability to specify return values and replace an implementation of a mock function. Many of the mocks for core components have simple implementations to make testing easier. This can be done with the `mockImplementation` method on mock functions.

```javascript
var o = {
  f: require('mocks').getMockFunction().mockImplementation(function() {
    // do something stateful
    return this;
  });
};

o.f(1).f(2);
```

In this case, some sugar for methods that return `this` is provided in the form of `mockReturnThis`. The following are equivalent:

```javascript
var o = {
  f: require('mocks').getMockFunction().mockReturnThis()
};
```

and 

```javascript
var o = {
  f: require('mocks').getMockFunction().mockImplementation(function() {
    return this;
  })
};
```

To assert how the mock functions get called, we added some custom matcher functions to jasmine

```javascript
expect(mockFunc).toBeCalled();
expect(mockFunc).toBeCalledWith(a, b);
expect(mockFunc).lastCalledWith(a, b);
// Or use the bare values
expect(mockFunc.mock.calls.length).toBe(4);
expect(mockFunc.mock.calls[3][0]).toEqual(a);
```
