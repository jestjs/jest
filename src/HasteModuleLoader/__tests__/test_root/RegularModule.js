/**
 * @providesModule RegularModule
 */
var moduleStateValue = 'default';

function setModuleStateValue(value) {
  moduleStateValue = value;
}

function getModuleStateValue() {
  return moduleStateValue;
}

exports.getModuleStateValue = getModuleStateValue;
exports.isRealModule = true;
exports.setModuleStateValue = setModuleStateValue;
