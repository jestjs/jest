/* eslint-disable sort-keys */

const fs = require('fs');
const path = require('path');
const Feed = require('feed');

const blogFolder = path.resolve('../blog/');
const blogRootURL = 'https://facebook.github.io/jest/blog/';
const jestImage = (
  'https://cdn.rawgit.com/facebook/jest/' +
  'master/packages/jest-cli/src/assets/jest_logo.png'
);

const getURLFromFile = file => {
  const url = (
    file.substring(0, 11).split('-').join('/') +
    file.substring(11).replace(/\.md$/, '.html')
  );
  return (
    `${blogRootURL}${url}`
  );
};

const retrieveMetaData = file => {
  const postPieces = String(
    fs.readFileSync(
      path.join(blogFolder, file)
    )
  ).split('---');
  const header = postPieces[1];
  const post = postPieces.slice(2).join('---');

  const indexOfTruncate = post.indexOf('<!--truncate-->');

  // if there's no truncate tag just take the first paragraph.
  const postExcerpt = (
    indexOfTruncate === -1 ?
    post.replace(/\n\r/g, '\n').split('.\n\n')[0] :
    post.substring(0, indexOfTruncate)
  );

  return (
    header
      .split('\n')
      .filter(x => x)
      .reduce(
        (metadata, str) => {
          const matches = /(.*?): (.*)/.exec(str);
          metadata[matches[1]] = matches[2];
          return metadata;
        }, {
          url: getURLFromFile(file),
          description: postExcerpt,
        }
      )
  );
};

module.exports = function(type) {
  type = type || 'rss';

  const posts = Object.create(null);

  fs.readdirSync(blogFolder).forEach(file => {
    posts[file.substring(0, 10)] = retrieveMetaData(file);
  });
  const allPosts = Object.keys(posts).sort().reverse();

  const feed = new Feed({
    title: 'Jest Blog',
    description:
      'The best place to stay up-to-date with the latest Jest news and events.',
    id: blogRootURL,
    link: blogRootURL,
    image: jestImage,
    copyright: 'Copyright © ' + new Date().getFullYear() + ' Facebook Inc.',
    updated: new Date(allPosts[0] + 'T06:00:00'),
  });

  allPosts.forEach(key => {
    const post = posts[key];
    feed.addItem({
      title: post.title,
      link: post.url,
      author: [{
        name: post.author,
        link: post.authorURL,
      }],
      date: new Date(key + 'T06:00:00'),
      description: post.description,
    });
  });

  return (
    type === 'rss' ? feed.render('rss-2.0') : feed.render('atom-1.0')
  );
};
