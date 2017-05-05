/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule BlogPostLayout
 * @jsx React.DOM
 */
/* eslint-disable max-len */

const BlogPost = require('BlogPost');
const BlogSidebar = require('BlogSidebar');
const Container = require('Container');
const React = require('React');
const Site = require('Site');

const BlogPostLayout = React.createClass({
  render() {
    return (
      <Site
        className="sideNavVisible"
        section="blog"
        url={'blog/' + this.props.metadata.path}
        title={this.props.metadata.title}
        language={'en'}
        description={this.props.children.trim().split('\n')[0]}
      >
        <div className="docMainWrapper wrapper">
          <BlogSidebar language={'en'} current={this.props.metadata} />
          <Container className="mainContainer documentContainer postContainer blogContainer">
            <div className="lonePost">
              <BlogPost
                post={this.props.metadata}
                content={this.props.children}
                language={'en'}
              />
            </div>
          </Container>
        </div>
      </Site>
    );
  },
});

module.exports = BlogPostLayout;
