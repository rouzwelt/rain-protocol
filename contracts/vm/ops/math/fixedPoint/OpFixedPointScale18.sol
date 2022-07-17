// SPDX-License-Identifier: CAL
pragma solidity ^0.8.15;

import "../../../../math/FixedPointMath.sol";
import "../../../LibStackTop.sol";

/// @title OpFixedPointScale18
/// @notice Opcode for scaling a number to 18 fixed point.
library OpFixedPointScale18 {
    using FixedPointMath for uint256;

    function scale18(uint256 operand_, StackTop stackTopLocation_)
        internal
        pure
        returns (StackTop)
    {
        uint256 location_;
        uint256 a_;
        assembly ("memory-safe") {
            location_ := sub(stackTopLocation_, 0x20)
            a_ := mload(location_)
        }
        uint256 b_ = a_.scale18(operand_);
        assembly ("memory-safe") {
            mstore(location_, b_)
        }
        return stackTopLocation_;
    }
}
