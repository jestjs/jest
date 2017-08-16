/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogSidebar
 * @jsx React.DOM
 */

/* eslint-disable sort-keys */

const MetadataBlog = require('MetadataBlog');
const React = require('React');
const Container = require('Container');
const SideNav = require('SideNav');

const BlogSidebar = React.createClass({
  render() {
    const contents = [
      {
        name: 'Recent Posts',
        links: MetadataBlog.files,
      },
    ];
    const title = this.props.current && this.props.current.title;
    const current = {
      id: title || '',
      category: 'Recent Posts',
    };
    return (
      <Container className="docsNavContainer" id="docsNav" wrapper={false}>
        <SideNav
          language={this.props.language}
          root="/jest/blog/"
          title="Blog"
          contents={contents}
          current={current}
        />
      </Container>
    );
  },
});

module.exports = BlogSidebar;
