import '@nomicfoundation/hardhat-toolbox'
import 'hardhat-deploy'
import dotenv from 'dotenv'
import type { HardhatUserConfig, HttpNetworkUserConfig } from 'hardhat/types'
import yargs from 'yargs/yargs'

import "@nomicfoundation/hardhat-foundry";


const argv = yargs(process.argv.slice(2))
  .options({ network: { type: 'string', default: 'hardhat' } })
  .help(false)
  .version(false)
  .parseSync()

// Load environment variables.
dotenv.config()
const { NODE_URL, INFURA_KEY, MNEMONIC, ETHERSCAN_API_KEY, PK, SOLIDITY_VERSION, SOLIDITY_SETTINGS } = process.env

const DEFAULT_MNEMONIC = 'candy maple cake sugar pudding cream honey rich smooth crumble sweet treat'

const sharedNetworkConfig: HttpNetworkUserConfig = {}
if (PK) {
  sharedNetworkConfig.accounts = [PK]
} else {
  sharedNetworkConfig.accounts = {
    mnemonic: MNEMONIC || DEFAULT_MNEMONIC,
  }
}

if (['mainnet', 'sepolia', 'polygon', 'amoy'].includes(argv.network) && INFURA_KEY === undefined) {
  throw new Error(`Could not find Infura key in env, unable to connect to network ${argv.network}`)
}

import './src/tasks/local_verify'
import './src/tasks/deploy_contracts'
import './src/tasks/show_codesize'


const solidityVersion = SOLIDITY_VERSION || '0.8.23'
const soliditySettings = SOLIDITY_SETTINGS
  ? JSON.parse(SOLIDITY_SETTINGS)
  : {
      evmVersion: 'paris',
      viaIR: true,
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    }

const customNetwork = NODE_URL
  ? {
      custom: {
        ...sharedNetworkConfig,
        url: NODE_URL,
      },
    }
  : {}

const userConfig: HardhatUserConfig = {
  paths: {
    artifacts: 'build/artifacts',
    cache: 'build/cache',
    deploy: 'src/deploy',
    sources: 'contracts',
  },
  solidity: {
    compilers: [
      {
        version: "0.8.21",
        settings: soliditySettings,

      },
      {
        version: "0.8.25",
        settings: soliditySettings,

      },
      {
        version: solidityVersion,
        settings: soliditySettings,
      },
    ],
  },
  networks: {
    localhost: {
      url: 'http://localhost:8545',
      tags: ['dev', 'entrypoint', 'safe'],
    },
    hardhat: {
      forking: {
        url: "https://polygon-mainnet.infura.io/v3/c0201f3cd3894e30b62af4bb542b5779",
        blockNumber: 62447560,

      },
      gasPrice: 10000000000,
      chainId: 137,
      tags: ['test', 'entrypoint', 'safe', 'polygon'],
      // allowUnlimitedContractSize: true,
    },
    // hardhat: {
    //   forking: {
    //     url: "https://base-mainnet.g.alchemy.com/v2/Zs890Y4JuSC19mPxz5HAoOCuRegcBoDH",
    //     blockNumber: 20832442,

    //   },
    //   gasPrice: 10000000000,
    //   chainId: 8453,
    //   tags: ['test', 'entrypoint', 'safe', 'base'],
    //   // allowUnlimitedContractSize: true,
    // },
    mainnet: {
      ...sharedNetworkConfig,
      url: `https://mainnet.infura.io/v3/${INFURA_KEY}`,
    },
    gnosis: {
      ...sharedNetworkConfig,
      url: 'https://rpc.gnosis.gateway.fm',
    },
    polygon: {
      ...sharedNetworkConfig,
      url: `https://polygon-mainnet.infura.io/v3/${INFURA_KEY}`,
    },
    polygonfork: {
      ...sharedNetworkConfig,
      url: `https://node.zenguard.xyz/rpc/polygon`,
    },
    polygonsandbox: {
      ...sharedNetworkConfig,
      url: `https://rpc.dev.buildbear.io/embarrassing-groot-85ac687a`,
    },
    basefork: {
      ...sharedNetworkConfig,
      url: "https://node.zenguard.xyz/rpc/base",
    },
    base: {
      ...sharedNetworkConfig,
      url: `https://base-mainnet.g.alchemy.com/v2/Zs890Y4JuSC19mPxz5HAoOCuRegcBoDH`,
    },
    basesandbox: {
      ...sharedNetworkConfig,
      url: `https://rpc.dev.buildbear.io/implicit-siryn-1bdc1bb0`,
    },
    arbitrum: {
      ...sharedNetworkConfig,
      url: `https://arb1.arbitrum.io/rpc`,
    },
    sepolia: {
      ...sharedNetworkConfig,
      url: `https://sepolia.infura.io/v3/${INFURA_KEY}`,
      tags: ['dev', 'entrypoint'],
    },
    basesepolia: {
      ...sharedNetworkConfig,
      url: `https://base-sepolia.g.alchemy.com/v2/Zs890Y4JuSC19mPxz5HAoOCuRegcBoDH`,
      tags: ['dev', 'entrypoint'],
    },
    amoy: {
      ...sharedNetworkConfig,
      url: `https://polygon-amoy.infura.io/v3/${INFURA_KEY}`,
      tags: ['dev', 'entrypoint'],
    },
    ...customNetwork,
  },
  namedAccounts: {
    deployer: 0,
  },
  mocha: {
    timeout: 2000000,
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
}
export default userConfig
