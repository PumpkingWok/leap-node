/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */

const axios = require('axios');

module.exports = async (txServerPort, rawTx) => {
  const url = `http://localhost:${txServerPort}/txs`;
  return axios.post(url, { encoded: rawTx });
};
