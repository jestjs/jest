/**
 * @providesModule DocsSidebar
 * @jsx React.DOM
 */

var Metadata = require('Metadata');

var DocsSidebar = React.createClass({
  getCategories: function() {
    var metadatas = Metadata;

    // Build a hashmap of article_id -> metadata
    // Find the first metadata
    var first = null;
    var articles = {}
    for (var i = 0; i < metadatas.length; ++i) {
      var metadata = metadatas[i];
      articles[metadata.id] = metadata;
      if (!metadata.previous) {
        first = metadata;
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
    return <div className="nav-docs">
      {this.getCategories().map((category) =>
        <div className="nav-docs-section" key={category.name}>
          <h3>{category.name}</h3>
          <ul>
            {category.links.map((metadata) =>
              <li key={metadata.id}>
                <a
                  style={{marginLeft: metadata.indent ? 20 : 0}}
                  className={metadata.id === this.props.metadata.id ? 'active' : ''}
                  href={metadata.href}>
                  {metadata.title}
                </a>
              </li>
            )}
          </ul>
        </div>
      )}
    </div>;
  }
});

module.exports = DocsSidebar;
