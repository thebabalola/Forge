// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../interfaces/IAaveLendingPool.sol";

/**
 * @title MockAaveLendingPool
 * @dev Mock implementation of Aave V3 Lending Pool for testing
 * @notice This contract simulates Aave's lending pool behavior for testing purposes
 */
contract MockAaveLendingPool is IAaveLendingPool {
    using SafeERC20 for IERC20;

    // Track user deposits by asset and user address
    mapping(address => mapping(address => uint256)) public userDeposits;
    
    // Track total deposits by asset
    mapping(address => uint256) public totalDeposits;

    /**
     * @notice Supply an amount of underlying asset into the reserve
     * @param asset The address of the underlying asset to supply
     * @param amount The amount to be supplied
     * @param onBehalfOf The address that will receive the aTokens
     * @param referralCode Code used to register the integrator
     */
    function supply(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external override {
        require(asset != address(0), "MockAaveLendingPool: asset is zero address");
        require(onBehalfOf != address(0), "MockAaveLendingPool: onBehalfOf is zero address");
        require(amount > 0, "MockAaveLendingPool: amount is zero");

        // Transfer asset from caller to this contract
        IERC20(asset).safeTransferFrom(msg.sender, address(this), amount);

        // Update deposits
        userDeposits[asset][onBehalfOf] += amount;
        totalDeposits[asset] += amount;
    }

    /**
     * @notice Withdraw an amount of underlying asset from the reserve
     * @param asset The address of the underlying asset to withdraw
     * @param amount The underlying amount to be withdrawn
     * @param to The address that will receive the withdrawn assets
     * @return The actual amount withdrawn
     */
    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external override returns (uint256) {
        require(asset != address(0), "MockAaveLendingPool: asset is zero address");
        require(to != address(0), "MockAaveLendingPool: to is zero address");
        require(amount > 0, "MockAaveLendingPool: amount is zero");

        // Check if sender has sufficient deposit
        uint256 userBalance = userDeposits[asset][msg.sender];
        require(userBalance >= amount, "MockAaveLendingPool: insufficient balance");

        // Check if contract has sufficient liquidity
        uint256 contractBalance = IERC20(asset).balanceOf(address(this));
        require(contractBalance >= amount, "MockAaveLendingPool: insufficient liquidity");

        // Update deposits
        userDeposits[asset][msg.sender] -= amount;
        totalDeposits[asset] -= amount;

        // Transfer asset to recipient
        IERC20(asset).safeTransfer(to, amount);

        return amount;
    }

    /**
     * @notice Get the underlying balance of the user
     * @param asset The address of the asset
     * @param user The address of the user
     * @return The balance of the underlying asset
     */
    function getBalance(address asset, address user) external view override returns (uint256) {
        return userDeposits[asset][user];
    }

    /**
     * @notice Get total deposits for an asset
     * @param asset The address of the asset
     * @return The total deposits
     */
    function getTotalDeposits(address asset) external view returns (uint256) {
        return totalDeposits[asset];
    }
}
