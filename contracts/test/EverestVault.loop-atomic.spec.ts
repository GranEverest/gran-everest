import { expect } from "chai";
import { ethers, network } from "hardhat";

const toWei = (v: string) => ethers.parseEther(v);
const fromWei = (v: bigint) => Number(ethers.formatEther(v));

async function waitForReceipt(hash: string, timeoutMs = 30000, intervalMs = 50) {
  const provider = ethers.provider;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const r = await provider.getTransactionReceipt(hash);
    if (r) return r;
    await new Promise((res) => setTimeout(res, intervalMs));
  }
  throw new Error(`Timeout waiting for receipt: ${hash}`);
}

describe("EverestVault - Anti-loop atomic (same block)", () => {
  it("blocks deposit if it occurs in the SAME block as borrow", async () => {
    const [user] = await ethers.getSigners();
    const provider = ethers.provider;

    const Vault = await ethers.getContractFactory("EverestVault");
    const vault = await Vault.deploy();
    await vault.waitForDeployment();

    // Initial deposit (automine ON)
    await expect(vault.connect(user).deposit({ value: toWei("1.0") })).to.not.be.reverted;

    // Try to bundle both txs in SAME block
    await network.provider.send("evm_setAutomine", [false]);
    await network.provider.send("evm_setIntervalMining", [0]);

    // Force ordering with explicit nonces (borrow first)
    const baseNonce = await provider.getTransactionCount(user.address);

    const txBorrow = await vault
      .connect(user)
      .borrow(toWei("0.3"), { nonce: baseNonce });

    const txDepositSameBlock = await vault
      .connect(user)
      .deposit({ value: toWei("0.1"), nonce: baseNonce + 1 });

    // Mine a block (ideally both in same block)
    await network.provider.send("evm_mine");

    // back to automine
    await network.provider.send("evm_setAutomine", [true]);
    await network.provider.send("evm_setIntervalMining", [1]);

    const rBorrow  = await waitForReceipt(txBorrow.hash);
    const rDeposit = await waitForReceipt(txDepositSameBlock.hash);

    const sameBlock = rBorrow.blockNumber === rDeposit.blockNumber;

    if (sameBlock) {
      expect(Number(rBorrow.status)).to.equal(1);
      expect(Number(rDeposit.status)).to.equal(0);
      const [collat, debt] = await vault.getUserData(user.address);
      expect(fromWei(debt)).to.be.closeTo(0.3, 1e-9);
      expect(fromWei(collat)).to.be.closeTo(0.9975, 1e-9);
    } else {
      expect(Number(rBorrow.status)).to.equal(1);
      expect(Number(rDeposit.status)).to.equal(1);
      const [collat, debt] = await vault.getUserData(user.address);
      expect(fromWei(debt)).to.be.closeTo(0.3, 1e-9);
      expect(fromWei(collat)).to.be.closeTo(1.09725, 1e-9); // 0.9975 + 0.09975
    }
  });

  it("allows deposit in a different block, even with debt", async () => {
    const [user] = await ethers.getSigners();

    const Vault = await ethers.getContractFactory("EverestVault");
    const vault = await Vault.deploy();
    await vault.waitForDeployment();

    await vault.connect(user).deposit({ value: toWei("1.0") });  // ~0.9975 collateral
    await vault.connect(user).borrow(toWei("0.3"));              // mined block N

    await expect(vault.connect(user).deposit({ value: toWei("0.5") })).to.not.be.reverted;

    const [collat, debt] = await vault.getUserData(user.address);
    expect(fromWei(collat)).to.be.closeTo(1.49625, 1e-9); // 0.9975 + 0.49875
    expect(fromWei(debt)).to.be.closeTo(0.3, 1e-9);
  });
});
