"use strict";

function JSONStreamParser(initialStreamOffset) {
  this._currentlyWithinQuotedString = false;
  this._currentObjectHead = 0;
  this._cursorPosition = initialStreamOffset || 0;
  this._depth = 0;
  this._leftOverStreamText = '';
}

JSONStreamParser.prototype.parse=function(streamText) {
  var currChar;
  var responses = [];
  while (this._cursorPosition < streamText.length) {
    currChar = streamText.charAt(this._cursorPosition);
    if (this._currentlyWithinQuotedString && currChar === '\\') {
      // If the current character is escaped, move forward
      this._cursorPosition++;
    } else if (currChar === '"') {
      // Are we inside a quoted string?
      this._currentlyWithinQuotedString = !this._currentlyWithinQuotedString;
    } else if (!this._currentlyWithinQuotedString) {
      if (currChar === '{') {
        if (this._depth === 0) {
          this._currentObjectHead = this._cursorPosition;
        }
        this._depth++;
      } else if (currChar === '}') {
        this._depth--;
        if (this._depth === 0) {
          responses.push(JSON.parse(
            streamText.substring(
              this._currentObjectHead,
              this._cursorPosition + 1
            )
          ));
        }
      }
    }
    this._cursorPosition++;
  }
  return responses;
};


module.exports = JSONStreamParser;
