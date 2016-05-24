/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogSidebar
 * @jsx React.DOM
 */

var MetadataBlog = require('MetadataBlog');
var React = require('React');
var Container = require('Container');
var SideNav = require('SideNav');

var BlogSidebar = React.createClass({
  render: function() {
    var contents = [{
      name: "Recent Posts",
      links: MetadataBlog.files,
    }];
    const title = this.props.current && this.props.current.title;
    var current = {
      id: title || '',
      category: "Recent Posts",
    };
    return (
      <Container className="docsNavContainer" id="docsNav" wrapper={false}>
        <SideNav
          root="/jest/blog/"
          title="Blog"
          contents={contents}
          current={current}
        />
      </Container>
    );
  }
});

module.exports = BlogSidebar;
