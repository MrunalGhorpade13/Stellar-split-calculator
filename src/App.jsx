// src/App.jsx — Stellar Split Calculator Level 2
// Multi-wallet (StellarWalletsKit) + Real Soroban contract calls

import { useState, useEffect, useCallback, useRef } from "react";
import { connectWallet, disconnectWallet } from "./lib/walletkit";
import { createBill as contractCreateBill, markPaid as contractMarkPaid, CONTRACT_ID } from "./lib/contract";

// ── 3 Error Types (Level 2 requirement) ───────────────────────────
class WalletNotFoundError extends Error {
  constructor() {
    super("No wallet extension found. Please install Freighter or xBull.");
    this.name = "WalletNotFoundError";
  }
}
class UserRejectedError extends Error {
  constructor() {
    super("You rejected the request. No funds were moved.");
    this.name = "UserRejectedError";
  }
}
class InsufficientBalanceError extends Error {
  constructor() {
    super("Insufficient XLM balance to cover transaction fees.");
    this.name = "InsufficientBalanceError";
  }
}

const classifyError = (err) => {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("not found") || msg.includes("install") || msg.includes("no wallet") || msg.includes("wallet_not_found"))
    return new WalletNotFoundError();
  if (msg.includes("reject") || msg.includes("cancel") || msg.includes("denied") || msg.includes("declined"))
    return new UserRejectedError();
  if (msg.includes("balance") || msg.includes("insufficient") || msg.includes("underfunded"))
    return new InsufficientBalanceError();
  return err;
};

const getErrorDisplay = (err) => {
  if (err instanceof WalletNotFoundError)
    return { icon: "🔌", title: "Wallet Not Found", color: "#f97316", action: "Install Freighter", actionUrl: "https://www.freighter.app/" };
  if (err instanceof UserRejectedError)
    return { icon: "🚫", title: "Transaction Rejected", color: "#f59e0b", action: null };
  if (err instanceof InsufficientBalanceError)
    return { icon: "💸", title: "Insufficient Balance", color: "#ef4444", action: "Get Testnet XLM", actionUrl: "https://friendbot.stellar.org" };
  return { icon: "⚠️", title: "Error", color: "#ef4444", action: null };
};

// ── Horizon balance fetch ─────────────────────────────────────────
const getXLMBalance = async (address) => {
  try {
    const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
    if (!res.ok) return null;
    const data = await res.json();
    const xlm = data.balances?.find((b) => b.asset_type === "native");
    return xlm ? parseFloat(xlm.balance) : 0;
  } catch {
    return null;
  }
};

// ══════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════════

