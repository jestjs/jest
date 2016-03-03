/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule HeaderLinks
 * @jsx React.DOM
 */

var MetadataBlog = require('MetadataBlog');
var React = require('React');

var HeaderLinks = React.createClass({
  links: [
    {section: 'docs', href: '/jest/docs/tutorial.html#content', text: 'docs'},
    {section: 'support', href: '/jest/support.html', text: 'support'},
    MetadataBlog.files.length > 0 && {section: 'blog', href: '/jest/blog/' + MetadataBlog.files[0].path, text: 'blog'},
    {section: 'github', href: 'http://github.com/facebook/jest', text: 'github'},
  ].filter(function(e) { return e; }),

  render: function() {
    return (
      <ul className="nav-site">
        {this.links.map(function(link) {
          return (
            <li key={link.section}>
              <a
                href={link.href}
                className={link.section === this.props.section ? 'active' : ''}>
                {link.text}
              </a>
            </li>
          );
        }, this)}
      </ul>
    );
  }
});

module.exports = HeaderLinks;
