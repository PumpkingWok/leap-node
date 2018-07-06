/* eslint-disable no-console */

const dashdash = require('dashdash');

const options = [
  {
    names: ['help', 'h'],
    type: 'bool',
    help: 'Print this help',
  },
  {
    names: ['no-validators-updates'],
    type: 'bool',
    default: false,
    help: 'Disabling validators set updates',
  },
  {
    names: ['port'],
    type: 'number',
    default: 3000,
    help: 'Tx endpoint port',
  },
  {
    names: ['rpcaddr'],
    type: 'string',
    default: 'localhost',
    help: 'Host for http RPC server',
  },
  {
    names: ['rpcport'],
    type: 'number',
    default: 8545,
    help: 'Port for http RPC server',
  },
  {
    names: ['wsaddr'],
    type: 'string',
    default: 'localhost',
    help: 'Host for websocket RPC server',
  },
  {
    names: ['p2pPort'],
    type: 'number',
    default: undefined,
    help: 'Port for p2p connection',
  },
];

const parser = dashdash.createParser({ options });
const cliArgs = parser.parse(process.argv);

if (cliArgs.help) {
  console.log('Usage:');
  console.log(parser.help({ includeEnv: true }).trimRight());
  process.exit(0);
}

module.exports = cliArgs;