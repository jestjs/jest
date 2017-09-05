/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule JestUsers
 * @jsx React.DOM
 */

const React = require('React');
const Site = require('Site');
const Container = require('Container');
const siteConfig = require('../siteConfig.js');

class JestUsers extends React.Component {
  render() {
    const showcase = siteConfig.users.map(user => {
      return (
        <a href={user.infoLink}>
          <img src={user.image} title={user.caption} />
        </a>
      );
    });

    return (
      <Site language={this.props.language}>
        <div className="mainContainer">
          <Container padding={['bottom', 'top']}>
            <div className="showcaseSection">
              <div className="prose">
                <h1>{siteConfig[this.props.language].using.header.title}</h1>
                <p>{siteConfig[this.props.language].using.header.content}</p>
              </div>
              <div className="logos">{showcase}</div>
              <p>{siteConfig[this.props.language].using.prompt}</p>
              <a
                href="https://github.com/facebook/jest/edit/master/website/siteConfig.js"
                className="button"
              >
                {siteConfig[this.props.language].using.prompt_cta}
              </a>
            </div>
          </Container>
        </div>
      </Site>
    );
  }
}

JestUsers.defaultProps = {
  language: 'en',
};

module.exports = JestUsers;
