import React, { useState, useEffect } from "react";
import { Button, Box, Typography, CircularProgress } from "@material-ui/core";
import { Link, Backdrop, makeStyles } from "@material-ui/core";
import { ethers } from "ethers";
import { useAccount, useNetwork, useSigner } from "wagmi";

import { Biconomy } from "@biconomy/mexa";
import useGetQuoteFromNetwork from "../hooks/useGetQuoteFromNetwork";
import {
  getConfig,
  ExternalProvider,
  showErrorMessage,
  showInfoMessage,
  showSuccessMessage,
} from "../utils";

let biconomy: any;
const abi = [{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newWhitelistAddress","type":"address"}],"name":"AddressAddedToWhitelist","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"removedWhitelistAddress","type":"address"}],"name":"AddressRemovedFromWhitelist","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint8","name":"version","type":"uint8"}],"name":"Initialized","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"actual_caller","type":"address"},{"indexed":false,"internalType":"address","name":"msgSender","type":"address"},{"indexed":false,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"address","name":"owner","type":"address"}],"name":"LogCheckOwner","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"newAddress","type":"address"},{"indexed":false,"internalType":"address","name":"senderAddress","type":"address"}],"name":"LogFeeAddressUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"newPercent","type":"uint256"},{"indexed":false,"internalType":"address","name":"senderAddress","type":"address"}],"name":"LogFeePercentUpdated","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"auctionType","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"address","name":"seller","type":"address"},{"indexed":false,"internalType":"uint256","name":"quantity","type":"uint256"}],"name":"LogOrderFinalised1155","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"auctionType","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"address","name":"buyer","type":"address"},{"indexed":false,"internalType":"address","name":"seller","type":"address"}],"name":"LogOrderFinalised721","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Paused","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"previousAdminRole","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"newAdminRole","type":"bytes32"}],"name":"RoleAdminChanged","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleGranted","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"bytes32","name":"role","type":"bytes32"},{"indexed":true,"internalType":"address","name":"account","type":"address"},{"indexed":true,"internalType":"address","name":"sender","type":"address"}],"name":"RoleRevoked","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"uint256","name":"tokenId","type":"uint256"},{"indexed":false,"internalType":"uint256","name":"value","type":"uint256"}],"name":"RoyaltiesPaid","type":"event"},{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"account","type":"address"}],"name":"Unpaused","type":"event"},{"inputs":[],"name":"DEFAULT_ADMIN_ROLE","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"addAddressToWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"auctionDetails","outputs":[{"internalType":"uint256","name":"totalListedQuantity","type":"uint256"},{"internalType":"uint256","name":"quantityLeft","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feeAddress","outputs":[{"internalType":"address","name":"","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"feePercent","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"uint256[]","name":"otherParams","type":"uint256[]"},{"internalType":"address","name":"_buyer","type":"address"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"uint256","name":"bidAmount","type":"uint256"},{"internalType":"uint256","name":"_quantity","type":"uint256"},{"internalType":"address","name":"tokenContract","type":"address"}],"name":"finaliseERC1155Auction","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"buyer","type":"address"},{"internalType":"address","name":"owner","type":"address"},{"internalType":"uint256[]","name":"otherParams","type":"uint256[]"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"uint256","name":"bidAmount","type":"uint256"},{"internalType":"address","name":"tokenContract","type":"address"}],"name":"finaliseERC721Auction","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"uint256[]","name":"otherParams","type":"uint256[]"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"uint256","name":"quantity","type":"uint256"},{"internalType":"address","name":"tokenContract","type":"address"}],"name":"finaliseFixedPriceAuction1155","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_owner","type":"address"},{"internalType":"uint256[]","name":"otherParams","type":"uint256[]"},{"internalType":"bytes","name":"signature","type":"bytes"},{"internalType":"address","name":"tokenContract","type":"address"}],"name":"finaliseFixedPriceAuction721","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"getChainID","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"}],"name":"getRoleAdmin","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"getTrustedForwarder","outputs":[{"internalType":"address","name":"forwarder","type":"address"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"grantRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"hasRole","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_name","type":"string"},{"internalType":"string","name":"_symbol","type":"string"},{"internalType":"string","name":"signDomain","type":"string"},{"internalType":"string","name":"signVersion","type":"string"},{"internalType":"address","name":"_feeAddress","type":"address"},{"internalType":"address[]","name":"_whitelistAddresses","type":"address[]"},{"internalType":"uint256","name":"_feePercent","type":"uint256"},{"internalType":"address","name":"_wethAddr","type":"address"},{"internalType":"address","name":"_trustedForwarder","type":"address"}],"name":"initialize","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"forwarder","type":"address"}],"name":"isTrustedForwarder","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"uint256[]","name":"","type":"uint256[]"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC1155BatchReceived","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC1155Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"},{"internalType":"bytes","name":"","type":"bytes"}],"name":"onERC721Received","outputs":[{"internalType":"bytes4","name":"","type":"bytes4"}],"stateMutability":"pure","type":"function"},{"inputs":[],"name":"paused","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"addr","type":"address"}],"name":"removeAddressFromWhitelist","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"renounceRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes32","name":"role","type":"bytes32"},{"internalType":"address","name":"account","type":"address"}],"name":"revokeRole","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_trustedForwarder","type":"address"}],"name":"setTrustedForwarder","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"address","name":"_trustedForwarder","type":"address"}],"name":"setTrustedForwarderByAnyone","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"bytes4","name":"interfaceId","type":"bytes4"}],"name":"supportsInterface","outputs":[{"internalType":"bool","name":"","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"_newFeeAddress","type":"address"}],"name":"updateFeeAddress","outputs":[],"stateMutability":"nonpayable","type":"function"},{"inputs":[{"internalType":"uint256","name":"_newFeePercent","type":"uint256"}],"name":"updateFeePercent","outputs":[],"stateMutability":"nonpayable","type":"function"}]
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
      biconomy = new Biconomy(window.ethereum as ExternalProvider, {
        apiKey: 'YZIkkcydz.ef23a671-3536-412c-a73f-15548dedd6fe',
        debug: true,
        contractAddresses: ['0x63DaCA01bA1a77A188d650441e43952Ad746629B'],
      });
      await biconomy.init();
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
      const provider = await biconomy.provider;
      const contractInstance = new ethers.Contract(
        '0x63DaCA01bA1a77A188d650441e43952Ad746629B',
        abi,
        biconomy.ethersProvider
      );
      const buyer_address = '0x7BB87C672dEe6a921189a21b1E70756325571f9B'; 
      const owner_address =  '0x28074A132E9CF81B0a6B4fd90bF881b03DA87299' ;
      const otherParams = [ 1, 10000000000000, 2, 1, 1675846031942, 1675842452363 ]; 
      const signature = '0x0617997d6df77a84a421819b99fa5dbe392aa5058438cf8f2c544dc54f8b65df0b7a09d24dccdd3a960fdcb66f39f0a589263af1f9fc5304a7ef97ec2e701d0e1b';
      const bidAmount = 20000000000000;
      const contract_address = '0xb2b2981345626a00684482509b074c223bfe8054';
      let { data } = await contractInstance.populateTransaction.finaliseERC721Auction(buyer_address, owner_address, otherParams, signature, bidAmount, contract_address);
      let txParams = {
        data: data,
        to: '0x63DaCA01bA1a77A188d650441e43952Ad746629B',
        from: userAddress,
        signatureType: "EIP712_SIGN",
      };
      const tx = await provider.send("eth_sendTransaction", [txParams]);
      console.log(tx);
      biconomy.on("txHashGenerated", (data: any) => {
        console.log(data);
        showSuccessMessage(`tx hash ${data.hash}`);
      });
      biconomy.on("txMined", (data: any) => {
        console.log(data);
        showSuccessMessage(`tx mined ${data.hash}`);
        fetchQuote();
      });
    } catch (error) {
      fetchQuote();
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
