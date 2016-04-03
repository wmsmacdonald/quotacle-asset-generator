#!/usr/bin/env node
var fs = require('fs');
var process = require('child_process');
var path = require('path');

var movies = fs.readFileSync('./movies.csv').toString().split('\n').slice(0, -1);

movies = movies.map(function(line) {
    var fields = line.replace(/ /g, '').split(',');
    return { id: fields[0], cleanfile: fields[1] } 
});

var videosPath = '/data/quotacle/movies';
var hlsPath = '/data/quotacle/assets/videos/movies';

var numProcesses = 0;
var numCores = 4;
var processQueue = [];

for (var i = 0; i < movies.length; i++) {
    
    var inputVideoPath = path.join(videosPath, movies[i].cleanfile + '.mp4');

    var outputPath = path.join(hlsPath, movies[i].id);
    fs.mkdirSync(outputPath);
    //var outputVideoPath = path.join(outputPath, 'index.m3u8');
    //var command = '/usr/bin/ffmpeg -i ' + inputVideoPath
        //+ ' -hls_time 1 -hls_list_size 0 ' + outputVideoPath;
    var command = 'mv ' + inputVideoPath + ' ' + path.join(outputPath, 'full.mp4');  
    processQueue.push(command); 
    executeNext();
}

function executeNext() {
    if (numProcesses < 4 && processQueue.length > 0) {
        var command = processQueue.shift();
        console.log('Started: ' + command);
        process.exec(command, function(err, stdout) {
            console.log('Finished: ' + command);
            numProcesses--;
            executeNext();
        });
        numProcesses++;
    }
}
