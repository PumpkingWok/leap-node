/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const utils = require('ethereumjs-util');
const { EMPTY_ADDRESS } = require('../utils');

function getAddress(pubkey) {
  const bytes = Buffer.from(pubkey.value, 'base64');
  const hash = utils.sha256(bytes).slice(0, 20);
  return hash.toString('base64');
}

/*
 * Removes validators except those having a slot
 */
module.exports = (chainInfo, slots) => {
  const validatorPubKeys = slots
    .filter(s => s.owner !== EMPTY_ADDRESS)
    .map(s => s.tendermint.replace('0x', ''))
    .map(addr => Buffer.from(addr, 'hex').toString('base64'));
  const validatorAddrs = validatorPubKeys.map(key =>
    getAddress({
      value: key,
      type: 'ed25519',
    })
  );

  // Change existing validators
  Object.keys(chainInfo.validators).forEach(addr => {
    const idx = validatorAddrs.findIndex(
      a => a.toLowerCase() === addr.toLowerCase()
    );
    if (idx === -1 && chainInfo.validators[addr].power !== 0) {
      chainInfo.validators[addr] = 0;
    } else if (idx !== -1 && chainInfo.validators[addr].power === 0) {
      chainInfo.validators[addr] = 10;
    }
  });

  // Add new validators
  validatorAddrs.forEach((addr, i) => {
    if (chainInfo.validators[addr] === undefined) {
      chainInfo.validators[addr] = {
        address: addr,
        pubKey: {
          data: validatorPubKeys[i],
          type: 'ed25519',
        },
        power: 10,
      };
    }
  });
};
