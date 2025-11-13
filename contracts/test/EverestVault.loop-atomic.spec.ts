import { expect } from "chai";
import { ethers } from "hardhat";
import { parseEther } from "ethers";

describe("EverestVault - Anti-loop atomic (same block)", function () {
  it("blocks deposit if it occurs in the SAME block as borrow", async () => {
    const [deployer, feeRecipient] = await ethers.getSigners();

    // Deploy vault con feeRecipient
    const Vault = await ethers.getContractFactory("EverestVault");
    const vault = await Vault.deploy(feeRecipient.address);
    await vault.waitForDeployment();

    // Deploy helper
    const Helper = await ethers.getContractFactory("LoopSameBlock");
    const helper = await Helper.deploy();
    await helper.waitForDeployment();

    // Cargar ETH al helper y depositar desde el helper (colateral del helper)
    await deployer.sendTransaction({ to: await helper.getAddress(), value: parseEther("5") });
    await helper.depositTo(await vault.getAddress(), { value: parseEther("5") });

    // En una sola tx: borrow y luego deposit (debe revertir por anti-loop)
    await expect(
      helper.borrowThenDeposit(await vault.getAddress(), parseEther("2"))
    ).to.be.revertedWithCustomError(vault, "BorrowDepositSameBlock");
  });

  it("allows deposit in a different block, even with debt", async () => {
    const [deployer, feeRecipient, user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("EverestVault");
    const vault = await Vault.deploy(feeRecipient.address);
    await vault.waitForDeployment();

    await vault.connect(user).deposit({ value: parseEther("3") });  // bloque N
    await vault.connect(user).borrow(parseEther("1"));              // bloque N+1

    await expect(
      vault.connect(user).deposit({ value: parseEther("0.1") })     // bloque N+2
    ).to.not.be.reverted;
  });
});
