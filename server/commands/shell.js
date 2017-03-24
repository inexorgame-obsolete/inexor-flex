const process = require('process');
const readline = require('readline');
const yargs = require('yargs');
const figlet = require('figlet');

const TreeClient = require('@inexor-game/treeclient').TreeClient;
const path = require('@inexor-game/path');
const log = require('@inexor-game/logger')();

exports.command = 'shell'
exports.describe = 'Interactive Inexor Shell'

exports.handler = function() {

  console.log(figlet.textSync('INEXOR', {
    font: 'Ghost',
    horizontalLayout: 'default',
    verticalLayout: 'default'
  }));
  
  const parser = yargs
    .reset()
    .commandDir('cli')
    .help()
    .showHelp();

  let readline_handler = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    historySize: 50,
    prompt: '> '
  });
  
  readline_handler.prompt();
  
  readline_handler.on('line', function(line) {
    // log.info('Entered command: ' + line);
    switch (line) {
      case 'exit':
      case 'quit':
        readline_handler.close();
        break;
      default:
        parser.parse(line.split(' '), function (err, argv, output) {
          if (output) {
            console.log(output);
          }
        });
        readline_handler.prompt();
        break;
    }
  }).on('close', () => {
    console.log('Thank you for playing Inexor!');
  }).on('SIGINT', () => {
    readline_handler.close();
  });

}
