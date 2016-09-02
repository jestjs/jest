/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule DocsSidebar
 * @jsx React.DOM
 */

var Metadata = require('Metadata');
var React = require('React');
var Container = require('Container');
var SideNav = require('SideNav');

var DocsSidebar = React.createClass({
  getCategories: function() {
    var metadatas = Metadata.files.filter(function(metadata) {
      return metadata.layout === 'docs';
    });

    // Build a hashmap of article_id -> metadata
    var articles = {}
    for (var i = 0; i < metadatas.length; ++i) {
      var metadata = metadatas[i];
      articles[metadata.id] = metadata;
    }

    // Build a hashmap of article_id -> previous_id
    var previous = {};
    for (var i = 0; i < metadatas.length; ++i) {
      var metadata = metadatas[i];
      if (metadata.next) {
        if (!articles[metadata.next]) {
          throw '`next: ' + metadata.next + '` in ' + metadata.id + ' doesn\'t exist';
        }
        previous[articles[metadata.next].id] = metadata.id;
      }
    }

    // Find the first element which doesn't have any previous
    var first = null;
    for (var i = 0; i < metadatas.length; ++i) {
      var metadata = metadatas[i];
      if (!previous[metadata.id]) {
        first = metadata;
        break;
      }
    }

    var categories = [];
    var currentCategory = null;

    var metadata = first;
    var i = 0;
    while (metadata && i++ < 1000) {
      if (!currentCategory || metadata.category !== currentCategory.name) {
        currentCategory && categories.push(currentCategory);
        currentCategory = {
          name: metadata.category,
          links: []
        }
      }
      currentCategory.links.push(metadata);
      metadata = articles[metadata.next];
    }
    categories.push(currentCategory);

    return categories;
  },

  render: function() {
    return (
      <Container className="docsNavContainer" id="docsNav" wrapper={false}>
        <SideNav
          root="/jest/docs/getting-started.html"
          title="Docs"
          contents={this.getCategories()}
          current={this.props.metadata}
        />
      </Container>
    );
  }
});

module.exports = DocsSidebar;
