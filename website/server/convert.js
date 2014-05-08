var fs = require('fs')
var glob = require('glob');
var mkdirp = require('mkdirp');
var optimist = require('optimist');
var argv = optimist.argv;

function execute() {
  var MD_DIR = 'docs/';

  var metadatas = [];

  var generators = [
    {path: new RegExp('.*'), action: function(metadata) {
      return 'docs/' + metadata.id + '.js'
    }}
  ];

  glob('src/jest/docs/*.*', function(er, files) {
    files.forEach(function(file) {
      fs.unlinkSync(file);
    });
  });


  glob(MD_DIR + '**/*.md', function (er, files) {
    files.forEach(function(file) {
      var content = fs.readFileSync(file, {encoding: 'utf8'});

      // Extract markdown metadata header
      var metadata = { filename: file.substr(MD_DIR.length).replace(/\.md$/, '.js') };
      var lines = content.split('\n');
      for (var i = 1; i < lines.length - 1; ++i) {
        if (lines[i] === '---') {
          break;
        }
        var keyvalue = lines[i].split(':');
        var key = keyvalue[0].trim();
        var value = keyvalue[1].trim();
        // Handle the case where you have "Community #10"
        try { value = JSON.parse(value); } catch(e) { }
        metadata[key] = value;
      }
      metadatas.push(metadata);
      var body = lines.slice(i).join('\n');

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
            '    return layout({metadata: ' + JSON.stringify(metadata) + '}, `' + body.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`);\n' +
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

if (argv.execute) {
  execute();
  console.log('Build success');
}

module.exports = execute;
