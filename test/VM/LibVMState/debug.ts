import { assert } from "chai";
import { concat } from "ethers/lib/utils";
import { ethers } from "hardhat";
import type { LibVMStateTest } from "../../../typechain/LibVMStateTest";
import { StandardIntegrity } from "../../../typechain/StandardIntegrity";
import { Opcode } from "../../../utils/rainvm/ops/allStandardOps";
import { op } from "../../../utils/rainvm/vm";

enum DebugStyle {
  Stack,
  Constant,
  Context,
  Source,
}

describe("LibVMState debug tests", async function () {
  let libVMState: LibVMStateTest;

  before(async () => {
    const stateBuilderFactory = await ethers.getContractFactory(
      "StandardIntegrity"
    );
    const vmIntegrity =
      (await stateBuilderFactory.deploy()) as StandardIntegrity;
    await vmIntegrity.deployed();

    const libVMStateFactory = await ethers.getContractFactory("LibVMStateTest");
    libVMState = (await libVMStateFactory.deploy(
      vmIntegrity.address
    )) as LibVMStateTest;
  });

  it("should debug Stack", async () => {
    const debugStyle = DebugStyle.Stack;
    // prettier-ignore
    const sources = [
      concat([
        op(Opcode.BLOCK_NUMBER, 0),
      ]),
      concat([
        op(Opcode.SENDER, 0),
      ])
    ];
    const constants = [2, 4, 6, 8, 10];
    const context = [3, 5, 7, 9, 11];

    const { stackTop_, stackTopAfter_ } = await libVMState.callStatic.debug(
      { sources, constants },
      context,
      debugStyle
    );

    assert(stackTopAfter_.eq(stackTop_));
  });

  it("should debug Constants", async () => {
    const debugStyle = DebugStyle.Constant;
    // prettier-ignore
    const sources = [
      concat([
        op(Opcode.BLOCK_NUMBER, 0),
      ]),
      concat([
        op(Opcode.SENDER, 0),
      ])
    ];
    const constants = [2, 4, 6, 8, 10];
    const context = [3, 5, 7, 9, 11];

    console.log({ constants });

    const { stackTop_, stackTopAfter_ } = await libVMState.callStatic.debug(
      { sources, constants },
      context,
      debugStyle
    );

    assert(stackTopAfter_.eq(stackTop_));
  });

  it("should debug Context", async () => {
    const debugStyle = DebugStyle.Context;
    // prettier-ignore
    const sources = [
      concat([
        op(Opcode.BLOCK_NUMBER, 0),
      ]),
      concat([
        op(Opcode.SENDER, 0),
      ])
    ];
    const constants = [2, 4, 6, 8, 10];
    const context = [3, 5, 7, 9, 11];

    console.log({ context });

    const { stackTop_, stackTopAfter_ } = await libVMState.callStatic.debug(
      { sources, constants },
      context,
      debugStyle
    );

    assert(stackTopAfter_.eq(stackTop_));
  });

  it("should debug Source", async () => {
    const debugStyle = DebugStyle.Source;
    // prettier-ignore
    const sources = [
      concat([
        op(Opcode.BLOCK_NUMBER, 0),
      ]),
      concat([
        op(Opcode.SENDER, 0),
      ])
    ];
    const constants = [2, 4, 6, 8, 10];
    const context = [3, 5, 7, 9, 11];

    const serialized_ = await libVMState.callStatic.serialize({
      sources,
      constants,
    });

    console.log({ serialized_ });

    const { stackTop_, stackTopAfter_ } = await libVMState.callStatic.debug(
      { sources, constants },
      context,
      debugStyle
    );

    assert(stackTopAfter_.eq(stackTop_));
  });
});
