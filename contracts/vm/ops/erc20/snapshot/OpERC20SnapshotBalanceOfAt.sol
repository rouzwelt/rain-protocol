// SPDX-License-Identifier: CAL
pragma solidity ^0.8.15;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Snapshot.sol";
import "../../../LibStackTop.sol";

/// @title OpERC20SnapshotBalanceOfAt
/// @notice Opcode for Open Zeppelin `ERC20Snapshot.balanceOfAt`.
/// https://docs.openzeppelin.com/contracts/4.x/api/token/erc20#ERC20Snapshot
library OpERC20SnapshotBalanceOfAt {
    /// Stack `balanceOfAt`.
    function balanceOfAt(uint256, StackTop stackTopLocation_)
        internal
        view
        returns (StackTop)
    {
        uint256 location_;
        uint256 token_;
        uint256 account_;
        uint256 snapshotId_;
        assembly ("memory-safe") {
            stackTopLocation_ := sub(stackTopLocation_, 0x40)
            location_ := sub(stackTopLocation_, 0x20)
            token_ := mload(location_)
            account_ := mload(stackTopLocation_)
            snapshotId_ := mload(add(stackTopLocation_, 0x20))
        }
        uint256 balance_ = ERC20Snapshot(address(uint160(token_))).balanceOfAt(
            address(uint160(account_)),
            snapshotId_
        );
        assembly ("memory-safe") {
            mstore(location_, balance_)
        }
        return stackTopLocation_;
    }
}
