/**
 * @providesModule ModuleWithSideEffects
 */
'use strict';

var RegularModule = require('RegularModule');

RegularModule.setModuleStateValue('Side effect value');
