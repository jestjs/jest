/**
 * @jsx React.DOM
 */

/* eslint-disable max-len */

const React = require('React');
const Site = require('Site');
const Marked = require('Marked');

const Container = require('Container');
const HomeSplash = require('HomeSplash');
const GridBlock = require('GridBlock');

const siteConfig = require('../../siteConfig.js');
const blog = require('MetadataBlog');

const index = React.createClass({
  render() {
    const showcase = siteConfig.users.filter(user => {
      return user.pinned;
    }).map(user => {
      return <a href={user.infoLink}><img src={user.image} title={user.caption}/></a>;
    });

    return (
      <Site>
        <HomeSplash mostRecentPost={blog.files[0]} />
        <div className="mainContainer">
          <Container padding={['bottom', 'top']}>
            <GridBlock align="center" contents={siteConfig.topFeatures} layout="fourColumn" />
          </Container>
          <Container padding={['bottom']}>
            <div className="testingFeatures" style={{textAlign: 'center'}}>
              <h2>Zero configuration testing platform</h2>
              <Marked>
                Jest is used by Facebook to test all JavaScript code including React applications. One of Jest's philosophies is to provide an integrated “zero-configuration” experience. We observed that when engineers are provided with ready-to-use tools, they end up writing more tests, which in turn results in stable and healthy code bases.
              </Marked>
            </div>
          </Container>

          <GridBlock className="testingFeatures"
            contents={siteConfig.features}
            alternatingBackground />

          {/*<GridBlock className="testingFeatures"
            contents={siteConfig.features.slice(0, siteConfig.features.length / 2)}
            alternatingBackground />

          <Container background="dark" padding={['bottom', 'top']}>
            <div className="blockElement testingFeatures imageAlignSide twoByGridBlock">
              <div className="blockContent">
                <h2>
                  <a className="anchor" name="use"></a>
                  Try it out!
                  <a className="hash-link" href="#use"></a>
                </h2>
                <div>
                  <p>You can try out a real version of Jest right here. Just edit your test and hit the run button!</p>
                </div>
              </div>
              <div className="jest-repl">
                <iframe className="jest-repl"
                  src="https://repl.it/languages/jest?lite=true"></iframe>
              </div>
            </div>
          </Container>

          <GridBlock className="testingFeatures"
            contents={siteConfig.features.slice(siteConfig.features.length / 2, siteConfig.features.length)}
            alternatingBackground />*/}

          {/*<Container background="dark" padding={['bottom', 'top']}>
            <div className="blockElement testingFeatures imageAlignSide twoByGridBlock">
              <div className="video">
                <iframe src="https://fast.wistia.net/embed/iframe/78j73pyz17"></iframe>
              </div>
              <div className="blockContent">
                <h2>Unit test with Jest</h2>
                <div>
                  <Marked>Learn how to install Jest and write your first unit test in this video by [Kent C. Dodds](https://twitter.com/kentcdodds) on [Egghead.io](https://egghead.io/).</Marked>
                </div>
              </div>
            </div>
          </Container>*/}

          <Container padding={['bottom']}>
            <div className="miniShowcaseSection testingFeatures">
              <h2>Who's using Jest?</h2>
              <p>Jest is used by teams of all sizes to test websites, mobile apps, and APIs.</p>
              <div className="logos">
                {showcase}
              </div>
              <div className="more-users">
                <a className="button" href="/jest/users.html" target="_self">More Jest Users</a>
              </div>
            </div>
          </Container>
        </div>
      </Site>
    );
  },
});

module.exports = index;
