import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { artifacts, ethers } from "hardhat";
import type {
  AutoApprove,
  StateConfigStruct,
} from "../../typechain/AutoApprove";
import type {
  AutoApproveFactory,
  ImplementationEvent as ImplementationEventAutoApproveFactory,
} from "../../typechain/AutoApproveFactory";
import { zeroAddress } from "../constants";
import { getEventArgs } from "../events";

export const autoApproveFactoryDeploy = async () => {
  const stateBuilderFactory = await ethers.getContractFactory(
    "AutoApproveStateBuilder"
  );
  const stateBuilder = await stateBuilderFactory.deploy();
  await stateBuilder.deployed();

  const factoryFactory = await ethers.getContractFactory("AutoApproveFactory");
  const autoApproveFactory = (await factoryFactory.deploy(
    stateBuilder.address
  )) as AutoApproveFactory;
  await autoApproveFactory.deployed();

  const { implementation } = (await getEventArgs(
    autoApproveFactory.deployTransaction,
    "Implementation",
    autoApproveFactory
  )) as ImplementationEventAutoApproveFactory["args"];
  assert(
    !(implementation === zeroAddress),
    "implementation autoApprove factory zero address"
  );

  return autoApproveFactory;
};

export const autoApproveDeploy = async (
  deployer: SignerWithAddress,
  autoApproveFactory: AutoApproveFactory,
  config: StateConfigStruct
) => {
  const { implementation } = (await getEventArgs(
    autoApproveFactory.deployTransaction,
    "Implementation",
    autoApproveFactory
  )) as ImplementationEventAutoApproveFactory["args"];
  assert(
    !(implementation === zeroAddress),
    "implementation autoApprove factory zero address"
  );

  const tx = await autoApproveFactory.createChildTyped(config);
  const autoApprove = new ethers.Contract(
    ethers.utils.hexZeroPad(
      ethers.utils.hexStripZeros(
        (await getEventArgs(tx, "NewChild", autoApproveFactory)).child
      ),
      20
    ),
    (await artifacts.readArtifact("AutoApprove")).abi,
    deployer
  ) as AutoApprove;
  await autoApprove.deployed();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  autoApprove.deployTransaction = tx;

  return autoApprove;
};