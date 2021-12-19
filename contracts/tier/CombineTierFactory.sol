// SPDX-License-Identifier: CAL
pragma solidity ^0.8.10;

import { ChunkedSource } from "../vm/ImmutableSource.sol";
import { Factory } from "../factory/Factory.sol";
import { CombineTier } from "./CombineTier.sol";

/// @title CombineTierFactory
/// @notice Factory for creating and deploying `CombineTier` contracts.
contract CombineTierFactory is Factory {

    /// @inheritdoc Factory
    function _createChild(
        bytes calldata data_
    ) internal virtual override returns(address) {
        (ChunkedSource memory source_) = abi.decode(data_, (ChunkedSource));
        CombineTier combineTier_ = new CombineTier(source_);
        return address(combineTier_);
    }

    /// Typed wrapper for `createChild` with Source.
    /// Use original `Factory` `createChild` function signature if function
    /// parameters are already encoded.
    ///
    /// @param source_ `Source` of the `CombineTier` logic.
    /// @return New `CombineTier` child contract address.
    function createChild(ChunkedSource calldata source_)
        external
        returns(address) {
        return this.createChild(abi.encode(source_));
    }
}