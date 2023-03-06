import React, { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress } from "@material-ui/core";
import { Link, Backdrop, makeStyles } from "@material-ui/core";
import Web3 from "web3";
import { AbiItem } from "web3-utils";
import { useAccount, useNetwork, useSigner } from "wagmi";

import { Biconomy } from "@biconomy/mexa";
import useGetQuoteFromNetwork from "../hooks/useGetQuoteFromNetwork";
import {
  getConfig,
  ExternalProvider,
  showErrorMessage,
  showSuccessMessage,
} from "../utils";

let biconomy: any;

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
  const [config, setConfig] = useState(getConfig("").configEIP2771);

  useEffect(() => {
    const conf = getConfig(chain?.id.toString() || "").configEIP2771;
    setConfig(conf);
  }, [chain?.id]);

  const { quote, owner, fetchQuote } = useGetQuoteFromNetwork(
    config.contract.address,
    config.contract.abi
  );

  useEffect(() => {
    const initBiconomy = async () => {
      setBackdropOpen(true);
      setLoadingMessage("Initializing Biconomy ...");
      biconomy = new Biconomy((signer?.provider as any).provider, {
        apiKey: config.apiKey.prod,
        debug: true,
        contractAddresses: [config.contract.address],
      });
      // await biconomy.init();
      setBackdropOpen(false);
    };
    if (address && chain && signer?.provider) initBiconomy();
  }, [address, chain, config, signer?.provider]);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setTransactionHash("");
    if (!address) {
      showErrorMessage("Please connect wallet");
      return;
    }
    if (!newQuote) {
      showErrorMessage("Please enter the quote");
      return;
    }
    try {
      if (metaTxEnabled) {
        const web3 = new Web3(biconomy.provider);
        const contractInstance = new web3.eth.Contract(
          config.contract.abi as AbiItem[],
          config.contract.address
        );
        biconomy.on("txHashGenerated", (data: any) => {
          console.log(data);
          showSuccessMessage(`tx hash ${data.hash}`);
        });
        biconomy.on("txMined", (data: any) => {
          console.log(data);
          showSuccessMessage(`tx mined ${data.hash}`);
          fetchQuote();
        });
        let tx = await contractInstance.methods.setQuote(newQuote).send({
          from: address,
          signatureType: "EIP712_SIGN",
        });
        console.log(tx);
      } else {
        console.log("Sending normal transaction");
        const web3 = new Web3(window.ethereum as any);
        const contractInstance = new web3.eth.Contract(
          config.contract.abi as AbiItem[],
          config.contract.address
        );
        let tx = await contractInstance.methods.setQuote(newQuote).send({
          from: address,
        });
        setTransactionHash(tx.transactionHash);
        tx = await tx.wait(1);
        console.log(tx);
        showSuccessMessage("Transaction confirmed");
        fetchQuote();
      }
    } catch (err) {
      console.log("handle errors like signature denied here");
      console.log(err);
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
      // marginLeft: theme.spacing(0),
    },
  },
  link: {},
  main: {},
  backdrop: {
    zIndex: theme.zIndex.drawer + 1,
    color: "#fff",
    opacity: ".85!important",
    background: "#000",
  },
}));
