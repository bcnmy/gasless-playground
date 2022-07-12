import React, { useState, useEffect, useCallback } from "react";
// import "../App.css";
import Button from "@material-ui/core/Button";

// import "react-notifications/lib/notifications.css";
import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";

import Web3 from "web3";
import { Biconomy } from "mexa-sdk-v2";
import { makeStyles } from "@material-ui/core/styles";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import { Box } from "@material-ui/core";
import { toBuffer } from "ethereumjs-util";
import { IpcProviderBase } from "web3-core-helpers";
// import { config } from "../utils/contractDetails";
import { AbiItem } from "web3-utils";

import {
  useAccount,
  useNetwork,
  useProvider,
  useContract,
  useSigner,
} from "wagmi";
let abi = require("ethereumjs-abi");

let config = {
  contract: {
    address: "0x8ae808442aefe3bc1f544811cb0f1dda05895742",
    abi: [
      {
        inputs: [
          {
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            internalType: "bytes",
            name: "functionSignature",
            type: "bytes",
          },
          {
            internalType: "bytes32",
            name: "sigR",
            type: "bytes32",
          },
          {
            internalType: "bytes32",
            name: "sigS",
            type: "bytes32",
          },
          {
            internalType: "uint8",
            name: "sigV",
            type: "uint8",
          },
        ],
        name: "executeMetaTransaction",
        outputs: [
          {
            internalType: "bytes",
            name: "",
            type: "bytes",
          },
        ],
        stateMutability: "payable",
        type: "function",
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "address",
            name: "userAddress",
            type: "address",
          },
          {
            indexed: false,
            internalType: "address payable",
            name: "relayerAddress",
            type: "address",
          },
          {
            indexed: false,
            internalType: "bytes",
            name: "functionSignature",
            type: "bytes",
          },
        ],
        name: "MetaTransactionExecuted",
        type: "event",
      },
      {
        inputs: [
          {
            internalType: "string",
            name: "newQuote",
            type: "string",
          },
        ],
        name: "setQuote",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "user",
            type: "address",
          },
        ],
        name: "getNonce",
        outputs: [
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getQuote",
        outputs: [
          {
            internalType: "string",
            name: "currentQuote",
            type: "string",
          },
          {
            internalType: "address",
            name: "currentOwner",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "quote",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string",
          },
        ],
        stateMutability: "view",
        type: "function",
      },
    ],
  },
  apiKey: {
    test: "cNWqZcoBb.4e4c0990-26a8-4a45-b98e-08101f754119",
    prod: "rTN0Kt1dE.39ac9ec7-2150-47fe-adac-752615904bd1",
  },
};

const domainType = [
  { name: "name", type: "string" },
  { name: "version", type: "string" },
  { name: "verifyingContract", type: "address" },
  { name: "salt", type: "bytes32" },
];

const metaTransactionType = [
  { name: "nonce", type: "uint256" },
  { name: "from", type: "address" },
  { name: "functionSignature", type: "bytes" },
];

let domainData = {
  name: "TestContract",
  version: "1",
  verifyingContract: config.contract.address,
  salt: "0x" + (42).toString(16).padStart(64, "0"),
};

let web3: any, walletWeb3: any;
let biconomy: any;

const useStyles = makeStyles((theme) => ({
  root: {
    "& > * + *": {
      marginLeft: theme.spacing(2),
    },
  },
  link: {
    marginLeft: "5px",
  },
  main: {
    padding: 20,
    height: "100%",
  },
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
    opacity: ".85!important",
    background: "#000",
  },
}));

