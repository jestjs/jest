/**
 * Copyright (c) 2017-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include <node.h>

using namespace v8;

void size(const FunctionCallbackInfo<Value>& args) {
  Isolate* isolate = args.GetIsolate();
  Set* set = Set::Cast(*args[0]);

  args.GetReturnValue().Set(
    Number::New(isolate, static_cast<double>(set->Size()))
  );
}

void Initialize(Local<Object> exports) {
  NODE_SET_METHOD(exports, "size", size);
}

NODE_MODULE(module_name, Initialize)
