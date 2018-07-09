/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const submitPeriod = require('../txHelpers/submitPeriod');

module.exports = async (rsp, chainInfo, _, options) => {
  const height = chainInfo.height - 32;
  const { node } = options;
  if (height === 0) {
    // genesis height doesn't need check
    rsp.status = 1;
    return;
  }

  const contractPeriod = await submitPeriod(
    node.previousPeriod,
    height + node.checkCallsCount,
    options
  );

  if (contractPeriod.timestamp === '0') {
    rsp.status = 0;
  } else {
    rsp.status = 1;
  }

  node.checkCallsCount += 1;
};
