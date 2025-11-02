import { Wallet } from "ethers";
import * as dotenv from "dotenv";
dotenv.config();

const pk = process.env.PRIVATE_KEY!;
if (!pk) throw new Error("No PRIVATE_KEY in .env");
console.log("Address:", new Wallet(pk).address);
