var moduleStateValue = 'default';

function setModuleStateValue(value) {
  moduleStateValue = value;
}

function getModuleStateValue() {
  return moduleStateValue;
}

exports.getModuleStateValue = getModuleStateValue;
exports.isManualMockModule = true;
exports.setModuleStateValue = setModuleStateValue;
