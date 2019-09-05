# zone-patch
Enables Jest functions to be run within Zone.js context, specifically for [Angular](https://angular.io) apps.

It's crucial to run this patch here, because at this point patched functions like `test` or `describe` are available in global scope.

`zone-patch` has been included in `setupJest.js` by default.
