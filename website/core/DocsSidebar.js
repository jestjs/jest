/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule DocsSidebar
 * @jsx React.DOM
 */

/* eslint-disable sort-keys */

const Metadata = require('Metadata');
const React = require('React');
const Container = require('Container');
const SideNav = require('SideNav');

class DocsSidebar extends React.Component {
  getCategories(language) {
    const metadatas = Metadata.files.filter(metadata => {
      return (
        metadata.layout === this.props.layout && metadata.language === language
      );
    });

    // Build a hashmap of article_id -> metadata
    const articles = {};
    for (let i = 0; i < metadatas.length; ++i) {
      const metadata = metadatas[i];
      articles[metadata.id] = metadata;
    }

    // Build a hashmap of article_id -> previous_id
    const previous = {};
    for (let i = 0; i < metadatas.length; ++i) {
      const metadata = metadatas[i];
      if (metadata.next) {
        if (!articles[metadata.next]) {
          throw new Error(
            '`next: ' + metadata.next + '` in ' + metadata.id + " doesn't exist"
          );
        }
        previous[articles[metadata.next].id] = metadata.id;
      }
    }

    // Find the first element which doesn't have any previous
    let first = null;
    for (let i = 0; i < metadatas.length; ++i) {
      const metadata = metadatas[i];
      if (!previous[metadata.id]) {
        first = metadata;
        break;
      }
    }

    const categories = [];
    let currentCategory = null;

    let metadata = first;
    let i = 0;
    while (metadata && i++ < 1000) {
      if (!currentCategory || metadata.category !== currentCategory.name) {
        currentCategory && categories.push(currentCategory);
        currentCategory = {
          name: metadata.category,
          links: [],
        };
      }
      currentCategory.links.push(metadata);
      metadata = articles[metadata.next];
    }
    categories.push(currentCategory);

    return categories;
  }

  render() {
    return (
      <Container className="docsNavContainer" id="docsNav" wrapper={false}>
        <SideNav
          language={this.props.metadata.language}
          root={this.props.root}
          title={this.props.title}
          contents={this.getCategories(this.props.metadata.language)}
          current={this.props.metadata}
        />
      </Container>
    );
  }
}

DocsSidebar.propTypes = {
  layout: React.PropTypes.string,
  root: React.PropTypes.string,
  title: React.PropTypes.string,
};

DocsSidebar.defaultProps = {
  layout: 'docs',
  root: '/jest/docs/en/getting-started.html',
  title: 'Docs',
};

module.exports = DocsSidebar;
