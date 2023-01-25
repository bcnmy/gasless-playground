//SPDX-License-Identifier: MIT
pragma solidity 0.6.6;

import "./utils/EIP712MetaTransaction.sol";

contract TestContract is EIP712MetaTransaction("TestContract", "1") {
    string public quote;
    address public owner;

    function setQuote(string memory newQuote) public {
        quote = newQuote;
        owner = msgSender();
    }

    function getQuote()
        public
        view
        returns (string memory currentQuote, address currentOwner)
    {
        currentQuote = quote;
        currentOwner = owner;
    }
}
