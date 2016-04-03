#!/usr/bin/env node
var net = require('net');
var fs = require('fs');
var path = require('path');
var temp = require('temp');

var processQueue = require('./process_queue');

//var HOST = '73.65.72.10';
var HOST = '127.0.0.1';
var PORT = 5340;

var acceptedApiKeys = require('./conf/secrets/accepted_api_keys');
var paths = require('./conf/paths');
var ffmpegPath = require('./conf/ffmpeg_path');
var wwwHost = require('./conf/www_host');


// Create a server instance, and chain the listen function to it
// The function passed to net.createServer() becomes the event handler for the 'connection' event
// The sock object the callback function receives UNIQUE for each connection
net.createServer(function(sock) {

  // We have a connection - a socket object is assigned to the connection automatically
  console.log('CONNECTED: ' + sock.remoteAddress +':'+ sock.remotePort);

  var initialSetup = true;

  // Add a 'data' event handler to this instance of socket
  sock.on('data', function(data) {
    if (initialSetup) {
      console.log('Password given: "%s"', data);
      if (acceptedApiKeys.indexOf(data.toString()) < 0) {
        sock.write(JSON.stringify({
          authSuccess: false
        }));
        console.log('Password incorrect');
        return sock.destroy();
      }
      sock.write(JSON.stringify({
        authSuccess: true
      }));
      console.log('Password correct');
      initialSetup = false;
      return;
    }

    data = JSON.parse(data);
    var message = data.message;

    if (message.action.toString() === 'createThumbnail') {
      var outputFile = temp.path({
        suffix: '.jpg',
        dir: paths.thumbnails
      });

      var command = ffmpegPath
        + ' -ss '+ message.timeOffset
        + ' -i ' + path.join(paths.sourceAssets, message.file)
        + ' -frames:v 1'
        + ' ' + outputFile;

      processQueue.add(command, function(err) {
        if (err) {
          sock.write(JSON.stringify({
            requestId: data.requestId,
            message: {
              err: 'FFmpeg command failed: ' + command
            }
          }));
        }
        else {
          var url = "http://" + wwwHost + '/thumbnails/' + path.basename(outputFile);
          sock.write(JSON.stringify({
            requestId: data.requestId,
            message: {
              url: url
            }
          }));
        }
      });
    }
    else if (message.action.toString() === 'createVideoClip') {
      throw 'createVideoClip not yet implemented';
    }

    // Write the data back to the socket, the client will receive it as data from the server
    //sock.write('You said "' + data + '"');

  });

  // Add a 'close' event handler to this instance of socket
  sock.on('close', function(data) {
    console.log('CLOSED: ' + sock.remoteAddress +' '+ sock.remotePort);
  });

}).listen(PORT);

function ffmpeg(command, callback) {
  console.log('pretending to execute ' + command);
  callback();
}

console.log('Server listening on ' + HOST +':'+ PORT);
