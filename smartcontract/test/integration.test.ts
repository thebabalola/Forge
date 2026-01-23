import { expect } from "chai";
import { ethers } from "hardhat";
import {
  UserVault,
  MockERC20,
  ChainlinkMock,
  MockAaveLendingPool,
  MockCToken,
  VaultFactory,
} from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("ForgeX Integration Tests", function () {
  let vaultFactory: VaultFactory;
  let asset: MockERC20;
  let priceFeed: ChainlinkMock;
  let mockAave: MockAaveLendingPool;
  let mockCToken: MockCToken;
  
  let owner: SignerWithAddress;
  let alice: SignerWithAddress;
  let bob: SignerWithAddress;

  const INITIAL_MINT = ethers.parseUnits("10000", 18);

  before(async function () {
    [owner, alice, bob] = await ethers.getSigners();

    // 1. Deploy Infrastructure
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 18);

    const ChainlinkMockFactory = await ethers.getContractFactory("ChainlinkMock");
    priceFeed = await ChainlinkMockFactory.deploy(200000000000, 8); // $2000

    const MockAaveFactory = await ethers.getContractFactory("MockAaveLendingPool");
    mockAave = await MockAaveFactory.deploy();

    const MockCTokenFactory = await ethers.getContractFactory("MockCToken");
    mockCToken = await MockCTokenFactory.deploy(await asset.getAddress());

    // 2. Deploy Factory
    const VaultFactoryFactory = await ethers.getContractFactory("VaultFactory");
    vaultFactory = await VaultFactoryFactory.deploy(owner.address);

    // 3. Configure Factory
    await vaultFactory.setAssetPriceFeed(await asset.getAddress(), await priceFeed.getAddress());
    await vaultFactory.setAaveAddress(await mockAave.getAddress());
    await vaultFactory.setCompoundAddress(await mockCToken.getAddress());

    // 4. Distribution
    await asset.mint(alice.address, INITIAL_MINT);
    await asset.mint(bob.address, INITIAL_MINT);
  });

  it("System setup should be correct", async function () {
    expect(await vaultFactory.getAaveAddress()).to.equal(await mockAave.getAddress());
    expect(await vaultFactory.getCompoundAddress()).to.equal(await mockCToken.getAddress());
  });
});
