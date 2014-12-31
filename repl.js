
var util = require('util'),
    salliedforth = require('./tests/js/salliedforth.js');

var forthInt = new salliedforth.Interpreter( this );

process.stdin.setEncoding('utf8');
var inspectOptions = {
  colors: true
};

process.stdout.write('\nsalliedforth.js - v: ' + forthInt.versionString + '\n');
process.stdout.write('https://github.com/jococo/sallied-forth\n\n');

process.stdout.write('OK.\n> ');

process.stdin.on('readable', function() {
  var chunk = process.stdin.read();
  if (chunk !== null) {
    var result;
    try {
      result = forthInt.interpret(chunk);
      if(result.data && (result.data.length > 0)) {
        process.stdout.write("" + util.inspect(result.data, inspectOptions) + '\n');
      }
      process.stdout.write('OK.\n> ');
    } catch( err) {
      process.stderr.write('!! ' + err + '\n');
      process.stdout.write('OK.\n> ');
    }

  }
});

process.stdin.on('end', function() {
  process.stdout.write('end');
});