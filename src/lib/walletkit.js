// src/lib/walletkit.js — StellarWalletsKit multi-wallet integration
import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
} from "@creit.tech/stellar-wallets-kit";

// Singleton kit instance
let kit = null;

export function getKit() {
  if (!kit) {
    kit = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }
  return kit;
}

/**
 * Opens the multi-wallet selection modal and returns connected address.
 * @returns {Promise<string>} public key
 */
export const connectWallet = () =>
  new Promise((resolve, reject) => {
    const k = getKit();
    k.openModal({
      onWalletSelected: async (option) => {
        try {
          k.setWallet(option.id);
          const { address } = await k.getAddress();
          resolve(address);
        } catch (err) {
          reject(err);
        }
      },
    });
  });

/**
 * Sign a XDR transaction string with the connected wallet.
 * @param {string} xdr
 * @param {string} address
 * @returns {Promise<string>} signed XDR
 */
export const signTransaction = async (xdr, address) => {
  const k = getKit();
  const { signedTxXdr } = await k.signTransaction(xdr, {
    address,
    networkPassphrase: "Test SDF Network ; September 2015",
  });
  return signedTxXdr;
};

export const disconnectWallet = () => {
  kit = null;
};