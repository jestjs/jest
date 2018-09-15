

Yes, you can safely assume tests inside a single file will run in the order of appearance. You could prove this by putting a console.log in each it block.

It's probably worth mentioning that it's generally bad practice to rely on the order of execution / external state...and you never know, Jest (or the current underlying test runner, Jasmine) may decide to run them in a random order in a newer version.

