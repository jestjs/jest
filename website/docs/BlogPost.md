---
id: blog-post
title: Jest - Painless JavaScript Unit Testing
layout: docs
category: Blog Post
permalink: blog-post.html
previous: api
---

Testing is a crucial part of making a large scale application but is usually seen as a chore and difficult thing to do. Jest attempts to make it painless via two major innovations.

## CommonJS Modules

A lot of time, in order to test some code, you need to heavily refactor its structure in order to please your testing environment. The reason is that you need to provide two implementations for your dependencies, one for production and one for testing.

When looking at our codebase, we realized that all the dependencies for our modules were already expressed via the `require` call used by CommonJS module system. The natural next step is to write a custom `require` function when testing that is able to provide a different implementation.

The end result is that you are able to test any code that is using CommonJS without any big refactoring. It also doesn't have any performance impact on production code.

## Automatic Mocking

Once you have the ability to swap out the implementation, you still need to provide a mocked version for all the dependencies. This is a very repetitive task that is not very rewarding and can be automated.

Jest loads the real module, inspects its shape and gives a mocked module that has the same shape but where all the functions are replaced by mocked functions.

Jest is automatically mocking all the dependencies, this way your tests are isolated from the rest of the environment and are less likely to break. Also, since they are mocked, they are faster to re-load and can be run in parallel.

## Conclusion

Jest, like many things at Facebook, is the result of a couple engineers being frustrated by how painful it is to test and hacking the system to find a better solution.
