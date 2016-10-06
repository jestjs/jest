/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */

'use strict';

const naturalCompare = require('natural-compare');

const fullTemplate = ({keys, previews, css}) => `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Snapshot preview</title>
    <style>
      body.jest {
        display: flex;
        flex-direction: row;
        margin: 0;
        padding: 0;
        height: 100vh;
      }
      .jest--sidebar {
        width: 18em;
        padding: 0.3em 0;
        background-color: #eee;
        font-family: sans-serif;
        font-size: 0.8em;
      }
      .jest--preview {
        flex: 1;
        display: none;
        transform: translateZ(0);
      }
      .jest--preview.shown { display: block; }
      .jest--key {
        padding: 0.3em 1em;
        cursor: pointer;
      }
      .jest--key.shown { background-color: #ca461a; color: white; }
      .jest--key:hover { background-color: #ddd; }
      .jest--key.shown:hover { background-color: #ba360a; }
      pre.jest--nonreact { padding: 10px }
      
      ${css}
    </style>
    <script type="text/javascript">
      function removeClass(className, classToRemove) {
        var idx;
        var el;
        var classes;
        var els = document.getElementsByClassName(className);
        for (var i = 0; i < els.length; i++) {
          el = els[i];
          classes = el.className.split(' ');
          idx = classes.indexOf(classToRemove);
          if (idx >= 0) {
            classes.splice(idx, 1);
            el.className = classes.join(' ');
          }
        };
      }
      function onClick(id) {
        removeClass('jest--key', 'shown');
        removeClass('jest--preview', 'shown');
        el = document.getElementById('jest--preview_' + id);
        if (el) el.className += ' shown';
        el = document.getElementById('jest--key_' + id);
        if (el) el.className += ' shown';
      }
    </script>
  </head>
  <body class="jest">
    <div class="jest--sidebar">
${keys}
    </div>
${previews}
  </body>
</html>
`;

const keyTemplate = (key, idx) => `
      <div class="jest--key${idx === 0 ? ' shown' : ''}"
           id="jest--key_${key}"
           onclick="onClick('${key}')">
        ${key}
      </div>
`;

/* eslint-disable max-len */
const previewTemplate = (key, idx, htmlSnapshot) => `
    <div id="jest--preview_${key}" class="jest--preview${idx === 0 ? ' shown' : ''}">
      ${htmlSnapshot}
    </div>
`;
/* eslint-enable max-len */

module.exports = (
  htmlSnapshots: {[key: string]: string},
  css: ?string,
): string => {
  const keys = [];
  const previews = [];
  Object.keys(htmlSnapshots).sort(naturalCompare).forEach((key, idx) => {
    keys.push(keyTemplate(key, idx));
    previews.push(previewTemplate(key, idx, htmlSnapshots[key]));
  });
  return fullTemplate({
    keys: keys.join(''),
    previews: previews.join(''),
    css: css || '',
  });
};
