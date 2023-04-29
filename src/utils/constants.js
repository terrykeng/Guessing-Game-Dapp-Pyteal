import algosdk from "algosdk";
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";

const config = {
    algodToken: "",
    algodServer: "https://node.testnet.algoexplorerapi.io/",
    algodPort: "",
    indexerToken: "",
    indexerServer: "https://algoindexer.testnet.algoexplorerapi.io/",
    indexerPort: "",
}


export const algodClient = new algosdk.Algodv2(config.algodToken, config.algodServer, config.algodPort)

export const indexerClient = new algosdk.Indexer(config.indexerToken, config.indexerServer, config.indexerPort);



export const minRound = 25556983;

export const guessingGameNote = "guessing-game:uv1"




export const numLocalInts = 0;
export const numLocalBytes = 2;

export const numGlobalInts = 1; 
export const numGlobalBytes = 4;
export const ALGORAND_DECIMALS = 6;
export const Appid = 191909283
export const connector = new WalletConnect({
    bridge: "https://bridge.walletconnect.org",
    qrcodeModal: QRCodeModal,
  });


export const abi = {
  "name": "Guessing Game",
  "methods": [
    {
      "name": "create_challenge",
      "args": [
        {
          "type": "string",
          "name": "rand"
        },
        {
          "type": "pay",
          "name": "payment"
        }
      ],
      "returns": {
        "type": "void"
      }
    },
    {
      "name": "show_seed",
      "args": [],
      "returns": {
        "type": "uint64"
      }
    },
    {
      "name": "accept_challenge",
      "args": [
        {
          "type": "pay",
          "name": "payment"
        }
      ],
      "returns": {
        "type": "void"
      }
    },
    {
      "name": "play_value",
      "args": [
        {
          "type": "string",
          "name": "p"
        }
      ],
      "returns": {
        "type": "void"
      }
    },
    {
      "name": "show_play",
      "args": [],
      "returns": {
        "type": "string"
      }
    },
    {
      "name": "reveal",
      "args": [
        {
          "type": "account",
          "name": "account1"
        },
        {
          "type": "account",
          "name": "account2"
        }
      ],
      "returns": {
        "type": "uint64"
      }
    },
    {
      "name": "show_winner",
      "args": [
        {
          "type": "account",
          "name": "account1"
        },
        {
          "type": "account",
          "name": "account2"
        }
      ],
      "returns": {
        "type": "uint64"
      }
    },
    {
      "name": "getPlayer1",
      "args": [],
      "returns": {
        "type": "address"
      }
    },
    {
      "name": "getPlayer2",
      "args": [],
      "returns": {
        "type": "address"
      }
    }
  ],
  "networks": {}
}