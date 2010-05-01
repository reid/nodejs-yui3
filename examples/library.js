#!/usr/bin/env node

var sys = require('sys');

var YUI = require("../lib/node-yui3").YUI;

require("assert").equal( global.YUI, undefined, "global yui created");


YUI({
    filter: 'debug',
    debug: true
}).use('json', 'base', 'gallery-yql', function(Y) {

    //sys.puts('Inside: ' + sys.inspect(process.memoryUsage()));
    //Logger outputs with sys.puts
    Y.log('This is a test');
    //Lang is available
    Y.log('Test: ' + Y.Lang.isBoolean(true), 'debug', 'myapp');

    //Creating a simple class
    var One = function() {
        One.superclass.constructor.apply(this, arguments);
    };
    //Extending it with Y.Base so we have Custom Events and a lifecycle
    Y.extend(One, Y.Base, {
        test: function() {
            this.publish('foo', {
                emitFacade: true
            });
            this.fire('foo');
        }
    }, {
        NAME: 'one'
    });

    //Create a new instance of our new class
    var o = new One();
    o.on('foo', function(o) {
        Y.log('Foo Fired', 'debug', 'myapp');
        //Y.log(o, 'debug');
    });
    o.test(); //Should fire the one:foo Event.

    //sys.puts(sys.inspect(Y));
    
    var q1 = new Y.yql('select * from github.user.info where (id = "davglass")');
    q1.on('query', function(r) {
        //Do something here.
        sys.puts(sys.inspect(r));
    });

});