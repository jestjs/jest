---
id: architecture
title: Architecture
---

This diagram shows how Jest works to run your tests. Jest is composed of 51 modules up to this moment, however, to keep things a bit easier, we decided to focus at a higher level.

![](https://i.imgur.com/9smPBCb)

**Jest-Cli**: Module responsible for exposing the communication interface to the users.

**Jest-Config**: Module responsible for collecting user preferences, such as test runner, test environment, and plugins. For more information, read the Jest’s config page.

**Jest-Core**: Module responsible for collecting the user’s requests, normalizing them to the module's internal pattern of communication, and orchestrating its execution.

**Jest-Runtime**: Module responsible for dealing with the configuration and test environment. This module defines which additional features will come to play depending on the users’ execution environment (browser, nodejs).

**Jest-Haste-Map**: Module responsible for collecting all test files to create an internal representation, so as to localize it efficiently.

**Jest-Runner**: Module responsible for managing the execution of the tests. It decides which test runner should be invoked according to the users’ config.

**Jest-Reporters**: Module responsible for communicating the tests’ results, through events.

**Jest-Worker**: Module responsible for parallelizing tests’ execution, through nodejs workers.

**Jest-Circus**: Module responsible for running the tests effectively. It exposes the API used by users to implement the tests and it invokes them.

**Jest-Jasmine**: Module responsible for running the tests effectively. It exposes the API used by users to implement the tests and it invokes them.

import LiteYouTubeEmbed from 'react-lite-youtube-embed';

If you are interested in learning more about how Jest works, understand its architecture, and how Jest is split up into individual reusable packages, check out this video:

<LiteYouTubeEmbed id="3YDiloj8_d0" />

If you'd like to learn how to build a testing framework like Jest from scratch, check out this video:

<LiteYouTubeEmbed id="B8FbUK0WpVU" />

There is also a [written guide you can follow](https://cpojer.net/posts/building-a-javascript-testing-framework). It teaches the fundamental concepts of Jest and explains how various parts of Jest can be used to compose a custom testing framework.
