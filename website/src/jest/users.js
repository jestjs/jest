/**
 * @jsx React.DOM
 */

const React = require('React');
const Site = require('Site');
const Container = require('Container');
const siteConfig = require('../../siteConfig.js');

class UserShowcase extends React.Component {
  render() {
    const showcase = siteConfig.users.map(user => {
      return (
        <a href={user.infoLink}>
          <img src={user.image} title={user.caption}/>
        </a>
      );
    });

    return (
      <Site>
        <div className="mainContainer">
          <Container padding={['bottom', 'top']}>
            <div className="showcaseSection">
              <div className="prose">
                <h1>Who's using Jest?</h1>
                <p>Jest is used by teams of all sizes to test websites, mobile
                apps, and APIs.</p>
              </div>
              <div className="logos">
                {showcase}
              </div>
              <p>Is your company using Jest?<br/>
                Edit this page with a <a
                href="https://github.com/facebook/jest/edit/website/src/jest/users.js">
                Pull Request
              </a> to add your logo.</p>
            </div>
          </Container>
        </div>
      </Site>
    );
  }
}

module.exports = UserShowcase;
