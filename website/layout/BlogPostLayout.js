/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogPostLayout
 * @jsx React.DOM
 */

var BlogPost = require('BlogPost');
var BlogSidebar = require('BlogSidebar');
var Marked = require('Marked');
var MetadataBlog = require('MetadataBlog');
var React = require('React');
var Site = require('Site');

var BlogPostLayout = React.createClass({
  render: function() {
    return (
      <Site
        section="blog"
        title={this.props.metadata.title}
        description={this.props.children.trim().split('\n')[0]}>
        <section className="content wrap documentationContent">
          <BlogSidebar title={this.props.metadata.title} />
          <div className="inner-content">
            <BlogPost post={this.props.metadata} content={this.props.children} />
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = BlogPostLayout;
