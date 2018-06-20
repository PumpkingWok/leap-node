const {
  getSlotsByAddr,
  readSlots,
  sendTransaction,
  GENESIS,
} = require('./utils');

module.exports = async (
  rsp,
  chainInfo,
  height,
  { node, web3, bridge, account, privKey }
) => {
  const period = await bridge.methods
    .periods(node.previousPeriod.merkleRoot())
    .call();

  // period not found
  if (period.timestamp === '0') {
    const slots = await readSlots(bridge);
    const mySlots = getSlotsByAddr(slots, account.address);
    const currentSlotId = (height + node.checkCallsCount) % slots.length;
    const currentSlot = mySlots.find(slot => slot.id === currentSlotId);

    if (currentSlot) {
      await sendTransaction(
        web3,
        bridge.methods.submitPeriod(
          currentSlot.id,
          node.previousPeriod.prevHash || GENESIS,
          node.previousPeriod.merkleRoot()
        ),
        bridge.address,
        privKey
      );
    }

    rsp.status = 1;
  } else {
    rsp.status = 0;
  }

  node.checkCallsCount += 1;
};
