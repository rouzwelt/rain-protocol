// contracts/GLDToken.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.6.12;

import { console } from "hardhat/console.sol";

// An Initable contract effectively has a second constructor.
//
// The intent is to facilitate a simple two step _interactive_ construction process.
//
// 1. The contract is constructed with configuration parameters
// 2. The user interacts with the contract e.g. approves it for ERC20 transfers
// 3. The contract completes the construction with a withInit modified function e.g. that consumes an approved ERC20 balance
//
// This is different from the Open Zeppelin concept of initialization.
// The OZ initialization:
//
// - Is designed to _emulate_ a non-interactive constructor for _upgradeable_ contracts (we don't want to upgrade, we want to interact)
// - Focusses on guarding the initializor function (has no modifiers to guard other functions)
// - Performs nested initialization calls like a constructor would (requires two bits of state instead of one)
// - Can be called from within a constructor (we want to initialize _after_ constructing)
abstract contract Initable {
    string constant private ERR_ONLY_INIT = "ERR_ONLY_INIT";
    string constant private ERR_ONLY_NOT_INIT = "ERR_ONLY_NOT_INIT";

    // The outside world is free to inspect the initialization state.
    // Initialization is atomic and binary, it either is or is not initialized.
    // Multi-step interactions are out of scope.
    // ONLY the withInit modified function can modify this directly.
    bool public initialized = false;

    // Mofified function can only be called _after_ initialization.
    // All functions that reference finalized initialization state MUST use this modifier.
    modifier onlyInit() {
        console.log("Initable: onlyInit: %s", initialized);
        require(initialized, ERR_ONLY_INIT);
        _;
    }

    // Modified function can only be called _before_ initialization.
    // Functions MAY use this to facilitate initialization then disable themselves.
    modifier onlyNotInit() {
        console.log("Initable: onlyNotInit: %s", initialized);
        require(!initialized, ERR_ONLY_NOT_INIT);
        _;
    }

    // Modified function initializes the contract.
    // MUST only be called once.
    // Sets initialized to true after initialization completes without reverting.
    modifier withInit() {
        console.log("Initable: withInit: %s", initialized);
        require(!initialized, ERR_ONLY_NOT_INIT);
        _;
        console.log("Initable: initialized");
        initialized = true;
    }
}