// SPDX-License-Identifier: CAL
pragma solidity ^0.8.15;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../runtime/LibStackTop.sol";
import "../../runtime/LibVMState.sol";
import "../../integrity/LibIntegrityState.sol";

/// @title OpDebug
/// @notice Opcode for debugging state. Uses the standard debugging logic from
/// VMState.debug.
library OpDebug {
    using LibStackTop for StackTop;
    using LibVMState for VMState;

    /// VM integrity for debug.
    /// Debug doesn't modify the stack.
    function integrity(
        IntegrityState memory,
        Operand,
        StackTop stackTop_
    ) internal pure returns (StackTop) {
        return stackTop_;
    }

    /// Debug the current state.
    function debug(
        VMState memory state_,
        Operand operand_,
        StackTop stackTop_
    ) internal view returns (StackTop) {
        return state_.debug(stackTop_, DebugStyle(Operand.unwrap(operand_)));
    }
}
