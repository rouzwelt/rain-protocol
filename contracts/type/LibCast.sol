// SPDX-License-Identifier: CAL
pragma solidity =0.8.10;

/// @title Cast
/// @notice Additional type casting logic that the Solidity compiler doesn't
/// give us by default. A type cast (vs. conversion) is considered one where the
/// structure is unchanged by the cast. The cast does NOT (can't) check that the
/// input is a valid output, for example any integer MAY be cast to a function
/// pointer but almost all integers are NOT valid function pointers. It is the
/// calling context that MUST ensure the validity of the data, the cast will
/// merely retype the data in place, generally without additional checks.
/// As most structures in solidity have the same memory structure as a `uint256`
/// or fixed/dynamic array of `uint256` there are many conversions that can be
/// done with near zero or minimal overhead.
library LibCast {
    /// Retype an integer to an opcode function pointer.
    /// @param i_ The integer to cast to an opcode function pointer.
    /// @return fn_ The opcode function pointer.
    function asOpFn(uint256 i_)
        internal
        pure
        returns (function(uint256, uint256) view returns (uint256) fn_)
    {
        assembly {
            fn_ := i_
        }
    }

    /// Retype a stack move function pointer to an integer.
    /// Provided the origin of the function pointer is solidity and NOT yul, the
    /// returned integer will be valid to run if retyped back via yul. If the
    /// origin of the function pointer is yul then we cannot guarantee anything
    /// about the validity beyond the correctness of the yul code in question.
    ///
    /// Function pointers as integers are NOT portable across contracts as the
    /// code in different contracts is different so function pointers will point
    /// to a different, incompatible part of the code.
    ///
    /// Function pointers as integers lose the information about their signature
    /// so MUST ONLY be called in an appropriate context once restored.
    /// @param fn_ The stack move function pointer to integerify.
    /// @return i_ The integer of the function pointer.
    function asUint256(function(uint256) view returns (uint256) fn_)
        internal
        pure
        returns (uint256 i_)
    {
        assembly {
            i_ := fn_
        }
    }
}