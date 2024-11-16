// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

import "hardhat/console.sol";
import { Execution } from "modulekit/Accounts.sol";
import {
    ERC20Integration, ERC4626Integration
} from "modulekit/Integrations.sol";
import { UniswapV3Integration } from "../integrations/Uniswap.sol";

import { IERC20 } from "forge-std/interfaces/IERC20.sol";
import { IERC4626 } from "forge-std/interfaces/IERC4626.sol";

import { ERC7579ValidatorBase } from "../module-bases/ERC7579ValidatorBase.sol";
import { PackedUserOperation } from
    "@account-abstraction/contracts/core/UserOperationLib.sol";

import { UD2x18 } from "@prb/math/UD2x18.sol";
import { ud } from "@prb/math/UD60x18.sol";
import { SignatureCheckerLib } from "solady/utils/SignatureCheckerLib.sol";
import { ECDSA } from "solady/utils/ECDSA.sol";
import { ExecutionLib } from "../safe7579/lib/ExecutionLib.sol";

import { ERC7579ExecutorBase } from "../module-bases/ERC7579ExecutorBase.sol";



contract AutoSwapExecutor is ERC7579ExecutorBase {
    using SignatureCheckerLib for address;
    using ExecutionLib for bytes;


    struct Config {
        UD2x18 percentage; // percentage to be saved to the vault
        address targetToken;
        address to; // address of the vault
        uint256 totalAmount;
    }

    // account => token => Config
    mapping(address => mapping(address => Config)) public config;

    event ConfigSet(address indexed account, address indexed token);
    event AutoSaveExecuted(address indexed smartAccount, address indexed token, uint256 amountIn);

  

    function onInstall(bytes calldata data) external override {

        // add the account configs
 
    }

    function onUninstall(bytes calldata) external override {

        // delete the account configs
    }



    function calcDepositAmount(
        uint256 amountReceived,
        UD2x18 percentage
    )
        public
        pure
        returns (uint256)
    {
        // calculate the amount to be saved which is the
        // percentage of the amount received
        return ud(amountReceived).mul(percentage.intoUD60x18()).intoUint256();
    }


    function createConfig(address token, address targetToken, UD2x18 percentage, address to) public {

        Config memory _config = Config({ percentage: percentage, targetToken: targetToken, to: to, totalAmount: 0 });

        config[msg.sender][token] = _config;

    }

    function autoSwap(
        address token,
        uint256 amountReceived
    )
        external
    {
        // cache the account address
        address account = msg.sender;

        // get the configuration for the token
        Config memory conf = config[account][token];

        console.log(conf.targetToken);
        

        // calculate amount that is subject to be saved
        uint256 amountIn = calcDepositAmount(amountReceived, conf.percentage);
        

            // create swap from received token to underlying token
        Execution[] memory swap = UniswapV3Integration.approveAndSwap({
                smartAccount: msg.sender,
                tokenIn: IERC20(token),
                tokenOut: IERC20(conf.targetToken),
                amountIn: amountReceived,
                sqrtPriceLimitX96: 0
            });


            // execute swap on account
            bytes[] memory results = _execute(swap);

            // get return data of swap, and set it as amountIn.
            // this will be the actual amount that is subject to be saved
            amountIn = abi.decode(results[2], (uint256));

        // jobExecution.totalTargetToken = jobExecution.totalTargetToken + amountIn;

        // emit event
        emit AutoSaveExecuted(account, token, amountIn);
    }


    function name() external pure returns (string memory) {
        return "AutoSwapExecutor";
    }

    function version() external pure returns (string memory) {
        return "0.0.1";
    }

    function isModuleType(uint256 typeID) external pure override returns (bool) {
        return typeID == TYPE_EXECUTOR;
    }

    function isInitialized(address smartAccount) external view returns (bool) { }
}