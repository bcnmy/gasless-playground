// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "./utils/BasicMetaTransaction.sol";

contract SetQuotePersonalSign is BasicMetaTransaction {
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
