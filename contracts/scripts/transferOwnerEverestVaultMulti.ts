import { ethers } from "hardhat";

async function main() {
  const [signer] = await ethers.getSigners();

  console.log("Caller (must be current owner):", signer.address);

  const newOwner = process.env.NEW_OWNER;
  if (!newOwner) {
    throw new Error("NEW_OWNER env var not set");
  }

  // Dirección del EverestVaultMulti en Base mainnet
  const vaultAddress = "0x8A83E4349f4bd053cef3083F4219628957f54725";

  const vault = await ethers.getContractAt("EverestVaultMulti", vaultAddress);

  const currentOwner = await vault.owner();
  console.log("Current owner:", currentOwner);

  if (currentOwner.toLowerCase() === newOwner.toLowerCase()) {
    console.log("New owner is already the current owner. Nothing to do.");
    return;
  }

  if (currentOwner.toLowerCase() !== signer.address.toLowerCase()) {
    throw new Error("Signer is not the current owner. Cannot transferOwnership.");
  }

  console.log("Transferring ownership to:", newOwner);
  const tx = await vault.transferOwnership(newOwner);
  console.log("tx hash:", tx.hash);
  await tx.wait();
  console.log("Ownership transferred to:", newOwner);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
