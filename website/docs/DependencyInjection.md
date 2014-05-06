---
id: dependency-injection
title: Dependency Injection
layout: docs
category: Deep Dive
permalink: dependency-injection.html
previous: timer-mocks
next: api
---

Dependency Injection was popularized in the JavaScript community by Angular.
Jest implements this design pattern as well but in a very different way.

Why Dependency Injection?
-------------------------

In order to understand why we need to implement Dependency Injection in the context of testing, it is best to take a small example.
