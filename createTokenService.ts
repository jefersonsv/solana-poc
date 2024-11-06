import {
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
  ExtensionType,
  getMetadataPointerState,
  getMint,
  getMintLen,
  getTokenMetadata,
  LENGTH_SIZE,
  TOKEN_2022_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import {
  createInitializeInstruction,
  createRemoveKeyInstruction,
  createUpdateFieldInstruction,
  pack,
  TokenMetadata,
} from "@solana/spl-token-metadata";
import {
  clusterApiUrl,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import fs from "fs";

(async () => {
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const walletPath = `./id.json`;
  const secretKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const wallet = Keypair.fromSecretKey(new Uint8Array(secretKey));

  // Playground wallet
  const payer = wallet;

  // Connection to devnet cluster

  // Transaction to send
  let transaction: Transaction;
  // Transaction signature returned from sent transaction
  let transactionSignature: string;

  // Generate new keypair for Mint Account
  const mintKeypair = Keypair.generate();
  // Address for Mint Account
  const mint = mintKeypair.publicKey;
  // Decimals for Mint Account
  const decimals = 6;
  // Authority that can mint new tokens
  const mintAuthority = wallet.publicKey;
  // Authority that can update the metadata pointer and token metadata
  const updateAuthority = wallet.publicKey;

  // Metadata to store in Mint Account
  const metaData: TokenMetadata = {
    updateAuthority: updateAuthority,
    mint: mint,
    name: "Second TOKEN",
    symbol: "STOK",
    uri:
      "https://raw.githubusercontent.com/jefersonsv/solana-poc/refs/heads/master/assets/image.png",
    additionalMetadata: [["author", "Jeferson"]],
  };

  // Size of MetadataExtension 2 bytes for type, 2 bytes for length
  const metadataExtension = TYPE_SIZE + LENGTH_SIZE;
  // Size of metadata
  const metadataLen = pack(metaData).length;

  // Size of Mint Account with extension
  const mintLen = getMintLen([ExtensionType.MetadataPointer]);

  // Minimum lamports required for Mint Account
  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintLen + metadataExtension + metadataLen
  );

  // Instruction to invoke System Program to create new account
  const createAccountInstruction = SystemProgram.createAccount({
    fromPubkey: payer.publicKey, // Account that will transfer lamports to created account
    newAccountPubkey: mint, // Address of the account to create
    space: mintLen, // Amount of bytes to allocate to the created account
    lamports, // Amount of lamports transferred to created account
    programId: TOKEN_2022_PROGRAM_ID, // Program assigned as owner of created account
  });

  // Instruction to initialize the MetadataPointer Extension
  const initializeMetadataPointerInstruction = createInitializeMetadataPointerInstruction(
    mint, // Mint Account address
    updateAuthority, // Authority that can set the metadata address
    mint, // Account address that holds the metadata
    TOKEN_2022_PROGRAM_ID
  );

  // Instruction to initialize Mint Account data
  const initializeMintInstruction = createInitializeMintInstruction(
    mint, // Mint Account Address
    decimals, // Decimals of Mint
    mintAuthority, // Designated Mint Authority
    null, // Optional Freeze Authority
    TOKEN_2022_PROGRAM_ID // Token Extension Program ID
  );

  // Instruction to initialize Metadata Account data
  const initializeMetadataInstruction = createInitializeInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: updateAuthority, // Authority that can update the metadata
    mint: mint, // Mint Account address
    mintAuthority: mintAuthority, // Designated Mint Authority
    name: metaData.name,
    symbol: metaData.symbol,
    uri: metaData.uri,
  });

  // Instruction to update metadata, adding custom field
  const updateFieldInstruction = createUpdateFieldInstruction({
    programId: TOKEN_2022_PROGRAM_ID, // Token Extension Program as Metadata Program
    metadata: mint, // Account address that holds the metadata
    updateAuthority: updateAuthority, // Authority that can update the metadata
    field: metaData.additionalMetadata[0][0], // key
    value: metaData.additionalMetadata[0][1], // value
  });

  // Add instructions to new transaction
  transaction = new Transaction().add(
    createAccountInstruction,
    initializeMetadataPointerInstruction,
    // note: the above instructions are required before initializing the mint
    initializeMintInstruction,
    initializeMetadataInstruction,
    updateFieldInstruction
  );

  // Send transaction
  transactionSignature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payer, mintKeypair] // Signers
  );

  console.log(
    "\nCreate Mint Account:",
    `https://solana.fm/tx/${transactionSignature}?cluster=devnet-solana`
  );
})();

/*
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createInitializeMintInstruction,
  createMint,
  ExtensionType,
  getMintLen,
  getOrCreateAssociatedTokenAccount,
  LENGTH_SIZE,
  mintTo,
  TOKEN_PROGRAM_ID,
  TYPE_SIZE,
} from "@solana/spl-token";
import { pack, TokenMetadata } from "@solana/spl-token-metadata";
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

  const metadata: TokenMetadata = {
    mint: wallet.publicKey,
    name: "First TOKEN",
    symbol: "FTOK",
    uri: "https://solana.com/solutions/token-extensions",
    additionalMetadata: [["author", "Jeferson"]],
  };

  const mintSpace = getMintLen([ExtensionType.MetadataPointer]);

  const metadataSpace = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;

  const lamports = await connection.getMinimumBalanceForRentExemption(
    mintSpace + metadataSpace
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
