/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule JestHelp
 * @jsx React.DOM
 */

/* eslint-disable sort-keys, no-multi-str */

'use strict';

const React = require('React');
const Site = require('Site');

const Container = require('Container');
const GridBlock = require('GridBlock');

const siteConfig = require('../siteConfig.js');

const JestHelp = React.createClass({
  render() {
    const supportLinks = [
      siteConfig[this.props.language].support.browse,
      siteConfig[this.props.language].support.join,
      siteConfig[this.props.language].support.uptodate,
    ];

    return (
      <Site section="support" language={this.props.language}>
        <div className="docMainWrapper wrapper">
          <Container className="mainContainer documentContainer postContainer">
            <div className="post">
              <header className="postHeader">
                <h2>{siteConfig[this.props.language].support.header.title}</h2>
              </header>
              <p>
                {siteConfig[this.props.language].support.header.content}
              </p>
              <GridBlock contents={supportLinks} layout="threeColumn" />
            </div>
          </Container>
        </div>

      </Site>
    );
  },
});

JestHelp.defaultProps = {
  language: 'en',
};

module.exports = JestHelp;
