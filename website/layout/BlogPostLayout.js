/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogPostLayout
 * @jsx React.DOM
 */

var BlogPost = require('BlogPost');
var BlogSidebar = require('BlogSidebar');
var Container = require('Container');
var React = require('React');
var Site = require('Site');

var BlogPostLayout = React.createClass({
  render: function() {
    return (
      <Site
        className="sideNavVisible"
        section="blog"
        url={'blog/' + this.props.metadata.path}
        title={this.props.metadata.title}
        description={this.props.children.trim().split('\n')[0]}>
        <div className="docMainWrapper wrapper">
          <BlogSidebar />
          <Container className="mainContainer documentContainer postContainer blogContainer">
            <div className="lonePost">
              <BlogPost post={this.props.metadata} content={this.props.children} />
            </div>
          </Container>
        </div>
      </Site>
    );
  }
});

module.exports = BlogPostLayout;
