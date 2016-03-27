#!/usr/bin/env node
var net = require('net');
var fs = require('fs');
var path = require('path');
//var HOST = '73.65.72.10';
var HOST = '127.0.0.1';
var PORT = 5340;

var password = fs.readFileSync(path.join(__dirname, 'secrets/asset_generator_password.conf')).toString().split('\n')[0];

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
      if (data != password) {
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

    console.log('DATA ' + sock.remoteAddress + ': ' + data);
    data = JSON.parse(data);

    if (data.action === 'createThumbnail') {
      ffmpeg('/usr/bin/ffmpeg -i ' + data.file + ' -ss ' + data.startTime + ' -to ' + data.endTime + ' vframes 1 output.jpg', function() {
        sock.write(JSON.stringify({
          requestId: data.requestId,
          data_uri: 'testasdjflkasjkdljfklsadjlkfjalksjdklfjksdjklf'
        }));
      });
    }
    else if (data.action === 'createVideoClip') {

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
}

console.log('Server listening on ' + HOST +':'+ PORT);
