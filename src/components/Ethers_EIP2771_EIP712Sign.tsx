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

import {
  useAccount,
  useNetwork,
  useProvider,
  useContract,
  useSigner,
} from "wagmi";

let config = {
  contract: {
    address: "0x8e67eb59cf715c435e2af33fa4ee33c1a6d7a8ae",
    abi: [
      { inputs: [], stateMutability: "nonpayable", type: "constructor" },
      {
        inputs: [],
        name: "admin",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "getQuote",
        outputs: [
          { internalType: "string", name: "currentQuote", type: "string" },
          { internalType: "address", name: "currentOwner", type: "address" },
        ],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [
          { internalType: "address", name: "forwarder", type: "address" },
        ],
        name: "isTrustedForwarder",
        outputs: [{ internalType: "bool", name: "", type: "bool" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "owner",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "quote",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [{ internalType: "string", name: "newQuote", type: "string" }],
        name: "setQuote",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "_trustedForwarder",
            type: "address",
          },
        ],
        name: "setTrustedForwarder",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function",
      },
      {
        inputs: [],
        name: "trustedForwarder",
        outputs: [{ internalType: "address", name: "", type: "address" }],
        stateMutability: "view",
        type: "function",
      },
      {
        inputs: [],
        name: "versionRecipient",
        outputs: [{ internalType: "string", name: "", type: "string" }],
        stateMutability: "view",
        type: "function",
      },
    ],
  },
  apiKey: {
    test: "cNWqZcoBb.4e4c0990-26a8-4a45-b98e-08101f754119",
    prod: "tNyxHiNaP.056bd335-d91c-49ef-842d-d1dce4da854b",
  },
};

// let chainId = 42;
// let web3: any, walletWeb3: any;
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
      biconomy = new Biconomy(window.ethereum as any, {
        apiKey: config.apiKey.prod,
        debug: true,
        contractAddresses: [config.contract.address],
      });
      await biconomy.init();
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
        showInfoMessage(`Getting user signature`);
        sendTransaction(address!, newQuote);
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

  const sendTransaction = async (userAddress: string, arg: string) => {
    try {
      showInfoMessage(`Sending transaction via Biconomy`);
      const provider = await biconomy.provider;
      const contractInstance = new ethers.Contract(
        config.contract.address,
        config.contract.abi,
        biconomy.ethersProvider
      );
      let { data } = await contractInstance.populateTransaction.setQuote(arg);
      let txParams = {
        data: data,
        to: config.contract.address,
        from: userAddress,
        signatureType: "EIP712_SIGN",
      };
      await provider.send("eth_sendTransaction", [txParams]);
      biconomy.on("test", (data: any) => console.log("test received", data));
      biconomy.on("txMined", (data: any) => {
        console.log("data", data);
        getQuoteFromNetwork();
      });
      getQuoteFromNetwork();
    } catch (error) {
      getQuoteFromNetwork();
      console.log(error);
    }
  };

  const showErrorMessage = (message: string) => {
    // NotificationManager.error(message, "Error", 5000);
  };

  const showSuccessMessage = (message: string) => {
    // NotificationManager.success(message, "Message", 3000);
  };

  const showInfoMessage = (message: string) => {
    // NotificationManager.info(message, "Info", 3000);
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
