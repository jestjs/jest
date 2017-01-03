/**
 * @providesModule GridBlock
 * @jsx React.DOM
 */

const React = require('React');
const classNames = require('classnames');

const Marked = require('Marked');

class GridBlock extends React.Component {
  renderBlock(block) {
    const blockClasses = classNames('blockElement', this.props.className, {
      'alignCenter': this.props.align === 'center',
      'alignRight': this.props.align === 'right',
      'fourByGridBlock': this.props.layout === 'fourColumn',
      'imageAlignSide': (block.image && this.props.imagealign === 'side'),
      'imageAlignTop': (block.image && this.props.imagealign === 'top'),
      'threeByGridBlock': this.props.layout === 'threeColumn',
      'twoByGridBlock': this.props.layout === 'twoColumn',
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
    } else {
      return null;
    }
  }

  renderBlockTitle(title) {
    if (title) {
      return <h3>{title}</h3>;
    } else {
      return null;
    }
  }

  render() {
    return (
      <div className="gridBlock">
        {this.props.contents.map(this.renderBlock, this)}
      </div>
    );
  }
}

GridBlock.defaultProps = {
  align: 'left',
  contents: [],
  imagealign: 'top',
  layout: 'twoColumn',
};

module.exports = GridBlock;
