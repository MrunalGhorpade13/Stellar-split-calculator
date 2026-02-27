// src/lib/walletkit.js — StellarWalletsKit v2.0.0 (lazy init, static class API)

let initialized = false;

function ensureInit() {
  if (initialized) return;
  initialized = true;

  // Lazy import to avoid running at module parse time (crashes Vite dep optimizer)
  Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    import("@creit.tech/stellar-wallets-kit/modules/freighter"),
    import("@creit.tech/stellar-wallets-kit/modules/albedo"),
    import("@creit.tech/stellar-wallets-kit/modules/xbull"),
    import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
  ]).then(([{ StellarWalletsKit, Networks }, { FreighterModule }, { AlbedoModule }, { xBullModule }, { LobstrModule }]) => {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new AlbedoModule(),
        new LobstrModule(),
      ],
    });
  });
}

/**
 * Opens the StellarWalletsKit auth modal. Returns connected address string.
 * @returns {Promise<string>}
 */
export const connectWallet = async () => {
  const [{ StellarWalletsKit, Networks }, { FreighterModule }, { AlbedoModule }, { xBullModule }, { LobstrModule }] = await Promise.all([
    import("@creit.tech/stellar-wallets-kit"),
    import("@creit.tech/stellar-wallets-kit/modules/freighter"),
    import("@creit.tech/stellar-wallets-kit/modules/albedo"),
    import("@creit.tech/stellar-wallets-kit/modules/xbull"),
    import("@creit.tech/stellar-wallets-kit/modules/lobstr"),
  ]);

  if (!initialized) {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new AlbedoModule(),
        new LobstrModule(),
      ],
    });
    initialized = true;
  }

  const { address } = await StellarWalletsKit.authModal();
  return address;
};

/**
 * Sign a transaction XDR via the active wallet.
 * @param {string} xdr
 * @param {string} address
 * @returns {Promise<string>} signed XDR
 */
export const signTransaction = async (xdr, address) => {
  const { StellarWalletsKit, Networks } = await import("@creit.tech/stellar-wallets-kit");
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    address,
    networkPassphrase: Networks.TESTNET,
  });
  return signedTxXdr;
};

export const disconnectWallet = async () => {
  const { StellarWalletsKit } = await import("@creit.tech/stellar-wallets-kit");
  await StellarWalletsKit.disconnect();
  initialized = false;
};