/**
 * @providesModule GridBlock
 * @jsx React.DOM
 */

var React = require('React');
var classNames = require('classnames');

var Marked = require('Marked');

class GridBlock extends React.Component {
  renderBlock(block) {
    var blockClasses = classNames('blockElement', this.props.className, {
      'alignCenter': this.props.align === "center",
      'alignRight': this.props.align === "right",
      'twoByGridBlock': this.props.layout === "twoColumn",
      'fourByGridBlock': this.props.layout === "fourColumn",
      'imageAlignTop': (block.image && this.props.imagealign === "top"),
      'imageAlignSide': (block.image && this.props.imagealign === "side"),
    });
    return (
      <div className={blockClasses}>
        {this.renderBlockImage(block.image)}
        <div className="blockContent">
          {this.renderBlockTitle(block.title)}
          <Marked>{block.content}</Marked>
        </div>
      </div>
    );
  }

  renderBlockImage(image) {
    if (image) {
      return (
        <div className="blockImage"><img src={image} /></div>
      );
    }
  }

  renderBlockTitle(title) {
    if (title) {
      return <h3>{title}</h3>;
    }
  }

  render() {
    return (
      <div className="gridBlock">
        {this.props.contents.map(this.renderBlock, this)}
      </div>
    );
  }
};

GridBlock.defaultProps = {
  align: "left",
  contents: [],
  imagealign: "top",
  layout: "twoColumn",
};

module.exports = GridBlock;
