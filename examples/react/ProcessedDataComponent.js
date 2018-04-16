// Copyright 2004-present Facebook. All Rights Reserved.

import React from 'react';

function processData(data) {
  return data.map(x => x * 2);
}

export default class ProcessedData extends React.Component {
  constructor(props) {
    super(props);
    this.state = {processedData: null};
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    return {
      processedData: processData(nextProps.data),
    };
  }

  render() {
    if (this.state.processedData === null) {
      return <p>Loading...</p>;
    } else {
      return <ul>{this.state.processedData.map(n => <li>n></li>)}</ul>;
    }
  }
}
