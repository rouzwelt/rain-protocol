import { assert } from "chai";
import { concat } from "ethers/lib/utils";
import { ethers } from "hardhat";
import { RainterpreterStore } from "../../../../typechain";
import {
  OpMetaEvent,
  Rainterpreter,
  RainterpreterConfigStruct,
  ValidStoreEvent,
} from "../../../../typechain/contracts/interpreter/shared/Rainterpreter";
import {
  AllStandardOps,
  areEqualStateConfigs,
  basicDeploy,
  getEventArgs,
  memoryOperand,
  MemoryType,
  op,
} from "../../../../utils";
import {
  rainterpreterDeploy,
  rainterpreterStoreDeploy,
} from "../../../../utils/deploy/interpreter/shared/rainterpreter/deploy";
import { rainterpreterExpressionDeployerDeploy } from "../../../../utils/deploy/interpreter/shared/rainterpreterExpressionDeployer/deploy";

describe("Test Rainterpreter Expression Deployer event", async function () {
  it("DeployExpression event should emit original StateConfig", async () => {
    const interpreter = await rainterpreterDeploy();
    const expressionDeployer = await rainterpreterExpressionDeployerDeploy(
      interpreter
    );

    const config = {
      constants: ["1", "2"],
      sources: [
        concat([
          op(AllStandardOps.READ_MEMORY, memoryOperand(MemoryType.Constant, 0)),
          op(AllStandardOps.READ_MEMORY, memoryOperand(MemoryType.Constant, 1)),
          op(AllStandardOps.ADD, 2),
        ]),
      ],
    };

    const expected = config;
    const tx = await expressionDeployer.deployExpression(config, [1]);
    const configFromEvent = (
      await getEventArgs(tx, "ExpressionConfig", expressionDeployer)
    )[1];

    const result = {
      constants: configFromEvent.constants,
      sources: configFromEvent.sources,
    };

    const mathExpressionConstants = [2, 3];
    const v2 = op(
      AllStandardOps.READ_MEMORY,
      memoryOperand(MemoryType.Constant, 0)
    );
    const v3 = op(
      AllStandardOps.READ_MEMORY,
      memoryOperand(MemoryType.Constant, 1)
    );

    // prettier-ignore
    const mathExpressionSources = [
      concat([
              v2,
              v2,
              v2,
            op(AllStandardOps.ADD, 3),
            v3,
          op(AllStandardOps.MUL, 2),
          v2,
          v3,
        op(AllStandardOps.DIV, 3),
      ]),
    ];

    const mathExpressionConfig = {
      constants: mathExpressionConstants,
      sources: mathExpressionSources,
    };

    const expectedMathResult = mathExpressionConfig;
    const mathExpressionTx = await expressionDeployer.deployExpression(
      mathExpressionConfig,
      [1]
    );

    const mathConfigFromEvent = (
      await getEventArgs(
        mathExpressionTx,
        "ExpressionConfig",
        expressionDeployer
      )
    )[1];

    const mathResult = {
      constants: mathConfigFromEvent.constants,
      sources: mathConfigFromEvent.sources,
    };

    assert(
      areEqualStateConfigs(expected, result),
      `wrong state config
      expected  ${expected}
      got       ${result}`
    );

    assert(
      areEqualStateConfigs(expectedMathResult, mathResult),
      `wrong state config
      expected  ${expectedMathResult}
      got       ${mathResult}`
    );
  });

  it("should emit correct opMeta on interpreter construction", async () => {
    const signers = await ethers.getSigners();
    const deployer = signers[0];

    const opMeta = ethers.utils.toUtf8Bytes("AlphaRainInterpreter");
    const interpreterStore: RainterpreterStore =
      await rainterpreterStoreDeploy();

    const interpreterConfig: RainterpreterConfigStruct = {
      store: interpreterStore.address,
      opMeta: opMeta,
    };

    const interpreter = (await basicDeploy("Rainterpreter", {}, [
      interpreterConfig,
    ])) as Rainterpreter;

    // Checking OpMeta Event
    const OpMetaEvent = (await getEventArgs(
      interpreter.deployTransaction,
      "OpMeta",
      interpreter
    )) as OpMetaEvent["args"];

    const expectedString = ethers.utils.hexlify(opMeta);

    assert(OpMetaEvent.sender === deployer.address, "wrong sender");
    assert(OpMetaEvent.opMeta === expectedString, "incorrect bytes");

    // Checking ValidStore Event
    const ValidStoreEvent = (await getEventArgs(
      interpreter.deployTransaction,
      "ValidStore",
      interpreter
    )) as ValidStoreEvent["args"];

    assert(ValidStoreEvent.sender === deployer.address, "wrong sender");
    assert(
      ValidStoreEvent.store === interpreterStore.address,
      "incorrect store"
    );
  });
});
