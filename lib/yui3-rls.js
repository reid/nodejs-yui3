/**
* This method accepts the default RLS configuration object and returns two arrays of file paths for js and css files.
* @method rls
* @param {YUI} YUI The YUI instance to use when creating an RLS server.
* @param {Object} config The RLS configuration to work from
* @param {Function} fn The callback executed when the process is completed
* @returns {Callback} js, css Callback returns two arguments. Both arrays of file paths, one for JS and one for CSS files.
*/

var events = require('events'),
    sys = require(process.binding('natives').util ? 'util' : 'sys');

var RLS = exports.RLS = function(Y, config) {
    events.EventEmitter.call(this);
    this.YUI = Y;
    this.config = config;
    this.setup();
};

sys.inherits(RLS, events.EventEmitter);

var proto = {
    setup: function() {
        this.files = [];
        this.data = {};

        this.grab = true;
        this.parse = false;
        if (this.config.parse) {
            this.parse = this.config.parse;
        }
    },
    file: null,
    data: null,
    parse: null,
    bootstrapCore: null,
    grab: null,
    inst: null,
    normalizeConfig: function() {
        //No config.m given, giving it a default
        if (!this.config.m) {
            this.config.m = ['yui']; // Default here?
        }

        if (!this.config.env) {
            this.config.env = [];
        }

        if (!(this.config.m instanceof Array)) {
            this.config.m = this.config.m.split(',');
        }
        if (!(this.config.env instanceof Array)) {
            this.config.env = this.config.env.split(',');
        }
        
        this.bootstrapCore = this.config.env.every(function (env) {
            return env !== "yui"
        });
        this.emit('normalizeConfig', this.config);
    },
    normalizeYUIConfig: function() {
        //This deletes all custom NodeJS YUI modules (jsdom, io, etc)
        delete this.YUI.GlobalConfig.modules;
        //Set this instance to no debugging so it never console logs anything
        this.YUI.GlobalConfig.debug = false;
        //Replace the default -debug with -min so all the files are -min files.
        this.YUI.GlobalConfig.loaderPath = this.YUI.GlobalConfig.loaderPath.replace('-debug', '-min');
        
        if (this.config.GlobalConfig) {
            if (this.config.GlobalConfig.loaderPath) {
                this.YUI.GlobalConfig._loaderPath = this.YUI.GlobalConfig.base + this.YUI.GlobalConfig.loaderPath;
            }
            for (var i in this.config.GlobalConfig) {
                this.YUI.GlobalConfig[i] = this.config.GlobalConfig[i];
            }
        }


        this._inc = this.YUI.include.bind(this);
        this._add = this.YUI.add.bind(this);
        this.YUI.include = this.include.bind(this);
        this.YUI.add = this.add.bind(this);
        this.emit('normalizeYUIConfig', this.YUI);
    },
    add: function(name, fn, version, args) {
        //This keeps everything but Loader from executing it's wrapped function
        if (name.indexOf('loader') === -1) {
            fn = function() {};
        }
        //Call the original add method with the new noop function if needed.
        this._add.call(this.YUI, name, fn, version, args);
    },
    include: function(file, cb, inner) {
        var parse = this.parse;
        if (file.indexOf(this.YUI.GlobalConfig.loaderPath) > -1) {
            parse = true;
        }
        if (this.grab) {
            this.files.push(file);
        }
        //Call the original YUI.include.
        var self = this;
        if (parse) {
            this._inc(file, function(err, data, info) {
                if (err) {
                    throw err;
                    return;
                }
                if (self.grab && parse) {
                    self.data[info.file] = info.data;
                }
                cb(null, function() {});
            });
        } else {
            cb(null, function() {});
        }
    },
    createInternalInstance: function() {
        //Setup the YUI instance config
        var yc = {};

        //Add the lang property
        if (this.config.lang) {
            yc.lang = this.config.lang;
        }
        
        //Create the new instance.
        this.inst = this.YUI(yc);
        this.inst.config._cssLoad = [];
        this.emit('createInstance', this.inst);
    },
    populateEnv: function() {
        //Preloading what's already on the page, telling the YUI.include function
        //  to NOT grab the files until it's done
        if (this.config.env) {
            this.grab = false;
            //Using the modules that are already on the page.

            // XXX: Problem. The loader.sorted bit below may not
            // contain some modules that are already on the page
            // but need to be *attached* to the Y instance!
            this.inst.useSync.apply(this.inst, this.config.env);

            this.grab = true;
        }
        this.emit('populateEnv');
    },
    populateModules: function() {
        var mods = this.config.m;
        this.inst.useSync.apply(this.inst, mods);
        this.emit('populateModules');
    },
    adjustFiles: function() {
        var self = this;
        var mods = this.config.m;
        //If the user asks for it, give it..
        //?m=yui,loader because I want one script include.
        if (mods.indexOf('loader') === -1) {
            this.files.forEach(function(v, k) {
                if (v.indexOf(self.inst.config.loaderPath) !== -1) {
                    self.files.splice(k, 1);
                }
            });
        } else {
            if (this.files.length && (this.files[0].indexOf('loader') !== -1)) {
                if (this.inst.config._loaderPath) {
                    this.files[0] = this.inst.config._loaderPath;
                }
            }
        }
        if (this.bootstrapCore) {
            this.files.unshift(this.YUI.GlobalConfig.base + 'yui/yui-min.js');
        }
        this.emit('adjustFiles');
    },
    filter: function() {
        //Filter the URL's
        if (this.config.filt) {
            var str = '';
            //This just does the string replaces on the file names
            switch (this.config.filt.toLowerCase()) {
                case 'raw':
                    str = '';
                    break;
                case 'debug':
                    str = '-debug';
                    break;
                default:
                    str = '-min';
                    break;
            }
            var f = [];
            this.files.forEach(function(v, k) {
                f[k] = v.replace('-min', str);
            });
            this.files = f;
        }
        this.emit('filter');
    },
    complete: function() {
        var self = this;
        //Sanity Check, remove any files from the
        //  fileData object if they are not in the files or css list
        var d = {};
        [].concat(this.files, this.inst.config._cssLoad).forEach(function(v) {
            d[v] = self.data[v];
        });
        var sorted = [];
        if (this.inst.Env && this.inst.Env._loader && this.inst.Env._loader.sorted) {
            sorted = this.inst.Env._loader.sorted;
        }
        //console.log(Y.Env._loader.moduleInfo);
        this.payload = {
            js : this.files,
            css : this.inst.config._cssLoad,
            d: d,
            sorted : sorted,
            Y: this.inst
        };
        this.emit('complete');
    },
    findMissing: function() {
        var self = this;
        var checkComplete = function() {
            if (missing.length === 0) {
                self.complete();
            }
        }

        var missing = [];
        var c = 1;
        [].concat(this.files, this.inst.config._cssLoad).forEach(function(v) {
            if (!self.data[v] && self.parse) {
                missing.push(v);
            }
        });

        if (missing.length) {
            var fs = require('fs');
            missing.forEach(function(v) {
                fs.readFile(v, encoding='utf8', (function(fileName) {
                    return function(err, data) {
                        self.data[fileName] = data;
                        missing.splice(missing.indexOf(fileName), 1);
                        checkComplete();
                    }
                })(v));
            });
        } else {
            self.complete();
        }   
        this.emit('findMissing');
    },
    compile: function(fn) {
        this.on('complete', function() {
            fn(null, this.payload);
        });
        this.normalizeConfig();
        this.normalizeYUIConfig();
        this.createInternalInstance();
        this.populateEnv();
        this.populateModules();
        this.adjustFiles();
        this.filter();
        this.findMissing();
    }
}

for (var i in proto) {
    RLS.prototype[i] = proto[i];
}
