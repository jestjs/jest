var fs = require('fs')
var glob = require('glob');
var mkdirp = require('mkdirp');
var optimist = require('optimist');
var path = require('path');
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

function globEach(pattern, cb) {
  glob(pattern, function(err, files) {
    if (err) {
      console.error(err);
      return;
    }
    files.forEach(cb);
  });
}

function rmFile(file) {
  try {
    fs.unlinkSync(file);
  } catch(e) {
    /* seriously, unlink throws when the file doesn't exist :( */
  }
}

function backtickify(str) {
  var escaped = '`' + str.replace(/\\/g, '\\\\').replace(/`/g, '\\`') + '`';
  // Replace require( with require\( so node-haste doesn't replace example
  // require calls in the docs
  return escaped.replace(/require\(/g, 'require\\(');
}


// Extract markdown metadata header
function extractMetadata(content) {
  var metadata = {};
  var both = splitHeader(content);
  var lines = both.header.split('\n');
  for (var i = 0; i < lines.length - 1; ++i) {
    var keyvalue = lines[i].split(':');
    var key = keyvalue[0].trim();
    var value = keyvalue.slice(1).join(':').trim();
    // Handle the case where you have "Community #10"
    try { value = JSON.parse(value); } catch(e) { }
    metadata[key] = value;
  }
  return {metadata: metadata, rawContent: both.content};
}

function buildFile(layout, rawContent, metadata) {
  return (
    '/**\n' +
    ' * @generated\n' +
    ' */\n' +
    'var React = require("React");\n' +
    'var Layout = require("' + layout + '");\n' +
    'var content = ' + backtickify(rawContent) + '\n' +
    'var Post = React.createClass({\n' +
    '  statics: {\n' +
    '    content: content\n' +
    '  },\n' +
    '  render: function() {\n' +
    '    return <Layout metadata={' + JSON.stringify(metadata) + '}>{content}</Layout>;\n' +
    '  }\n' +
    '});\n' +
    'module.exports = Post;\n'
  );
}

function writeFileAndCreateFolder(file, content) {
  mkdirp.sync(file.replace(new RegExp('/[^/]*$'), ''));
  fs.writeFileSync(file, content);
}

function execute() {
  var DOCS_MD_DIR = '../docs/';
  var BLOG_MD_DIR = '../blog/';

  globEach('src/jest/docs/*.*', rmFile);
  globEach('src/jest/blog/*.*', rmFile);

  var api = splitHeader(fs.readFileSync(DOCS_MD_DIR + 'API.md', {encoding: 'utf8'}).toString()).content
    .split('---')[0]
    .replace(/\(#/g, '(http://facebook.github.io/jest/docs/api.html#');
  var readme = fs.readFileSync('../README.md', {encoding: 'utf8'}).toString()
    .replace(
      /<generated_api_start \/>[\s\S]*<generated_api_end \/>/,
      '<generated_api_start />' + api + '<generated_api_end />'
    );
  fs.writeFileSync('../README.md', readme);

  glob(DOCS_MD_DIR + '**/*.*', function(er, files) {
    var metadatas = {
      files: [],
    };

    files.forEach(function(file) {
      var extension = path.extname(file);
      if (extension === '.md' || extension === '.markdown') {
        var res = extractMetadata(fs.readFileSync(file, {encoding: 'utf8'}));
        var metadata = res.metadata;
        var rawContent = res.rawContent;
        metadata.source = path.basename(file);
        metadatas.files.push(metadata);

        if (metadata.permalink.match(/^https?:/)) {
          return;
        }

        // Create a dummy .js version that just calls the associated layout
        var layout = metadata.layout[0].toUpperCase() + metadata.layout.substr(1) + 'Layout';

        writeFileAndCreateFolder(
          'src/jest/' + metadata.permalink.replace(/\.html$/, '.js'),
          buildFile(layout, rawContent, metadata)
        );
      }

      if (extension === '.json') {
        var content = fs.readFileSync(file, {encoding: 'utf8'});
        metadatas[path.basename(file, '.json')] = JSON.parse(content);
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

  glob(BLOG_MD_DIR + '**/*.*', function(er, files) {
    var metadatas = {
      files: [],
    };

    files.sort().reverse().forEach(function(file) {
      // Transform
      //   2015-08-13-blog-post-name-0.5.md
      // into
      //   2015/08/13/blog-post-name-0-5.html
      var filePath = path.basename(file)
        .replace('-', '/')
        .replace('-', '/')
        .replace('-', '/')
        // react-middleware is broken with files that contains multiple . like react-0.14.js
        .replace(/\./g, '-')
        .replace(/\-md$/, '.html');

      var res = extractMetadata(fs.readFileSync(file, {encoding: 'utf8'}));
      var metadata = Object.assign({path: filePath}, res.metadata);
      var rawContent = res.rawContent;

      metadatas.files.push(metadata);

      writeFileAndCreateFolder(
        'src/jest/blog/' + filePath.replace(/\.html$/, '.js'),
        buildFile('BlogPostLayout', rawContent, metadata)
      );
    });

    fs.writeFileSync(
      'core/metadata-blog.js',
      '/**\n' +
      ' * @generated\n' +
      ' * @providesModule MetadataBlog\n' +
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
