import React, { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress } from "@material-ui/core";
import { Link, Backdrop, makeStyles } from "@material-ui/core";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { useAccount, useNetwork, useSigner } from "wagmi";

import { Biconomy } from "mexa-sdk-v2";
import useGetQuoteFromNetwork from "../hooks/useGetQuoteFromNetwork";
import {
  configCustom_PersonalSign as config,
  getSignatureParametersWeb3,
  ExternalProvider,
} from "../utils";
import { toBuffer } from "ethereumjs-util";
let abi = require("ethereumjs-abi");

let biconomy: any, web3: any, contractInstance: any;

function App() {
  const classes = useStyles();
  const { address } = useAccount();
  const { chain } = useNetwork();
  const { data: signer } = useSigner();

  const [backdropOpen, setBackdropOpen] = React.useState(false);
  const [loadingMessage, setLoadingMessage] = React.useState("");
  const [newQuote, setNewQuote] = useState("");
  const [metaTxEnabled] = useState(true);
  const [transactionHash, setTransactionHash] = useState("");

  const { quote, owner, fetchQuote } = useGetQuoteFromNetwork(
    config.contract.address,
    config.contract.abi
  );

  useEffect(() => {
    const initBiconomy = async () => {
      setBackdropOpen(true);
      setLoadingMessage("Initializing Biconomy ...");
      biconomy = new Biconomy(window.ethereum as ExternalProvider, {
        apiKey: config.apiKey.prod,
        debug: true,
        contractAddresses: [config.contract.address],
      });
      await biconomy.init();
      console.log(biconomy.interfaceMap);
      web3 = new Web3(window.ethereum as any);
      contractInstance = await new web3.eth.Contract(
        config.contract.abi as AbiItem[],
        config.contract.address
      );
      setBackdropOpen(false);
    };
    if (address && chain && signer?.provider) initBiconomy();
  }, [address, chain, signer?.provider]);

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

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setTransactionHash("");
    if (!newQuote) {
      showErrorMessage("Please enter the quote");
      return;
    }
    if (!address) {
      showErrorMessage("Please connect wallet");
      return;
    }
    if (metaTxEnabled) {
      console.log("Sending meta transaction");
      const nonce = await contractInstance.methods.getNonce(address).call();
      console.log(nonce);
      let functionSignature = await contractInstance.methods
        .setQuote(newQuote)
        .encodeABI();
      console.log(functionSignature);
      let messageToSign = await constructMetaTransactionMessage(
        nonce,
        Number(chain?.network!),
        functionSignature,
        config.contract.address
      );
      console.log("messageToSign", messageToSign);

      // NOTE: We are using wallet web3 here to get signature from connected wallet
      const signature = await web3.eth.personal.sign(
        "0x" + messageToSign.toString("hex"),
        address
      );
      console.log(signature);

      // NOTE: Using wallet web3 here, as it is connected to the wallet where user account is present.
      let { r, s, v } = getSignatureParametersWeb3(signature);
      console.log(r, s, v);
      sendSignedTransaction(address!, functionSignature, r, s, v);
    } else {
      console.log("Sending normal transaction");
      let tx = await contractInstance.methods.setQuote(newQuote).send({
        from: address,
      });
      setTransactionHash(tx.transactionHash);
      tx = await tx.wait(1);
      console.log(tx);
      showSuccessMessage("Transaction confirmed");
      fetchQuote();
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
      biconomy.on("txHashGenerated", (data: any) => {
        console.log(data);
      });

      biconomy.on("txMined", (data: any) => {
        console.log(data);
      });
      await contractInstance.methods
        .executeMetaTransaction(userAddress, functionData, r, s, v)
        .send({
          from: userAddress,
        });
      fetchQuote();
    } catch (error) {
      console.log(error);
      fetchQuote();
    }
  };

  return (
    <div className="App">
      <section className="main">
        <div className="flex">
          <p className="mb-author">Quote: {quote}</p>
        </div>

        <p className="mb-author">Quote owner: {owner}</p>
        {address?.toLowerCase() === owner?.toLowerCase() && (
          <cite className="owner">You are the owner of the quote</cite>
        )}
        {address?.toLowerCase() !== owner?.toLowerCase() && (
          <cite>You are not the owner of the quote</cite>
        )}
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
              onChange={(event) => setNewQuote(event.target.value)}
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
        onClick={() => setBackdropOpen(false)}
      >
        <CircularProgress color="inherit" />
        <div style={{ paddingLeft: "10px" }}>{loadingMessage}</div>
      </Backdrop>
    </div>
  );
}

export default App;

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
