// SPDX-License-Identifier: CAL
pragma solidity ^0.8.15;
import "../../../LibStackTop.sol";

/// @title OpEqualTo
/// @notice Opcode to compare the top two stack values.
library OpEqualTo {
    function equalTo(uint256, StackTop stackTopLocation_)
        internal
        pure
        returns (StackTop)
    {
        assembly ("memory-safe") {
            stackTopLocation_ := sub(stackTopLocation_, 0x20)
            let location_ := sub(stackTopLocation_, 0x20)
            mstore(location_, eq(mload(location_), mload(stackTopLocation_)))
        }
        return stackTopLocation_;
    }
}
