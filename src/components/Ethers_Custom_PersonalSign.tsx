import React, { useState, useEffect, useCallback } from "react";
import Button from "@material-ui/core/Button";

import Backdrop from "@material-ui/core/Backdrop";
import CircularProgress from "@material-ui/core/CircularProgress";

import { ethers } from "ethers";
import { Biconomy } from "mexa-sdk-v2";
import { makeStyles } from "@material-ui/core/styles";
import Link from "@material-ui/core/Link";
import Typography from "@material-ui/core/Typography";
import { Box } from "@material-ui/core";
import { toBuffer } from "ethereumjs-util";

import {
  useAccount,
  useNetwork,
  useProvider,
  useContract,
  useSigner,
} from "wagmi";
let abi = require("ethereumjs-abi");

const config = {
  contract: {
    address: "0xd03be140122c873ec8a05fab002cdeca814f84df",
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
        inputs: [],
        name: "getChainID",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256",
          },
        ],
        stateMutability: "pure",
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
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address",
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "chainID",
            type: "uint256",
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
        name: "verify",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool",
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

let salt = 42;
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
  const { data: signer } = useSigner();

  const classes = useStyles();
  const [backdropOpen, setBackdropOpen] = React.useState(true);
  const [loadingMessage, setLoadingMessage] = React.useState(
    " Loading Application ..."
  );
  const [quote, setQuote] = useState("This is a default quote");
  const [owner, setOwner] = useState("Default Owner Address");
  const [newQuote, setNewQuote] = useState("");
  const [metaTxEnabled] = useState(true);
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
      await biconomy.init();
      // walletWeb3 = new Web3(window.ethereum as any);
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

  const constructMetaTransactionMessage = (
    nonce: any,
    chainId: any,
    functionSignature: any,
    contractAddress: any
  ) => {
    return abi.soliditySHA3(
      ["uint256", "address", "uint256", "bytes"],
      [nonce, contractAddress, chainId, toBuffer(functionSignature)]
    );
  };

  const onSubmit = async (event: any) => {
    console.log(newQuote, contract);
    if (newQuote !== "" && contract && signer?.provider) {
      setTransactionHash("");
      if (metaTxEnabled) {
        console.log("Sending meta transaction");
        let userAddress = address;
        let ethersProvider = new ethers.providers.Web3Provider(
          window.ethereum as any
        );
        const walletProvider = ethersProvider.getSigner();
        const contractInstance = new ethers.Contract(
          config.contract.address,
          config.contract.abi,
          biconomy.ethersProvider
        );
        let nonce = await contractInstance.getNonce(userAddress);
        const contractInterface = new ethers.utils.Interface(
          config.contract.abi
        );
        let functionSignature = contractInterface.encodeFunctionData(
          "setQuote",
          [newQuote]
        );
        let messageToSign = constructMetaTransactionMessage(
          nonce.toNumber(),
          salt,
          functionSignature,
          config.contract.address
        );
        const signature = await walletProvider.signMessage(messageToSign);
        console.log("messageToSign", messageToSign);

        let { r, s, v } = getSignatureParameters(signature);
        console.log(r, s, v);
        sendSignedTransaction(userAddress!, functionSignature, r, s, v);
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
    if (!ethers.utils.isHexString(signature)) {
      throw new Error(
        'Given value "'.concat(signature, '" is not a valid hex string.')
      );
    }
    const r = signature.slice(0, 66);
    const s = "0x".concat(signature.slice(66, 130));
    let v = "0x".concat(signature.slice(130, 132));
    v = ethers.BigNumber.from(v).toString();
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
      showInfoMessage(`Sending transaction via Biconomy`);
      const provider = await biconomy.provider;
      const contractInstance = new ethers.Contract(
        config.contract.address,
        config.contract.abi,
        biconomy.ethersProvider
      );
      let { data } =
        await contractInstance.populateTransaction.executeMetaTransaction(
          userAddress,
          functionData,
          r,
          s,
          v
        );
      let txParams = {
        data: data,
        to: config.contract.address,
        from: userAddress,
        signatureType: "PERSONAL_SIGN",
      };
      await provider.send("eth_sendTransaction", [txParams]);
      biconomy.on("test", (data: any) => {
        console.log("test received", data);
        getQuoteFromNetwork();
      });
      biconomy.on("txMined", (data: any) => {
        console.log("data", data);
        getQuoteFromNetwork();
      });
      // let tx = await contractInstance.executeMetaTransaction(
      //   userAddress,
      //   functionData,
      //   r,
      //   s,
      //   v
      // );
      // showInfoMessage(`Transaction sent. Waiting for confirmation ..`);
      // await tx.wait(1);
      // console.log("Transaction hash : ", tx.hash);
      // //let confirmation = await tx.wait();
      // console.log(tx);
      // setTransactionHash(tx.hash);

      showSuccessMessage("Transaction confirmed on chain");
      getQuoteFromNetwork();
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
