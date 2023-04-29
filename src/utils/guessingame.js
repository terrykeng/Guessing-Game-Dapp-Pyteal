import algosdk from "algosdk";
import {
    algodClient,
    guessingGameNote,
    numGlobalBytes,
    numGlobalInts,
    numLocalBytes,
    numLocalInts,
    connector,
    abi
} from "./constants";

/* eslint import/no-webpack-loader-syntax: off */
import approvalProgram from "!!raw-loader!../contracts/approval.teal";
import clearProgram from "!!raw-loader!../contracts/clear.teal";
import {utf8ToBase64String} from "./conversions";
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
export let addresses = []
export let Appid = []
export let rand1 = 0
export let rand2 = 0
export let p1wins = 0
export let p2wins = 0
export let draws = 0

// Compile smart contract in .teal format to program
const compileProgram = async (programSource) => {
    let encoder = new TextEncoder();
    let programBytes = encoder.encode(programSource);
    let compileResponse = await algodClient.compile(programBytes).do();
    return new Uint8Array(Buffer.from(compileResponse.result, "base64"));
}

const contract = new algosdk.ABIContract(abi);

export const Deploygame = async(senderAddress) => {
    console.log('Starting a new game ')
    Appid.length = 0
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;
    const compiledApprovalProgram = await compileProgram(approvalProgram)
    const compiledClearProgram = await compileProgram(clearProgram)

    let note = new TextEncoder().encode(guessingGameNote);

    let txn = algosdk.makeApplicationCreateTxnFromObject({
        from: senderAddress,
        suggestedParams: params,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        approvalProgram: compiledApprovalProgram,
        clearProgram: compiledClearProgram,
        numLocalInts: numLocalInts,
        numLocalByteSlices: numLocalBytes,
        numGlobalInts: numGlobalInts,
        numGlobalByteSlices: numGlobalBytes,
        note: note,
    });

    let txns = [txn]
    const txnsToSign = txns.map(txn => {
        const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
    
        return {
        txn: encodedTxn,
        message: 'Description of transaction being signed',
        };
    });

    const requestParams = [txnsToSign];

    const request = formatJsonRpcRequest("algo_signTxn", requestParams);
    const result = await connector.sendCustomRequest(request);
    const decodedResult = result.map(element => {
    return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });


    let txId = txn.txID().toString();

    // Sign & submit the transaction
    console.log("Signed transaction with txID: %s", txId);
    await algodClient.sendRawTransaction(decodedResult).do();

    // Wait for transaction to be confirmed
    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);

    // Get the completed Transaction
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);

    // Get created application id and notify about completion
    let transactionResponse = await algodClient.pendingTransactionInformation(txId).do();
    let appId = transactionResponse['application-index'];
    Appid.push(appId)
    console.log("Created new app-id: ", appId);
    return appId;
}

export const Connectgame = async(senderAddress, data) => {
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;
    let txn = algosdk.makeApplicationOptInTxnFromObject({
        from : senderAddress,
        suggestedParams : params,
        appIndex : parseInt(data.appid)
    })
    let txns = [txn]
    const txnsToSign = txns.map(txn => {
        const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");
    
        return {
        txn: encodedTxn,
        message: 'Description of transaction being signed',
        };
    });

    const requestParams = [txnsToSign];

    const request = formatJsonRpcRequest("algo_signTxn", requestParams);
    const result = await connector.sendCustomRequest(request);
    const decodedResult = result.map(element => {
    return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
    });
    await algodClient.sendRawTransaction(decodedResult).do();

    let txId = txn.txID().toString();

    let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
    console.log("Signed transaction with txID: %s", txId);
    console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
    console.log("Connected to game")
    Appid.push(parseInt(data.appid))
    return parseInt(data.appid)
}


export const create_challenge = async(senderAddress, game) => {
    console.log("creating challenge...")
    addresses.length = 0;
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;
    

    const atc = new algosdk.AtomicTransactionComposer();

    console.log(Appid[0]);
    console.log(parseInt(Appid[0]));
    const ran = Math.floor(Math.random()*10) + 1;
    const rand1 = utf8ToBase64String(ran.toString());
    console.log(rand1)
    let appaccount = algosdk.getApplicationAddress(Appid[0]);
    

    const signTxn = async(txnss) =>{
        const defaultAddress = senderAddress
        const txnsToSign = txnss.map(txn => {
          const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64');
          
          if (algosdk.encodeAddress(txn.from.publicKey) !== defaultAddress) {
            return { txn: encodedTxn, signers: [] };
          } else {
            return { txn: encodedTxn };
          }
        });
        
        const request = formatJsonRpcRequest('algo_signTxn', [txnsToSign]);

        const result = await connector.sendCustomRequest(request);
        const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
        return decodedResult
      }
    let txn = algosdk.makeApplicationOptInTxnFromObject({
        from : senderAddress,
        suggestedParams : params,
        appIndex : parseInt(Appid[0])
    })
    let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: appaccount,
        amount: game.wager * 1000000,
        suggestedParams: params
    })
    atc.addTransaction({ txn:txn , signer: signTxn } )

    const all = { txn: paymentTxn, signer:signTxn}

    atc.addMethodCall({
        appID: Appid[0],
        method: contract.getMethodByName('create_challenge'),
        methodArgs:[rand1, all],
        sender: senderAddress,
        signer: signTxn,
        suggestedParams: params,
      })
      atc.addMethodCall({
        appID: Appid[0],
        method: contract.getMethodByName('getPlayer1'),
        methodArgs:[],
        sender: senderAddress,
        signer: signTxn,
        suggestedParams: params,
        })

  
    const result = await atc.execute(algodClient, 4);
    
    console.log(result['methodResults'][1]['returnValue']);
    addresses.push(result['methodResults'][1]['returnValue']);
  
    console.log(addresses[0])

    console.log('Challenge made')
}


