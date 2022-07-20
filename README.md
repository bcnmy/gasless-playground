# Biconomy Gasless Playground

Example codes for integrating [biconomy gasless mexa sdk](https://github.com/bcnmy/mexa-sdk) in your repo.

By using Gasless SDK, dapp users are able to use the dapp and send transactions free of cost while developer pays the gas fee on their behalf as a part of user acquisition cost.

- [Gasless Playground]()
- [Gasless Dashboard](https://dashboard.biconomy.io)
- [Mexa SDK](https://github.com/bcnmy/mexa-sdk)

#### Run locally


```bash
git clone https://github.com/bcnmy/gasless-playground.git
cd gasless-playground
yarn
yarn start
```

#### Methods available


```
Ethers_Custom_EIP712Sign
Ethers_Custom_PersonalSign
Ethers_EIP2771_EIP712Sign
Ethers_EIP2771_PersonalSign
Web3_Custom_EIP712Sign
Web3_Custom_PersonalSign
Web3_EIP2771_EIP712Sign
Web3_EIP2771_PersonalSign
```