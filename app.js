const {
  Connection,
  PublicKey,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} = require("@solana/web3.js");

// Define the network (mainnet-beta, devnet, or testnet)
const connection = new Connection("https://api.devnet.solana.com", "confirmed");

const senderSecretKey = Uint8Array.from([
  199,
  20,
  106,
  164,
  225,
  219,
  71,
  194,
  24,
  9,
  31,
  160,
  195,
  8,
  73,
  94,
  182,
  205,
  187,
  109,
  133,
  223,
  36,
  114,
  63,
  244,
  154,
  127,
  202,
  55,
  199,
  222,
  44,
  66,
  212,
  7,
  200,
  153,
  102,
  113,
  64,
  167,
  34,
  79,
  67,
  50,
  10,
  167,
  234,
  219,
  73,
  11,
  22,
  227,
  12,
  155,
  129,
  78,
  150,
  249,
  208,
  194,
  54,
  207,
]);
const senderKeypair = Keypair.fromSecretKey(senderSecretKey);
const wallet1 = new PublicKey("3yn3S5pDh7NGuyrzY7HtJmje3autnLPnuZzsvv7CrTnW");
const wallet2 = new PublicKey("CpePtN1mK47Xz4Q1XRGZp3T5LYjuqqqFCgom4iW6pbj8");
// Public key of the account you want to check

// Function to get the balance
async function getBalance() {
  try {
    const balance1OLD = await connection.getBalance(wallet1);
    const balance2OLD = await connection.getBalance(wallet2);
    console.log("Account balance:", balance1OLD / 1e9, "SOL"); // SOL is in lamports, so divide by 1e9 to get SOL
    console.log("Account balance:", balance2OLD / 1e9, "SOL"); // SOL is in lamports, so divide by 1e9 to get SOL

    // Fetch the latest blockhash and fee calculator to estimate the fee
    const {
      blockhash,
      lastValidBlockHeight,
    } = await connection.getLatestBlockhash();

    // Create a transaction object
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: senderKeypair.publicKey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: wallet2,
        lamports: 1.2 * LAMPORTS_PER_SOL, // Amount in lamports
      })
    );

    // Create a transaction message to get fee estimation
    const message = transaction.compileMessage();

    // Estimate the fee using getFeeForMessage
    const feeInLamports = await connection.getFeeForMessage(message);
    if (feeInLamports === null) {
      throw new Error("Failed to estimate fee");
    }

    console.log("Estimated transaction fee in lamports:", feeInLamports.value);
    console.log(
      "Estimated transaction fee in SOL:",
      feeInLamports.value / LAMPORTS_PER_SOL
    );

    // Send the transaction and wait for confirmation
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      senderKeypair,
    ]);
    console.log("Transaction successful with signature:", signature);

    const balance1 = await connection.getBalance(wallet1);
    const balance2 = await connection.getBalance(wallet2);
    console.log("Account balance:", balance1 / 1e9, "SOL"); // SOL is in lamports, so divide by 1e9 to get SOL
    console.log("Account balance:", balance2 / 1e9, "SOL"); // SOL is in lamports, so divide by 1e9 to get SOL
    console.log("end");
  } catch (error) {
    console.error("Error fetching balance:", error);
  }
}

getBalance();
