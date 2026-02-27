// src/App.jsx — Stellar Split Calculator Level 2
// 3 Wallets: Freighter · Albedo · xBull | Soroban contract | Real-time events

import { useState, useEffect, useCallback } from "react";
import {
  connectFreighter, connectAlbedo, connectXBull,
  disconnectWallet, setActiveWallet,
} from "./lib/walletkit";
import {
  createBill as contractCreateBill,
  markPaid as contractMarkPaid,
  CONTRACT_ID,
} from "./lib/contract";

// ── 3 Error Types ───────────────────────────────────────────────
class WalletNotFoundError extends Error {
  constructor(msg) { super(msg || "Wallet not found. Please install the extension."); this.name = "WalletNotFoundError"; }
}
class UserRejectedError extends Error {
  constructor() { super("You rejected the request. No funds were moved."); this.name = "UserRejectedError"; }
}
class InsufficientBalanceError extends Error {
  constructor() { super("Insufficient XLM balance to cover fees."); this.name = "InsufficientBalanceError"; }
}

const classifyError = (err) => {
  const msg = (err?.message || "").toLowerCase();
  if (msg.includes("not found") || msg.includes("install") || msg.includes("no wallet") || err.name === "WalletNotFoundError")
    return new WalletNotFoundError(err.message);
  if (msg.includes("reject") || msg.includes("cancel") || msg.includes("denied") || msg.includes("declined"))
    return new UserRejectedError();
  if (msg.includes("balance") || msg.includes("insufficient") || msg.includes("underfunded"))
    return new InsufficientBalanceError();
  return err;
};

const getErrorDisplay = (err) => {
  if (err instanceof WalletNotFoundError) return { icon: "🔌", title: "Wallet Not Found", color: "#f97316", action: "Install Freighter", url: "https://freighter.app" };
  if (err instanceof UserRejectedError) return { icon: "🚫", title: "Rejected", color: "#eab308", action: null };
  if (err instanceof InsufficientBalanceError) return { icon: "💸", title: "Low Balance", color: "#ef4444", action: "Get Testnet XLM", url: "https://friendbot.stellar.org" };
  return { icon: "⚠️", title: "Error", color: "#ef4444", action: null };
};

const getXLMBalance = async (address) => {
  try {
    const r = await fetch(`https://horizon-testnet.stellar.org/accounts/${address}`);
    if (!r.ok) return null;
    const d = await r.json();
    const native = d.balances?.find((b) => b.asset_type === "native");
    return native ? parseFloat(native.balance) : 0;
  } catch { return null; }
};

// ── Color Tokens (Emerald / Teal theme) ────────────────────────
const C = {
  bg: "#050e1a",
  surface: "#0a1628",
  border: "#132240",
  accent: "#10b981",   // emerald-500
  accent2: "#06b6d4",   // cyan-500
  purple: "#8b5cf6",
  text: "#e2e8f0",
  muted: "#64748b",
  dim: "#1e3a5f",
};

// ── Wallet definitions ─────────────────────────────────────────
const WALLETS = [
  {
    id: "freighter",
    icon: "🟢",
    name: "Freighter",
    desc: "Browser extension by SDF",
    url: "https://freighter.app",
    badge: "Most popular",
  },
  {
    id: "albedo",
    icon: "🔵",
    name: "Albedo",
    desc: "Web wallet — no install",
    url: "https://albedo.link",
    badge: "No extension needed",
  },
  {
    id: "xbull",
    icon: "🟡",
    name: "xBull",
    desc: "Advanced browser extension",
    url: "https://xbull.app",
    badge: "Feature-rich",
  },
];

// ══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ══════════════════════════════════════════════════════════════