const TxStatusBadge = ({ status, hash }) => {
  if (!status || status === "idle") return null;
  const cfg = {
    pending: { border: "#f59e0b", text: "#fbbf24", label: "⏳ Broadcasting to Stellar Testnet...", pulse: true },
    success: { border: "#10b981", text: "#34d399", label: "✅ Transaction Confirmed!", pulse: false },
    error: { border: "#ef4444", text: "#f87171", label: "❌ Transaction Failed", pulse: false },
  }[status];
  if (!cfg) return null;
  return (
    <div style={{ borderLeft: `4px solid ${cfg.border}`, background: cfg.border + "15", borderRadius: 8, padding: "10px 14px", marginTop: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {cfg.pulse && <span style={{ width: 8, height: 8, borderRadius: "50%", background: cfg.border, display: "inline-block", animation: "pulse 1.5s infinite" }} />}
        <span style={{ color: cfg.text, fontWeight: 600, fontSize: 13 }}>{cfg.label}</span>
      </div>
      {hash && (
        <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", marginTop: 4, fontSize: 11, color: "#64748b", fontFamily: "monospace", wordBreak: "break-all", textDecoration: "none" }}>
          🔗 View on Stellar Expert: {hash.slice(0, 32)}...
        </a>
      )}
    </div>
  );
};

const ErrorBanner = ({ error, onDismiss }) => {
  if (!error) return null;
  const d = getErrorDisplay(error);
  return (
    <div style={{ borderLeft: `4px solid ${d.color}`, background: d.color + "15", borderRadius: 8, padding: "12px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", gap: 8 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <span>{d.icon}</span>
          <span style={{ color: "#fca5a5", fontWeight: 700, fontSize: 13 }}>{d.title}</span>
          <span style={{ fontSize: 10, background: "#ef444420", color: "#f87171", padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>
            {error.name}
          </span>
        </div>
        <p style={{ fontSize: 12, color: "#fecaca", margin: 0 }}>{error.message}</p>
        {d.action && d.actionUrl && (
          <a href={d.actionUrl} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 11, color: "#60a5fa", display: "block", marginTop: 4, textDecoration: "none" }}>
            → {d.action}
          </a>
        )}
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>×</button>
    </div>
  );
};

const EventLog = ({ events }) => (
  <div style={{ maxHeight: 260, overflowY: "auto" }}>
    {events.length === 0 ? (
      <div style={{ textAlign: "center", padding: "32px 0", color: "#334155" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
        <p style={{ fontSize: 13, margin: 0 }}>No events yet. Connect wallet to start.</p>
      </div>
    ) : events.map((e, i) => (
      <div key={i} style={{ background: "#020817", border: "1px solid #1e293b", borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontFamily: "monospace", fontSize: 12 }}>
        <span style={{ color: "#38bdf8" }}>[{e.time}]</span>{" "}
        <span style={{ color: e.type.includes("ERROR") || e.type.includes("FAIL") ? "#f87171" : "#a78bfa", fontWeight: 700 }}>{e.type}</span>{" "}
        <span style={{ color: "#94a3b8" }}>{e.data}</span>
      </div>
    ))}
  </div>
);

// Wallet option icons
const WALLET_ICONS = {
  freighter: "🟣",
  xbull: "🐂",
  albedo: "🔵",
  lobstr: "🦞",
  walletconnect: "🔗",
};

const WalletIcon = ({ id }) => (
  <span style={{ fontSize: 16 }}>{WALLET_ICONS[id?.toLowerCase()] || "👛"}</span>
);

const BillCard = ({ bill, onMarkPaid, currentWallet }) => {
  const [mStatus, setMStatus] = useState("idle");
  const [mHash, setMHash] = useState(null);
  const paidCount = bill.participants.filter((p) => bill.paid?.[p]).length;
  const progress = Math.round((paidCount / bill.participants.length) * 100);
  const settled = paidCount === bill.participants.length;

  return (
    <div style={{ background: "#0f172a", border: `1px solid ${settled ? "#10b98130" : "#1e293b"}`, borderRadius: 16, padding: 20, marginBottom: 12, transition: "border-color 0.3s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "#f1f5f9" }}>{bill.description}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "#475569" }}>{bill.createdAt}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 20, fontWeight: 900, color: "#60a5fa", fontFamily: "monospace" }}>
            {bill.totalAmount} <span style={{ fontSize: 13, color: "#64748b" }}>{bill.currency}</span>
          </p>
          <p style={{ margin: 0, fontSize: 11, color: "#64748b" }}>{bill.sharePerPerson.toFixed(4)} {bill.currency}/person</p>
        </div>
      </div>

      <div style={{ background: "#020817", borderRadius: 4, height: 6, marginBottom: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${progress}%`, background: settled ? "linear-gradient(90deg,#10b981,#34d399)" : "linear-gradient(90deg,#3b82f6,#8b5cf6)", borderRadius: 4, transition: "width 0.6s ease" }} />
      </div>
      <p style={{ fontSize: 11, color: "#475569", marginBottom: 12 }}>{paidCount}/{bill.participants.length} paid · {progress}%</p>

      {settled && (
        <div style={{ textAlign: "center", color: "#34d399", fontSize: 12, fontWeight: 700, background: "#10b98115", borderRadius: 8, padding: "6px 0", marginBottom: 10, border: "1px solid #10b98130" }}>
          ✅ Bill fully settled!
        </div>
      )}

      {bill.participants.map((p) => {
        const isPaid = bill.paid?.[p];
        const isMe = currentWallet && p === currentWallet;
        return (
          <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isPaid ? "#10b98108" : "#020817", border: `1px solid ${isPaid ? "#10b98130" : "#1e293b"}`, borderRadius: 10, padding: "8px 12px", marginBottom: 6, transition: "all 0.3s" }}>
            <div>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{p.slice(0, 8)}...{p.slice(-6)}</span>
              {isMe && <span style={{ marginLeft: 6, fontSize: 10, background: "#3b82f620", color: "#60a5fa", padding: "1px 6px", borderRadius: 4 }}>you</span>}
            </div>
            {isPaid ? (
              <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>✓ PAID</span>
            ) : (
              <button
                onClick={() => onMarkPaid(bill.id, p, (s, h) => { setMStatus(s); if (h) setMHash(h); })}
                style={{ fontSize: 11, background: "linear-gradient(135deg,#2563eb,#7c3aed)", color: "#fff", border: "none", borderRadius: 8, padding: "4px 12px", cursor: "pointer", fontWeight: 600 }}>
                Mark Paid
              </button>
            )}
          </div>
        );
      })}

      <TxStatusBadge status={mStatus} hash={mHash} />

      {bill.txHash && (
        <a href={`https://stellar.expert/explorer/testnet/tx/${bill.txHash}`} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", marginTop: 8, fontSize: 11, color: "#334155", fontFamily: "monospace", textDecoration: "none", transition: "color 0.2s" }}
          onMouseEnter={e => e.target.style.color = "#60a5fa"}
          onMouseLeave={e => e.target.style.color = "#334155"}>
          TX: {bill.txHash.slice(0, 24)}...
        </a>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════════
export default function App() {
  const [wallet, setWallet] = useState(null);
  const [walletType, setWalletType] = useState(null);
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const [form, setForm] = useState({ description: "", totalAmount: "", currency: "XLM", participants: "" });
  const [txStatus, setTxStatus] = useState("idle");
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  const pushEvent = useCallback((type, data) => {
    setEvents((prev) => [{ type, data, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 50));
  }, []);

  // Poll balance every 15s
  useEffect(() => {
    if (!wallet) return;
    getXLMBalance(wallet).then(setBalance);
    const id = setInterval(() => getXLMBalance(wallet).then(setBalance), 15000);
    return () => clearInterval(id);
  }, [wallet]);

  // ── Connect via StellarWalletsKit modal ───────────────────────
  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    try {
      const address = await connectWallet();
      setWallet(address);
      setWalletType("StellarWalletsKit");
      pushEvent("WALLET_CONNECTED", address.slice(0, 10) + "..." + address.slice(-6));
      pushEvent("NETWORK", "Stellar Testnet");
    } catch (err) {
      const classified = classifyError(err);
      setError(classified);
      pushEvent("ERROR", classified.name + ": " + classified.message.slice(0, 50));
    } finally {
      setConnecting(false);
    }
  };

  // ── Disconnect ────────────────────────────────────────────────
  const handleDisconnect = () => {
    disconnectWallet();
    setWallet(null);
    setWalletType(null);
    setBalance(null);
    setTxStatus("idle");
    setTxHash(null);
    setError(null);
    pushEvent("WALLET_DISCONNECTED", "User disconnected");
  };

  // ── Create Bill (real contract call) ─────────────────────────
  const handleCreateBill = async () => {
    setError(null);
    setTxStatus("idle");
    setTxHash(null);

    const participantList = form.participants.split(",").map((p) => p.trim()).filter(Boolean);
    const total = parseFloat(form.totalAmount);

    if (!form.description || !total || participantList.length === 0) {
      setError(Object.assign(new Error("Please fill in all fields (description, amount, participants)."), { name: "ValidationError" }));
      return;
    }

    if (balance !== null && balance < 1) {
      setError(new InsufficientBalanceError());
      return;
    }

    const sharePerPerson = total / participantList.length;
    const totalStroops = Math.round(total * 10_000_000);

    pushEvent("TX_SUBMITTED", `Creating: "${form.description}" for ${participantList.length} people`);
    setTxStatus("pending");

    try {
      const hash = await contractCreateBill({
        description: form.description,
        totalStroops,
        participants: participantList,
        callerAddress: wallet,
      });

      setTxStatus("success");
      setTxHash(hash);

      const newBill = {
        id: Date.now(),
        description: form.description,
        totalAmount: total,
        sharePerPerson,
        currency: form.currency,
        participants: participantList,
        paid: {},
        createdAt: new Date().toLocaleString(),
        txHash: hash,
      };
      setBills((prev) => [newBill, ...prev]);
      pushEvent("BILL_CREATED", `"${form.description}" — ${sharePerPerson.toFixed(4)} ${form.currency}/person`);
      pushEvent("TX_HASH", hash.slice(0, 20) + "...");
      setForm({ description: "", totalAmount: "", currency: "XLM", participants: "" });
    } catch (err) {
      const classified = classifyError(err);
      setError(classified);
      setTxStatus("error");
      pushEvent("TX_FAILED", classified.name);
    }
  };

  // ── Mark Paid (real contract call) ───────────────────────────
  const handleMarkPaid = async (billId, participant, onStatus) => {
    setError(null);
    onStatus("pending");
    try {
      const hash = await contractMarkPaid({
        billId,
        participant,
        callerAddress: wallet,
      });
      onStatus("success", hash);
      setBills((prev) =>
        prev.map((b) => b.id === billId ? { ...b, paid: { ...b.paid, [participant]: true } } : b)
      );
      pushEvent("PAYMENT_MARKED", `${participant.slice(0, 8)}...${participant.slice(-4)} paid`);
      pushEvent("TX_HASH", hash.slice(0, 20) + "...");
    } catch (err) {
      onStatus("error");
      const classified = classifyError(err);
      setError(classified);
      pushEvent("TX_FAILED", classified.name);
    }
  };

  // ── Computed ─────────────────────────────────────────────────
  const participantList = form.participants.split(",").map((p) => p.trim()).filter(Boolean);
  const sharePreview =
    participantList.length > 0 && parseFloat(form.totalAmount) > 0
      ? (parseFloat(form.totalAmount) / participantList.length).toFixed(4)
      : null;

  const isDeployed = CONTRACT_ID !== "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";

  const tabs = [
    { id: "create", label: "Create Bill", icon: "✏️" },
    { id: "bills", label: "My Bills", icon: "📋", badge: bills.length },
    { id: "events", label: "Live Events", icon: "⚡", badge: events.length },
  ];

  // ── Styles ───────────────────────────────────────────────────
  const S = {
    page: { minHeight: "100vh", background: "#020817", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" },
    wrap: { maxWidth: 540, margin: "0 auto", padding: "32px 16px" },
    card: { background: "#0f172a", border: "1px solid #1e293b", borderRadius: 16, padding: 22, marginBottom: 16 },
    label: { fontSize: 11, fontWeight: 700, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 },
    input: { width: "100%", background: "#020817", border: "1px solid #1e293b", borderRadius: 10, padding: "10px 12px", color: "#e2e8f0", fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" },
    btn: { width: "100%", padding: "13px", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit", transition: "opacity 0.2s, transform 0.1s" },
    btnSm: { background: "transparent", border: "1px solid #334155", borderRadius: 8, padding: "6px 14px", color: "#94a3b8", cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideIn { from{opacity:0;transform:translateY(-8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        input:focus, select:focus, textarea:focus { border-color: #3b82f6 !important; }
        ::placeholder { color: #334155 !important; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #020817; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 2px; }
      `}</style>

      <div style={S.wrap}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 32, animation: "fadeIn 0.5s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 20, padding: "4px 14px", marginBottom: 16 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: "#475569" }}>Stellar Testnet</span>
          </div>
          <h1 style={{ fontSize: 38, fontWeight: 900, marginBottom: 8, background: "linear-gradient(135deg,#38bdf8,#818cf8,#c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ⚡ Stellar Split
          </h1>
          <p style={{ color: "#475569", fontSize: 13, marginBottom: 16 }}>Split bills trustlessly on the Stellar blockchain</p>

          {/* Contract pill */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#0f172a", border: `1px solid ${isDeployed ? "#10b98130" : "#1e293b"}`, borderRadius: 20, padding: "4px 14px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isDeployed ? "#10b981" : "#a78bfa" }} />
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#475569" }}>
              Contract: {CONTRACT_ID.slice(0, 14)}...
            </span>
            <a href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 11, color: "#3b82f6", textDecoration: "none" }}
              title="View on Stellar Expert">↗</a>
          </div>
        </div>

        {/* ── Wallet Card ── */}
        <div style={{ ...S.card, animation: "slideIn 0.4s ease" }}>
          {!wallet ? (
            <>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#64748b", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 8 }}>Connect Wallet</p>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 16, lineHeight: 1.6 }}>
                Choose from <strong style={{ color: "#e2e8f0" }}>Freighter, xBull, Albedo, Lobstr</strong> and more to get started.
              </p>

              {/* Wallet options preview */}
              <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" }}>
                {["🟣 Freighter", "🐂 xBull", "🔵 Albedo", "🦞 Lobstr"].map((w) => (
                  <div key={w} style={{ fontSize: 11, background: "#020817", border: "1px solid #1e293b", borderRadius: 8, padding: "4px 10px", color: "#64748b" }}>
                    {w}
                  </div>
                ))}
              </div>

              {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

              <button
                onClick={handleConnect}
                disabled={connecting}
                style={{ ...S.btn, opacity: connecting ? 0.7 : 1 }}
                onMouseEnter={e => !connecting && (e.target.style.transform = "scale(1.01)")}
                onMouseLeave={e => (e.target.style.transform = "scale(1)")}>
                {connecting ? (
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    <span style={{ width: 14, height: 14, border: "2px solid #ffffff50", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                    Opening Wallet Selector...
                  </span>
                ) : "🔗 Connect Wallet"}
              </button>

              <p style={{ fontSize: 11, color: "#1e293b", textAlign: "center", marginTop: 10 }}>
                Powered by{" "}
                <a href="https://stellarwalletskit.dev" target="_blank" rel="noopener noreferrer" style={{ color: "#334155", textDecoration: "none" }}>
                  StellarWalletsKit
                </a>
              </p>
            </>
          ) : (
            <div style={{ animation: "fadeIn 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg,#3b82f6,#8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>👛</div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: "#64748b", fontWeight: 700, letterSpacing: "0.05em" }}>CONNECTED · TESTNET</p>
                    <p style={{ margin: 0, fontSize: 13, fontFamily: "monospace", color: "#e2e8f0" }}>{wallet.slice(0, 10)}...{wallet.slice(-8)}</p>
                  </div>
                </div>
                <button onClick={handleDisconnect} style={S.btnSm}>Disconnect</button>
              </div>
              {balance !== null && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: "#020817", border: "1px solid #1e293b", borderRadius: 10, padding: "8px 14px" }}>
                  <span style={{ fontSize: 13, color: "#64748b" }}>Balance:</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: "#e2e8f0" }}>
                    {balance !== null ? `${balance.toFixed(4)} XLM` : "Loading..."}
                  </span>
                  {balance !== null && balance < 1 && (
                    <a href={`https://friendbot.stellar.org/?addr=${wallet}`} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: "auto", fontSize: 11, color: "#fbbf24", textDecoration: "none" }}>
                      Get testnet XLM →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Main content (connected) ── */}
        {wallet && (
          <>
            <ErrorBanner error={error} onDismiss={() => setError(null)} />

            {/* Tab bar */}
            <div style={{ display: "flex", gap: 4, background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, padding: "8px 4px", border: tab.id === activeTab ? "1px solid #3b82f640" : "1px solid transparent",
                  borderRadius: 8, background: tab.id === activeTab ? "#3b82f615" : "transparent",
                  color: tab.id === activeTab ? "#e2e8f0" : "#475569", cursor: "pointer",
                  fontWeight: 700, fontSize: 12, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 0.2s",
                }}>
                  {tab.icon} {tab.label}
                  {tab.badge > 0 && (
                    <span style={{ fontSize: 10, background: tab.id === "events" ? "#10b981" : "#334155", color: "#fff", borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* ── CREATE TAB ── */}
            {activeTab === "create" && (
              <div style={{ ...S.card, animation: "slideIn 0.3s ease" }}>
                <p style={{ ...S.label, marginBottom: 18, fontSize: 12 }}>New Bill</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                  <div>
                    <label style={S.label}>Description</label>
                    <input style={S.input} type="text" placeholder="e.g. Dinner at Barbeque Nation"
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div style={{ display: "flex", gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <label style={S.label}>Total Amount</label>
                      <input style={S.input} type="number" placeholder="100" min="0" step="0.01"
                        value={form.totalAmount} onChange={(e) => setForm({ ...form, totalAmount: e.target.value })} />
                    </div>
                    <div style={{ width: 100 }}>
                      <label style={S.label}>Currency</label>
                      <select style={S.input} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                        <option>XLM</option>
                        <option>USDC</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={S.label}>Participants (comma-separated Stellar addresses)</label>
                    <textarea style={{ ...S.input, resize: "vertical", minHeight: 90, fontFamily: "monospace", fontSize: 11, lineHeight: 1.6 }}
                      placeholder={`${wallet},\nGBXXXXXXXXXXXXXXXXXXXXXXX...`}
                      value={form.participants} onChange={(e) => setForm({ ...form, participants: e.target.value })} />
                    {participantList.length > 0 && (
                      <p style={{ fontSize: 11, color: "#475569", marginTop: 4 }}>
                        {participantList.length} participant{participantList.length !== 1 ? "s" : ""} added
                      </p>
                    )}
                  </div>

                  {sharePreview && (
                    <div style={{ background: "linear-gradient(135deg,#3b82f608,#8b5cf608)", border: "1px solid #3b82f630", borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: "#94a3b8" }}>Each person pays:</span>
                      <span style={{ fontSize: 22, fontWeight: 900, color: "#60a5fa", fontFamily: "monospace" }}>
                        {sharePreview} <span style={{ fontSize: 12, color: "#64748b" }}>{form.currency}</span>
                      </span>
                    </div>
                  )}

                  <button
                    onClick={handleCreateBill}
                    disabled={txStatus === "pending" || !form.description || !form.totalAmount || !form.participants}
                    style={{ ...S.btn, opacity: (txStatus === "pending" || !form.description || !form.totalAmount || !form.participants) ? 0.5 : 1 }}>
                    {txStatus === "pending" ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ width: 14, height: 14, border: "2px solid #ffffff50", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                        Broadcasting to Testnet...
                      </span>
                    ) : "🚀 Create Bill on Stellar Testnet"}
                  </button>

                  <TxStatusBadge status={txStatus} hash={txHash} />
                </div>
              </div>
            )}

            {/* ── BILLS TAB ── */}
            {activeTab === "bills" && (
              <div style={{ animation: "slideIn 0.3s ease" }}>
                {bills.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: "#334155" }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
                    <p style={{ margin: 0, fontSize: 14 }}>No bills yet. Create one first!</p>
                  </div>
                ) : bills.map((bill) => (
                  <BillCard key={bill.id} bill={bill} onMarkPaid={handleMarkPaid} currentWallet={wallet} />
                ))}
              </div>
            )}

            {/* ── EVENTS TAB ── */}
            {activeTab === "events" && (
              <div style={{ ...S.card, animation: "slideIn 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <p style={{ ...S.label, margin: 0 }}>Live Event Feed</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", animation: "pulse 2s infinite" }} />
                    <span style={{ fontSize: 11, color: "#10b981", fontWeight: 700 }}>LIVE</span>
                    {events.length > 0 && (
                      <button onClick={() => setEvents([])} style={{ ...S.btnSm, fontSize: 10, padding: "2px 8px", marginLeft: 8 }}>
                        Clear
                      </button>
                    )}
                  </div>
                </div>
                <EventLog events={events} />
              </div>
            )}
          </>
        )}

        {/* ── Footer ── */}
        <div style={{ textAlign: "center", marginTop: 40, paddingTop: 20, borderTop: "1px solid #0f172a" }}>
          <p style={{ fontSize: 11, color: "#1e293b", lineHeight: 1.8 }}>
            Stellar Testnet · StellarWalletsKit · Soroban{" "}
            <span style={{ color: "#0f172a" }}>|</span>{" "}
            <a href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`} target="_blank" rel="noopener noreferrer"
              style={{ color: "#1e293b", textDecoration: "none" }}>
              View Contract ↗
            </a>
          </p>
        </div>

      </div>
    </div>
  );
}
