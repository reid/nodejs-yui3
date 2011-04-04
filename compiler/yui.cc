#include <v8.h>
#include <node.h>
#include "build/default/yui_natives.h"
#include <string.h>
#include <strings.h>

using namespace v8;

namespace node {

    const char* MainSource() {
        return yui_native;
    }

    extern "C" void init(Handle<Object> target) {
        HandleScope scope;
      
        for (int i = 0; natives[i].name; i++) {
            Local<String> name = String::New(natives[i].name);
            Local<String> source = String::New(natives[i].source);
            target->Set(name, source);
        }
    }

}
