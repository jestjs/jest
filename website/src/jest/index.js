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
          <Container background="light" padding={['bottom', 'top']}>
            <GridBlock align="center" contents={siteConfig.topFeatures} layout="fourColumn" />
          </Container>
          <Container padding={['bottom', 'top']}>
            <div className="testingFeatures">
              <h2>Painless JavaScript Testing</h2>
              <p>Fast interactive mode that can switch between running all tests, or only those related to changed files, or even those that match a test pattern. Jest runs failed tests first. Yes, we already said that. I'm only copying this text here for demonstration purposes.</p>
            </div>
          </Container>
          <GridBlock className="testingFeatures" contents={siteConfig.features} alternatingBackground/>
          <Container background="dark" padding={['bottom', 'top']}>
            <div className="blockElement testingFeatures imageAlignSide twoByGridBlock">
              <div className="blockContent">
                <h2>
                  <a className="anchor" name="use"></a>
                  Try Out Jest
                  <a className="hash-link" href="#use"></a>
                </h2>
                <div>
                  <Marked>You can try out a real version of Jest through [repl.it](https://repl.it). Just edit your test and hit the run button!</Marked>
                </div>
              </div>
              <div className="jest-repl">
                <iframe className="jest-repl"
                  src="https://repl.it/languages/jest?lite=true"></iframe>
              </div>
            </div>
          </Container>
          <Container background="dark" padding={['bottom', 'top']}>
            <div className="blockElement testingFeatures imageAlignSide twoByGridBlock">
              <div className="video">
                <iframe src="https://fast.wistia.net/embed/iframe/78j73pyz17"></iframe>
              </div>
              <div className="blockContent">
                <h2>Unit Test with Jest</h2>
                <div>
                  <Marked>This video by [Kent C. Dodds](https://twitter.com/kentcdodds) on [Egghead.io](https://egghead.io/) will guide you through installing Jest and writing your first unit test.</Marked>
                </div>
              </div>
            </div>
          </Container>

          <Container padding={['bottom']}>
            <div className="miniShowcaseSection testingFeatures">
              <h2>Who's Using Jest?</h2>
              <p>Jest is used by <a href="/jest/users.html">teams of all sizes</a> to test websites, mobile apps, and APIs.</p>
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
