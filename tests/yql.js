var YUI = require("yui3").YUI;
var YUITest = require("yuitest").YUITest;

var Assert = YUITest.Assert,
    ArrayAssert = YUITest.ArrayAssert,
    suite = new YUITest.TestSuite("YUI");
//Generic Async Wait
var async = function(fn) {
    var count = 0;
    return function(data) {
        var loaded = false;
        var w = function() {
            if (count === 1000) {
                throw new Error('Async Timer reached 1000 iterations..');
            }
            count++;
            if (!loaded) {
                this.wait(w, 10);
            }
        };
        var next = function() {
            loaded = true;
        };
        fn.call(this, data, next);
        this.wait(w, 10);
    };
};

YUI({
    filter: 'debug',
    logExclude: {
        'attribute': true,
        'base': true,
        //'get': true,
        'loader': true,
        'yui': true,
        'widget': true,
        'event': true
    },
    debug: false
}).useSync('yql', function(Y) {
        
        suite.add( new YUITest.TestCase({
            name: 'YQL',
                "unescapsed query": async(function(data, next) {
                    var sql = "select * from html where url = \"http://instantwatcher.com/genres/506\" and xpath='//div[@id=\"titles\"]/ul/li/a'";
                    Y.YQL(sql, function(r) {
                        Assert.isObject(r.query);
                        next();
                    });
                }),
                "normal query": async(function(data, next) {
                    Y.YQL("select * from github.user.info where (id = 'davglass')", function(r) {
                        Assert.isObject(r.query);
                        next();
                    });
                })
            })
        ); 
        YUITest.TestRunner.add(suite);

        

});
