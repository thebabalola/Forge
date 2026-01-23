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

describe("UserVault Comprehensive Suite", function () {
  let vault: UserVault;
  let asset: MockERC20;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let vaultFactory: VaultFactory;
  let priceFeed: ChainlinkMock;
  let mockAaveLendingPool: MockAaveLendingPool;
  let mockCToken: MockCToken;

  const INITIAL_MINT = ethers.parseUnits("10000", 18);
  const depositAmount = ethers.parseUnits("1000", 18);
  const VAULT_NAME = "ForgeX Vault Token";
  const VAULT_SYMBOL = "svToken";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // 1. Deploy mock ERC20 token (18 decimals for simplicity in tests)
    const MockERC20Factory = await ethers.getContractFactory("MockERC20");
    asset = await MockERC20Factory.deploy("Mock USDC", "USDC", 18);
    await asset.waitForDeployment();

    // 2. Mint tokens to users
    await asset.mint(user1.address, INITIAL_MINT);
    await asset.mint(user2.address, INITIAL_MINT);

    // 3. Deploy ChainlinkMock ($2000 price, 8 decimals)
    const ChainlinkMockFactory = await ethers.getContractFactory("ChainlinkMock");
    priceFeed = await ChainlinkMockFactory.deploy(200000000000, 8);
    await priceFeed.waitForDeployment();

    // 4. Deploy Protocol Mocks
    const MockAaveFactory = await ethers.getContractFactory("MockAaveLendingPool");
    mockAaveLendingPool = await MockAaveFactory.deploy();
    
    const MockCTokenFactory = await ethers.getContractFactory("MockCToken");
    mockCToken = await MockCTokenFactory.deploy(await asset.getAddress());

    // 5. Deploy VaultFactory
    const VaultFactoryFactory = await ethers.getContractFactory("VaultFactory");
    vaultFactory = await VaultFactoryFactory.deploy(owner.address);
    
    // 6. Setup Factory
    await vaultFactory.setAssetPriceFeed(await asset.getAddress(), await priceFeed.getAddress());
    await vaultFactory.setAaveAddress(await mockAaveLendingPool.getAddress());
    await vaultFactory.setCompoundAddress(await mockCToken.getAddress());

    // 7. Create Vault
    await vaultFactory.connect(user1).registerUser("testuser", "bio");
    await vaultFactory.connect(user1).createVault(await asset.getAddress(), VAULT_NAME, VAULT_SYMBOL);
    
    const userVaults = await vaultFactory.getUserVaults(user1.address);
    vault = await ethers.getContractAt("UserVault", userVaults[0]);

    // 8. Approvals
    await asset.connect(user1).approve(await vault.getAddress(), ethers.MaxUint256);
  });

  describe("ERC-4626 Core Functions", function () {
    it("Should maintain 1:1 ratio on first deposit", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
      expect(await vault.totalAssets()).to.equal(depositAmount);
    });

    it("Should calculate shares correctly with existing assets", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      
      // Simulate yield/donation
      await asset.mint(await vault.getAddress(), depositAmount);
      
      // Second deposit should get half the shares
      const secondDeposit = depositAmount;
      const expectedShares = await vault.previewDeposit(secondDeposit);
      
      await asset.connect(user2).mint(user2.address, secondDeposit);
      await asset.connect(user2).approve(await vault.getAddress(), secondDeposit);
      await vault.connect(user2).deposit(secondDeposit, user2.address);
      
      expect(await vault.balanceOf(user2.address)).to.equal(expectedShares);
    });

    it("Should allow minting exact shares", async function () {
      const sharesToMint = ethers.parseUnits("500", 18);
      const assetsRequired = await vault.previewMint(sharesToMint);
      
      await vault.connect(user1).mint(sharesToMint, user1.address);
      expect(await vault.balanceOf(user1.address)).to.equal(sharesToMint);
      expect(await vault.totalAssets()).to.equal(assetsRequired);
    });

    it("Should allow withdrawal of assets", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const withdrawAmount = depositAmount / 2n;
      
      await vault.connect(user1).withdraw(withdrawAmount, user1.address, user1.address);
      expect(await asset.balanceOf(user1.address)).to.equal(INITIAL_MINT - depositAmount + withdrawAmount);
    });

    it("Should allow redeeming shares for assets", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const sharesToRedeem = await vault.balanceOf(user1.address);
      
      await vault.connect(user1).redeem(sharesToRedeem, user1.address, user1.address);
      expect(await vault.balanceOf(user1.address)).to.equal(0);
      expect(await asset.balanceOf(user1.address)).to.equal(INITIAL_MINT);
    });
  });

  describe("Price Feed & Valuation", function () {
    it("Should return correct USD values", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      
      const assetPrice = await vault.getAssetPriceUSD();
      expect(assetPrice).to.equal(ethers.parseUnits("2000", 18));
      
      const totalValue = await vault.getTotalValueUSD();
      // 1000 assets * 2000 USD/asset = 2,000,000 USD
      expect(totalValue).to.equal(ethers.parseUnits("2000000", 18));
    });
  });

  describe("Protocol Allocations", function () {
    it("Should manage protocol allocations", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const allocAmount = ethers.parseUnits("500", 18);
      
      await expect(vault.connect(user1).setProtocolAllocation("Aave", allocAmount))
        .to.emit(vault, "ProtocolAllocationChanged");
        
      expect(await vault.getProtocolAllocation("Aave")).to.equal(allocAmount);
      expect(await vault.getTotalAllocated()).to.equal(allocAmount);
    });

    it("Should revert if allocation exceeds total assets", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      await expect(
        vault.connect(user1).setProtocolAllocation("Aave", depositAmount + 1n)
      ).to.be.revertedWithCustomError(vault, "AllocationExceedsBalance");
    });
  });

  describe("Aave Integration", function () {
    it("Should deploy and withdraw from Aave", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const deployAmount = ethers.parseUnits("400", 18);
      
      await vault.connect(user1).deployToAave(deployAmount);
      expect(await vault.getAaveBalance()).to.equal(deployAmount);
      
      await vault.connect(user1).withdrawFromAave(deployAmount);
      expect(await vault.getAaveBalance()).to.equal(0);
    });
  });

  describe("Compound Integration", function () {
    it("Should deploy and withdraw from Compound", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const deployAmount = ethers.parseUnits("300", 18);
      
      await vault.connect(user1).deployToCompound(deployAmount);
      // compoundBalance is estimated in UserVault via compoundDeposited
      expect(await vault.totalAssets()).to.equal(depositAmount); 
      
      await vault.connect(user1).withdrawFromCompound(deployAmount);
      expect(await asset.balanceOf(await vault.getAddress())).to.equal(depositAmount);
    });
  });

  describe("Security & Access Control", function () {
    it("Should respect pause functionality", async function () {
      await vault.connect(user1).pause();
      expect(await vault.isPaused()).to.be.true;
      
      await expect(
        vault.connect(user1).deposit(depositAmount, user1.address)
      ).to.be.revertedWithCustomError(vault, "EnforcedPause");
      
      await vault.connect(user1).unpause();
      await expect(vault.connect(user1).deposit(depositAmount, user1.address)).to.not.be.reverted;
    });

    it("Should prevent non-owners from performing owner actions", async function () {
      await expect(
        vault.connect(user2).pause()
      ).to.be.reverted; // Ownable check
      
      await expect(
        vault.connect(user2).deployToAave(100)
      ).to.be.reverted;
    });
  });

  describe("ERC20 Share Functionality", function () {
    it("Should allow share transfers", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const transferAmount = depositAmount / 2n;
      
      await vault.connect(user1).transfer(user2.address, transferAmount);
      expect(await vault.balanceOf(user2.address)).to.equal(transferAmount);
    });

    it("Should allow transferFrom with allowance", async function () {
      await vault.connect(user1).deposit(depositAmount, user1.address);
      const transferAmount = depositAmount / 2n;
      
      await vault.connect(user1).approve(user2.address, transferAmount);
      await vault.connect(user2).transferFrom(user1.address, user2.address, transferAmount);
      expect(await vault.balanceOf(user2.address)).to.equal(transferAmount);
    });
  });
});
