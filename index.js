/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const Web3 = require('web3');
const { Tx } = require('parsec-lib');
const lotion = require('lotion');

const cliArgs = require('./src/cliArgs');
const cleanupLotion = require('./src/cleanupLotion');
const Db = require('./src/api/db');
const jsonrpc = require('./src/api/jsonrpc');

const bridgeABI = require('./src/bridgeABI');
const applyTx = require('./src/tx/applyTx');
const accumulateTx = require('./src/tx/accumulateTx');

const addBlock = require('./src/block/addBlock');
const updatePeriod = require('./src/block/updatePeriod');
const updateValidators = require('./src/block/updateValidators');

const checkBridge = require('./src/period/checkBridge');

const eventsRelay = require('./src/eventsRelay');
const { printStartupInfo } = require('./src/utils');
const Node = require('./src/node');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const exists = promisify(fs.exists);

async function run() {
  const config = JSON.parse(await readFile(cliArgs.config));

  if (!config.bridgeAddr) {
    console.error('bridgeAddr is required');
    process.exit(0);
  }

  const web3 = new Web3();
  web3.setProvider(new web3.providers.HttpProvider(config.rootNetwork));
  const bridge = new web3.eth.Contract(bridgeABI, config.bridgeAddr);

  const app = lotion({
    initialState: {
      mempool: [],
      balances: {}, // stores account balances like this { [colorIndex]: { address1: 0, ... } }
      unspent: {}, // stores unspent outputs (deposits, transfers)
      processedDeposit: 0,
      slots: [],
    },
    networkId: config.network,
    genesis: config.genesis,
    abciPort: 26658,
    peers: config.peers,
    p2pPort: cliArgs.p2pPort,
    tendermintPort: 26659,
    createEmptyBlocks: false,
    logTendermint: true,
  });

  if (cliArgs.fresh) {
    await cleanupLotion(app);
  }

  const privFilename = path.join(path.dirname(cliArgs.config), '.priv');
  if (await exists(privFilename)) {
    config.privKey = await readFile(privFilename);
  } else {
    const { privateKey } = web3.eth.accounts.create();
    config.privKey = privateKey;
    await writeFile(privFilename, privateKey);
  }

  const db = Db(app);

<<<<<<< HEAD
  const node = new Node(db, web3, bridge, config.network);
  await node.init();
=======
  const node = {
    replay: true,
    blockHeight: 0,
    currentState: null,
    networkId: config.network,
    currentPeriod: new Period(),
    previousPeriod: null,
    lastBlockSynced: await db.getLastBlockSynced(),
  };

  await handleSlots(node, web3, bridge);
>>>>>>> Tests for a validator updates

  const account = web3.eth.accounts.privateKeyToAccount(config.privKey);

  app.useTx((state, { encoded }) => {
    const tx = Tx.fromRaw(encoded);
    applyTx(state, tx, node, bridge);
    accumulateTx(state, tx);
  });

  app.useBlock(async (state, chainInfo) => {
    if (!cliArgs.no_validators_updates) {
      updateValidators(chainInfo, state.slots, bridge);
    }
    updatePeriod(chainInfo, {
      bridge,
      web3,
      account,
      node,
    });
    await addBlock(state, chainInfo, {
      account,
      node,
      db,
    });
    console.log('Height:', chainInfo.height);
  });

  app.useBlock((state, { height }) => {
    // state is merk here. TODO: assign object copy or something immutable
    node.currentState = state;
    node.blockHeight = height;
  });

  app.usePeriod(async (rsp, chainInfo, height) => {
    await checkBridge(rsp, chainInfo, height, {
      node,
      web3,
      bridge,
      account,
      privKey: config.privKey,
    });
  });

  app.listen(cliArgs.port).then(async params => {
    node.replay = false;

    await printStartupInfo(params, node, account);

    await eventsRelay(params.txServerPort, web3, bridge);
    const api = await jsonrpc(node, params.txServerPort, db, web3, bridge);
    api
      .listenHttp({ port: cliArgs.rpcport, host: cliArgs.rpcaddr })
      .then(addr => {
        console.log(
          `Http JSON RPC server is listening at ${addr.address}:${addr.port}`
        );
      });

    api.listenWs({ port: cliArgs.wsport, host: cliArgs.wsaddr }).then(addr => {
      console.log(
        `Ws JSON RPC server is listening at ${addr.address}:${addr.port}`
      );
    });
  });
}

run();
