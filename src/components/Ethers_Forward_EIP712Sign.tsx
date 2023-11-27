import React, { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress } from "@material-ui/core";
import { Link, Backdrop, makeStyles } from "@material-ui/core";
import { ethers } from "ethers";
import { useAccount, useNetwork, useSigner } from "wagmi";

import { Biconomy } from "@biconomy/mexa";
import { EthereumProvider } from '@walletconnect/ethereum-provider'

import useGetQuoteFromNetwork from "../hooks/useGetQuoteFromNetwork";
import {
  getConfig,
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from "../utils";

let biconomy: any;
let walletConnectEthereumProvider: any;
let ercForwarderClient: any;

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
    console.log("initWalletConnect")
    const initWalletConnect = async () => {
      walletConnectEthereumProvider = await EthereumProvider.init({
        projectId: "caae1b850708e83462d6c02609a02657", // REQUIRED your projectId
        chains: [137], // REQUIRED chain ids
        showQrModal: true, // REQUIRED set to "true" to use @walletconnect/modal
        methods: [
          "eth_sendTransaction",
          "eth_signTransaction",
          "eth_sign",
          "personal_sign",
          "eth_signTypedData"
        ], // REQUIRED ethereum methods
        events: ["chainChanged", "accountsChanged"], // REQUIRED ethereum events
        optionalMethods: ['eth_signTypedData_v4']
      });

      console.log('userAddress', walletConnectEthereumProvider.accounts[0]);

      setBackdropOpen(true);
      setLoadingMessage("Initializing Biconomy ...");
      await walletConnectEthereumProvider.connect();
      const ethersProvider = new ethers.providers.Web3Provider(walletConnectEthereumProvider.signer);
      biconomy = new Biconomy(ethersProvider, {
        apiKey: config.apiKey.prod,
        debug: true,
      });
      setBackdropOpen(false);
  
      biconomy.onEvent(biconomy.READY, async () => {
        ercForwarderClient = biconomy.erc20ForwarderClient;
      }).onEvent(biconomy.ERROR, (error: any, message: any) => {
        // Handle error while initializing mexa
        console.log(message);
        console.log(error);
      });
    }

    initWalletConnect();

  }, []);

  const onSubmit = async (e: any) => {
    e.preventDefault();
    setTransactionHash("");
    // if (!address) {
    //   showErrorMessage("Please connect wallet");
    //   return;
    // }
    if (!newQuote) {
      showErrorMessage("Please enter the quote");
      return;
    }
    setTransactionHash("");
    if (metaTxEnabled) {
      showInfoMessage(`Getting user signature`);
      sendTransaction(address!, newQuote);
    } else {
      console.log("Sending normal transaction");
      // let tx = await contract.setQuote(newQuote, {
      //   from: address,
      // });
      // setTransactionHash(tx.transactionHash);
      // tx = await tx.wait(1);
      // console.log(tx);
      showSuccessMessage("Transaction confirmed");
      fetchQuote();
    }
  };

  const sendTransaction = async (userAddress: string, arg: string) => {
    try {
      showInfoMessage(`Sending transaction via Biconomy`);
      // const provider = await biconomy.provider;
      const contractInstance = new ethers.Contract(
        config.contract.address,
        config.contract.abi,
        biconomy.getSignerByAddress(walletConnectEthereumProvider.accounts[0])
      );
      // console.log('provider', provider);
      // let tx = await contractInstance.setQuote(arg);
      //   console.log(tx);

      const {
        data 
      } = await contractInstance.populateTransaction.setQuote(arg);

      const builtTx = await ercForwarderClient.buildTx({
        to: config.contract.address,
        token: "0xBbba073C31bF03b8ACf7c28EF0738DeCF3695683",
        txGas: 500000,
        data,
        userAddress: "0x7FB18bA4c1504A6E1Ed694Df754468C1fd701d49",
        forwardInfo: {action: 'Stake', feeToken: "SAND"}
      })

      console.log('buildTx', builtTx);

      const transaction = await ercForwarderClient.sendTxPersonalSign({
        req: builtTx.request,
        userAddress: "0x7FB18bA4c1504A6E1Ed694Df754468C1fd701d49"
      })
      console.log(transaction);
    } catch (error) {
      console.log(error);
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
