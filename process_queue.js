var process = require('child_process');

var numCores = require('./conf/num_cores');

var numProcesses = 0;
var queue = [];

module.exports = {
  add: function add(command, callback) {
    queue.push({ command: command, callback: callback });
    tryToExecuteNext();
  }
};

function tryToExecuteNext() {
  if (numProcesses < numCores && queue.length > 0) {
    var processItem = queue.shift();
    console.log(processItem.command);

    process.exec(processItem.command, function(err, stdout, stderr) {
      //console.log(JSON.stringify(err));
      if (err) {
        processItem.callback(err);
      }
      else {
        processItem.callback(false);
      }
      numProcesses--;
      tryToExecuteNext();
    });
    numProcesses++;
  }
}