/**
 * @providesModule PostLayout
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Metadata = require('Metadata');
var Markdown = require('Markdown');

var PostLayout = React.createClass({
  render: function() {
    return (
      <Site section="blog">
        <section className="content wrap blogContent">
          <div className="nav-docs nav-blog">
            <div className="nav-docs-section">
              <h3>Recent posts</h3>
              <ul>
                {Metadata
                  .filter((metadata) => metadata.filename.match(/^docs/))
                  .reverse()
                  .map((metadata) => <li>
                    <a
                      className={metadata.filename === this.props.metadata.filename ? 'active' : ''}
                      href={metadata.href}>
                      {metadata.title}
                    </a>
                  </li>)
                }
              </ul>
            </div>
          </div>
          <div className="inner-content">
            <h1>{this.props.metadata.title}</h1>
            <Markdown>{this.props.children}</Markdown>
          </div>
        </section>
      </Site>
    );
  }
});

module.exports = PostLayout;