function App() {
  const { address } = useAccount();
  const { chain } = useNetwork();
  const provider = useProvider();
  const { data: signer, isError, isLoading } = useSigner();

  const classes = useStyles();
  const [backdropOpen, setBackdropOpen] = React.useState(true);
  const [loadingMessage, setLoadingMessage] = React.useState(
    " Loading Application ..."
  );
  const [quote, setQuote] = useState("This is a default quote");
  const [owner, setOwner] = useState("Default Owner Address");
  const [newQuote, setNewQuote] = useState("");
  const [metaTxEnabled, setMetaTxEnabled] = useState(true);
  const [transactionHash, setTransactionHash] = useState("");
  const contract = useContract({
    addressOrName: config.contract.address,
    contractInterface: config.contract.abi,
    signerOrProvider: signer,
  });

  // console.log(signer?.provider, isError, isLoading);

  const getQuoteFromNetwork = useCallback(async () => {
    setLoadingMessage("Getting Quote from contact ...");
    try {
      const res = await contract.getQuote();
      console.log(res);
      showErrorMessage("No quotes set on blockchain yet");
      setQuote(res.currentQuote);
      setOwner(res.currentOwner);

      showErrorMessage("Not able to get quote information from Network");
      handleClose();
    } catch (error) {
      handleClose();
      console.log(error);
    }
  }, [contract]);

  useEffect(() => {
    const initBiconomy = async () => {
      setLoadingMessage("Initializing Biconomy ...");
      // console.log(window.ethereum);
      biconomy = new Biconomy(window.ethereum as any, {
        apiKey: config.apiKey.prod,
        debug: true,
        contractAddresses: [config.contract.address],
      });
      console.log("idhar 1");
      await biconomy.init();
      // walletWeb3 = new Web3(window.ethereum as any);
      console.log("idhar 2");
      console.log(biconomy.interfaceMap);
      getQuoteFromNetwork();
    };
    if (address && chain && signer?.provider) initBiconomy();
  }, [address, chain, getQuoteFromNetwork, provider, signer?.provider]);

  const handleClose = () => {
    setBackdropOpen(false);
  };

  const onQuoteChange = (event: any) => {
    setNewQuote(event.target.value);
  };

  const onSubmit = async (event: any) => {
    if (newQuote !== "" && contract) {
      setTransactionHash("");
      if (metaTxEnabled) {
        console.log("Sending meta transaction");
        let userAddress = address;
        const web3 = new Web3(window.ethereum as any);
        const contractInstance = new web3.eth.Contract(
          config.contract.abi as AbiItem[],
          config.contract.address
        );
        let nonce = await contractInstance.methods.getNonce(userAddress).call();
        let functionSignature = await contractInstance.methods
          .setQuote(newQuote)
          .encodeABI();
        let message = {
          nonce: parseInt(nonce),
          from: userAddress,
          functionSignature: functionSignature,
        };

        const dataToSign = JSON.stringify({
          types: {
            EIP712Domain: domainType,
            MetaTransaction: metaTransactionType,
          },
          domain: domainData,
          primaryType: "MetaTransaction",
          message: message,
        });

        // NOTE: Using walletWeb3 here, as it is connected to the wallet where user account is present.
        // if (web3.currentProvider && web3.currentProvider === null) return;
        (web3.currentProvider as IpcProviderBase).send(
          {
            jsonrpc: "2.0",
            id: 999999999999,
            method: "eth_signTypedData_v4",
            params: [userAddress, dataToSign],
          },
          function (error: any, response: any) {
            console.info(`User signature is ${response.result}`);
            if (error || (response && response.error)) {
              showErrorMessage("Could not get user signature");
            } else if (response && response.result) {
              let { r, s, v } = getSignatureParameters(response.result);
              sendSignedTransaction(userAddress!, functionSignature, r, s, v);
            }
          }
        );
      } else {
        console.log("Sending normal transaction");
        let tx = await contract.setQuote(newQuote, {
          from: address,
        });
        setTransactionHash(tx.transactionHash);
        tx = await tx.wait(1);
        console.log(tx);
        showSuccessMessage("Transaction confirmed");
        getQuoteFromNetwork();
      }
    } else {
      showErrorMessage("Please enter the quote");
    }
  };

  const getSignatureParameters = (signature: any) => {
    const web3 = new Web3(window.ethereum as any);
    if (!web3.utils.isHexStrict(signature)) {
      throw new Error(
        'Given value "'.concat(signature, '" is not a valid hex string.')
      );
    }
    const r = signature.slice(0, 66);
    const s = "0x".concat(signature.slice(66, 130));
    let v = "0x".concat(signature.slice(130, 132));
    v = web3.utils.hexToNumber(v).toString();
    if (![27, 28].includes(Number(v))) v += 27;
    return {
      r: r,
      s: s,
      v: Number(v),
    };
  };

  // const contractRead = useContractRead({
  //   addressOrName: config.contract.address,
  //   contractInterface: config.contract.abi,
  //   functionName: "getQuote",
  // });
  // console.log(contractRead.data);

  const showErrorMessage = (message: string) => {
    // NotificationManager.error(message, "Error", 5000);
  };

  const showSuccessMessage = (message: string) => {
    // NotificationManager.success(message, "Message", 3000);
  };

  const showInfoMessage = (message: string) => {
    // NotificationManager.info(message, "Info", 3000);
  };

  const sendSignedTransaction = async (
    userAddress: string,
    functionData: string,
    r: string,
    s: string,
    v: number
  ) => {
    try {
      const web3 = new Web3(biconomy.provider);
      const contractInstance = new web3.eth.Contract(
        config.contract.abi as AbiItem[],
        config.contract.address
      );
      console.log(userAddress, functionData, r, s, v);
      let tx = await contractInstance.methods
        .executeMetaTransaction(userAddress, functionData, r, s, v)
        .send({
          from: userAddress,
        });
      console.log("tx hash", tx);
      // setTransactionHash(tx.transactionHash);
      // tx = await tx.wait(1);x
      // console.log(`Transaction hash is ${tx.transactionHash}`);
      // showInfoMessage(
      //   `Transaction sent by relayer with hash ${tx.transactionHash}`
      // );
      // showSuccessMessage("Transaction confirmed on chain");
      // getQuoteFromNetwork();
      tx.on("transactionHash", function (hash: any) {
        console.log(`Transaction hash is ${hash}`);
        showInfoMessage(`Transaction sent by relayer with hash ${hash}`);
      }).once("confirmation", function (confirmationNumber: any, receipt: any) {
        console.log(receipt);
        setTransactionHash(receipt.transactionHash);
        showSuccessMessage("Transaction confirmed on chain");
        getQuoteFromNetwork();
      });
    } catch (error) {
      console.log(error);
      getQuoteFromNetwork();
    }
  };

  return (
    <div className="App">
      <section className="main">
        <div className="flex">
          <p className="mb-author">Quote: {quote}</p>
        </div>

        <div className="mb-attribution">
          <p className="mb-author">Quote owner: {owner}</p>
          {address?.toLowerCase() === owner?.toLowerCase() && (
            <cite className="owner">You are the owner of the quote</cite>
          )}
          {address?.toLowerCase() !== owner?.toLowerCase() && (
            <cite>You are not the owner of the quote</cite>
          )}
        </div>
      </section>
      <section>
        {transactionHash !== "" && (
          <Box className={classes.root} mt={2} p={2}>
            <Typography>
              Check your transaction hash
              <Link
                href={`https://kovan.etherscan.io/tx/${transactionHash}`}
                target="_blank"
                className={classes.link}
              >
                here
              </Link>
            </Typography>
          </Box>
        )}
      </section>
      <section>
        <div className="submit-container">
          <div className="submit-row">
            <input
              type="text"
              placeholder="Enter your quote"
              onChange={onQuoteChange}
              value={newQuote}
            />
            <Button variant="contained" color="primary" onClick={onSubmit}>
              Submit
            </Button>
            {/* <Button
              variant="contained"
              color="primary"
              onClick={onSubmitWithPrivateKey}
              style={{ marginLeft: "10px" }}
            >
              Submit (using private key)
            </Button> */}
          </div>
        </div>
      </section>
      <Backdrop
        className={classes.backdrop}
        open={backdropOpen}
        onClick={handleClose}
      >
        <CircularProgress color="inherit" />
        <div style={{ paddingLeft: "10px" }}>{loadingMessage}</div>
      </Backdrop>
      {/* <NotificationContainer /> */}
    </div>
  );
}

export default App;
