var fs = require('fs')
var glob = require('glob');
var mkdirp = require('mkdirp');
var optimist = require('optimist');
var argv = optimist.argv;

function splitHeader(content) {
  var lines = content.split('\n');
  for (var i = 1; i < lines.length - 1; ++i) {
    if (lines[i] === '---') {
      break;
    }
  }
  return {
    header: lines.slice(1, i + 1).join('\n'),
    content: lines.slice(i + 1).join('\n')
  };
}

function execute() {
  var MD_DIR = 'docs/';

  var api = splitHeader(fs.readFileSync(MD_DIR + 'API.md', {encoding: 'utf8'}).toString()).content;
  var getting_started = splitHeader(fs.readFileSync(MD_DIR + 'GettingStarted.md', {encoding: 'utf8'}).toString()).content;
  var readme = fs.readFileSync('../README.md', {encoding: 'utf8'}).toString()
    .replace(
      /<generated_api>[\s\S]*<\/generated_api>/,
      '<generated_api>' + api + '</generated_api>'
    )
    .replace(
      /<generated_getting_started>[\s\S]*<\/generated_getting_started>/,
      '<generated_getting_started>' + getting_started + '</generated_getting_started>'
    );
  fs.writeFileSync('../README.MD', readme);

  glob('src/jest/docs/*.*', function(er, files) {
    files.forEach(function(file) {
      fs.unlinkSync(file);
    });
  });


  var metadatas = [];
  var generators = [
    {path: new RegExp('.*'), action: function(metadata) {
      return 'docs/' + metadata.id + '.js'
    }}
  ];

  glob(MD_DIR + '**/*.md', function (er, files) {
    files.forEach(function(file) {
      var content = fs.readFileSync(file, {encoding: 'utf8'});

      // Extract markdown metadata header
      var metadata = { filename: file.substr(MD_DIR.length).replace(/\.md$/, '.js') };

      var both = splitHeader(content);
      var lines = both.header.split('\n');
      for (var i = 0; i < lines.length - 1; ++i) {
        var keyvalue = lines[i].split(':');
        var key = keyvalue[0].trim();
        var value = keyvalue[1].trim();
        // Handle the case where you have "Community #10"
        try { value = JSON.parse(value); } catch(e) { }
        metadata[key] = value;
      }
      metadatas.push(metadata);

      // Create a dummy .js version that just calls the associated layout
      for (var i = 0; i < generators.length; ++i) {
        var generator = generators[i];
        if (metadata.filename.match(generator.path)) {
          var name = generator.action(metadata);
          metadata.href = '/jest/' + name.replace(/\.js$/, '.html');
          var layout = metadata.layout[0].toUpperCase() + metadata.layout.substr(1) + 'Layout';

          var content = (
            '/**\n' +
            ' * @generated\n' +
            ' * @jsx React.DOM\n' +
            ' */\n' +
            'var React = require("React");\n' +
            'var layout = require("' + layout + '");\n' +
            'module.exports = React.createClass({\n' +
            '  render: function() {\n' +
            '    return layout({metadata: ' + JSON.stringify(metadata) + '}, `' + both.content.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`);\n' +
            '  }\n' +
            '});\n'
          );

          var targetFile = 'src/jest/' + name;
          mkdirp.sync(targetFile.replace(new RegExp('/[^/]*$'), ''));
          fs.writeFileSync(targetFile, content);
        }
      }
    });

    fs.writeFileSync(
      'core/metadata.js',
      '/**\n' +
      ' * @generated\n' +
      ' * @providesModule Metadata\n' +
      ' */\n' +
      'module.exports = ' + JSON.stringify(metadatas, null, 2) + ';'
    );
  });
}

if (argv.convert) {
  console.log('convert!')
  execute();
}

module.exports = execute;
