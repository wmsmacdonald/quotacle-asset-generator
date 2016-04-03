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
    process.exec(processItem.command, function(err, stdout) {
      if (err) processItem.callback(err);

      numProcesses--;
      tryToExecuteNext();
    });
    numProcesses++;
  }
}