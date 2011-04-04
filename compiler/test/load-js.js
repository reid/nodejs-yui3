#!/usr/bin/env node

var startTime = (new Date()).getTime(),
    times = [],
    max = 500;

for (var i = 0; i < max; i++) {
    var start = (new Date()).getTime();
    var YUI = require('yui3').YUI;
    YUI({debug: false}).useSync('yql');
    var end = (new Date()).getTime();
    times.push((end - start));    
}

var endTime = (new Date()).getTime(),
    t = 0;
times.forEach(function(v) {
    t += v;
});

console.log('Test time: ', ((endTime - startTime) / 1000), 'sec');
console.log('Average Time: ', ((t / max) / 1000), 'sec');

