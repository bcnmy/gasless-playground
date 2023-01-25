import React, { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress } from "@material-ui/core";
import { Link, Backdrop, makeStyles } from "@material-ui/core";
import Web3 from "web3";
import { IpcProviderBase } from "web3-core-helpers";
import { AbiItem } from "web3-utils";
import { useAccount, useNetwork, useSigner } from "wagmi";

import { Biconomy } from "@biconomy/mexa";
import useGetQuoteFromNetwork from "../hooks/useGetQuoteFromNetwork";
import {
  getConfig,
  getSignatureParametersWeb3,
  showErrorMessage,
  showSuccessMessage,
} from "../utils";

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
  const [config, setConfig] = useState(getConfig("").configCustom_EIP712Sign);

  useEffect(() => {
    const conf = getConfig(chain?.id.toString() || "").configCustom_EIP712Sign;
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
      await biconomy.init();
      web3 = new Web3(window.ethereum as any);
      contractInstance = await new web3.eth.Contract(
        config.contract.abi as AbiItem[],
        config.contract.address
      );
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
    if (metaTxEnabled) {
      console.log("Sending meta transaction");
      let nonce = await contractInstance.methods.getNonce(address).call();
      let functionSignature = await contractInstance.methods
        .setQuote(newQuote)
        .encodeABI();
      let message = {
        nonce: parseInt(nonce),
        from: address,
        functionSignature: functionSignature,
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
        salt: "0x" + (chain?.id || 80001).toString(16).padStart(64, "0"),
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

      // NOTE: Using web3 here, as it is connected to the wallet where user account is present.
      // if (web3.currentProvider && web3.currentProvider === null) return;
      (web3.currentProvider as IpcProviderBase).send(
        {
          jsonrpc: "2.0",
          id: 999999999999,
          method: "eth_signTypedData_v4",
          params: [address, dataToSign],
        },
        function (error: any, response: any) {
          console.info(`User signature is ${response.result}`);
          if (error || (response && response.error)) {
            showErrorMessage("Could not get user signature");
          } else if (response && response.result) {
            let { r, s, v } = getSignatureParametersWeb3(response.result);
            sendSignedTransaction(address!, functionSignature, r, s, v);
          }
        }
      );
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
        showSuccessMessage(`tx hash ${data.hash}`);
      });
      biconomy.on("txMined", (data: any) => {
        console.log(data);
        showSuccessMessage(`tx mined ${data.hash}`);
        fetchQuote();
      });
      const tx = await contractInstance.methods
        .executeMetaTransaction(userAddress, functionData, r, s, v)
        .send({
          from: userAddress,
        });
      console.log(tx);
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
