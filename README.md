# PARSEC Labs validation node

https://parseclabs.readthedocs.io/en/latest/

## Prerequisite

- Node.js 8+
- build-essential
- Python 2.X (required by node-gyp, only for building)

## Install

`npm install parsec-node -g` or `yarn global add parsec-node`

## Run locally

`parsec [ARGS] --config=path-to-config.json`

### Debug

To enable logs use `DEBUG` env variable (see: https://www.npmjs.com/package/debug). Debug namepaces:

- `tendermint`
- `parsec`
- `parsec:period`
- `parsec:tx`
- `abci` (built-in from js-abci)

Example: `DEBUG=tendermint,parsec:tx parsec`

### Available cli arguments

- `no-validators-updates` — disabling validators set updates (default: false)
- `port` — tx endpoint port (default: 3000)
- `rpcaddr` — host for http RPC server (default: localhost)
- `rpcport` — port for http RPC server (default: 8645)
- `wsaddr` — host for websocket RPC server (default: localhost)
- `wsport` — port for websocket RPC server (default: 8646)
- `p2pPort` — port for p2p connection (default: random)
- `config` — path to config file
- `version` — print version of the node

### Config file options

- `bridgeAddr` — parsec bridge contract address
- `rootNetwork` — ethereum provider url
- `genesis` — genesis string
- `network` — network id
- `peers` — array of peers

### Config presets

Dev config file: <a href="https://raw.githubusercontent.com/parsec-labs/parsec-node/master/presets/parsec-testnet-beta.json" download>parsec-testnet-beta.json</a>

Testnet config file: N/A

Mainnet config file: N/A

## Run in the cloud

You can use [Terraform](https://www.terraform.io/) to spin up an Amazon EC2 instance with the node. You will need an SSH keypair to access the EC2 instance. Generate a new keypair or use an existing one.

```
terraform init setup/cloud
terraform apply -var ssh_public_file="~/.ssh/parsec-testnet.pub" -var ssh_private_file="~/.ssh/parsec-testnet" -var network="testnet-beta" setup/cloud
```


Some useful commands once it is up and running:
- check the logs: `ssh ubuntu@<ec2 host> journalctl -u parsec`
- start/stop/restart/status: `ssh ubuntu@<ec2 host> sudo service parsec start/stop/restart/status`

## Dive in development

https://github.com/parsec-labs/parsec-contracts/wiki/Setting-up-local-development-environment

## Staking UI

Dev: http://stake-dev.parseclabs.org/

Testnet: N/A

Mainnet: N/A
