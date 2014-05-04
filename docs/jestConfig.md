You can write a `jestConfig.js` file at the root of your project.


```javascript
{
  "projectName": "jest",
```

The directories where tests are
```javascript
  "testPathDirs": [
    "."
  ],
```

Regexes of test files to ignore
```javascript
  "testPathIgnores": [
    "/node_modules/"
  ],
```

Regexes of module files to ignore
```javascript
  "moduleLoaderPathIgnores": [
    "/node_modules/"
  ]
}
```
