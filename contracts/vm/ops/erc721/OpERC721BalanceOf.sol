// SPDX-License-Identifier: CAL
pragma solidity ^0.8.15;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "../../LibStackTop.sol";

/// @title OpERC721BalanceOf
/// @notice Opcode for getting the current erc721 balance of an account.
library OpERC721BalanceOf {
    // Stack the return of `balanceOf`.
    function balanceOf(uint256, StackTop stackTopLocation_)
        internal
        view
        returns (StackTop)
    {
        uint256 location_;
        uint256 token_;
        uint256 account_;

        assembly ("memory-safe") {
            stackTopLocation_ := sub(stackTopLocation_, 0x20)
            location_ := sub(stackTopLocation_, 0x20)
            token_ := mload(location_)
            account_ := mload(stackTopLocation_)
        }
        uint256 balance_ = IERC721(address(uint160(token_))).balanceOf(
            address(uint160(account_))
        );

        assembly ("memory-safe") {
            mstore(location_, balance_)
        }
        return stackTopLocation_;
    }
}