const TxBadge = ({ status, hash }) => {
  if (!status || status === "idle") return null;
  const m = {
    pending: { bg: "#854d0e20", border: "#eab308", text: "#fbbf24", label: "⏳ Broadcasting…", pulse: true },
    success: { bg: "#064e3b20", border: "#10b981", text: "#34d399", label: "✅ Confirmed!", pulse: false },
    error: { bg: "#450a0a20", border: "#ef4444", text: "#f87171", label: "❌ Failed", pulse: false },
  }[status];
  if (!m) return null;
  return (
    <div style={{ background: m.bg, border: `1px solid ${m.border}`, borderRadius: 10, padding: "10px 14px", marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {m.pulse && <span style={{ width: 8, height: 8, borderRadius: "50%", background: m.border, display: "inline-block", animation: "pulse 1.5s infinite" }} />}
        <span style={{ color: m.text, fontWeight: 700, fontSize: 13 }}>{m.label}</span>
      </div>
      {hash && (
        <a href={`https://stellar.expert/explorer/testnet/tx/${hash}`} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", marginTop: 6, fontSize: 11, color: C.muted, fontFamily: "monospace", wordBreak: "break-all", textDecoration: "none" }}>
          🔗 {hash.slice(0, 36)}…
        </a>
      )}
    </div>
  );
};

const ErrorBanner = ({ error, onDismiss }) => {
  if (!error) return null;
  const d = getErrorDisplay(error);
  return (
    <div style={{ background: d.color + "12", border: `1px solid ${d.color}40`, borderRadius: 10, padding: "12px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", gap: 8 }}>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span>{d.icon}</span>
          <span style={{ color: d.color, fontWeight: 700, fontSize: 13 }}>{d.title}</span>
          <span style={{ fontSize: 10, background: d.color + "20", color: d.color, padding: "1px 6px", borderRadius: 4, fontFamily: "monospace" }}>{error.name}</span>
        </div>
        <p style={{ fontSize: 12, color: "#fca5a5", margin: 0 }}>{error.message}</p>
        {d.action && d.url && (
          <a href={d.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: "#60a5fa", display: "block", marginTop: 4, textDecoration: "none" }}>
            → {d.action}
          </a>
        )}
      </div>
      <button onClick={onDismiss} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 18, padding: "0 4px" }}>×</button>
    </div>
  );
};

