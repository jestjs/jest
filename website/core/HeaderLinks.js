/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule HeaderLinks
 * @jsx React.DOM
 */

var MetadataBlog = require('MetadataBlog');
var React = require('React');

var HeaderLinks = React.createClass({
  linksInternal: [
    {section: 'docs', href: '/jest/docs/tutorial.html#content', text: 'docs'},
    {section: 'support', href: '/jest/support.html#content', text: 'support'},
    {section: 'blog', href: '/jest/blog/#content', text: 'blog'},
  ],
  linksExternal: [
    {section: 'github', href: 'https://github.com/facebook/jest', text: 'GitHub'},
  ],

  makeLinks: function(links) {
    return links.map(function(link) {
      return (
        <li key={link.section}>
          <a
            href={link.href}
            className={link.section === this.props.section ? 'active' : ''}>
            {link.text}
          </a>
        </li>
      );
    }, this);
  },

  render: function() {
    return (
      <div className="nav-site-wrapper">
        <ul className="nav-site nav-site-internal">
          {this.makeLinks(this.linksInternal)}
        </ul>

        <div className="algolia-search-wrapper">
          <input id="algolia-doc-search" type="text" placeholder="Search docs..." />
        </div>

        <ul className="nav-site nav-site-external">
          {this.makeLinks(this.linksExternal)}
        </ul>
      </div>
    );
  }
});

module.exports = HeaderLinks;
