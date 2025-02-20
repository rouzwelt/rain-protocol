import { assert } from "chai";
import { concat } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { IInterpreterV1Consumer, Rainterpreter } from "../../../../typechain";
import { rainterpreterDeploy } from "../../../../utils/deploy/interpreter/shared/rainterpreter/deploy";
import { expressionConsumerDeploy } from "../../../../utils/deploy/test/iinterpreterV1Consumer/deploy";
import { getBlockTimestamp } from "../../../../utils/hardhat";
import { op } from "../../../../utils/interpreter/interpreter";
import { AllStandardOps } from "../../../../utils/interpreter/ops/allStandardOps";

const Opcode = AllStandardOps;

describe("RainInterpreter EInterpreter constant ops", async () => {
  let rainInterpreter: Rainterpreter;
  let logic: IInterpreterV1Consumer;

  before(async () => {
    rainInterpreter = await rainterpreterDeploy();

    const consumerFactory = await ethers.getContractFactory(
      "IInterpreterV1Consumer"
    );
    logic = (await consumerFactory.deploy()) as IInterpreterV1Consumer;
    await logic.deployed();
  });

  it("should return block.timestamp", async () => {
    const constants = [];

    const source = concat([
      // (BLOCK_TIMESTAMP)
      op(Opcode.BLOCK_TIMESTAMP),
    ]);

    const expression0 = await expressionConsumerDeploy(
      {
        sources: [source],
        constants,
      },
      rainInterpreter,
      1
    );

    await logic.eval(rainInterpreter.address, expression0.dispatch, []);
    const timestamp = await getBlockTimestamp();
    const result = await logic.stackTop();

    assert(
      result.eq(timestamp),
      `expected timestamp ${timestamp} got ${result}`
    );
  });

  it("should return block.number", async () => {
    const constants = [];

    const source = concat([
      // (BLOCK_NUMBER)
      op(Opcode.BLOCK_NUMBER),
    ]);

    const expression0 = await expressionConsumerDeploy(
      {
        sources: [source],
        constants,
      },
      rainInterpreter,
      1
    );

    await logic.eval(rainInterpreter.address, expression0.dispatch, []);
    const block = await ethers.provider.getBlockNumber();
    const result = await logic.stackTop();
    assert(result.eq(block), `expected block ${block} got ${result}`);
  });
});
