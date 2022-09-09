// SPDX-License-Identifier: CAL
pragma solidity =0.8.15;

import "./LibIntegrity.sol";

/// Config required to build a new `State`.
/// @param sources Sources verbatim.
/// @param constants Constants verbatim.
struct StateConfig {
    bytes[] sources;
    uint256[] constants;
}

interface IExpressionDeployer {
    function ensureIntegrity(
        bytes[] memory sources,
        uint256 constantsLength,
        uint256[] memory finalStacks
    ) external view returns (uint256 scratch, uint256 maximumStackHeight);

     function deployExpression(
        StateConfig memory config_,
        uint256[] memory finalMinStacks_
    ) external;
}