/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

const React = require("react");

const CompLibrary = require("../../core/CompLibrary.js");
const Container = CompLibrary.Container;

const translate = require("../../server/translate.js").translate;

const siteConfig = require(process.cwd() + "/siteConfig.js");

class Users extends React.Component {
  render() {
    const showcase = siteConfig.users.map(user => {
      return (
        <a href={user.infoLink}>
          <img src={user.image} title={user.caption} />
        </a>
      );
    });

    return (
      <div className="mainContainer">
        <Container padding={["bottom", "top"]}>
          <div className="showcaseSection">
            <div className="prose">
              <h1>
                <translate>Who's using Jest?</translate>
              </h1>
              <p>
                <translate>
                  Jest is used by teams of all sizes to test websites, mobile
                  apps, and APIs.
                </translate>
              </p>
            </div>
            <div className="logos">
              {showcase}
            </div>
            <p>
              <translate>Is your company using Jest?</translate>
            </p>
            <a
              href="https://github.com/facebook/jest/edit/master/website/siteConfig.js"
              className="button"
            >
              <translate>Add your company</translate>
            </a>
          </div>
        </Container>
      </div>
    );
  }
}

Users.defaultProps = {
  language: "en"
};

module.exports = Users;
