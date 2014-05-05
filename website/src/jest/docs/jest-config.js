/**
 * @generated
 * @jsx React.DOM
 */
var React = require("React");
var layout = require("DocsLayout");
module.exports = React.createClass({
  render: function() {
    return layout({metadata: {"filename":"jestConfig.js","id":"jest-config","title":"Jest Config","layout":"docs","category":"Reference","permalink":"jest-config.html","previous":"api","href":"/jest/docs/jest-config.html"}}, `---

You can write a \`jestConfig.js\` file at the root of your project.


\`\`\`javascript
{
  "projectName": "jest",
\`\`\`

The directories where tests are
\`\`\`javascript
  "testPathDirs": [
    "."
  ],
\`\`\`

Regexes of test files to ignore
\`\`\`javascript
  "testPathIgnores": [
    "/node_modules/"
  ],
\`\`\`

Regexes of module files to ignore
\`\`\`javascript
  "moduleLoaderPathIgnores": [
    "/node_modules/"
  ]
}
\`\`\`
`);
  }
});
