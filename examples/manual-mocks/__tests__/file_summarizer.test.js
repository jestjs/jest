// Copyright (c) Meta Platforms, Inc. and affiliates.. All Rights Reserved.

'use strict';

jest.mock('fs');

describe('listFilesInDirectorySync', () => {
  const MOCK_FILE_INFO = {
    '/path/to/file1.js': 'console.log("file1 contents");',
    '/path/to/file2.txt': 'file2 contents',
  };

  beforeEach(() => {
    // Set up some mocked out file info before each test
    require('fs').__setMockFiles(MOCK_FILE_INFO);
  });

  it('includes all files in the directory in the summary', () => {
    const FileSummarizer = require('../FileSummarizer');
    const fileSummary =
      FileSummarizer.summarizeFilesInDirectorySync('/path/to');

    expect(fileSummary).toHaveLength(2);
  });
});
