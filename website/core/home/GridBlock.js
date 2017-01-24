/**
 * @providesModule GridBlock
 * @jsx React.DOM
 */

const React = require('React');
const classNames = require('classnames');
const Container = require('Container');

const Marked = require('Marked');

class GridBlock extends React.Component {
  renderBlock(block) {
    const blockClasses = classNames('blockElement', this.props.className, {
      'alignCenter': this.props.align === 'center',
      'alignRight': this.props.align === 'right',
      'fourByGridBlock': this.props.layout === 'fourColumn',
      'imageAlignBottom': (block.image && block.imageAlign === 'bottom'),
      'imageAlignSide': (block.image && (block.imageAlign === 'left' ||
        block.imageAlign === 'right')),
      'imageAlignTop': (block.image && block.imageAlign === 'top'),
      'threeByGridBlock': this.props.layout === 'threeColumn',
      'twoByGridBlock': this.props.layout === 'twoColumn',
    });

    const topLeftImage = (block.imageAlign === 'top' ||
      block.imageAlign === 'left') &&
      this.renderBlockImage(block.image);

    const bottomRightImage = (block.imageAlign === 'bottom' ||
      block.imageAlign === 'right') &&
      this.renderBlockImage(block.image);

    return (
      <div className={blockClasses}>
        {topLeftImage}
        <div className="blockContent">
          {this.renderBlockTitle(block.title)}
          <Marked>{block.content}</Marked>
        </div>
        {bottomRightImage}
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
      return <h2>{title}</h2>;
    } else {
      return null;
    }
  }

  renderContainer(block, index) {
    const background = index % 2 ? 'dark' : 'light';
    return (
      <Container background={background} padding={['bottom', 'top']}>
        {this.renderBlock(block)}
      </Container>
    );
  }

  render() {
    let gridBlock = <div className="gridBlock">
      {this.props.contents.map(this.renderBlock, this)}
    </div>;

    if (this.props.alternatingBackground) {
      gridBlock = <div>
        {this.props.contents.map(this.renderContainer, this)}
      </div>;
    }

    return (
      gridBlock
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
