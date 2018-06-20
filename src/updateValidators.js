/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const { readSlots } = require('./utils');

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

/*
 * Removes validators except those having a slot
 */
module.exports = async (state, chainInfo, { bridge }) => {
  const slots = await readSlots(bridge);
  const validatorAddrs = slots
    .filter(s => s.owner !== EMPTY_ADDRESS)
    .map(s => s.tendermint.replace('0x', ''))
    .map(addr => Buffer.from(addr, 'hex').toString('base64'));

  Object.keys(chainInfo.validators).forEach(addr => {
    chainInfo.validators[addr] = validatorAddrs.indexOf(addr) === -1 ? 0 : 10;
  });
};
