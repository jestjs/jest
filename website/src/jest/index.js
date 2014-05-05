/**
 * @jsx React.DOM
 */

var React = require('React');
var Site = require('Site');
var Prism = require('Prism');
var unindent = require('unindent');

var index = React.createClass({
  render: function() {
    return (
      <Site>
        <div className="hero">
          <div className="wrap">
            <div className="text"><strong>Jest</strong></div>
            <div className="minitext">
              Painless JavaScript Unit Testing
            </div>
          </div>
        </div>

        <section className="content wrap">
          <p></p>
          <section className="light home-section">
            <div className="marketing-row">
              <div className="marketing-col">
                <h3>Familiar Approach</h3>
                <p>
                  Built on-top of the Jasmine test framework, keeping the learning curve low
                </p>
              </div>
              <div className="marketing-col">
                <h3>Isolated by Default</h3>
                <p>
                  Integrates with require() in order to automatically mock dependencies, making most existing code testable
                </p>
              </div>
              <div className="marketing-col">
                <h3>Short Feedback Loop</h3>
                <p>
                  Tests run in parallel and DOM apis are mocked so you can run tests on the command line
                </p>
              </div>
            </div>
          </section>
          <hr className="home-divider" />
          <section className="home-section">
            <div id="examples">
              <div className="example">
                <h3>Asynchronous Testing</h3>
                <p>
                  Unlike most testing libraries, Jest doesn{"'"}t need special handling to test asynchronous code. The mock functions are very versatile.
                </p>
                <div className="side-by-side">
                  <Prism>{unindent(`
                    require('jest-runtime').dontMock('../fetchCurrentUser.js');

                    describe('fetchCurrentUser', function() {
                      it('creates a parsed user', function() {
                        var $ = require('jquery');
                        var fetchCurrentUser = require('../fetchCurrentUser.js');

                        var fetchCallback = require('mocks').getMockFunction();
                        fetchCurrentUser(fetchCallback);
                        expect($.ajax).toBeCalledWith({
                          type: 'GET',
                          url: 'http://example.com/currentUser',
                          done: jasmine.any(Function)
                        });

                        $.ajax.mock.calls[0/*first call*/][0/*first argument*/].done({
                          firstName: 'Tomas',
                          lastName: 'Jakobsen'
                        });
                        expect(fetchCallback).toBeCalledWith({
                          loggedIn: true,
                          fullName: 'Tomas Jakobsen'
                        });
                      });
                    });
                  `)}</Prism>
                  <Prism>{unindent(`
                    var $ = require('jquery');

                    function parseUserJson(userJson) {
                      return {
                        loggedIn: true,
                        fullName: userJson.firstName + ' ' + userJson.lastName
                      };
                    };

                    function fetchCurrentUser(callback) {
                      function ajaxDone(userJson) {
                        var user = parseUserJson(userJson);
                        callback(user);
                      };

                      return $.ajax({
                        type: 'GET',
                        url: 'http://example.com/currentUser',
                        done: ajaxDone
                      });
                    };

                    module.exports = fetchCurrentUser;
                  `)}</Prism>
                </div>
              </div>
            </div>
          </section>
          <hr className="home-divider" />
          <section className="home-bottom-section">
            <div className="buttons-unit">
              <a href="docs/tutorial.html" className="button">Get Started</a>
            </div>
          </section>
          <p></p>
        </section>
      </Site>
    );
  }
});

module.exports = index;
