// SPDX-License-Identifier: MIT
pragma solidity ^0.6.2;

import "@opengsn/gsn/contracts/BaseRelayRecipient.sol";

contract SetQuoteTrustedForwarder is BaseRelayRecipient {
    address public admin;
    string public quote;
    address public owner;

    constructor() public {
        admin = _msgSender();
    }

    modifier onlyOwner() {
        require(_msgSender() == admin, "You are not the Admin");
        _;
    }

    function setTrustedForwarder(address _trustedForwarder) public onlyOwner {
        trustedForwarder = _trustedForwarder;
    }

    function setQuote(string memory newQuote) public {
        quote = newQuote;
        owner = _msgSender();
    }

    function getQuote()
        public
        view
        returns (string memory currentQuote, address currentOwner)
    {
        currentQuote = quote;
        currentOwner = owner;
    }

    function versionRecipient() external view override returns (string memory) {
        return "1";
    }
}
