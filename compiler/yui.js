var path = require('path');
var start = (new Date()).getTime();
var yui = require(path.join(__dirname, 'build/default/yui3-compiled'));

var vm = require('vm');

var script = vm.createScript(yui.yui + yui.nodejs_yui3, 'yui.js');

var sandbox = {
    process: process,
    require: require,
    module: module,
    __filename: __filename,
    __dirname: __dirname,
    exports: {}
};

script.runInNewContext(sandbox);

for (var i in yui) {
    sandbox.module.exports.execCache[i] = {
        data: yui[i]
    };
}

module.exports = sandbox.module.exports;
