import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { StorageManager } from "./storage";
import { analyseWithNous } from "./nous";
import { uploadToShelby, isShelbyMock } from "./shelby";
import { CONFIG } from "./config";

/* ── helpers ── */
const short = (addr) => {
  const s = String(addr ?? "");
  return s.slice(0, 6) + "…" + s.slice(-4);
};

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString("en-US", {
    weekday: "short", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit",
  });

/* ══════════════════════════════════════════════
   ConnectScreen
══════════════════════════════════════════════ */
function ConnectScreen({ onConnect, wallets }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const { connect } = useWallet();

  const handleConnect = async () => {
    setBusy(true);
    setErr("");
    try {
      const petra = wallets.find(w =>
        w.name?.toLowerCase().includes("petra")
      ) || wallets[0];

      if (!petra) {
        setErr("Petra wallet not found. Please install it from petra.app and refresh.");
        return;
      }
      await connect(petra.name);
    } catch (e) {
      setErr(e?.message || "Connection failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="connect-screen">
      <div className="connect-card">
        <span className="connect-icon">📓</span>
        <h1 className="connect-title">Your Private Journal</h1>
        <p className="connect-subtitle">
          Write freely. Notes stored on <strong>Shelby Protocol</strong>
          {" "}and analysed by <strong>Nous Hermes AI</strong>.
        </p>

        <ol className="connect-steps">
          <li><span className="step-num">1</span>
            Install <a href="https://petra.app" target="_blank" rel="noopener">Petra Wallet</a> and create an Aptos account.
          </li>
          <li><span className="step-num">2</span>
            Switch to <strong>Aptos Testnet</strong> inside Petra (Settings → Network).
          </li>
          <li><span className="step-num">3</span>
            Get free APT at <a href="https://aptos.dev/network/faucet" target="_blank" rel="noopener">aptos.dev/network/faucet</a>.
          </li>
          <li><span className="step-num">4</span>
            Get ShelbyUSD from <a href="https://discord.gg/shelbyprotocol" target="_blank" rel="noopener">Shelby Discord</a> #faucet.
          </li>
          <li><span className="step-num">5</span>
            Add API keys to <code>src/config.js</code> to go fully live.
          </li>
        </ol>

        {err && <p className="connect-error">{err}</p>}

        <button className="btn btn-primary" onClick={handleConnect} disabled={busy}>
          {busy ? "Connecting…" : "Connect Petra Wallet"}
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   NoteCard
══════════════════════════════════════════════ */
function NoteCard({ note, onAnalyse, onDelete }) {
  const [loading, setLoading] = useState(false);

  const handleAnalyse = async () => {
    setLoading(true);
    await onAnalyse(note.id);
    setLoading(false);
  };

  return (
    <article className="note-card">
      <header className="note-header">
        <span className="note-date">{fmtDate(note.date)}</span>
        {note.mock
          ? <span className="badge badge-mock">📦 Local</span>
          : <span className="badge badge-shelby">🌐 Shelby</span>}
      </header>

      <p className="note-text">{note.text}</p>

      <p className="note-blob">🗂 {note.blobName}</p>

      {note.analysis && (
        <div className="analysis-bubble">{note.analysis}</div>
      )}

      <footer className="note-actions">
        <button
          className="btn btn-nous"
          onClick={handleAnalyse}
          disabled={loading}
        >
          {loading ? "⏳ Thinking…" : "🧠 Ask Nous"}
        </button>
        <button className="btn btn-delete" onClick={() => onDelete(note.id)}>
          🗑 Delete
        </button>
      </footer>
    </article>
  );
}

/* ══════════════════════════════════════════════
   JournalScreen
══════════════════════════════════════════════ */
function JournalScreen({ address, onDisconnect, signAndSubmitTransaction }) {
  const [notes, setNotes] = useState([]);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    setNotes(StorageManager.load(address));
  }, [address]);

  const addToast = useCallback((msg, type = "info") => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  }, []);

  const handleSave = async () => {
    if (!text.trim()) return addToast("Please write something first.", "error");
    setSaving(true);
    try {
      const { blobName, mock } = await uploadToShelby(text.trim(), address, signAndSubmitTransaction);
      const entry = {
        id: StorageManager.genId(),
        blobName, text: text.trim(),
        date: Date.now(), mock, analysis: null,
      };
      const updated = StorageManager.addNote(address, entry);
      setNotes(updated);
      setText("");
      addToast(mock
        ? "Saved locally (mock mode). Add Shelby API key to store on-chain."
        : "Uploaded to Shelby! 🎉", "success");
    } catch (e) {
      addToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyse = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    try {
      const analysis = await analyseWithNous(note.text);
      const updated = StorageManager.updateNote(address, id, { analysis });
      setNotes(updated);
    } catch (e) {
      addToast(e.message, "error");
    }
  };

  const handleDelete = (id) => {
    if (!confirm("Delete this entry?")) return;
    const updated = StorageManager.deleteNote(address, id);
    setNotes(updated);
    addToast("Entry deleted.", "info");
  };

  const shelbyMock = isShelbyMock();
  const nousMock = !CONFIG.NOUS_API_KEY;

  return (
    <div className="journal-screen">
      {(shelbyMock || nousMock) && (
        <div className="mode-banner">
          ℹ️{" "}
          {[shelbyMock && "Shelby: mock mode", nousMock && "Nous: demo mode"]
            .filter(Boolean).join(" · ")}
          {" "}— add API keys in <code>src/config.js</code> to go live.
        </div>
      )}

      {/* Write */}
      <div className="write-section">
        <p className="section-label">New Entry</p>
        <textarea
          className="note-textarea"
          placeholder="How are you feeling today? Write anything…"
          value={text}
          onChange={e => setText(e.target.value)}
          maxLength={5000}
        />
        <div className="write-footer">
          <p className="write-hint">
            Stored on <strong>Shelby</strong> · analysed by <strong>Nous Hermes</strong>
          </p>
          <button
            className="btn btn-save"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Uploading…" : "Save & Upload to Shelby"}
          </button>
        </div>
      </div>

      {/* Notes list */}
      <div className="notes-section">
        <p className="section-label">
          Past Entries{" "}
          {notes.length > 0 && <span className="notes-count">({notes.length})</span>}
        </p>
        {notes.length === 0 ? (
          <div className="notes-empty">
            <span className="empty-icon">🌿</span>
            <p>No entries yet. Write your first thought above!</p>
          </div>
        ) : (
          <div className="notes-list">
            {notes.map(n => (
              <NoteCard
                key={n.id}
                note={n}
                onAnalyse={handleAnalyse}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════
   App root
══════════════════════════════════════════════ */
export default function App() {
  const { account, connected, disconnect, wallets, signAndSubmitTransaction } = useWallet();

  const address = account?.address?.toString?.() ?? account?.address ?? null;

  return (
    <div className="page-wrapper">
      <header className="app-header">
        <div className="brand">
          <span className="brand-title">Digital Journal</span>
          <span className="brand-sub">Emotion Companion · Shelby · Nous</span>
        </div>
        {connected && address && (
          <div className="wallet-badge">
            <span className="wallet-dot" />
            <span className="wallet-addr">{short(address)}</span>
            <button className="btn-disconnect" onClick={disconnect}>✕</button>
          </div>
        )}
      </header>

      {connected && address ? (
        <JournalScreen address={address} onDisconnect={disconnect} signAndSubmitTransaction={signAndSubmitTransaction} />
      ) : (
        <ConnectScreen wallets={wallets ?? []} />
      )}

      <footer className="app-footer">
        Built on{" "}
        <a href="https://shelby.xyz" target="_blank" rel="noopener">Shelby Protocol</a>
        {" · "}powered by{" "}
        <a href="https://nousresearch.com" target="_blank" rel="noopener">Nous Hermes</a>
        {" · "}wallet by{" "}
        <a href="https://petra.app" target="_blank" rel="noopener">Petra</a>
        <br />Open source · no tracking · your words, your keys
      </footer>
    </div>
  );
}
