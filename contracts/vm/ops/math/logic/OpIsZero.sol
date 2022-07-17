// SPDX-License-Identifier: CAL
pragma solidity ^0.8.15;
import "../../../LibStackTop.sol";

/// @title OpIsZero
/// @notice Opcode for checking if the stack top is zero.
library OpIsZero {
    function isZero(uint256, StackTop stackTopLocation_)
        internal
        pure
        returns (StackTop)
    {
        assembly ("memory-safe") {
            // The index doesn't change for iszero as there is
            // one input and output.
            let location_ := sub(stackTopLocation_, 0x20)
            mstore(location_, iszero(mload(location_)))
        }
        return stackTopLocation_;
    }
}
