jest.dontMock('../FileSummarizer');

describe('FileSummarizer', function() {
  describe('listFilesInDirectorySync', function() {
    var MOCK_FILE_INFO = {
      '/path/to/file1.js':
        'console.log("file1 contents");',

      '/path/to/file2.txt':
        "file2 contents"
    };

    beforeEach(function() {
      // Set up some mocked out file info before each test
      require('fs').__setMockFiles(MOCK_FILE_INFO);
    });

    it('includes all files in the directory in the summary', function() {
      var FileSummarizer = require('../FileSummarizer');
      var fileSummary = FileSummarizer.summarizeFilesInDirectorySync(
        '/path/to'
      );

      expect(fileSummary.length).toBe(2);
    });
  });
})
