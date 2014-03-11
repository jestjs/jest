var CoverageInstrumentor = require('cover/instrument').Instrumentor;
var fs = require('fs');

var COVERAGE_TEMPLATE_PATH = require.resolve('./coverageTemplate');

var _memoizedCoverageTemplate = null;
function _getCoverageTemplate() {
  if (_memoizedCoverageTemplate === null) {
    _memoizedCoverageTemplate = require('underscore').template(
      fs.readFileSync(COVERAGE_TEMPLATE_PATH, 'utf8')
    );
  }
  return _memoizedCoverageTemplate;
}

function CoverageCollector(sourceText, coverageDataStore) {
  this._coverageDataStore = coverageDataStore;
  this._instrumentedSourceText = null;
  this._instrumentor = new CoverageInstrumentor();
  this._origSourceText = sourceText;
}

CoverageCollector.prototype.getInstrumentedSource = function(storageVarName) {
  if (this._instrumentedSourceText === null) {
    this._instrumentedSourceText = _getCoverageTemplate()({
      instrumented: this._instrumentor,
      coverageStorageVar: storageVarName,
      source: this._instrumentor.instrument(this._origSourceText)
    });
  }
  return this._instrumentedSourceText;
};

CoverageCollector.prototype.extractRuntimeCoverageInfo = function() {
  var instrumentationInfo = this._instrumentor.objectify();
  var coverageInfo = {
    coveredSpans: [],
    uncoveredSpans: [],
    sourceText: this._origSourceText
  };

  // Find all covered spans
  for (var nodeIndex in this._coverageDataStore.nodes) {
    coverageInfo.coveredSpans.push(instrumentationInfo.nodes[nodeIndex].loc);
  }

  // Find all definitely uncovered spans
  for (var nodeIndex in instrumentationInfo.nodes) {
    if (!this._coverageDataStore.nodes.hasOwnProperty(nodeIndex)) {
      coverageInfo.uncoveredSpans.push(
        instrumentationInfo.nodes[nodeIndex].loc
      );
    }
  }

  return coverageInfo;
};

module.exports = CoverageCollector;
