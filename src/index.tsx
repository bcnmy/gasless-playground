import React from "react";
import ReactDOM from "react-dom/client";

import "@rainbow-me/rainbowkit/styles.css";
// import "@rainbow-me/rainbowkit/dist/index.css";
import "react-toastify/dist/ReactToastify.css";
import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { chain, configureChains, createClient, WagmiConfig } from "wagmi";
import { publicProvider } from "wagmi/providers/public";

import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";

const { chains, provider, webSocketProvider } = configureChains(
  [chain.polygonMumbai, chain.goerli],
  [publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Gasless Playground",
  chains,
});

const wagmiClient = createClient({
  autoConnect: true,
  connectors,
  provider,
  webSocketProvider,
});

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  <WagmiConfig client={wagmiClient}>
    <RainbowKitProvider chains={chains} coolMode>
      <App />
    </RainbowKitProvider>
  </WagmiConfig>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
