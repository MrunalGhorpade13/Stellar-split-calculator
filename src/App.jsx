import { useState, useEffect, useCallback } from "react";
import {
  isConnected,
  getAddress,
  signTransaction,
  setAllowed,
} from "@stellar/freighter-api";
import * as StellarSdk from "@stellar/stellar-sdk";

const server = new StellarSdk.Horizon.Server(
  "https://horizon-testnet.stellar.org"
);
const networkPassphrase = StellarSdk.Networks.TESTNET;

export default function App() {
  const [walletAddress, setWalletAddress] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [participants, setParticipants] = useState([
    { name: "", address: "", amount: "" },
  ]);
  const [totalBill, setTotalBill] = useState("");
  const [txResults, setTxResults] = useState([]);
  const [sending, setSending] = useState(false);
  const [splitMode, setSplitMode] = useState("equal");
  const [memo, setMemo] = useState("");

  const fetchBalance = useCallback(async (address) => {
    try {
      const account = await server.loadAccount(address);
      const xlm = account.balances.find((b) => b.asset_type === "native");
      setBalance(xlm ? parseFloat(xlm.balance).toFixed(4) : "0");
    } catch {
      setBalance("0 (not funded)");
    }
  }, []);

  useEffect(() => {
    (async () => {
      const connected = await isConnected();
      if (connected?.isConnected) {
        const addr = await getAddress();
        if (addr?.address) {
          setWalletAddress(addr.address);
          fetchBalance(addr.address);
        }
      }
    })();
  }, [fetchBalance]);

  const connectWallet = async () => {
    setConnecting(true);
    try {
      await setAllowed();
      const addr = await getAddress();
      if (addr?.address) {
        setWalletAddress(addr.address);
        fetchBalance(addr.address);
      }
    } catch (e) {
      alert("Could not connect: " + e.message);
    }
    setConnecting(false);
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setBalance(null);
    setTxResults([]);
  };

  const addParticipant = () =>
    setParticipants([...participants, { name: "", address: "", amount: "" }]);

  const removeParticipant = (i) =>
    setParticipants(participants.filter((_, idx) => idx !== i));

  const updateParticipant = (i, field, value) => {
    const updated = [...participants];
    updated[i][field] = value;
    setParticipants(updated);
  };

  const getSplitAmounts = () => {
    if (splitMode === "equal") {
      const perPerson =
        participants.length > 0
          ? (parseFloat(totalBill) / participants.length).toFixed(7)
          : "0";
      return participants.map(() => perPerson);
    }
    return participants.map((p) => p.amount || "0");
  };

  const totalCustom = participants
    .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
    .toFixed(4);

  const sendPayments = async () => {
    if (!walletAddress) return alert("Connect wallet first.");
    const amounts = getSplitAmounts();

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const amt = amounts[i];
      if (!p.address || parseFloat(amt) <= 0) {
        alert(`Invalid address or amount for participant ${i + 1}`);
        return;
      }
      if (!StellarSdk.StrKey.isValidEd25519PublicKey(p.address)) {
        alert(
          `Invalid Stellar address for ${p.name || "participant " + (i + 1)}`
        );
        return;
      }
    }

    setSending(true);
    setTxResults([]);

    for (let i = 0; i < participants.length; i++) {
      const p = participants[i];
      const amt = amounts[i];
      const result = { name: p.name || `Person ${i + 1}`, status: "pending" };

      try {
        const sourceAccount = await server.loadAccount(walletAddress);
        const txBuilder = new StellarSdk.TransactionBuilder(sourceAccount, {
          fee: StellarSdk.BASE_FEE,
          networkPassphrase,
        })
          .addOperation(
            StellarSdk.Operation.payment({
              destination: p.address,
              asset: StellarSdk.Asset.native(),
              amount: String(amt),
            })
          )
          .setTimeout(30);

        if (memo.trim()) txBuilder.addMemo(StellarSdk.Memo.text(memo.trim()));

        const tx = txBuilder.build();
        const xdr = tx.toXDR();

        const signed = await signTransaction(xdr, {
          networkPassphrase,
          accountToSign: walletAddress,
        });

        const signedTx = StellarSdk.TransactionBuilder.fromXDR(
          signed.signedTxXdr ?? signed,
          networkPassphrase
        );
        const response = await server.submitTransaction(signedTx);

        result.status = "success";
        result.hash = response.hash;
        result.amount = amt;
      } catch (err) {
        result.status = "error";
        result.error =
          err?.response?.data?.extras?.result_codes?.operations?.join(", ") ||
          err.message;
      }

      setTxResults((prev) => [...prev, result]);
    }

    setSending(false);
    fetchBalance(walletAddress);
  };

  const splitAmounts = getSplitAmounts();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white font-sans">

      {/* HEADER */}
      <header className="border-b border-white/10 px-6 py-4 flex items-center justify-between backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-500 flex items-center justify-center text-lg">
            ⚡
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none">Stellar Split</h1>
            <p className="text-xs text-slate-400">Split bills on Testnet</p>
          </div>
        </div>

        {walletAddress ? (
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Balance</p>
              <p className="font-mono text-sm font-semibold text-indigo-300">
                {balance ?? "…"} XLM
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Wallet</p>
              <p className="font-mono text-xs">
                {walletAddress.slice(0, 4)}…{walletAddress.slice(-4)}
              </p>
            </div>
            <button
              onClick={disconnectWallet}
              className="text-xs bg-red-500/20 hover:bg-red-500/40 border border-red-500/30 text-red-300 px-3 py-1.5 rounded-lg transition"
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
          >
            {connecting ? "Connecting…" : "Connect Freighter"}
          </button>
        )}
      </header>

      {/* MAIN */}
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Mobile balance */}
        {walletAddress && (
          <div className="sm:hidden rounded-2xl bg-white/5 border border-white/10 p-4 flex justify-between items-center">
            <span className="text-slate-400 text-sm">Your Balance</span>
            <span className="font-mono font-bold text-indigo-300">
              {balance ?? "…"} XLM
            </span>
          </div>
        )}

        {/* Not connected */}
        {!walletAddress && (
          <div className="rounded-2xl bg-white/5 border border-white/10 p-8 text-center space-y-3">
            <div className="text-5xl">🌐</div>
            <h2 className="text-xl font-bold">Welcome to Stellar Split</h2>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Connect your Freighter wallet to split bills and send XLM
              payments on the Stellar Testnet.
            </p>
            <button
              onClick={connectWallet}
              disabled={connecting}
              className="mt-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-6 py-3 rounded-xl font-semibold transition"
            >
              {connecting ? "Connecting…" : "Connect Freighter Wallet"}
            </button>
          </div>
        )}

        {/* Connected UI */}
        {walletAddress && (
          <>
            {/* Bill Details */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
              <h2 className="font-semibold text-slate-200">Bill Details</h2>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Total Bill (XLM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.0000001"
                    placeholder="e.g. 50"
                    value={totalBill}
                    onChange={(e) => setTotalBill(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">
                    Memo (optional)
                  </label>
                  <input
                    type="text"
                    maxLength={28}
                    placeholder="e.g. Dinner split"
                    value={memo}
                    onChange={(e) => setMemo(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setSplitMode("equal")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                    splitMode === "equal"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  ÷ Equal Split
                </button>
                <button
                  onClick={() => setSplitMode("custom")}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${
                    splitMode === "custom"
                      ? "bg-indigo-600 text-white"
                      : "bg-white/10 text-slate-300 hover:bg-white/20"
                  }`}
                >
                  ✎ Custom Split
                </button>
              </div>
            </section>

            {/* Participants */}
            <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-200">
                  Participants ({participants.length})
                </h2>
                <button
                  onClick={addParticipant}
                  className="text-xs bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-300 px-3 py-1.5 rounded-lg transition"
                >
                  + Add
                </button>
              </div>

              {participants.map((p, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 font-medium">
                      Person {i + 1}
                    </span>
                    {participants.length > 1 && (
                      <button
                        onClick={() => removeParticipant(i)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        ✕ Remove
                      </button>
                    )}
                  </div>

                  <input
                    placeholder="Name (optional)"
                    value={p.name}
                    onChange={(e) =>
                      updateParticipant(i, "name", e.target.value)
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                  />

                  <input
                    placeholder="Stellar Address (G...)"
                    value={p.address}
                    onChange={(e) =>
                      updateParticipant(i, "address", e.target.value)
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm font-mono focus:outline-none focus:border-indigo-400"
                  />

                  {splitMode === "custom" && (
                    <input
                      type="number"
                      min="0"
                      step="0.0000001"
                      placeholder="Amount (XLM)"
                      value={p.amount}
                      onChange={(e) =>
                        updateParticipant(i, "amount", e.target.value)
                      }
                      className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-indigo-400"
                    />
                  )}

                  <div className="text-right text-xs text-indigo-300 font-mono">
                    Will pay:{" "}
                    <span className="font-bold">
                      {parseFloat(splitAmounts[i] || 0).toFixed(7)} XLM
                    </span>
                  </div>
                </div>
              ))}

              {/* Equal split summary */}
              {splitMode === "equal" && totalBill && (
                <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-slate-300">
                    <span>Total bill</span>
                    <span className="font-mono">
                      {parseFloat(totalBill).toFixed(4)} XLM
                    </span>
                  </div>
                  <div className="flex justify-between text-indigo-300 font-semibold mt-1">
                    <span>Each pays</span>
                    <span className="font-mono">{splitAmounts[0]} XLM</span>
                  </div>
                </div>
              )}

              {/* Custom split summary */}
              {splitMode === "custom" && (
                <div className="bg-indigo-900/30 border border-indigo-500/20 rounded-xl p-3 text-sm">
                  <div className="flex justify-between text-indigo-300 font-semibold">
                    <span>Total to send</span>
                    <span className="font-mono">{totalCustom} XLM</span>
                  </div>
                </div>
              )}

              <button
                onClick={sendPayments}
                disabled={
                  sending ||
                  !totalBill ||
                  participants.every((p) => !p.address)
                }
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed py-3 rounded-xl font-semibold transition text-sm"
              >
                {sending
                  ? "Sending Payments…"
                  : `Send ${participants.length} Payment${
                      participants.length > 1 ? "s" : ""
                    }`}
              </button>
            </section>

            {/* Transaction Results */}
            {txResults.length > 0 && (
              <section className="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-3">
                <h2 className="font-semibold text-slate-200">
                  Transaction Results
                </h2>
                {txResults.map((r, i) => (
                  <div
                    key={i}
                    className={`rounded-xl p-3 border ${
                      r.status === "success"
                        ? "bg-green-900/30 border-green-500/30"
                        : r.status === "error"
                        ? "bg-red-900/30 border-red-500/30"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{r.name}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          r.status === "success"
                            ? "bg-green-500/20 text-green-300"
                            : r.status === "error"
                            ? "bg-red-500/20 text-red-300"
                            : "bg-white/10 text-slate-300"
                        }`}
                      >
                        {r.status === "success"
                          ? "✓ Sent"
                          : r.status === "error"
                          ? "✕ Failed"
                          : "⏳ Pending"}
                      </span>
                    </div>

                    {r.status === "success" && (
                      <>
                        <p className="text-xs text-slate-400 mt-1">
                          Amount:{" "}
                          <span className="font-mono text-green-300">
                            {r.amount} XLM
                          </span>
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Hash:{" "}
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${r.hash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-indigo-400 hover:text-indigo-300 break-all"
                          >
                            {r.hash}
                          </a>
                        </p>
                      </>
                    )}

                    {r.status === "error" && (
                      <p className="text-xs text-red-400 mt-1">{r.error}</p>
                    )}
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center text-xs text-slate-600 pb-6">
        Stellar Testnet · Built with @stellar/stellar-sdk · Freighter Wallet
      </footer>
    </div>
  );
}
