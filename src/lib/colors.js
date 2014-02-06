var BOLD = '\u001b[1;1m';
var GRAY = '\u001b[1;30m';
var GREEN_BG = '\u001b[1;42m';
var MAGENTA_BG = '\u001b[1;45m';
var RED = '\u001b[1;31m';
var RED_BG = '\u001b[1;41m';
var RESET = '\u001b[0m';
var UNDERLINE = '\u001b[1;4m';

function colorize(str, color) {
  return color + str.toString().split(RESET).join(RESET + color) + RESET;
}

exports.BOLD = BOLD;
exports.GRAY = GRAY;
exports.GREEN_BG = GREEN_BG;
exports.MAGENTA_BG = MAGENTA_BG;
exports.RED = RED;
exports.RED_BG = RED_BG;
exports.RESET = RESET;
exports.UNDERLINE = UNDERLINE;

exports.colorize = colorize;
