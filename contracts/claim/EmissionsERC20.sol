// SPDX-License-Identifier: CAL
pragma solidity ^0.8.10;

import { ERC20Config } from "../erc20/ERC20Config.sol";
import "./IClaim.sol";
import "../tier/ReadOnlyTier.sol";
import { RainVM, State, Op, Ops as RainVMOps } from "../vm/RainVM.sol";
import "../vm/ImmutableSource.sol";
import { BlockOps, Ops as BlockOpsOps } from "../vm/ops/BlockOps.sol";
import { ThisOps, Ops as ThisOpsOps } from "../vm/ops/ThisOps.sol";
import { MathOps, Ops as MathOpsOps } from "../vm/ops/MathOps.sol";
import { TierOps, Ops as TierOpsOps } from "../vm/ops/TierOps.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

enum Ops {
    account,
    constructionBlockNumber,
    length
}

struct EmissionsERC20Config {
    bool allowDelegatedClaims;
    ERC20Config erc20Config;
    ImmutableSourceConfig immutableSourceConfig;
}

contract EmissionsERC20 is
    ERC20,
    IClaim,
    ReadOnlyTier,
    RainVM,
    ImmutableSource
{
    bool public immutable allowDelegatedClaims;
    uint8 public immutable blockOpsStart;
    uint8 public immutable thisOpsStart;
    uint8 public immutable mathOpsStart;
    uint8 public immutable tierOpsStart;
    uint8 public immutable emissionsOpsStart;
    /// Block this contract was constructed.
    /// Can be used to calculate claim entitlements relative to the deployment
    /// of the emissions contract itself.
    uint32 public immutable constructionBlockNumber;

    /// Each claim is modelled as a report so that the claim report can be
    /// diffed against the upstream report from a tier based emission scheme.
    mapping(address => uint256) public reports;

    constructor(EmissionsERC20Config memory config_)
        ImmutableSource(config_.immutableSourceConfig)
        ERC20(config_.erc20Config.name, config_.erc20Config.symbol)
    {
        blockOpsStart = uint8(RainVMOps.length);
        thisOpsStart = blockOpsStart + uint8(BlockOpsOps.length);
        mathOpsStart = thisOpsStart + uint8(ThisOpsOps.length);
        tierOpsStart = mathOpsStart + uint8(MathOpsOps.length);
        emissionsOpsStart = tierOpsStart + uint8(TierOpsOps.length);

        allowDelegatedClaims = config_.allowDelegatedClaims;

        constructionBlockNumber = uint32(block.number);
    }

    function applyOp(
        bytes memory context_,
        State memory state_,
        Op memory op_
    )
        internal
        override
        view
    {
        unchecked {
            if (op_.code < thisOpsStart) {
                op_.code -= blockOpsStart;
                BlockOps.applyOp(
                    context_,
                    state_,
                    op_
                );
            }
            else if (op_.code < mathOpsStart) {
                op_.code -= thisOpsStart;
                ThisOps.applyOp(
                    context_,
                    state_,
                    op_
                );
            }
            else if (op_.code < tierOpsStart) {
                op_.code -= mathOpsStart;
                MathOps.applyOp(
                    context_,
                    state_,
                    op_
                );
            }
            else if (op_.code < emissionsOpsStart) {
                op_.code -= tierOpsStart;
                TierOps.applyOp(
                    context_,
                    state_,
                    op_
                );
            }
            else {
                op_.code -= emissionsOpsStart;
                if (op_.code == 0) {
                    (address account_) = abi.decode(context_, (address));
                    state_.stack[state_.stackIndex]
                    = uint256(uint160(account_));
                    state_.stackIndex++;
                }
                else if (op_.code == 1) {
                    state_.stack[state_.stackIndex] = constructionBlockNumber;
                    state_.stackIndex++;
                }
            }
        }
    }

    /// @inheritdoc ITier
    function report(address account_)
        public
        virtual
        override
        view
        returns (uint256)
    {
        return reports[account_] > 0 ? reports[account_] : TierReport.NEVER;
    }

    function calculateClaim(address account_)
        public
        view
        returns (uint256)
    {
        State memory state_ = newState();
        eval(
            abi.encode(account_),
            state_,
            0
        );
        return state_.stack[state_.stackIndex - 1];
    }

    function claim(address account_, bytes memory data_) external {
        // Disallow delegated claims if appropriate.
        if (!allowDelegatedClaims) {
            require(msg.sender == account_, "DELEGATED_CLAIM");
        }

        // Mint the claim.
        uint256 amount_ = calculateClaim(account_);
        _mint(account_, amount_);

        // Record the current block as the latest claim.
        // This can be diffed/combined with external reports in future claim
        // calculations.
        reports[account_] = TierReport.updateBlocksForTierRange(
            0,
            Tier.ZERO,
            Tier.EIGHT,
            uint32(block.number)
        );

        // Notify the world of the claim.
        emit Claim(account_, data_);
    }

}