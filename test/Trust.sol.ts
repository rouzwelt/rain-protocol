import { ethers } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import type { Trust } from "../typechain/Trust"
import type { ReserveToken } from "../typechain/ReserveToken"
import * as Util from './Util'

chai.use(solidity);
const { expect, assert } = chai;

describe("Trust", async function() {
  it("should refund users", async function() {
    this.timeout(0)

    const signers = await ethers.getSigners()

    const [rightsManager, crpFactory, bFactory] = await Util.balancerDeploy()

    const reserve = (await Util.basicDeploy('ReserveToken', {})) as ReserveToken

    const trustFactory = await ethers.getContractFactory (
      'Trust',
      {
        libraries: {
          'RightsManager': rightsManager.address
        }
      }
    )

    const tokenName = 'Token'
    const tokenSymbol = 'TKN'

    const reserveTotal = ethers.BigNumber.from('150000' + Util.eighteenZeros)
    const mintRatio = ethers.BigNumber.from('1' + Util.eighteenZeros)
    const bookRatio = ethers.BigNumber.from('2' + Util.eighteenZeros)
    const initialValuation = ethers.BigNumber.from('1000000' + Util.eighteenZeros)
    const minRaise = ethers.BigNumber.from('100000' + Util.eighteenZeros)

    const trust = await trustFactory.deploy(
      crpFactory.address,
      bFactory.address,
      tokenName,
      tokenSymbol,
      reserve.address,
      reserveTotal,
      mintRatio,
      bookRatio,
      initialValuation,
      minRaise,
    )

    await trust.deployed()

    await reserve.approve(trust.address, reserveTotal)

    const now = await ethers.provider.getBlockNumber()
    const unblockBlock = now + 10

    await trust.init(unblockBlock, {
      gasLimit: 100000000
    })

    const poolFactory = await ethers.getContractFactory(
      'RedeemableERC20Pool',
      {
        libraries: {
          'RightsManager': rightsManager.address
        }
      }
    )

    // have a few signers buy some tokens
    await reserve.transfer(signers[1].address, ethers.BigNumber.from('1000' + Util.eighteenZeros))
    await reserve.transfer(signers[2].address, ethers.BigNumber.from('2000' + Util.eighteenZeros))

    const poolJson = require('../artifacts/contracts/RedeemableERC20Pool.sol/RedeemableERC20Pool.json')
    const trustPool = new ethers.Contract(
      (await trust.pool()),
      poolJson.abi,
      signers[0]
    )

    const bPoolJson = require('../artifacts/contracts/configurable-rights-pool/contracts/test/BPool.sol/BPool.json')
    const bPool1 = new ethers.Contract(
      (await trustPool.pool()),
      bPoolJson.abi,
      signers[1]
    )
    const reserveJson = require('../artifacts/contracts/test/ReserveToken.sol/ReserveToken.json')
    const reserve1 = new ethers.Contract(
      reserve.address,
      reserveJson.abi,
      signers[1]
    )
    reserve1.approve(bPool1.address, ethers.BigNumber.from('1000' + Util.eighteenZeros))

    await bPool1.swapExactAmountIn(
      reserve.address,
      ethers.BigNumber.from('1000' + Util.eighteenZeros),
      (await trust.token()),
      ethers.BigNumber.from('1'),
      ethers.BigNumber.from('1000000' + Util.eighteenZeros)
    )

    const redeemableTokenJson = require('../artifacts/contracts/RedeemableERC20.sol/RedeemableERC20.json')
    const token1 = new ethers.Contract(
      (await trust.token()),
      redeemableTokenJson.abi,
      signers[1]
    )

    const crpJson = require('../artifacts/contracts/configurable-rights-pool/contracts/ConfigurableRightsPool.sol/ConfigurableRightsPool.json')
    const crp2 = new ethers.Contract(
      (await trustPool.crp()),
      crpJson.abi,
      signers[2]
    )
    await crp2.pokeWeights()

    const bPool2 = new ethers.Contract(
      (await trustPool.pool()),
      bPoolJson.abi,
      signers[2]
    )
    const reserve2 = new ethers.Contract(
      reserve.address,
      reserveJson.abi,
      signers[2]
    )
    reserve2.approve(
      bPool2.address,
      ethers.BigNumber.from('2000' + Util.eighteenZeros)
    )

    await bPool2.swapExactAmountIn(
      reserve.address,
      ethers.BigNumber.from('2000' + Util.eighteenZeros),
      (await trust.token()),
      ethers.BigNumber.from('1'),
      ethers.BigNumber.from('1000000' + Util.eighteenZeros)
    )

    // create a few blocks by sending some tokens around
    while ((await ethers.provider.getBlockNumber()) < (unblockBlock - 1)) {
      await reserve.transfer(signers[1].address, 1)
    }

    await trust.exit()

    await token1.redeem(await token1.balanceOf(signers[1].address))
    const reserveBalance1 = await reserve.balanceOf(signers[1].address)
    assert(
      ethers.BigNumber.from('587865634469347548948').eq(
        reserveBalance1
      ),
      'wrong balance 1 after redemption: ' + reserveBalance1
    )

    const token2 = new ethers.Contract(
      (await trust.token()),
      redeemableTokenJson.abi,
      signers[2]
    )
    await token2.redeem(await token1.balanceOf(signers[2].address))
    const reserveBalance2 = await reserve.balanceOf(signers[2].address)
    assert(
      ethers.BigNumber.from('2412069963578385643084').eq(
        reserveBalance2
      ),
      'wrong balance 2 after redemption: ' + reserveBalance2
    )

  })

  it("should create tokens", async function() {
    this.timeout(0)

    const signers = await ethers.getSigners()

    const [rightsManager, crpFactory, bFactory] = await Util.balancerDeploy()

    const reserve = (await Util.basicDeploy('ReserveToken', {})) as ReserveToken

    const trustFactory = await ethers.getContractFactory(
      'Trust',
      {
        libraries: {
          'RightsManager': rightsManager.address
        }
      }
    )

    const tokenName = 'Token'
    const tokenSymbol = 'TKN'

    const reserveTotal = ethers.BigNumber.from('150000' + Util.eighteenZeros)
    const mintRatio = ethers.BigNumber.from('1' + Util.eighteenZeros)
    const bookRatio = ethers.BigNumber.from('2' + Util.eighteenZeros)
    const initialValuation = ethers.BigNumber.from('1000000' + Util.eighteenZeros)
    const minRaise = ethers.BigNumber.from('0')

    const trust = await trustFactory.deploy(
      crpFactory.address,
      bFactory.address,
      tokenName,
      tokenSymbol,
      reserve.address,
      reserveTotal,
      mintRatio,
      bookRatio,
      initialValuation,
      minRaise,
    )

    await trust.deployed()

    await reserve.approve(trust.address, reserveTotal)

    const now = await ethers.provider.getBlockNumber()
    const unblockBlock = now + 10

    await trust.init(unblockBlock, {
      gasLimit: 100000000
    })

    // create a few blocks by sending some tokens around
    while ((await ethers.provider.getBlockNumber()) < (unblockBlock - 1)) {
      await reserve.transfer(signers[1].address, 1)
    }

    await trust.exit()

  })
});