const EventLog = ({ events, onClear }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
      <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase" }}>Live Events</p>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 7, height: 7, borderRadius: "50%", background: C.accent, animation: "pulse 2s infinite" }} />
        <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>LIVE</span>
        {events.length > 0 && <button onClick={onClear} style={{ fontSize: 10, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", color: C.muted, cursor: "pointer" }}>Clear</button>}
      </div>
    </div>
    <div style={{ maxHeight: 260, overflowY: "auto" }}>
      {events.length === 0 ? (
        <div style={{ textAlign: "center", padding: "32px 0", color: C.dim }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
          <p style={{ fontSize: 13, margin: 0 }}>No events yet. Connect a wallet to start.</p>
        </div>
      ) : events.map((e, i) => (
        <div key={i} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8, padding: "8px 12px", marginBottom: 6, fontFamily: "monospace", fontSize: 12 }}>
          <span style={{ color: C.accent2 }}>[{e.time}]</span>{" "}
          <span style={{ color: e.type.includes("ERROR") || e.type.includes("FAIL") ? "#f87171" : C.purple, fontWeight: 700 }}>{e.type}</span>{" "}
          <span style={{ color: "#94a3b8" }}>{e.data}</span>
        </div>
      ))}
    </div>
  </div>
);

const BillCard = ({ bill, onMarkPaid, wallet }) => {
  const [mStatus, setMStatus] = useState("idle");
  const [mHash, setMHash] = useState(null);
  const paid = bill.participants.filter((p) => bill.paid?.[p]).length;
  const pct = Math.round((paid / bill.participants.length) * 100);
  const settled = paid === bill.participants.length;

  return (
    <div style={{ background: C.surface, border: `1px solid ${settled ? C.accent + "40" : C.border}`, borderRadius: 16, padding: 20, marginBottom: 14, transition: "border-color 0.4s" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: C.text }}>{bill.description}</h3>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: C.muted }}>{bill.createdAt}</p>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: 22, fontWeight: 900, color: C.accent2, fontFamily: "monospace" }}>
            {bill.totalAmount} <span style={{ fontSize: 13, color: C.muted }}>{bill.currency}</span>
          </p>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>{bill.sharePerPerson.toFixed(4)} {bill.currency}/person</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: C.bg, borderRadius: 4, height: 6, marginBottom: 8, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: settled ? `linear-gradient(90deg,${C.accent},${C.accent2})` : `linear-gradient(90deg,${C.accent2},${C.purple})`, transition: "width 0.6s ease", borderRadius: 4 }} />
      </div>
      <p style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>{paid}/{bill.participants.length} paid · {pct}%</p>

      {settled && (
        <div style={{ textAlign: "center", color: C.accent, fontSize: 12, fontWeight: 700, background: C.accent + "15", borderRadius: 8, padding: "6px 0", marginBottom: 12, border: `1px solid ${C.accent}30` }}>
          ✅ Fully Settled!
        </div>
      )}

      {bill.participants.map((p) => {
        const isPaid = bill.paid?.[p];
        const isMe = wallet && p === wallet;
        return (
          <div key={p} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: isPaid ? C.accent + "08" : C.bg, border: `1px solid ${isPaid ? C.accent + "30" : C.border}`, borderRadius: 10, padding: "8px 14px", marginBottom: 8, transition: "all 0.3s" }}>
            <div>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94a3b8" }}>{p.slice(0, 8)}…{p.slice(-6)}</span>
              {isMe && <span style={{ marginLeft: 8, fontSize: 10, background: C.accent2 + "20", color: C.accent2, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>you</span>}
            </div>
            {isPaid ? (
              <span style={{ fontSize: 11, color: C.accent, fontWeight: 700 }}>✓ PAID</span>
            ) : (
              <button onClick={() => onMarkPaid(bill.id, p, (s, h) => { setMStatus(s); if (h) setMHash(h); })}
                style={{ fontSize: 11, background: `linear-gradient(135deg,${C.accent2},${C.purple})`, color: "#fff", border: "none", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontWeight: 700 }}>
                Mark Paid
              </button>
            )}
          </div>
        );
      })}

      <TxBadge status={mStatus} hash={mHash} />
      {bill.txHash && (
        <a href={`https://stellar.expert/explorer/testnet/tx/${bill.txHash}`} target="_blank" rel="noopener noreferrer"
          style={{ display: "block", marginTop: 8, fontSize: 11, color: C.muted, fontFamily: "monospace", textDecoration: "none" }}>
          TX: {bill.txHash.slice(0, 24)}…
        </a>
      )}
    </div>
  );
};

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════
export default function App() {
  const [wallet, setWallet] = useState(null);
  const [walletMeta, setWalletMeta] = useState(null); // { id, name, icon }
  const [balance, setBalance] = useState(null);
  const [connecting, setConnecting] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [bills, setBills] = useState([]);
  const [activeTab, setActiveTab] = useState("create");
  const [form, setForm] = useState({ description: "", totalAmount: "", currency: "XLM", participants: "" });
  const [txStatus, setTxStatus] = useState("idle");
  const [txHash, setTxHash] = useState(null);
  const [error, setError] = useState(null);
  const [events, setEvents] = useState([]);

  const pushEvent = useCallback((type, data) => {
    setEvents((p) => [{ type, data, time: new Date().toLocaleTimeString() }, ...p].slice(0, 50));
  }, []);

  useEffect(() => {
    if (!wallet) return;
    getXLMBalance(wallet).then(setBalance);
    const id = setInterval(() => getXLMBalance(wallet).then(setBalance), 15000);
    return () => clearInterval(id);
  }, [wallet]);

  // ── Connect ──────────────────────────────────────────────────
  const handleConnectWith = async (w) => {
    setConnecting(w.id);
    setShowModal(false);
    setError(null);
    try {
      let address;
      if (w.id === "freighter") address = await connectFreighter();
      else if (w.id === "albedo") address = await connectAlbedo();
      else if (w.id === "xbull") address = await connectXBull();
      setActiveWallet(w.id, address);
      setWallet(address);
      setWalletMeta(w);
      pushEvent("WALLET_CONNECTED", `${w.name} · ${address.slice(0, 8)}…`);
      pushEvent("NETWORK", "Stellar Testnet");
    } catch (err) {
      const c = classifyError(err);
      setError(c);
      pushEvent("ERROR", c.name);
    } finally {
      setConnecting(null);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWallet(null); setWalletMeta(null); setBalance(null);
    setShowModal(false); setTxStatus("idle"); setTxHash(null); setError(null);
    pushEvent("WALLET_DISCONNECTED", "Disconnected");
  };

  // ── Create Bill ───────────────────────────────────────────────
  const handleCreateBill = async () => {
    setError(null); setTxStatus("idle"); setTxHash(null);
    const parts = form.participants.split(",").map((p) => p.trim()).filter(Boolean);
    const total = parseFloat(form.totalAmount);
    if (!form.description || !total || parts.length === 0) {
      setError(Object.assign(new Error("Fill in all fields."), { name: "ValidationError" })); return;
    }
    if (balance !== null && balance < 1) { setError(new InsufficientBalanceError()); return; }
    const share = total / parts.length;
    pushEvent("TX_SUBMITTED", `"${form.description}" · ${parts.length} people`);
    setTxStatus("pending");
    try {
      const hash = await contractCreateBill({ description: form.description, totalStroops: Math.round(total * 1e7), participants: parts, callerAddress: wallet });
      setTxStatus("success"); setTxHash(hash);
      setBills((p) => [{ id: Date.now(), description: form.description, totalAmount: total, sharePerPerson: share, currency: form.currency, participants: parts, paid: {}, createdAt: new Date().toLocaleString(), txHash: hash }, ...p]);
      pushEvent("BILL_CREATED", `${form.description} · ${share.toFixed(4)} ${form.currency}/person`);
      pushEvent("TX_HASH", hash.slice(0, 20) + "…");
      setForm({ description: "", totalAmount: "", currency: "XLM", participants: "" });
    } catch (err) {
      const c = classifyError(err); setError(c); setTxStatus("error"); pushEvent("TX_FAILED", c.name);
    }
  };

  const handleMarkPaid = async (billId, participant, onStatus) => {
    setError(null); onStatus("pending");
    try {
      const hash = await contractMarkPaid({ billId, participant, callerAddress: wallet });
      onStatus("success", hash);
      setBills((p) => p.map((b) => b.id === billId ? { ...b, paid: { ...b.paid, [participant]: true } } : b));
      pushEvent("PAYMENT_MARKED", `${participant.slice(0, 8)}…`);
    } catch (err) {
      onStatus("error"); setError(classifyError(err));
    }
  };

  // ── Computed ─────────────────────────────────────────────────
  const parts = form.participants.split(",").map((p) => p.trim()).filter(Boolean);
  const sharePreview = parts.length > 0 && parseFloat(form.totalAmount) > 0
    ? (parseFloat(form.totalAmount) / parts.length).toFixed(4) : null;
  const isDeployed = CONTRACT_ID !== "CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABSC4";

  const tabs = [
    { id: "create", label: "Create Bill", icon: "✏️" },
    { id: "bills", label: "Bills", icon: "📋", badge: bills.length },
    { id: "events", label: "Events", icon: "⚡", badge: events.length },
  ];

  const S = {
    input: { width: "100%", background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", color: C.text, fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: "inherit", transition: "border-color 0.2s" },
    label: { fontSize: 11, fontWeight: 700, color: C.muted, letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 6 },
    card: { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 22, marginBottom: 16 },
    btn: { width: "100%", padding: "13px", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, border: "none", borderRadius: 10, color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer", fontFamily: "inherit" },
    btnSm: { background: "transparent", border: `1px solid ${C.border}`, borderRadius: 8, padding: "6px 14px", color: C.muted, cursor: "pointer", fontSize: 12, fontFamily: "inherit" },
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes slideDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        input:focus, select:focus, textarea:focus { border-color: ${C.accent} !important; box-shadow: 0 0 0 2px ${C.accent}20; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-thumb { background: ${C.border}; border-radius: 2px; }
      `}</style>

      <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 16px" }}>

        {/* ── Header ── */}
        <div style={{ textAlign: "center", marginBottom: 36, animation: "fadeUp 0.5s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 20, padding: "4px 14px", marginBottom: 18 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.accent, animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 11, color: C.muted }}>Stellar Testnet</span>
          </div>
          <h1 style={{ fontSize: 40, fontWeight: 900, marginBottom: 8, background: `linear-gradient(135deg,${C.accent},${C.accent2},${C.purple})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", lineHeight: 1.1 }}>
            ⚡ Stellar Split
          </h1>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 18 }}>Split bills trustlessly on the Stellar blockchain</p>

          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.surface, border: `1px solid ${isDeployed ? C.accent + "50" : C.border}`, borderRadius: 20, padding: "5px 14px" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: isDeployed ? C.accent : C.muted }} />
            <span style={{ fontSize: 11, fontFamily: "monospace", color: C.muted }}>Contract: {CONTRACT_ID.slice(0, 14)}…</span>
            <a href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: C.accent2, textDecoration: "none" }}>↗</a>
          </div>
        </div>

        {/* ── Wallet Card ── */}
        <div style={{ ...S.card, animation: "fadeUp 0.4s ease" }}>
          {!wallet ? (
            <>
              <p style={S.label}>Connect Wallet</p>
              <p style={{ fontSize: 13, color: C.muted, marginBottom: 16, lineHeight: 1.7 }}>
                Choose from <strong style={{ color: C.text }}>3 supported wallets</strong> to start splitting bills on-chain.
              </p>

              {error && <ErrorBanner error={error} onDismiss={() => setError(null)} />}

              {showModal ? (
                <div style={{ animation: "slideDown 0.25s ease" }}>
                  {WALLETS.map((w) => (
                    <button key={w.id} onClick={() => handleConnectWith(w)}
                      disabled={!!connecting}
                      style={{
                        display: "flex", alignItems: "center", gap: 14, width: "100%", textAlign: "left",
                        background: connecting === w.id ? C.accent + "15" : C.bg,
                        border: `1px solid ${connecting === w.id ? C.accent : C.border}`,
                        borderRadius: 12, padding: "13px 16px", marginBottom: 10,
                        cursor: connecting ? "not-allowed" : "pointer",
                        fontFamily: "inherit", transition: "all 0.2s",
                      }}
                      onMouseEnter={e => { if (!connecting) e.currentTarget.style.borderColor = C.accent; }}
                      onMouseLeave={e => { if (connecting !== w.id) e.currentTarget.style.borderColor = C.border; }}
                    >
                      <span style={{ fontSize: 28 }}>{w.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <p style={{ margin: 0, fontWeight: 700, color: C.text, fontSize: 14 }}>{w.name}</p>
                          <span style={{ fontSize: 10, background: C.accent + "20", color: C.accent, padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>{w.badge}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 12, color: C.muted, marginTop: 2 }}>{w.desc}</p>
                      </div>
                      {connecting === w.id ? (
                        <span style={{ width: 18, height: 18, border: `2px solid ${C.accent}`, borderTop: "2px solid transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                      ) : (
                        <span style={{ color: C.muted, fontSize: 16 }}>›</span>
                      )}
                    </button>
                  ))}
                  <button onClick={() => setShowModal(false)} style={{ ...S.btnSm, width: "100%", marginTop: 4 }}>✕ Cancel</button>
                </div>
              ) : (
                <button onClick={() => setShowModal(true)} style={S.btn}>
                  🔗 Connect Wallet
                </button>
              )}

              <p style={{ fontSize: 11, color: C.dim, textAlign: "center", marginTop: 12 }}>
                Freighter · Albedo · xBull · Stellar Testnet
              </p>
            </>
          ) : (
            <div style={{ animation: "fadeUp 0.3s ease" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg,${C.accent},${C.accent2})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>
                    {walletMeta?.icon || "👛"}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: 10, color: C.muted, fontWeight: 700, letterSpacing: "0.06em" }}>
                      {(walletMeta?.name || "WALLET").toUpperCase()} · TESTNET
                    </p>
                    <p style={{ margin: 0, fontSize: 13, fontFamily: "monospace", color: C.text }}>{wallet.slice(0, 10)}…{wallet.slice(-8)}</p>
                  </div>
                </div>
                <button onClick={handleDisconnect} style={S.btnSm}>Disconnect</button>
              </div>
              {balance !== null && (
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: "8px 14px" }}>
                  <span style={{ fontSize: 13, color: C.muted }}>Balance</span>
                  <span style={{ fontFamily: "monospace", fontWeight: 700, color: balance < 1 ? "#fbbf24" : C.accent }}>
                    {balance.toFixed(4)} XLM
                  </span>
                  {balance < 1 && (
                    <a href={`https://friendbot.stellar.org/?addr=${wallet}`} target="_blank" rel="noopener noreferrer"
                      style={{ marginLeft: "auto", fontSize: 11, color: "#fbbf24", textDecoration: "none" }}>
                      Get free XLM →
                    </a>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Connected Content ── */}
        {wallet && (
          <>
            <ErrorBanner error={error} onDismiss={() => setError(null)} />

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {tabs.map((tab) => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex: 1, padding: "9px 4px",
                  border: `1px solid ${tab.id === activeTab ? C.accent + "40" : "transparent"}`,
                  borderRadius: 8,
                  background: tab.id === activeTab ? C.accent + "15" : "transparent",
                  color: tab.id === activeTab ? C.text : C.muted,
                  cursor: "pointer", fontWeight: 700, fontSize: 12, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  transition: "all 0.2s",
                }}>
                  {tab.icon} {tab.label}
                  {tab.badge > 0 && (
                    <span style={{ fontSize: 10, background: tab.id === "events" ? C.accent : C.dim, color: "#fff", borderRadius: 10, padding: "1px 6px", fontWeight: 700 }}>
                      {tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Create Bill Tab */}
            {activeTab === "create" && (
              <div style={{ ...S.card, animation: "slideDown 0.3s ease" }}>
                <p style={S.label}>New Bill</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 14 }}>

                  <div>
                    <label style={S.label}>Description</label>
                    <input style={S.input} type="text" placeholder="e.g. Dinner at Barbeque Nation"
                      value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                  </div>

                  <div style={{ display: "flex", gap: 12 }}>
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
                    {parts.length > 0 && <p style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{parts.length} participant{parts.length !== 1 ? "s" : ""}</p>}
                  </div>

                  {sharePreview && (
                    <div style={{ background: C.accent + "10", border: `1px solid ${C.accent}30`, borderRadius: 12, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, color: C.muted }}>Each person pays:</span>
                      <span style={{ fontSize: 24, fontWeight: 900, color: C.accent, fontFamily: "monospace" }}>
                        {sharePreview} <span style={{ fontSize: 12, color: C.muted }}>{form.currency}</span>
                      </span>
                    </div>
                  )}

                  <button onClick={handleCreateBill}
                    disabled={txStatus === "pending" || !form.description || !form.totalAmount || !form.participants}
                    style={{ ...S.btn, opacity: (txStatus === "pending" || !form.description || !form.totalAmount || !form.participants) ? 0.45 : 1 }}>
                    {txStatus === "pending" ? (
                      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                        <span style={{ width: 14, height: 14, border: "2px solid #ffffff50", borderTop: "2px solid #fff", borderRadius: "50%", animation: "spin 0.8s linear infinite", display: "inline-block" }} />
                        Broadcasting…
                      </span>
                    ) : "🚀 Create Bill on Testnet"}
                  </button>
                  <TxBadge status={txStatus} hash={txHash} />
                </div>
              </div>
            )}

            {/* Bills Tab */}
            {activeTab === "bills" && (
              <div style={{ animation: "slideDown 0.3s ease" }}>
                {bills.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "60px 0", color: C.dim }}>
                    <div style={{ fontSize: 44, marginBottom: 12 }}>📋</div>
                    <p style={{ margin: 0 }}>No bills yet. Create one first!</p>
                  </div>
                ) : bills.map((b) => <BillCard key={b.id} bill={b} onMarkPaid={handleMarkPaid} wallet={wallet} />)}
              </div>
            )}

            {/* Events Tab */}
            {activeTab === "events" && (
              <div style={{ ...S.card, animation: "slideDown 0.3s ease" }}>
                <EventLog events={events} onClear={() => setEvents([])} />
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", marginTop: 40, paddingTop: 20, borderTop: `1px solid ${C.surface}` }}>
          <p style={{ fontSize: 11, color: C.dim, lineHeight: 1.9 }}>
            Stellar Testnet · StellarWalletsKit · Soroban
            <br />
            <a href={`https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`} target="_blank" rel="noopener noreferrer"
              style={{ color: C.dim, textDecoration: "none" }}>View Contract ↗</a>
          </p>
        </div>
      </div>
    </div>
  );
}