export const accept_challenge = async(senderAddress, game) => {
    console.log("accepting challenge...")

    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;
    
    let appaccount = algosdk.getApplicationAddress(parseInt(Appid[0]))
    const atc = new algosdk.AtomicTransactionComposer();

    const signTxn = async(txnss) =>{
        const defaultAddress = senderAddress
        const txnsToSign = txnss.map(txn => {
          const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64');
          
          if (algosdk.encodeAddress(txn.from.publicKey) !== defaultAddress) {
            return { txn: encodedTxn, signers: [] };
          } else {
            return { txn: encodedTxn };
          }
        });
        
        const request = formatJsonRpcRequest('algo_signTxn', [txnsToSign]);

        const result = await connector.sendCustomRequest(request);
        const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
        return decodedResult
      }

    let paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: senderAddress,
        to: appaccount,
        amount: game.wager *1000000,
        suggestedParams: params
    })
    
    const all = { txn: paymentTxn, signer:signTxn}
    


      atc.addMethodCall({
            appID: Appid[0],
            method: contract.getMethodByName('accept_challenge'),
            methodArgs:[all],
            sender: senderAddress,
            signer: signTxn,
            suggestedParams: params,
          });
  

          const result = await atc.execute(algodClient, 4);
          console.log(result)
    console.log('Challenge accepted')
}

export const play = async(senderAddress, game) => {

    console.log("playing guess...")
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;
    addresses.length = 0
    const atc = new algosdk.AtomicTransactionComposer();
    const y = utf8ToBase64String(game.move);
    console.log(y);

    const signTxn = async(txnss) =>{
        const defaultAddress = senderAddress
        const txnsToSign = txnss.map(txn => {
          const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64');
          
          if (algosdk.encodeAddress(txn.from.publicKey) !== defaultAddress) {
            return { txn: encodedTxn, signers: [] };
          } else {
            return { txn: encodedTxn };
          }
        });
        
        const request = formatJsonRpcRequest('algo_signTxn', [txnsToSign]);

        const result = await connector.sendCustomRequest(request);
        const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
        return decodedResult
      }

    atc.addMethodCall({
        appID: Appid[0],
        method: contract.getMethodByName('play_value'),
        methodArgs:[y],
        sender: senderAddress,
        signer: signTxn,
        suggestedParams: params,
      })
    
    atc.addMethodCall({
    appID: Appid[0],
    method: contract.getMethodByName('getPlayer1'),
    sender: senderAddress,
    signer: signTxn,
    suggestedParams: params,
    })

    atc.addMethodCall({
        appID: Appid[0],
        method: contract.getMethodByName('getPlayer2'),
        methodArgs:[],
        sender: senderAddress,
        signer: signTxn,
        suggestedParams: params,
    })

    const result = await atc.execute(algodClient, 4);

    addresses.push(result['methodResults'][1]['returnValue'], result['methodResults'][2]['returnValue'])
    
    console.log("Guess recorded")
}

export const reveal = async(senderAddress) => {
    console.log("Revealing result...")
    let params = await algodClient.getTransactionParams().do();
    params.fee = algosdk.ALGORAND_MIN_TX_FEE;
    params.flatFee = true;
    const atc = new algosdk.AtomicTransactionComposer();

    const signTxn = async(txnss) =>{
        const defaultAddress = senderAddress
        const txnsToSign = txnss.map(txn => {
        const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString('base64');
        
        if (algosdk.encodeAddress(txn.from.publicKey) !== defaultAddress) {
            return { txn: encodedTxn, signers: [] };
        } else {
            return { txn: encodedTxn };
        }
        });
        
        const request = formatJsonRpcRequest('algo_signTxn', [txnsToSign]);

        const result = await connector.sendCustomRequest(request);
        const decodedResult = result.map(element => {
            return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
            });
        return decodedResult
    }
    atc.addMethodCall({
        appID: Appid[0],
        method: contract.getMethodByName('reveal'),
        methodArgs:[addresses[0], addresses[1]],
        sender: senderAddress,
        signer: signTxn,
        suggestedParams: params,
        })
    atc.addMethodCall({
        appID: Appid[0],
        method: contract.getMethodByName('show_winner'),
        methodArgs:[addresses[0], addresses[1]],
        sender: senderAddress,
        signer: signTxn,
        suggestedParams: params,
        })
    
    
    const result = await atc.execute(algodClient, 4);
    console.log(result)
    console.log(result['methodResults'][1]['returnValue']);
    let x = result['methodResults'][1]['returnValue']
    console.log(x);
    if (x === 3n){
        console.log('round ended in a draw')
        draws += 1
    }else if(x === 1n){
        console.log('Player 1 wins the game')
        p1wins += 1
    }else if(x === 2n){
        console.log('Player 2 wins the game')
        p2wins += 1
    }

    
    
}

