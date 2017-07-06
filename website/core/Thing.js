/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @jsx React.DOM
 */

const React = require('React');
const Site = require('Site');
const Marked = require('Marked');

const Container = require('Container');
const HomeSplash = require('HomeSplash');
const GridBlock = require('GridBlock');
const blog = require('MetadataBlog');

const siteConfig = require('../../siteConfig.js');

try {
  console.log('Thing.js triggered...');

  const Thing = React.createClass({
    render() {
      let language = this.props.language;
      if (typeof language == 'undefined') {
        language = 'en';
      }

      const showcase = siteConfig.users
        .filter(user => {
          return user.pinned;
        })
        .map(user => {
          return (
            <a href={user.infoLink}>
              <img src={user.image} title={user.caption} />
            </a>
          );
        });

      return (
        <Site>
          <HomeSplash mostRecentPost={blog.files[0]} />
          <div className="mainContainer">
            <Container padding={['bottom', 'top']}>
              <GridBlock
                align="center"
                contents={siteConfig[language].features}
                layout="fourColumn"
              />
            </Container>
            <div
              className="productShowcaseSection paddingBottom"
              style={{textAlign: 'center'}}
            >
              <h2>
                {siteConfig[language].featureCallout.title}
              </h2>
              <Marked>
                {siteConfig[language].featureCallout.content}
              </Marked>
            </div>

            <Container padding={['bottom', 'top']} background="light">
              <GridBlock
                contents={[
                  {
                    content:
                      siteConfig[language].belowFold.parallelized.content,
                    image: '/jest/img/content/feature-fast.png',
                    imageAlign: 'right',
                    title: siteConfig[language].belowFold.parallelized.title,
                  },
                ]}
              />
            </Container>
            <Container padding={['bottom', 'top']}>
              <GridBlock
                contents={[
                  {
                    content: siteConfig[language].belowFold.coverage.content,
                    image: '/jest/img/content/feature-coverage.png',
                    imageAlign: 'left',
                    title: siteConfig[language].belowFold.coverage.title,
                  },
                ]}
              />
            </Container>
            <Container padding={['bottom', 'top']} background="light">
              <GridBlock
                contents={[
                  {
                    content: siteConfig[language].belowFold.zeroConfig.content,
                    image: '/jest/img/content/feature-config-react.png',
                    imageAlign: 'right',
                    title: siteConfig[language].belowFold.zeroConfig.title,
                  },
                ]}
              />
            </Container>

            <Container background="dark" padding={['bottom', 'top']}>
              <a className="anchor" name="use" />
              <a className="hash-link" href="#use" />
              <div className="blockElement imageAlignSide twoByGridBlock">
                <div className="blockContent">
                  <h2>
                    {siteConfig[language].belowFold.try.title}
                  </h2>
                  <div>
                    <Marked>
                      {siteConfig[language].belowFold.try.content}
                    </Marked>
                  </div>
                </div>
                <div className="jest-repl">
                  <iframe src="https://repl.it/languages/jest?lite=true" />
                </div>
              </div>
            </Container>

            <Container padding={['bottom', 'top']}>
              <GridBlock
                contents={[
                  {
                    content: siteConfig[language].belowFold.mocking.content,
                    image: '/jest/img/content/feature-mocking.png',
                    imageAlign: 'left',
                    title: siteConfig[language].belowFold.mocking.title,
                  },
                ]}
              />
            </Container>
            <Container padding={['bottom', 'top']} background="light">
              <GridBlock
                contents={[
                  {
                    content: siteConfig[language].belowFold.typescript.content,
                    image: '/jest/img/content/feature-typescript.png',
                    imageAlign: 'right',
                    title: siteConfig[language].belowFold.typescript.title,
                  },
                ]}
              />
            </Container>

            <Container padding={['bottom', 'top']}>
              <div className="blockElement imageAlignSide twoByGridBlock">
                <div className="video">
                  <iframe src="https://fast.wistia.net/embed/iframe/78j73pyz17" />
                </div>
                <div className="blockContent">
                  <h2>
                    {siteConfig[language].belowFold.learn.title}
                  </h2>
                  <div>
                    <Marked>
                      {siteConfig[language].belowFold.learn.content}
                    </Marked>
                  </div>
                </div>
              </div>
            </Container>

            <div className="productShowcaseSection paddingBottom">
              <h2>
                {siteConfig[language].belowFold.using.title}
              </h2>
              <p>
                {siteConfig[language].belowFold.using.content}
              </p>
              <div className="logos">
                {showcase}
              </div>
              <div className="more-users">
                <a className="button" href="/jest/users.html" target="_self">
                  {siteConfig[language].belowFold.using.button}
                </a>
              </div>
            </div>
          </div>
        </Site>
      );
    },
  });

  Thing.defaultProps = {
    language: 'en',
  };

  module.exports = Thing;
} catch (e) {
  console.log(e);
}
