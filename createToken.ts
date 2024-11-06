import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { clusterApiUrl, Connection, Keypair, PublicKey } from "@solana/web3.js";
import fs from "fs";

async function getBalanceSOL(wallet: PublicKey) {
  const connection = new Connection(
    "https://api.devnet.solana.com",
    "confirmed"
  );

  // const publicKey = new PublicKey(wallet);
  const balance = await connection.getBalance(wallet);
  return balance / 1e9; // SOL is in lamports, so divide by 1e9 to get SOL
}

async function createToken() {
  // Create a new token with the wallet as the initial mint authority

  const mint = await createMint(
    connection,
    wallet,
    wallet.publicKey,
    null, // Freeze authority (set to null if not needed)
    9
  );

  console.log("Token created:", mint.toBase58()); //
  return mint;
}

async function createAssociatedTokenAccount(mint: PublicKey) {
  const associatedTokenAccount = await getOrCreateAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey
  );

  console.log(
    "Associated Token Account:",
    associatedTokenAccount.address.toBase58()
  );
  return associatedTokenAccount;
}

async function mintTokens(
  mint: PublicKey,
  recipient: PublicKey,
  amount: number
) {
  await mintTo(
    connection,
    wallet,
    mint,
    recipient,
    wallet,
    amount * Math.pow(10, 9) // Scale amount based on token decimals,
  );

  console.log(`Minted ${amount} tokens to ${recipient.toBase58()}`);
}

const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

// Load wallet (replace with your wallet path)
const walletPath = `./id.json`;
const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

console.info(wallet); // CpePtN1mK47Xz4Q1XRGZp3T5LYjuqqqFCgom4iW6pbj8

(async () => {
  try {
    const before = await getBalanceSOL(wallet.publicKey);
    console.info(`Balance: ${before} SOL`);

    const token = await createToken();
    const associatedAccount = await createAssociatedTokenAccount(token);
    await mintTokens(token, associatedAccount.address, 5987000); // Mint 100 tokens

    const after = await getBalanceSOL(wallet.publicKey);
    console.info(`Balance: ${after} SOL`);
  } catch (error) {
    console.error("Error creating token:", error);
  }
})();

/*

Token created: Ev2BqJteP9ZrsXTfhbCncaBeDaf5rMQEpnWjXEEXxzQ8 https://explorer.solana.com/address/Ev2BqJteP9ZrsXTfhbCncaBeDaf5rMQEpnWjXEEXxzQ8?cluster=devnet
Associated Token Account: Hd5XrJNVgwyNyzyERT4EaGPX4Kv5KQGKoWe1vSFCfW6
Minted 100 tokens to Hd5XrJNVgwyNyzyERT4EaGPX4Kv5KQGKoWe1vSFCfW6
*/
