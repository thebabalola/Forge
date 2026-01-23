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

  describe("Journey 1: Alice's First Vault", function () {
    let aliceVault: UserVault;
    const depositAmount = ethers.parseUnits("1000", 18);

    it("Alice should register and create a vault", async function () {
      // 1. Register
      await vaultFactory.connect(alice).registerUser("alice", "DeFi Explorer");
      expect(await vaultFactory.isUserRegistered(alice.address)).to.be.true;

      // 2. Create Vault
      const tx = await vaultFactory.connect(alice).createVault(
        await asset.getAddress(),
        "Alice Alpha Vault",
        "AAV"
      );
      await tx.wait();

      const aliceVaults = await vaultFactory.getUserVaults(alice.address);
      expect(aliceVaults.length).to.equal(1);
      
      aliceVault = await ethers.getContractAt("UserVault", aliceVaults[0]);
      expect(await aliceVault.name()).to.equal("Alice Alpha Vault");
      expect(await aliceVault.owner()).to.equal(alice.address);
    });

    it("Alice should deposit assets and receive shares", async function () {
      await asset.connect(alice).approve(await aliceVault.getAddress(), depositAmount);
      await aliceVault.connect(alice).deposit(depositAmount, alice.address);

      expect(await aliceVault.balanceOf(alice.address)).to.equal(depositAmount);
      expect(await aliceVault.totalAssets()).to.equal(depositAmount);
      expect(await asset.balanceOf(await aliceVault.getAddress())).to.equal(depositAmount);
    });
  });

  describe("Journey 2: Protocol Management & Yield", function () {
    let aliceVault: UserVault;
    const depositAmount = ethers.parseUnits("1000", 18);

    before(async function () {
      const aliceVaults = await vaultFactory.getUserVaults(alice.address);
      aliceVault = await ethers.getContractAt("UserVault", aliceVaults[0]);
    });

    it("Alice should allocate and deploy to Aave & Compound", async function () {
      const aaveAlloc = ethers.parseUnits("400", 18);
      const compoundAlloc = ethers.parseUnits("300", 18);

      // 1. Set Allocations
      await aliceVault.connect(alice).setProtocolAllocation("Aave", aaveAlloc);
      await aliceVault.connect(alice).setProtocolAllocation("Compound", compoundAlloc);

      // 2. Deploy
      await aliceVault.connect(alice).deployToAave(aaveAlloc);
      await aliceVault.connect(alice).deployToCompound(compoundAlloc);

      // 3. Verify
      expect(await aliceVault.getAaveBalance()).to.equal(aaveAlloc);
      // compound balance is estimated via state var
      expect(await aliceVault.totalAssets()).to.equal(depositAmount); 
      
      // Check idle balance in vault
      const idle = await asset.balanceOf(await aliceVault.getAddress());
      expect(idle).to.equal(depositAmount - aaveAlloc - compoundAlloc);
    });

    it("Alice should withdraw from protocols and redeem from vault", async function () {
      const withdrawFromAave = ethers.parseUnits("200", 18);
      await aliceVault.connect(alice).withdrawFromAave(withdrawFromAave);
      
      expect(await aliceVault.getAaveBalance()).to.equal(ethers.parseUnits("200", 18));

      // Alice redeems 500 shares
      const redeemAmount = ethers.parseUnits("500", 18);
      const balanceBefore = await asset.balanceOf(alice.address);
      
      await aliceVault.connect(alice).redeem(redeemAmount, alice.address, alice.address);
      
      const balanceAfter = await asset.balanceOf(alice.address);
      expect(balanceAfter - balanceBefore).to.equal(redeemAmount);
    });
  });
});
