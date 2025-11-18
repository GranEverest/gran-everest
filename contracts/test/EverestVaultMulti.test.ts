import { expect } from "chai";
import { ethers } from "hardhat";

const FEE_BPS = 25n;
const BPS_DENOMINATOR = 10000n;
const MAX_LTV_BPS = 7000n;

describe("EverestVaultMulti", () => {
  async function deployFixture() {
    const [owner, user, other, feeRecipient] = await ethers.getSigners();

    const EverestVaultMulti = await ethers.getContractFactory(
      "EverestVaultMulti"
    );
    const vault = await EverestVaultMulti.deploy(feeRecipient.address);
    await vault.waitForDeployment();

    return { vault, owner, user, other, feeRecipient };
  }

  function calcDepositFee(amount: bigint) {
    return (amount * FEE_BPS) / BPS_DENOMINATOR;
  }

  function calcWithdrawFee(collateralAmount: bigint) {
    return (collateralAmount * FEE_BPS) / BPS_DENOMINATOR;
  }

  function calcMaxBorrowable(collateral: bigint) {
    return (collateral * MAX_LTV_BPS) / BPS_DENOMINATOR;
  }

  describe("deployment", () => {
    it("sets feeRecipient correctly and rejects zero address", async () => {
      const [owner, , , feeRecipient] = await ethers.getSigners();

      const EverestVaultMulti = await ethers.getContractFactory(
        "EverestVaultMulti"
      );
      const vault = await EverestVaultMulti.deploy(feeRecipient.address);
      await vault.waitForDeployment();

      expect(await vault.feeRecipient()).to.equal(feeRecipient.address);

      await expect(
        EverestVaultMulti.deploy(ethers.ZeroAddress)
      ).to.be.revertedWith("feeRecipient zero");
    });
  });

  describe("vault creation", () => {
    it("allows user to create vaults and tracks count", async () => {
      const { vault, user } = await deployFixture();

      expect(await vault.vaultCountOf(user.address)).to.equal(0);

      const tx1 = await vault.connect(user).createVault();
      await expect(tx1)
        .to.emit(vault, "VaultCreated")
        .withArgs(user.address, 0);
      expect(await vault.vaultCountOf(user.address)).to.equal(1);

      const tx2 = await vault.connect(user).createVault();
      await expect(tx2)
        .to.emit(vault, "VaultCreated")
        .withArgs(user.address, 1);
      expect(await vault.vaultCountOf(user.address)).to.equal(2);

      const [coll0, debt0] = await vault.getVault(user.address, 0);
      const [coll1, debt1] = await vault.getVault(user.address, 1);

      expect(coll0).to.equal(0n);
      expect(debt0).to.equal(0n);
      expect(coll1).to.equal(0n);
      expect(debt1).to.equal(0n);
    });
  });

  describe("deposit", () => {
    it("reverts if no ETH sent or vault does not exist", async () => {
      const { vault, user } = await deployFixture();

      await expect(
        vault.connect(user).deposit(0, { value: 0 })
      ).to.be.revertedWith("No ETH sent");

      await expect(
        vault.connect(user).deposit(0, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Vault does not exist");
    });

    it("adds collateral (net of fee), updates totals and sends fee", async () => {
      const { vault, user, feeRecipient } = await deployFixture();

      // create vault 0
      await vault.connect(user).createVault();

      const oneEth = ethers.parseEther("1");
      const fee = calcDepositFee(oneEth); // 0.0025 ETH
      const collateralAdded = oneEth - fee;

      const feeRecipientBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );
      const contractBefore = await ethers.provider.getBalance(
        vault.target as string
      );

      const tx = await vault.connect(user).deposit(0, { value: oneEth });
      await expect(tx)
        .to.emit(vault, "Deposited")
        .withArgs(
          user.address,
          0,
          oneEth,
          collateralAdded,
          fee
        );

      const [collateral, debt] = await vault.getVault(user.address, 0);
      expect(collateral).to.equal(collateralAdded);
      expect(debt).to.equal(0n);

      const totalCollateral = await vault.totalCollateral();
      const totalDebt = await vault.totalDebt();
      expect(totalCollateral).to.equal(collateralAdded);
      expect(totalDebt).to.equal(0n);

      const feeRecipientAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );
      const contractAfter = await ethers.provider.getBalance(
        vault.target as string
      );

      expect(feeRecipientAfter - feeRecipientBefore).to.equal(fee);
      expect(contractAfter - contractBefore).to.equal(collateralAdded);
    });
  });

  describe("borrow", () => {
    it("reverts if amount = 0, vault missing or no collateral", async () => {
      const { vault, user } = await deployFixture();

      await expect(
        vault.connect(user).borrow(0, 0)
      ).to.be.revertedWith("Amount = 0");

      await expect(
        vault.connect(user).borrow(0, 1)
      ).to.be.revertedWith("Vault does not exist");

      await vault.connect(user).createVault();
      await expect(
        vault.connect(user).borrow(0, 1)
      ).to.be.revertedWith("No collateral");
    });

    it("allows borrow up to max LTV and reverts above", async () => {
      const { vault, user } = await deployFixture();

      await vault.connect(user).createVault();
      const oneEth = ethers.parseEther("1");
      const fee = calcDepositFee(oneEth);
      const collateralNet = oneEth - fee;

      await vault.connect(user).deposit(0, { value: oneEth });

      const maxBorrow = calcMaxBorrowable(collateralNet); // 70% de neto

      const contractBefore = await ethers.provider.getBalance(
        vault.target as string
      );

      const tx = await vault.connect(user).borrow(0, maxBorrow);
      await expect(tx)
        .to.emit(vault, "Borrowed")
        .withArgs(user.address, 0, maxBorrow, maxBorrow);

      const [collateral, debt] = await vault.getVault(user.address, 0);
      expect(collateral).to.equal(collateralNet);
      expect(debt).to.equal(maxBorrow);

      const totalCollateral = await vault.totalCollateral();
      const totalDebt = await vault.totalDebt();
      expect(totalCollateral).to.equal(collateralNet);
      expect(totalDebt).to.equal(maxBorrow);

      const contractAfter = await ethers.provider.getBalance(
        vault.target as string
      );
      // balance = collateral - debt
      expect(contractAfter).to.equal(collateralNet - maxBorrow);
      expect(contractBefore - contractAfter).to.equal(maxBorrow);

      // intentar pasar el límite revierte
      await expect(
        vault.connect(user).borrow(0, 1)
      ).to.be.revertedWith("Max LTV exceeded");
    });

    it("updates lastBorrowBlock on borrow", async () => {
      const { vault, user } = await deployFixture();

      await vault.connect(user).createVault();

      const dep = ethers.parseEther("1");
      const fee = calcDepositFee(dep);
      const collNet = dep - fee;

      await vault.connect(user).deposit(0, { value: dep });

      const beforeBlock = await vault.lastBorrowBlock(user.address);
      expect(beforeBlock).to.equal(0n);

      const borrowAmount = calcMaxBorrowable(collNet) / 2n;

      const tx = await vault.connect(user).borrow(0, borrowAmount);
      const receipt = await tx.wait();
      const blockNumber = receipt!.blockNumber;

      const last = await vault.lastBorrowBlock(user.address);
      expect(last).to.equal(BigInt(blockNumber));
    });
  });

  describe("repay", () => {
    it("reverts if no ETH sent or vault missing or no debt", async () => {
      const { vault, user } = await deployFixture();

      await expect(
        vault.connect(user).repay(0, { value: 0 })
      ).to.be.revertedWith("No ETH sent");

      await expect(
        vault.connect(user).repay(0, { value: 1 })
      ).to.be.revertedWith("Vault does not exist");

      await vault.connect(user).createVault();
      await expect(
        vault.connect(user).repay(0, { value: 1 })
      ).to.be.revertedWith("No debt");
    });

    it("repays exact debt and clears it", async () => {
      const { vault, user } = await deployFixture();

      await vault.connect(user).createVault();
      const dep = ethers.parseEther("1");
      const fee = calcDepositFee(dep);
      const collNet = dep - fee;
      await vault.connect(user).deposit(0, { value: dep });

      const borrowAmount = calcMaxBorrowable(collNet) / 2n;
      await vault.connect(user).borrow(0, borrowAmount);

      const contractBefore = await ethers.provider.getBalance(
        vault.target as string
      );

      const tx = await vault.connect(user).repay(0, { value: borrowAmount });
      await expect(tx)
        .to.emit(vault, "Repaid")
        .withArgs(user.address, 0, borrowAmount, 0);

      const [collateral, debt] = await vault.getVault(user.address, 0);
      expect(collateral).to.equal(collNet);
      expect(debt).to.equal(0n);

      const totalDebt = await vault.totalDebt();
      expect(totalDebt).to.equal(0n);

      const contractAfter = await ethers.provider.getBalance(
        vault.target as string
      );
      expect(contractAfter - contractBefore).to.equal(borrowAmount);
    });

    it("repays debt and refunds excess when overpaying", async () => {
      const { vault, user } = await deployFixture();

      await vault.connect(user).createVault();
      const dep = ethers.parseEther("1");
      const fee = calcDepositFee(dep);
      const collNet = dep - fee;
      await vault.connect(user).deposit(0, { value: dep });

      const borrowAmount = calcMaxBorrowable(collNet) / 4n;
      await vault.connect(user).borrow(0, borrowAmount);

      const contractBefore = await ethers.provider.getBalance(
        vault.target as string
      );
      const userBefore = await ethers.provider.getBalance(user.address);

      const overpay = borrowAmount + ethers.parseEther("0.1");

      const tx = await vault.connect(user).repay(0, { value: overpay });
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * tx.gasPrice!;

      // contrato sólo se queda con "borrowAmount"
      const contractAfter = await ethers.provider.getBalance(
        vault.target as string
      );
      expect(contractAfter - contractBefore).to.equal(borrowAmount);

      const [collateral, debt] = await vault.getVault(user.address, 0);
      expect(collateral).to.equal(collNet);
      expect(debt).to.equal(0n);

      const totalDebt = await vault.totalDebt();
      expect(totalDebt).to.equal(0n);

      const userAfter = await ethers.provider.getBalance(user.address);
      // usuario pierde exactamente "borrowAmount + gas", el resto se le refundió
      const diff = userBefore - userAfter;
      expect(diff).to.be.closeTo(
        borrowAmount + gasUsed,
        ethers.parseEther("0.0000001") // tolerancia
      );
    });
  });

  describe("withdraw", () => {
    it("reverts if amount = 0, vault missing or not enough collateral", async () => {
      const { vault, user } = await deployFixture();

      await expect(
        vault.connect(user).withdraw(0, 0)
      ).to.be.revertedWith("Amount = 0");

      await expect(
        vault.connect(user).withdraw(0, 1)
      ).to.be.revertedWith("Vault does not exist");

      await vault.connect(user).createVault();
      await expect(
        vault.connect(user).withdraw(0, 1)
      ).to.be.revertedWith("Not enough collateral");
    });

    it("withdraws collateral without debt, applies fee and updates totals", async () => {
      const { vault, user, feeRecipient } = await deployFixture();

      await vault.connect(user).createVault();
      const dep = ethers.parseEther("1");
      const feeDep = calcDepositFee(dep);
      const collNet = dep - feeDep;

      await vault.connect(user).deposit(0, { value: dep });

      const [collBefore, debtBefore] = await vault.getVault(user.address, 0);
      expect(collBefore).to.equal(collNet);
      expect(debtBefore).to.equal(0n);

      const feeRecipientBefore = await ethers.provider.getBalance(
        feeRecipient.address
      );
      const contractBefore = await ethers.provider.getBalance(
        vault.target as string
      );
      const userBefore = await ethers.provider.getBalance(user.address);

      const feeW = calcWithdrawFee(collNet);
      const amountOut = collNet - feeW;

      const tx = await vault
        .connect(user)
        .withdraw(0, collNet); // retirar todo el colateral
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * tx.gasPrice!;

      await expect(tx)
        .to.emit(vault, "Withdrawn")
        .withArgs(user.address, 0, collNet, amountOut, feeW);

      const [collAfter, debtAfter] = await vault.getVault(user.address, 0);
      expect(collAfter).to.equal(0n);
      expect(debtAfter).to.equal(0n);

      const totalColl = await vault.totalCollateral();
      const totalDebt = await vault.totalDebt();
      expect(totalColl).to.equal(0n);
      expect(totalDebt).to.equal(0n);

      const feeRecipientAfter = await ethers.provider.getBalance(
        feeRecipient.address
      );
      const contractAfter = await ethers.provider.getBalance(
        vault.target as string
      );
      const userAfter = await ethers.provider.getBalance(user.address);

      expect(feeRecipientAfter - feeRecipientBefore).to.equal(feeW);
      expect(contractBefore - contractAfter).to.equal(collNet); // sale todo el colateral
      expect(userAfter + gasUsed - userBefore).to.equal(amountOut);
    });

    it("reverts if withdrawal would break max LTV with existing debt", async () => {
      const { vault, user } = await deployFixture();

      await vault.connect(user).createVault();
      const dep = ethers.parseEther("1");
      const feeDep = calcDepositFee(dep);
      const collNet = dep - feeDep;

      await vault.connect(user).deposit(0, { value: dep });

      const maxBorrow = calcMaxBorrowable(collNet);
      // pedimos la mitad del máximo para dejar margen
      const borrowAmount = maxBorrow / 2n;
      await vault.connect(user).borrow(0, borrowAmount);

      const [, debt] = await vault.getVault(user.address, 0);
      expect(debt).to.equal(borrowAmount);

      // retirar casi todo el colateral rompe el LTV
      const tooMuchCollateral = collNet - 1n;
      await expect(
        vault.connect(user).withdraw(0, tooMuchCollateral)
      ).to.be.revertedWith("Max LTV exceeded");
    });
  });

  describe("pause", () => {
    it("only owner can pause/unpause", async () => {
      const { vault, owner, user } = await deployFixture();

      await expect(vault.connect(user).pause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );
      await expect(vault.connect(user).unpause()).to.be.revertedWith(
        "Ownable: caller is not the owner"
      );

      await vault.connect(owner).pause();
      await vault.connect(owner).unpause();
    });

    it("blocks deposit/borrow/withdraw but allows repay while paused", async () => {
      const { vault, owner, user } = await deployFixture();

      await vault.connect(user).createVault();
      const dep = ethers.parseEther("1");
      await vault.connect(user).deposit(0, { value: dep });

      // pausamos
      await vault.connect(owner).pause();

      await expect(
        vault.connect(user).deposit(0, { value: dep })
      ).to.be.revertedWith("Pausable: paused");

      await expect(
        vault.connect(user).borrow(0, 1)
      ).to.be.revertedWith("Pausable: paused");

      await expect(
        vault.connect(user).withdraw(0, 1)
      ).to.be.revertedWith("Pausable: paused");

      // pero repay debe seguir funcionando si hay deuda
      await vault.connect(owner).unpause();
      await vault.connect(user).borrow(0, ethers.parseEther("0.1"));
      await vault.connect(owner).pause();

      await vault
        .connect(user)
        .repay(0, { value: ethers.parseEther("0.1") });
    });
  });
});
