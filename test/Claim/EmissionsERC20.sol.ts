import * as Util from "../Util";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import { ethers } from "hardhat";
import * as claimUtil from "./ClaimUtil";
import { concat, hexlify } from "ethers/lib/utils";
import { eighteenZeros, op, paddedBlock, paddedReport } from "../Util";
import type { ReadWriteTier } from "../../typechain/ReadWriteTier";
import type { Contract } from "ethers";

chai.use(solidity);
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { expect, assert } = chai;

const enum Opcode {
  end,
  val,
  zipmap,
  blockNumber,
  thisAddress,
  add,
  sub,
  mul,
  pow,
  div,
  mod,
  min,
  max,
  average,
  report,
  never,
  always,
  diff,
  updateBlocksForTierRange,
  everyLteMin,
  everyLteMax,
  everyLteFirst,
  anyLteMin,
  anyLteMax,
  anyLteFirst,
  account,
  constructionBlockNumber,
}

enum Tier {
  ZERO,
  ONE, // bronze
  TWO, // silver
  THREE, // gold
  FOUR, // platinum
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
}

describe("EmissionsERC20", async function () {
  it("should calculate correct emissions amount, accounting for base reward, base tier reward and a linear scale factor that saturates after a certain number of blocks", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const readWriteTierFactory = await ethers.getContractFactory(
      "ReadWriteTier"
    );
    const readWriteTier =
      (await readWriteTierFactory.deploy()) as ReadWriteTier & Contract;
    await readWriteTier.deployed();

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const BLOCKS_PER_YEAR = 365;
    const BLOCK_PER_MONTH = BLOCKS_PER_YEAR / 12;

    const MONTHLY_REWARD_PLATINUM = 500;
    const MONTHLY_REWARD_GOLD = 300;
    const MONTHLY_REWARD_SILVER = 100;
    const MONTHLY_REWARD_BRONZE = 100;

    const BASE_REWARD_PER_TIER = paddedReport(
      ethers.BigNumber.from(
        "0x" +
          paddedBlock(0).repeat(4) +
          paddedBlock(Math.round(MONTHLY_REWARD_PLATINUM / BLOCK_PER_MONTH)) +
          paddedBlock(Math.round(MONTHLY_REWARD_GOLD / BLOCK_PER_MONTH)) +
          paddedBlock(Math.round(MONTHLY_REWARD_SILVER / BLOCK_PER_MONTH)) +
          paddedBlock(Math.round(MONTHLY_REWARD_BRONZE / BLOCK_PER_MONTH))
      )
    );

    const BASE_REWARD = ethers.BigNumber.from("1000" + eighteenZeros);

    const BONE = ethers.BigNumber.from("1" + eighteenZeros);

    // Val snippets
    const tierAddress = op(Opcode.val, 0);
    const baseRewardPerTier = op(Opcode.val, 1);
    const baseReward = op(Opcode.val, 2);
    const blocksPerYear = op(Opcode.val, 3); // multiplier saturation duration
    const bone = op(Opcode.val, 4);

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: Util.splitMonolithicSource(
            concat([
              op(Opcode.add, 8),
              op(Opcode.mul, 2),
              op(Opcode.add, 2),
              bone,
              op(Opcode.min, 2),
              op(Opcode.div, 2),
              blocksPerYear,
              bone,
              op(Opcode.sub, 2),
              op(Opcode.blockNumber),
              op(Opcode.constructionBlockNumber),
              op(Opcode.mul, 2),
              baseReward,
              op(Opcode.sub, 2),
              op(Opcode.blockNumber),
              op(Opcode.constructionBlockNumber),
              baseRewardPerTier,

              op(Opcode.diff),
              op(
                Opcode.updateBlocksForTierRange,
                claimUtil.tierRange(Tier.ZERO, Tier.EIGHT)
              ),
              op(Opcode.never),
              op(Opcode.blockNumber),

              op(Opcode.everyLteMax, 2),

              // lastClaimReport
              op(Opcode.report),
              op(Opcode.thisAddress),
              op(Opcode.account),

              // tierReport
              op(Opcode.report),
              tierAddress,
              op(Opcode.account),

              op(Opcode.blockNumber),
            ])
          ),
          vals: [
            readWriteTier.address,
            BASE_REWARD_PER_TIER,
            BASE_REWARD,
            BLOCKS_PER_YEAR, // e.g. '365' blocks = 1 year
            BONE,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ],
        },
      }
    );

    await readWriteTier.setTier(claimer.address, Tier.ONE, []);

    await Util.createEmptyBlock(5);

    const claimAmount = await emissionsERC20.calculateClaim(claimer.address);
    const expectedClaimAmount = 0;

    assert(
      claimAmount.eq(expectedClaimAmount),
      `wrong claim calculation result
      expected  ${expectedClaimAmount}
      got       ${claimAmount}`
    );
  });

  xit("should correctly mint ERC20 tokens upon a successive claim", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const readWriteTierFactory = await ethers.getContractFactory(
      "ReadWriteTier"
    );
    const readWriteTier =
      (await readWriteTierFactory.deploy()) as ReadWriteTier & Contract;
    await readWriteTier.deployed();

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [
            concat([
              op(Opcode.diff),

              op(
                Opcode.updateBlocksForTierRange,
                claimUtil.tierRange(Tier.ZERO, Tier.EIGHT)
              ),
              op(Opcode.never),
              op(Opcode.blockNumber),

              op(Opcode.everyLteMax, 2),

              // lastClaimReport
              op(Opcode.report),
              op(Opcode.thisAddress),
              op(Opcode.account),

              // tierReport
              op(Opcode.report),
              op(Opcode.val, 0),
              op(Opcode.account),

              op(Opcode.blockNumber),
            ]),
            0,
            0,
            0,
          ],
          vals: [
            readWriteTier.address,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ],
        },
      }
    );

    await readWriteTier.setTier(claimer.address, Tier.ONE, []);
    await readWriteTier.setTier(claimer.address, Tier.TWO, []);
    await readWriteTier.setTier(claimer.address, Tier.THREE, []);
    await readWriteTier.setTier(claimer.address, Tier.FOUR, []);

    await Util.createEmptyBlock(5);

    // first claim
    await emissionsERC20
      .connect(claimer)
      .claim(
        claimer.address,
        hexlify([...Buffer.from("Custom claim message")])
      );

    const expectedClaimAmount1 = paddedReport(
      ethers.BigNumber.from(
        "0x" +
          paddedBlock(0).repeat(4) +
          paddedBlock(6) +
          paddedBlock(7) +
          paddedBlock(8) +
          paddedBlock(9)
      )
    );
    const totalSupply1 = paddedReport(await emissionsERC20.totalSupply());
    const claimerBalance1 = paddedReport(
      await emissionsERC20.balanceOf(claimer.address)
    );

    assert(
      totalSupply1 === expectedClaimAmount1,
      `wrong total minted supply
      expected  ${expectedClaimAmount1}
      got       ${totalSupply1}`
    );
    assert(
      claimerBalance1 === expectedClaimAmount1,
      `wrong claimer balance
      expected  ${expectedClaimAmount1}
      got       ${claimerBalance1}`
    );

    await Util.createEmptyBlock(5);

    // second claim
    await emissionsERC20
      .connect(claimer)
      .claim(
        claimer.address,
        hexlify([...Buffer.from("Custom claim message")])
      );

    const expectedClaimAmount2 = paddedReport(
      ethers.BigNumber.from(
        "0x" +
          paddedBlock(0).repeat(4) +
          paddedBlock(6 + 6) +
          paddedBlock(7 + 6) +
          paddedBlock(8 + 6) +
          paddedBlock(9 + 6)
      )
    );
    const totalSupply2 = paddedReport(await emissionsERC20.totalSupply());
    const claimerBalance2 = paddedReport(
      await emissionsERC20.balanceOf(claimer.address)
    );

    assert(
      totalSupply2 === expectedClaimAmount2,
      `wrong total minted supply
        expected  ${expectedClaimAmount2}
        got       ${totalSupply2}`
    );
    assert(
      claimerBalance2 === expectedClaimAmount2,
      `wrong claimer balance
        expected  ${expectedClaimAmount2}
        got       ${claimerBalance2}`
    );
  });

  it("should return default claim report for an account before claiming", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [
            concat([
              // lastClaimReport
              op(Opcode.report),
              op(Opcode.thisAddress),
              op(Opcode.account),
            ]),
            0,
            0,
            0,
          ],
          vals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      }
    );

    const beforeClaimReport = await emissionsERC20.calculateClaim(
      claimer.address
    );

    assert(
      beforeClaimReport.isZero(),
      `wrong emissions report before claim
      expected  0x00
      got       ${hexlify(beforeClaimReport)}`
    );
  });

  xit("should correctly calculate claim amount after a claim", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const readWriteTierFactory = await ethers.getContractFactory(
      "ReadWriteTier"
    );
    const readWriteTier =
      (await readWriteTierFactory.deploy()) as ReadWriteTier & Contract;
    await readWriteTier.deployed();

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [
            concat([
              op(Opcode.diff),

              op(
                Opcode.updateBlocksForTierRange,
                claimUtil.tierRange(Tier.ZERO, Tier.EIGHT)
              ),
              op(Opcode.never),
              op(Opcode.blockNumber),

              op(Opcode.everyLteMax, 2),

              // lastClaimReport
              op(Opcode.report),
              op(Opcode.thisAddress),
              op(Opcode.account),

              // tierReport
              op(Opcode.report),
              op(Opcode.val, 0),
              op(Opcode.account),

              op(Opcode.blockNumber),
            ]),
            0,
            0,
            0,
          ],
          vals: [
            readWriteTier.address,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ],
        },
      }
    );

    await readWriteTier.setTier(claimer.address, Tier.ONE, []);
    await readWriteTier.setTier(claimer.address, Tier.TWO, []);
    await readWriteTier.setTier(claimer.address, Tier.THREE, []);
    await readWriteTier.setTier(claimer.address, Tier.FOUR, []);

    await Util.createEmptyBlock(5);

    await emissionsERC20
      .connect(claimer)
      .claim(
        claimer.address,
        hexlify([...Buffer.from("Custom claim message")])
      );

    const successiveClaimCalc0 = paddedReport(
      await emissionsERC20.calculateClaim(claimer.address)
    );
    const expectedClaimCalc0 = paddedReport(
      ethers.BigNumber.from("0x" + paddedBlock(0).repeat(8))
    );

    assert(
      successiveClaimCalc0 === expectedClaimCalc0,
      `wrong successive claim calculation0
      expected  ${expectedClaimCalc0}
      got       ${successiveClaimCalc0}`
    );

    await Util.createEmptyBlock(5);

    const successiveClaimCalc1 = paddedReport(
      await emissionsERC20.calculateClaim(claimer.address)
    );
    const expectedClaimCalc1 = paddedReport(
      ethers.BigNumber.from(
        "0x" + paddedBlock(0).repeat(4) + paddedBlock(5).repeat(4)
      )
    );

    assert(
      successiveClaimCalc1 === expectedClaimCalc1,
      `wrong successive claim calculation1
        expected  ${expectedClaimCalc1}
        got       ${successiveClaimCalc1}`
    );
  });

  xit("should correctly mint ERC20 tokens upon a claim", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const readWriteTierFactory = await ethers.getContractFactory(
      "ReadWriteTier"
    );
    const readWriteTier =
      (await readWriteTierFactory.deploy()) as ReadWriteTier & Contract;
    await readWriteTier.deployed();

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [
            concat([
              op(Opcode.diff),

              op(
                Opcode.updateBlocksForTierRange,
                claimUtil.tierRange(Tier.ZERO, Tier.EIGHT)
              ),
              op(Opcode.never),
              op(Opcode.blockNumber),

              op(Opcode.everyLteMax, 2),

              // lastClaimReport
              op(Opcode.report),
              op(Opcode.thisAddress),
              op(Opcode.account),

              // tierReport
              op(Opcode.report),
              op(Opcode.val, 0),
              op(Opcode.account),

              op(Opcode.blockNumber),
            ]),
            0,
            0,
            0,
          ],
          vals: [
            readWriteTier.address,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ],
        },
      }
    );

    await readWriteTier.setTier(claimer.address, Tier.ONE, []);
    await readWriteTier.setTier(claimer.address, Tier.TWO, []);
    await readWriteTier.setTier(claimer.address, Tier.THREE, []);
    await readWriteTier.setTier(claimer.address, Tier.FOUR, []);

    await Util.createEmptyBlock(5);

    assert(
      (await emissionsERC20.totalSupply()).isZero(),
      "total supply not zero"
    );

    await emissionsERC20
      .connect(claimer)
      .claim(
        claimer.address,
        hexlify([...Buffer.from("Custom claim message")])
      );

    const expectedClaimAmount = paddedReport(
      ethers.BigNumber.from(
        "0x" +
          paddedBlock(0).repeat(4) +
          paddedBlock(6) +
          paddedBlock(7) +
          paddedBlock(8) +
          paddedBlock(9)
      )
    );
    const totalSupply1 = paddedReport(await emissionsERC20.totalSupply());
    const claimerBalance1 = paddedReport(
      await emissionsERC20.balanceOf(claimer.address)
    );

    assert(
      totalSupply1 === expectedClaimAmount,
      `wrong total minted supply
      expected  ${expectedClaimAmount}
      got       ${totalSupply1}`
    );
    assert(
      claimerBalance1 === expectedClaimAmount,
      `wrong claimer balance
      expected  ${expectedClaimAmount}
      got       ${claimerBalance1}`
    );
  });

  it("should calculate claim report as difference between current block number and everyLteMax([tierReport, lastClaimReport]) for each tier", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const readWriteTierFactory = await ethers.getContractFactory(
      "ReadWriteTier"
    );
    const readWriteTier =
      (await readWriteTierFactory.deploy()) as ReadWriteTier & Contract;
    await readWriteTier.deployed();

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [
            concat([
              op(Opcode.diff),

              op(
                Opcode.updateBlocksForTierRange,
                claimUtil.tierRange(Tier.ZERO, Tier.EIGHT)
              ),
              op(Opcode.never),
              op(Opcode.blockNumber),

              op(Opcode.everyLteMax, 2),

              // lastClaimReport
              op(Opcode.report),
              op(Opcode.thisAddress),
              op(Opcode.account),

              // tierReport
              op(Opcode.report),
              op(Opcode.val, 0),
              op(Opcode.account),

              op(Opcode.blockNumber),
            ]),
            0,
            0,
            0,
          ],
          vals: [
            readWriteTier.address,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ],
        },
      }
    );

    await readWriteTier.setTier(claimer.address, Tier.ONE, []);
    await readWriteTier.setTier(claimer.address, Tier.TWO, []);
    await readWriteTier.setTier(claimer.address, Tier.THREE, []);
    await readWriteTier.setTier(claimer.address, Tier.FOUR, []);

    await Util.createEmptyBlock(5);

    const claimReport = paddedReport(
      await emissionsERC20.calculateClaim(claimer.address)
    );
    const expectedClaimReport = paddedReport(
      ethers.BigNumber.from(
        "0x" +
          paddedBlock(0).repeat(4) +
          paddedBlock(5) +
          paddedBlock(6) +
          paddedBlock(7) +
          paddedBlock(8)
      )
    );

    assert(
      claimReport === expectedClaimReport,
      `wrong claim calculation result
      expected  ${expectedClaimReport}
      got       ${claimReport}`
    );
  });

  it("should diff reports correctly", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const readWriteTierFactory = await ethers.getContractFactory(
      "ReadWriteTier"
    );
    const readWriteTier =
      (await readWriteTierFactory.deploy()) as ReadWriteTier & Contract;
    await readWriteTier.deployed();

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [
            concat([
              op(Opcode.diff),
              op(
                Opcode.updateBlocksForTierRange,
                claimUtil.tierRange(Tier.ZERO, Tier.EIGHT)
              ),
              op(Opcode.never),
              op(Opcode.blockNumber),

              op(Opcode.report),
              op(Opcode.val, 0),
              op(Opcode.account),
            ]),
            0,
            0,
            0,
          ],
          vals: [
            readWriteTier.address,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
          ],
        },
      }
    );

    const setTierBlock = (await ethers.provider.getBlockNumber()) + 1;
    await readWriteTier.setTier(claimer.address, Tier.EIGHT, []);

    await Util.createEmptyBlock(5);

    const calculationBlock = await ethers.provider.getBlockNumber();
    const diffResult = await emissionsERC20.calculateClaim(claimer.address);

    const expectedDiff = paddedReport(
      ethers.BigNumber.from(
        "0x" + paddedBlock(calculationBlock - setTierBlock).repeat(8)
      )
    );

    assert(
      diffResult.eq(expectedDiff),
      `wrong diff result
      expected  ${hexlify(expectedDiff)}
      got       ${hexlify(diffResult)}`
    );
  });

  it("should record the latest claim block as a tier report", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const claimAmount = 123;

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [concat([op(Opcode.val)]), 0, 0, 0],
          vals: [claimAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      }
    );

    const claimBlockNumber = (await ethers.provider.getBlockNumber()) + 1;

    await emissionsERC20
      .connect(claimer)
      .claim(
        claimer.address,
        hexlify([...Buffer.from("Custom claim message")])
      );

    const expectedReport = paddedReport(
      ethers.BigNumber.from("0x" + paddedBlock(claimBlockNumber).repeat(8))
    );

    const actualReport = paddedReport(
      await emissionsERC20.reports(claimer.address)
    );

    assert(
      actualReport === expectedReport,
      `wrong emissions claim report
      expected  ${expectedReport}
      actual    ${actualReport}`
    );
  });

  it("should allow delegated claims when flag set to true", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];
    const delegate = signers[2];

    const claimAmount = 123;

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: true,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [concat([op(Opcode.val)]), 0, 0, 0],
          vals: [claimAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      }
    );

    await emissionsERC20
      .connect(delegate)
      .claim(
        claimer.address,
        hexlify([...Buffer.from("Custom claim message")])
      );
  });

  it("should prevent delegated claims when flag set to false", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];
    const delegate = signers[2];

    const claimAmount = 123;

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [concat([op(Opcode.val)]), 0, 0, 0],
          vals: [claimAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      }
    );

    assert(!(await emissionsERC20.allowDelegatedClaims()));

    await Util.assertError(
      async () =>
        await emissionsERC20
          .connect(delegate)
          .claim(
            claimer.address,
            hexlify([...Buffer.from("Custom claim message")])
          ),
      "DELEGATED_CLAIM",
      "did not prevent delegated claim when flag was set to false"
    );
  });

  it("should perform claim using a constant val as claim amount", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const claimAmount = 123;

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: false,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [concat([op(Opcode.val)]), 0, 0, 0],
          vals: [claimAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      }
    );

    await emissionsERC20
      .connect(claimer)
      .claim(
        claimer.address,
        hexlify([...Buffer.from("Custom claim message")])
      );
  });

  it("should calculate claim amount from constant val", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];
    const claimer = signers[1];

    const claimAmount = 123;

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: true,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [concat([op(Opcode.val)]), 0, 0, 0],
          vals: [claimAmount, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      }
    );

    const claimAmountResult = await emissionsERC20.calculateClaim(
      claimer.address
    );

    assert(
      claimAmountResult.eq(claimAmount),
      `wrong claim amount from constant val
      expected  ${claimAmount}
      got       ${claimAmountResult}`
    );
  });

  it("should hold important correct values on construction", async function () {
    this.timeout(0);

    const signers = await ethers.getSigners();
    const creator = signers[0];

    const { emissionsERC20Factory } = await claimUtil.claimFactoriesDeploy();

    const constructionBlockNumber =
      (await ethers.provider.getBlockNumber()) + 1;

    const emissionsERC20 = await claimUtil.emissionsDeploy(
      creator,
      emissionsERC20Factory,
      {
        allowDelegatedClaims: true,
        erc20Config: {
          name: "Emissions",
          symbol: "EMS",
        },
        source: {
          source: [concat([op(Opcode.val)]), 0, 0, 0],
          vals: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        },
      }
    );

    assert(await emissionsERC20.allowDelegatedClaims());
    assert(
      (await emissionsERC20.constructionBlockNumber()) ===
        constructionBlockNumber,
      `wrong construction block number
      expected  ${constructionBlockNumber}
      got       ${await emissionsERC20.constructionBlockNumber()}`
    );
  });
});
