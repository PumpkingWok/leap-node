/* eslint-disable class-methods-use-this */
const { Tx, Type, Block } = require('parsec-lib');
const BridgeABI = require('./bridgeABI');
const DepositSubscription = require('./DepositSubscription');

function depositToTx(deposit) {
  console.log('NewDeposit', deposit);
  return {};
}

function isUnspent(tx) {
  console.log(tx);
  return true;
}

function parseAndValidateTx(node, txData) {
  const tx = Tx.parse(txData);

  if (tx.type !== Type.TRANSFER) {
    throw new Error('Wrong transaction type');
  }

  // check sender address with ins txs «owner» to be sure they can spend it
  const inputTxs = tx.ins
    .map(input => node.transactionsData[input.prevTx])
    .filter(a => a)
    .filter(isUnspent);

  if (inputTxs.length !== tx.ins.length) {
    throw new Error('Wrong inputs');
  }

  return tx;
}

module.exports = class Node {
  constructor(web3, bridgeAddr, privKey) {
    this.transactionsData = {};
    this.blocksData = {};
    this.chain = [];
    this.baseHeight = 0;
    this.block = null;
    this.bridgeAddr = bridgeAddr;
    this.privKey = privKey;
    this.web3 = web3;
    this.bridge = new web3.eth.Contract(BridgeABI, this.bridgeAddr);

    const depositSubscription = new DepositSubscription(web3, this.bridge);
    depositSubscription.on('deposits', this.handleNewDeposits.bind(this));
  }

  handleNewDeposits(deposits) {
    deposits.map(depositToTx).forEach(tx => {
      this.transactionsData[tx.hash] = tx;
    });
  }

  /*
   * Join, read chain state and other init stuff here
   */
  async init() {
    const { 0: hash, 1: height } = await this.bridge.methods
      .getTip([
        '0x7159fc66d7df6fa51c99eaf96c160fa8a9ec7287',
        '0x8ccfd031639d8d9f46133859ea80deaf5dee9be3',
        '0x634b47d61f93d2096672743c5e3bcdd25f18c350',
        '0x8db6b632d743aef641146dc943acb64957155388',
        '0x4436373705394267350db2c06613990d34621d69',
      ])
      .call();
    console.log('getTip', hash, Number(height));
    if (hash === '0x') {
      throw new Error('Something goes wrong. getTip returned empty hash');
    }

    this.block = new Block(hash, Number(height));
  }

  /*
   * Returns current block hash
   * @return String
   */
  async getCurrentBlock() {
    return this.block.hash();
  }

  async getBlockNumber() {
    return this.chain.length + this.baseHeight;
  }

  getBlockHashByNumber(number) {
    return this.chain[number - this.baseHeight];
  }

  /*
   * Returns block object with transactions
   * @param hashOrNumber String | Number
   * @return Object
   */
  async getBlock(hashOrNumber) {
    const hash =
      typeof hashOrNumber === 'number'
        ? this.getBlockHashByNumber(hashOrNumber)
        : hashOrNumber;
    return this.blocksData[hash];
  }

  /*
   * Returns transaction object
   * @param hash String
   * @return Object
   */
  async getTransaction(hash) {
    return this.transactionsData[hash];
  }

  /*
   * Adds transaction to the current block
   * @param txData String signed UTXO transaction
   * @return String hash
   */
  async sendRawTransaction(txData) {
    const tx = parseAndValidateTx(txData);
    this.transactionsData[tx.hash] = tx;
    this.block.addTx(tx.hash);

    return tx.hash;
  }

  /*
   * Submits current block to the bridge
   */
  async submitBlock() {
    await this.bridge.submitBlock(
      this.block.parent,
      this.block.merkleRoot(),
      ...this.block.sign(this.privKey)
    );
    const hash = this.block.hash();
    this.chain.push(hash);
    this.blocksData[hash] = this.block;
    this.block = new Block(this.block.hash(), this.block.height + 1);
  }
};
