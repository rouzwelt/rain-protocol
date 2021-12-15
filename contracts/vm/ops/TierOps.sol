// SPDX-License-Identifier: CAL
pragma solidity ^0.8.10;

import "../RainVM.sol";
import "../../tier/libraries/TierReport.sol";
import "../../tier/libraries/TierwiseCombine.sol";

enum Ops {
    report,
    never,
    always,
    andOld,
    andNew,
    andLeft,
    orOld,
    orNew,
    orLeft
}

abstract contract TierOps {
    uint8 public immutable tierOpsStart;
    uint8 public immutable opcodeTierReport;
    uint8 public immutable opcodeTierNever;
    uint8 public immutable opcodeTierAlways;
    uint8 public immutable opcodeTierAndOld;
    uint8 public immutable opcodeTierAndNew;
    uint8 public immutable opcodeTierAndLeft;
    uint8 public immutable opcodeTierOrOld;
    uint8 public immutable opcodeTierOrNew;
    uint8 public immutable opcodeTierOrLeft;
    uint8 public constant TIER_OPS_LENGTH = 9;

    constructor(uint8 start_) {
        tierOpsStart = start_;
        opcodeTierReport = start_ + uint8(Ops.report);
        opcodeTierNever = start_ + uint8(Ops.never);
        opcodeTierAlways = start_ + uint8(Ops.always);
        opcodeTierAndOld = start_ + uint8(Ops.andOld);
        opcodeTierAndNew = start_ + uint8(Ops.andNew);
        opcodeTierAndLeft = start_ + uint8(Ops.andLeft);
        opcodeTierOrOld = start_ + uint8(Ops.orOld);
        opcodeTierOrNew = start_ + uint8(Ops.orNew);
        opcodeTierOrLeft = start_ + uint8(Ops.orLeft);
    }

    function applyOp(
        bytes memory,
        Stack memory stack_,
        Op memory op_
    )
    internal
    virtual
    view
    returns (Stack memory) {
        if (op_.code == opcodeTierReport) {
            stack_.index -= 2;
            stack_.vals[stack_.index] =
                ITier(address(uint160(stack_.vals[stack_.index + 1])))
                    .report(address(uint160(stack_.vals[stack_.index])));
            stack_.index++;
        }
        else if (op_.code == opcodeTierNever) {
            stack_.vals[stack_.index] = TierReport.NEVER;
            stack_.index++;
        }
        else if (op_.code == opcodeTierAlways) {
            stack_.vals[stack_.index] = TierReport.ALWAYS;
            stack_.index++;
        }
        // All the combinators share the same stack and argument handling.
        else if (opcodeTierAndOld <= op_.code
            && op_.code <= opcodeTierOrLeft) {

            stack_.index -= op_.val + 1;
            uint256[] memory args_ = new uint256[](op_.val);
            for (uint256 a_ = 0; a_ < args_.length; a_++) {
                args_[a_] = stack_.vals[stack_.index + a_ + 1];
            }

            uint256 blockNumber_ = stack_.vals[stack_.index];

            if (op_.code == opcodeTierAndNew) {
                stack_.vals[stack_.index] = TierwiseCombine.andNew(
                    args_,
                    blockNumber_
                );
            }
            else if (op_.code == opcodeTierAndOld) {
                stack_.vals[stack_.index] = TierwiseCombine.andOld(
                    args_,
                    blockNumber_
                );
            }
            else if (op_.code == opcodeTierAndLeft) {
                stack_.vals[stack_.index] = TierwiseCombine.andLeft(
                    args_,
                    blockNumber_
                );
            }
            else if (op_.code == opcodeTierOrNew) {
                stack_.vals[stack_.index] = TierwiseCombine.orNew(
                    args_,
                    blockNumber_
                );
            }
            else if (op_.code == opcodeTierOrOld) {
                stack_.vals[stack_.index] = TierwiseCombine.orOld(
                    args_,
                    blockNumber_
                );
            }
            else if (op_.code == opcodeTierOrLeft) {
                stack_.vals[stack_.index] = TierwiseCombine.orLeft(
                    args_,
                    blockNumber_
                );
            }
            else {
                // Unhandled opcode!
                assert(false);
            }

            stack_.index++;
        }

        return stack_;
    }

}