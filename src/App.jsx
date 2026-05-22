// ─────────────────────────────────────────────────────────────────────────────
// GNSHI SMART ATTENDANCE AND MONITORING SYSTEM
// Gigaquit National School of Home Industries
// Production-ready • Firebase-wired • Tailwind CSS Design Overhaul
// ─────────────────────────────────────────────────────────────────────────────
import { Scanner } from "@yudiel/react-qr-scanner";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { auth, db } from "./firebase";
import { Toaster, toast as hotToast } from "react-hot-toast";
import {
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, getAuth,
} from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, onSnapshot, query, where,
  serverTimestamp, writeBatch, documentId,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { QRCodeSVG } from "qrcode.react";

// ─── GOOGLE FONT INJECTION ────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800;1,9..40,400&family=Syne:wght@600;700;800&display=swap";
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

// ─── TAILWIND CDN ─────────────────────────────────────────────────────────────
const twScript = document.createElement("script");
twScript.src = "https://cdn.tailwindcss.com";
document.head.appendChild(twScript);

// ─── TAILWIND CONFIG ─────────────────────────────────────────────────────────
const twConfig = document.createElement("script");
twConfig.textContent = `
  tailwind.config = {
    theme: {
      extend: {
        fontFamily: {
          sans: ["'DM Sans'", "system-ui", "sans-serif"],
          display: ["'Syne'", "sans-serif"],
        },
        colors: {
          maroon: {
            DEFAULT: "#7B1113",
            dark: "#5A0C0E",
            light: "#9B1416",
            fade: "#F9ECEC",
            50: "#FDF2F2",
          },
          gold: {
            DEFAULT: "#F5C518",
            dark: "#D4A800",
            light: "#FDD73A",
            fade: "#FFFAE8",
          },
          brand: {
            blue: "#1A4E8C",
            bluefade: "#EBF2FB",
          },
        },
        animation: {
          "fade-up": "fadeUp 0.3s ease forwards",
          "spin-slow": "spin 0.8s linear infinite",
          "pulse-gold": "pulseGold 2s infinite",
        },
        keyframes: {
          fadeUp: {
            "0%": { opacity: "0", transform: "translateY(12px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          pulseGold: {
            "0%": { boxShadow: "0 0 0 0 rgba(245,197,24,0.4)" },
            "70%": { boxShadow: "0 0 0 8px rgba(245,197,24,0)" },
            "100%": { boxShadow: "0 0 0 0 rgba(245,197,24,0)" },
          },
        },
        boxShadow: {
          card: "0 1px 12px rgba(0,0,0,0.06)",
          modal: "0 24px 80px rgba(0,0,0,0.28)",
          btn: "0 4px 14px rgba(123,17,19,0.35)",
          "btn-gold": "0 4px 14px rgba(245,197,24,0.45)",
        },
      },
    },
  };
`;
twScript.onload = () => {
  document.head.appendChild(twConfig);
};

// ─── GLOBAL INJECTED STYLES ───────────────────────────────────────────────────
const injectStyles = () => {
  const style = document.createElement("style");
  style.textContent = `
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { font-family: 'DM Sans', system-ui, sans-serif; background: #F8F7F5; }

    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(123,17,19,0.25); border-radius: 99px; }
    ::-webkit-scrollbar-thumb:hover { background: #7B1113; }

    .hide-scrollbar { scrollbar-width: none; -ms-overflow-style: none; }
    .hide-scrollbar::-webkit-scrollbar { display: none; }

    .font-display { font-family: 'Syne', sans-serif; }

    /* Accordion */
    .accordion-content { overflow: hidden; transition: max-height 0.25s ease, opacity 0.2s ease; }
    .accordion-content.closed { max-height: 0; opacity: 0; }
    .accordion-content.open { max-height: 600px; opacity: 1; }

    /* Float label */
    .float-wrap { position: relative; }
      .float-wrap input, .float-wrap select, .float-wrap textarea {
        width: 100%; padding: 26px 16px 8px 16px;
        border: 1.5px solid #E2E8F0; border-radius: 10px;
        font-size: 14px; font-family: 'DM Sans', sans-serif;
        background: #fff; outline: none;
        transition: border-color 0.2s, box-shadow 0.2s;
        color: #1a1a1a; line-height: 1.4;
      }
      .float-wrap input:focus, .float-wrap select:focus, .float-wrap textarea:focus {
        border-color: #7B1113; box-shadow: 0 0 0 3px rgba(123,17,19,0.10);
      }
      .float-wrap label {
        position: absolute; left: 16px;
        top: 50%; transform: translateY(-50%);
        font-size: 14px; color: #94A3B8; pointer-events: none;
        transition: top 0.18s cubic-bezier(.4,0,.2,1),
                    transform 0.18s cubic-bezier(.4,0,.2,1),
                    font-size 0.18s cubic-bezier(.4,0,.2,1),
                    color 0.18s cubic-bezier(.4,0,.2,1);
        font-family: 'DM Sans', sans-serif; font-weight: 500;
        white-space: nowrap; z-index: 1;
      }
      .float-wrap textarea ~ label { top: 18px; transform: none; }
      .float-wrap input:focus ~ label,
      .float-wrap input:not(:placeholder-shown) ~ label,
      .float-wrap select:focus ~ label,
      .float-wrap select:valid ~ label,
      .float-wrap textarea:focus ~ label,
      .float-wrap textarea:not(:placeholder-shown) ~ label {
        top: 8px; transform: none; font-size: 10px;
        font-weight: 800; letter-spacing: 0.07em;
        text-transform: uppercase; color: #7B1113;
      }
      .float-wrap select { appearance: none; cursor: pointer; }

   @media print {
  body * { visibility: hidden; }
  #qr-print-area,
  #qr-print-area * { visibility: visible; }
  #qr-print-header,
  #qr-print-header * { visibility: visible; }

  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  /*
   * Outer centering shell — positions the whole block in the
   * horizontal centre of the A4 page.
   */
  #qr-print-shell {
    position: fixed !important;
    top:    0 !important;
    left:   0 !important;
    width:  210mm !important;
    margin: 0 auto !important;
    padding: 8mm !important;
    box-sizing: border-box !important;
  }

  /* School header shown only in print */
  #qr-print-header {
    display: block !important;
    text-align: center !important;
    margin-bottom: 6mm !important;
  }

  /* 4-column QR grid */
  #qr-print-area {
    display: grid !important;
    grid-template-columns: repeat(4, 1fr) !important;
    gap: 4mm !important;
    justify-items: center !important;
    width: 100% !important;
  }
}

    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 0.8s linear infinite; }
    .fade-up { animation: fadeUp 0.3s ease forwards; }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(12px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `;
  document.head.appendChild(style);
};
injectStyles();

// ─── BRAND CONSTANTS (kept for computed values only) ─────────────────────────
const B = {
  maroon: "#7B1113", maroonDark: "#5A0C0E", maroonLight: "#9B1416",
  maroonFade: "#F9ECEC", maroon10: "#7B111310",
  gold: "#F5C518", goldDark: "#D4A800", goldLight: "#FDD73A", goldFade: "#FFFAE8",
  blue: "#1A4E8C", blueFade: "#EBF2FB",
  white: "#FFFFFF", offWhite: "#F8F7F5", slate: "#64748B", slateLight: "#F1F5F9",
  border: "#E8ECF0",
};

const SY_OPTIONS = ["2023-2024", "2024-2025", "2025-2026"];
const QUARTER_OPTIONS = ["Q1", "Q2", "Q3", "Q4"];
const TRACKS = ["Academic", "TVL"];
const STRANDS = {
  Academic: ["STEM", "HUMSS", "ABM", "GAS"],
  TVL: ["Agri-crops", "Food Processing", "Bread & Pastry", "Electrical", "Hairdressing", "CSS"],
};
const GRADE_LEVELS = ["7", "8", "9", "10", "11", "12"];
const TODAY = new Date();
const fmt = (d) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

// ─── SECONDARY FIREBASE APP ───────────────────────────────────────────────────
const secondaryApp = initializeApp(
  {
    apiKey: "AIzaSyA8_BY_XDf97Fv4rRdKD2OAX8AnD3VTjIA",
    authDomain: "gnshi-attendance.firebaseapp.com",
    projectId: "gnshi-attendance",
    storageBucket: "gnshi-attendance.firebasestorage.app",
    messagingSenderId: "1097687704477",
    appId: "1:1097687704477:web:b6e868eb423b8bca018574",
  },
  "secondary"
);
const secondaryAuth = getAuth(secondaryApp);

// ─── ICON SYSTEM ──────────────────────────────────────────────────────────────
const Ic = {
  chart: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
  scan: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h1v1h-1zM17 14h1v1h-1zM14 17h1v1h-1zM17 17h3v3h-3z"/></svg>,
  users: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  home: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9,22 9,12 15,12 15,22"/></svg>,
  file: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>,
  logout: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  print: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6,9 6,2 18,2 18,9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>,
  edit: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  plus: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>,
  download: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7,10 12,15 17,10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  upload: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17,8 12,3 7,8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>,
  menu: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>,
  close: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  settings: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  calendar: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  chevDown: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="6,9 12,15 18,9"/></svg>,
  eye: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  alert: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
  user: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  check: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>,
  trash: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
  book: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>,
  shield: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  chart: (p) => <svg {...p} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/></svg>,
};

// ─── TOAST ───────────────────────────────────────────────────────────────────

// ─── MODAL ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, size = "md" }) {
  const maxW = { sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-4"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className={`fade-up bg-white w-full ${maxW} max-h-[90vh] overflow-y-auto rounded-2xl shadow-modal`}>
        <div className="flex items-center justify-between px-6 py-4 rounded-t-2xl" style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})` }}>
          <span className="font-display text-white font-bold text-base">{title}</span>
          <button onClick={onClose} className="bg-white/15 hover:bg-white/25 text-white border-0 rounded-lg p-1.5 cursor-pointer flex items-center transition-colors">
            <Ic.close className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── FLOAT INPUT ──────────────────────────────────────────────────────────────
function FloatInput({ label, id, type = "text", value, onChange, required, placeholder = " ", rows }) {
  const [showPwd, setShowPwd] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && showPwd ? "text" : type;
  return (
    <div className="float-wrap relative">
      {rows ? (
        <textarea
          id={id} rows={rows} value={value} onChange={onChange}
          required={required} placeholder={placeholder}
        />
      ) : (
        <input
          id={id} type={inputType} value={value} onChange={onChange}
          required={required} placeholder={placeholder}
          style={{ paddingRight: isPassword ? 48 : 16 }}
        />
      )}
      <label htmlFor={id}>{label}{required && " *"}</label>
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPwd(p => !p)}
          style={{ zIndex: 2 }}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-0 cursor-pointer text-slate-400 hover:text-slate-600 p-1 transition-colors"
        >
          {showPwd
            ? <Ic.eyeOff className="w-4 h-4" />
            : <Ic.eye className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}

// ─── FLOAT SELECT ─────────────────────────────────────────────────────────────
function FloatSelect({ label, id, value, onChange, required, children }) {
  return (
    <div className="float-wrap relative">
      <select id={id} value={value} onChange={onChange} required={required}>{children}</select>
      <label htmlFor={id} style={{
        top: value ? 8 : "50%", transform: value ? "none" : "translateY(-50%)",
        fontSize: value ? 10 : 14, fontWeight: value ? 700 : 500,
        letterSpacing: value ? "0.06em" : "normal",
        textTransform: value ? "uppercase" : "none",
        color: value ? B.maroon : "#94A3B8",
      }}>{label}{required && " *"}</label>
      <Ic.chevDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
    </div>
  );
}

// ─── BTN ──────────────────────────────────────────────────────────────────────
function Btn({ children, onClick, variant = "primary", size = "md", disabled, type = "button", style: extraStyle, className = "" }) {
  const sizes = {
    sm: "h-9 px-4 text-xs gap-1.5",
    md: "h-11 px-5 text-sm gap-2",
    lg: "h-12 px-6 text-sm gap-2",
  };
  const variants = {
    primary: "text-white border-0 shadow-btn hover:brightness-110",
    gold: "border-0 shadow-btn-gold hover:brightness-105",
    outline: "bg-white border border-maroon/30 hover:border-maroon/60 hover:bg-maroon-50",
    ghost: "bg-transparent border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50",
    danger: "bg-red-600 text-white border-0 hover:bg-red-700",
  };
  const variantStyle = variant === "primary"
    ? { background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})`, color: "white" }
    : variant === "gold"
    ? { background: `linear-gradient(135deg, ${B.gold}, ${B.goldDark})`, color: B.maroonDark }
    : variant === "outline"
    ? { color: B.maroon }
    : {};

  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`inline-flex items-center justify-center rounded-xl font-bold font-sans cursor-pointer transition-all active:scale-[0.97] whitespace-nowrap ${sizes[size]} ${variants[variant]} ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      style={{ ...variantStyle, ...extraStyle }}
    >
      {children}
    </button>
  );
}

// ─── STAT CARD ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent, icon, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-100 shadow-card transition-all ${onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : ""}`}
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
          <p className="font-display text-3xl font-bold mt-1 leading-none" style={{ color: B.maroonDark }}>{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1.5">{sub}</p>}
        </div>
        <div className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: accent + "18", color: accent }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ─── STATUS PILL ──────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = {
    Present: "bg-emerald-100 text-emerald-800",
    Late: "bg-yellow-100 text-yellow-800",
    "Very Late": "bg-orange-100 text-orange-800",
    Absent: "bg-red-100 text-red-800",
    "Official Business": "bg-blue-100 text-blue-800",
    Excused: "bg-purple-100 text-purple-800",
  };
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold whitespace-nowrap ${cfg[status] || "bg-slate-100 text-slate-500"}`}>
      {status}
    </span>
  );
}

// ─── BAR CHART ────────────────────────────────────────────────────────────────
function BarChart({ data, height = 180, onBarClick }) {
  if (!data || data.length === 0) return (
    <div className="flex items-center justify-center text-slate-400 text-sm" style={{ height }}> No data</div>
  );
  const max = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(48, Math.floor((600 - (data.length - 1) * 8) / data.length));
  const totalW = data.length * barW + (data.length - 1) * 8;
  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${Math.max(totalW + 20, 300)} ${height + 40}`} style={{ width: "100%", minWidth: 300 }}>
        {data.map((d, i) => {
          const barH = Math.max(4, (d.value / max) * height);
          const x = i * (barW + 8);
          const y = height - barH;
          const color = d.value >= 90 ? "#10B981" : d.value >= 80 ? "#F59E0B" : B.maroon;
          return (
            <g key={i} onClick={() => onBarClick && onBarClick(d)} style={{ cursor: onBarClick ? "pointer" : "default" }}>
              <rect x={x} y={y} width={barW} height={barH} rx={6} fill={color} opacity={0.85} />
              <text x={x + barW / 2} y={y - 5} textAnchor="middle" fontSize={10} fill={color} fontWeight="700">{d.value}%</text>
              <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize={9} fill={B.slate} fontWeight="600">{d.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ─── LOGIN SCREEN ─────────────────────────────────────────────────────────────
function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setLoading(true);
  try {
    await signInWithEmailAndPassword(auth, email, password);
    // Do NOT call onLogin() here.
    // The onAuthStateChanged listener in App.jsx will handle
    // the user state update and redirect automatically.
  } catch {
    setError("Invalid email or password. Please try again.");
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* ── Left panel ── */}
      <div
        className="relative flex flex-col justify-between p-10 md:w-[45%] min-h-[260px] md:min-h-screen overflow-hidden"
        style={{ background: `linear-gradient(155deg, ${B.maroonDark} 0%, ${B.maroon} 50%, #3D0608 100%)` }}
      >
        {/* Decorative layers */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute w-[420px] h-[420px] rounded-full -top-32 -right-24"
            style={{ background: `radial-gradient(circle, ${B.gold}1A, transparent 70%)` }} />
          <div className="absolute w-[320px] h-[320px] rounded-full -bottom-20 -left-16"
            style={{ background: `radial-gradient(circle, ${B.blue}20, transparent 70%)` }} />
          <div className="absolute inset-0"
            style={{ backgroundImage: "radial-gradient(circle at 20px 20px, rgba(255,255,255,0.025) 1px, transparent 0)", backgroundSize: "36px 36px" }} />
          <svg className="absolute top-0 right-0 w-64 h-64 opacity-[0.08]" viewBox="0 0 256 256">
            <line x1="256" y1="0" x2="0" y2="256" stroke={B.gold} strokeWidth="1.5" />
            <line x1="256" y1="48" x2="48" y2="256" stroke={B.gold} strokeWidth="1" />
            <line x1="256" y1="96" x2="96" y2="256" stroke={B.gold} strokeWidth="0.5" />
          </svg>
        </div>

        {/* Brand mark */}
        <div className="relative z-10">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-6"
            style={{ background: `linear-gradient(135deg, ${B.gold}, ${B.goldDark})`, boxShadow: `0 8px 28px ${B.gold}55` }}
          >🏫</div>
          <h1 className="font-display text-4xl font-bold text-white tracking-tight leading-none">GNSHI</h1>
          <p className="text-xs font-bold tracking-[0.22em] uppercase mt-2" style={{ color: B.gold }}>
            Smart Attendance &amp; Monitoring
          </p>
          <p className="text-white/35 text-xs mt-1 leading-relaxed max-w-[220px]">
            Gigaquit National School of Home Industries
          </p>
        </div>

        {/* Bottom callout */}
        <div className="relative z-10 hidden md:block">
          <div className="border-l-2 pl-4" style={{ borderColor: `${B.gold}60` }}>
            <p className="text-white/50 text-xs leading-relaxed">
              Secure, real-time attendance tracking<br />
              powered by Firebase &amp; QR technology.
            </p>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50">
        <div className="w-full max-w-sm fade-up">
          <div className="bg-white rounded-3xl p-8 shadow-modal border border-slate-100">
            <div className="mb-7">
              <h2 className="font-display text-2xl font-bold tracking-tight" style={{ color: B.maroon }}>
                Welcome back
              </h2>
              <p className="text-slate-400 text-sm mt-1">Sign in to your account to continue.</p>
            </div>

            {error && (
              <div
                className="flex items-start gap-3 rounded-xl px-4 py-3 mb-5 border-l-4"
                style={{ backgroundColor: B.maroonFade, borderLeftColor: B.maroon }}
              >
                <Ic.alert className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: B.maroon }} />
                <span className="text-sm font-medium" style={{ color: B.maroon }}>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <FloatInput
                label="Email Address" id="login-email" type="email"
                value={email} onChange={e => setEmail(e.target.value)} required
              />
              <FloatInput
                label="Password" id="login-pwd" type="password"
                value={password} onChange={e => setPassword(e.target.value)} required
              />
              <Btn
                type="submit" disabled={loading} size="lg"
                className="w-full mt-1"
                style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})`, color: "white" }}
              >
                {loading ? "Signing in…" : "Sign In →"}
              </Btn>
            </form>

            <p className="text-center text-xs text-slate-400 mt-6">
              Contact your ICT Coordinator for account issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SIDEBAR ──────────────────────────────────────────────────────────────────
function Sidebar({ user, classes, selectedClassId, setSelectedClassId, activeTab, setActiveTab, sideOpen, setSideOpen, onLogout, calendarEvents = [], myAssignments = [] }) {
  const [expandedGrades, setExpandedGrades] = useState({});
  const todayStr  = fmt(TODAY);
  const todayEvts = calendarEvents.filter(e => e.date === todayStr);
  const todayEvent = todayEvts.find(e => e.type === "event");

  const gradeMap = useMemo(() => {
    const map = {};
    classes.forEach(c => {
      if (!map[c.grade]) map[c.grade] = [];
      map[c.grade].push(c);
    });
    return map;
  }, [classes]);

  const toggleGrade = (g) => setExpandedGrades(prev => ({ ...prev, [g]: !prev[g] }));

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: Ic.home },
    ...(user.role === "admin" ? [
      { id: "masterlist",  label: "Master List",        icon: Ic.users },
      { id: "staff",       label: "Staff Accounts",     icon: Ic.users },
      { id: "qr",          label: "QR Codes",           icon: Ic.scan },
      { id: "subjects",    label: "Subject Assignment",  icon: Ic.book },
      { id: "settings",    label: "School Settings",    icon: Ic.settings },
    ] : [
      { id: "scan",        label: "Scan Attendance",    icon: Ic.scan },
    ]),
    { id: "students",  label: "Student Records",  icon: Ic.book },
    { id: "sf2",       label: "SF2 Report",       icon: Ic.file },
    { id: "calendar",  label: "Calendar",         icon: Ic.calendar },
  ];

  return (
    <aside
      className="flex-shrink-0 h-screen flex flex-col overflow-hidden relative z-50 transition-all duration-300"
      style={{
        width: sideOpen ? 252 : 64,
        background: `linear-gradient(180deg, ${B.maroonDark} 0%, ${B.maroon} 55%, #4A0B0D 100%)`,
        boxShadow: "4px 0 24px rgba(0,0,0,0.15)",
      }}
    >
      {/* Logo row */}
      <div className={`flex items-center gap-3 border-b border-white/8 min-h-[68px] flex-shrink-0 ${sideOpen ? "px-4 py-4" : "px-3.5 py-4 justify-center"}`}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
          style={{ background: `linear-gradient(135deg, ${B.gold}, ${B.goldDark})`, boxShadow: `0 4px 12px ${B.gold}60` }}
        >🏫</div>
        {sideOpen && (
          <div className="overflow-hidden">
            <p className="font-display text-white font-bold text-sm leading-tight whitespace-nowrap">GNSHI Smart</p>
            <p className="text-xs font-bold tracking-[0.15em] uppercase whitespace-nowrap" style={{ color: B.gold, fontSize: 9 }}>Attendance System</p>
          </div>
        )}
      </div>

      {/* User chip */}
      {sideOpen && (
        <div className="px-3 py-3 flex-shrink-0">
          <div className="bg-white/8 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/40">Signed in as</p>
            <p className="text-white font-semibold text-sm mt-0.5 truncate">{user.name}</p>
            <span
              className="inline-block mt-1 text-[9px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full"
              style={{ background: `${B.gold}30`, color: B.gold, border: `1px solid ${B.gold}50` }}
            >{user.role}</span>
          </div>
        </div>
      )}

      {/* Today's event banner */}
      {sideOpen && todayEvent && user.role !== "admin" && (
        <div className="px-3 pb-2 flex-shrink-0">
          <button
            onClick={() => {
              if (classes.length > 0) {
                setSelectedClassId(classes[0].id);
                setActiveTab("scan");
              }
            }}
            className="w-full text-left rounded-xl px-3 py-2.5 transition-all"
            style={{ background: `${B.gold}22`, border: `1px solid ${B.gold}50` }}
          >
            <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: B.goldDark }}>Today's Event</p>
            <p className="text-xs font-bold mt-0.5 leading-tight" style={{ color: B.gold }}>{todayEvent.name}</p>
            {todayEvent.timeSlot && (
              <p className="text-[9px] capitalize mt-0.5" style={{ color: `${B.gold}CC` }}>
                {todayEvent.timeSlot} session → tap to scan
              </p>
            )}
          </button>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-2 space-y-0.5 hide-scrollbar">
        {navItems.map(({ id, label, icon: Icon }) => (
          <SideBtn key={id} icon={Icon} label={sideOpen ? label : ""} active={activeTab === id} onClick={() => setActiveTab(id)} />
        ))}

        {/* ── Subject Teacher: My Subjects ── */}
        {user.role !== "admin" && myAssignments.length > 0 && sideOpen && (
          <div className="mt-3 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-[9px] font-bold uppercase tracking-widest px-3 mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
              My Subjects
            </p>
            {myAssignments.map(assignment => {
              const tabId = `subject_${assignment.id}`;
              const isActive = activeTab === tabId;
              return (
                <button
                  key={assignment.id}
                  onClick={() => {
                    setActiveTab(tabId);
                    setSelectedClassId(assignment.classId);
                  }}
                  className="w-full flex items-start gap-2.5 rounded-xl border-0 cursor-pointer transition-all text-left px-3 py-2.5 mb-0.5"
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${B.gold}, ${B.goldDark})` : "rgba(255,255,255,0.06)",
                    color: isActive ? B.maroonDark : "rgba(255,255,255,0.75)",
                  }}
                >
                  <Ic.book
                    className="w-4 h-4 flex-shrink-0 mt-0.5"
                    style={{ color: isActive ? B.maroonDark : "rgba(255,255,255,0.5)" }}
                  />
                  <div className="overflow-hidden min-w-0">
                    <p className={`text-xs font-bold truncate leading-tight ${isActive ? "" : ""}`}>
                      {assignment.subjectName}
                    </p>
                    <p
                      className="text-[10px] font-medium truncate mt-0.5"
                      style={{ color: isActive ? `${B.maroonDark}99` : "rgba(255,255,255,0.45)" }}
                    >
                      Gr.{assignment.grade} — {assignment.section}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Subject Teacher: collapsed icon indicators */}
        {user.role !== "admin" && myAssignments.length > 0 && !sideOpen && (
          <div className="mt-2 pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
            {myAssignments.map(assignment => {
              const tabId = `subject_${assignment.id}`;
              const isActive = activeTab === tabId;
              return (
                <button
                  key={assignment.id}
                  onClick={() => {
                    setActiveTab(tabId);
                    setSelectedClassId(assignment.classId);
                  }}
                  className="w-full flex items-center justify-center rounded-xl border-0 cursor-pointer transition-all py-2.5 mb-0.5"
                  style={{
                    background: isActive ? `linear-gradient(135deg, ${B.gold}, ${B.goldDark})` : "transparent",
                    color: isActive ? B.maroonDark : "rgba(255,255,255,0.55)",
                  }}
                  title={`${assignment.subjectName} — Gr.${assignment.grade} ${assignment.section}`}
                >
                  <Ic.book className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        )}

        {/* Grade accordions (adviser only — not shown for pure subject teachers with no classes) */}
        {Object.keys(gradeMap).sort((a, b) => parseInt(a) - parseInt(b)).map(grade => (
          <div key={grade}>
            <button
              onClick={() => toggleGrade(grade)}
              className="w-full flex items-center gap-2.5 rounded-xl border-0 cursor-pointer transition-all text-white/60 hover:text-white/90 hover:bg-white/6"
              style={{ padding: sideOpen ? "9px 12px" : "9px 8px", background: "transparent" }}
            >
              <span className="text-sm flex-shrink-0">📚</span>
              {sideOpen && (
                <>
                  <span className="flex-1 text-left text-sm font-semibold">Grade {grade}</span>
                  <Ic.chevDown
                    className="w-3.5 h-3.5 transition-transform duration-200"
                    style={{ transform: expandedGrades[grade] ? "rotate(180deg)" : "rotate(0deg)" }}
                  />
                </>
              )}
            </button>

            {sideOpen && (
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  expandedGrades[grade]
                    ? "grid-rows-[1fr] opacity-100 mt-1"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden flex flex-col gap-0.5">
                  {gradeMap[grade].map(cls => (
                    <button
                      key={cls.id}
                      onClick={() => { setSelectedClassId(cls.id); setActiveTab("scan"); }}
                      className="w-full flex items-center gap-2 rounded-lg border-0 cursor-pointer transition-all"
                      style={{
                        padding: "7px 12px 7px 28px",
                        background: selectedClassId === cls.id ? `${B.gold}22` : "transparent",
                        borderLeft: selectedClassId === cls.id ? `3px solid ${B.gold}` : "3px solid transparent",
                        marginLeft: 4,
                      }}
                    >
                      <span
                        className="text-xs font-semibold text-left"
                        style={{ color: selectedClassId === cls.id ? B.gold : "rgba(255,255,255,0.55)" }}
                      >{cls.section}</span>
                      {cls.track && (
                        <span
                          className="text-[9px] rounded px-1.5 py-0.5"
                          style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}
                        >{cls.strand || cls.track}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-2 py-2 border-t border-white/8 space-y-0.5 flex-shrink-0">
        <SideBtn icon={Ic.menu} label={sideOpen ? "Collapse" : ""} active={false} onClick={() => setSideOpen(o => !o)} />
        <SideBtn icon={Ic.logout} label={sideOpen ? "Sign Out" : ""} active={false} onClick={onLogout} />
      </div>
    </aside>
  );
}

function SideBtn({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 rounded-xl border-0 cursor-pointer transition-all"
      style={{
        padding: "9px 12px",
        background: active ? `linear-gradient(135deg, ${B.gold}, ${B.goldDark})` : "transparent",
        color: active ? B.maroonDark : "rgba(255,255,255,0.65)",
      }}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      {label && <span className="flex-1 text-left text-sm font-semibold whitespace-nowrap">{label}</span>}
    </button>
  );
}

// ─── TOP HEADER ───────────────────────────────────────────────────────────────
function TopHeader({ user, activeTab, selectedClass, suspended, sy, setSy, quarter, setQuarter, onUpdateSyQuarter }) {
  const tabTitles = {
    dashboard: "Dashboard", scan: "Scan Attendance", sf2: "SF2 Report",
    students: "Student Records", qr: "QR Code Generator", settings: "School Settings",
    calendar: "Academic Calendar", staff: "Staff Account Manager",
  };

  return (
    <header className="bg-white border-b border-slate-100 px-6 h-16 flex items-center justify-between gap-4 flex-shrink-0 shadow-sm relative z-10">
      <div>
        <h1 className="font-display text-lg font-bold tracking-tight" style={{ color: B.maroonDark }}>
          {tabTitles[activeTab] || "GNSHI SAMS"}
          {(activeTab === "scan" || activeTab === "sf2" || activeTab === "students") && selectedClass && (
            <span className="ml-2 text-xs font-semibold text-slate-400">Grade {selectedClass.grade} — {selectedClass.section}</span>
          )}
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {TODAY.toLocaleDateString("en-PH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          {suspended && <span className="ml-2 font-bold" style={{ color: B.maroon }}>🚨 SUSPENSION ACTIVE</span>}
        </p>
      </div>

      <div className="flex items-center gap-2.5">
        {/* SY dropdown */}
        <div className="relative">
          <select value={sy} onChange={e => { setSy(e.target.value); onUpdateSyQuarter(e.target.value, quarter); }}
            className="appearance-none h-9 pl-3 pr-7 rounded-lg text-xs font-bold outline-none cursor-pointer border border-slate-200 bg-slate-50 text-slate-700">
            {SY_OPTIONS.map(s => <option key={s}>SY {s}</option>)}
          </select>
          <Ic.chevDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>

        {/* Quarter dropdown */}
        <div className="relative">
          <select value={quarter} onChange={e => { setQuarter(e.target.value); onUpdateSyQuarter(sy, e.target.value); }}
            className="appearance-none h-9 pl-3 pr-7 rounded-lg text-xs font-bold outline-none cursor-pointer"
            style={{ background: `${B.gold}18`, border: `1.5px solid ${B.gold}55`, color: B.goldDark }}>
            {QUARTER_OPTIONS.map(q => <option key={q}>{q}</option>)}
          </select>
          <Ic.chevDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: B.goldDark }} />
        </div>

        {suspended && (
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: B.maroonFade, color: B.maroon, border: `1px solid ${B.maroon}25` }}>⛔ Suspended</span>
        )}

        {/* Avatar */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})`, boxShadow: `0 2px 8px ${B.maroon}40` }}>
          {user.name?.[0] || "?"}
        </div>
      </div>
    </header>
  );
}

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
function AdminDashboard({ allClasses, allStudents, attendance, suspended, setSuspended, showToast, sy, quarter }) {
  const todayStr = fmt(TODAY);

  const todayCounts = useMemo(() => {
    const c = { Present: 0, Late: 0, "Very Late": 0, Absent: 0 };
    Object.values(attendance).forEach(cr => {
      Object.values(cr[todayStr] || {}).forEach(s => { if (c[s] !== undefined) c[s]++; });
    });
    return c;
  }, [attendance]);

  const totalStudents = allStudents.length;
  const presentTotal = todayCounts.Present + todayCounts.Late + todayCounts["Very Late"];
  const rate = totalStudents > 0 ? Math.round((presentTotal / totalStudents) * 100) : 0;

  const sardo = useMemo(() => allStudents.filter(s => (s.absences || 0) >= 3).slice(0, 10), [allStudents]);

  const sectionBarData = useMemo(() =>
    allClasses.map(cl => {
      const recs = attendance[cl.id]?.[todayStr] || {};
      const vals = Object.values(recs);
      const pres = vals.filter(v => v !== "Absent").length;
      const tot = vals.length || 1;
      return { label: `${cl.section}`, value: Math.round((pres / tot) * 100) };
    }), [allClasses, attendance]);

  return (
    <div className="fade-up space-y-6">
      {suspended && (
        <div className="rounded-2xl px-5 py-4 flex items-center justify-between gap-4 flex-wrap" style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})` }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚨</span>
            <div>
              <p className="text-white font-semibold text-sm">Classes Suspended</p>
              <p className="text-white/55 text-xs mt-0.5">Scanning disabled school-wide. SF2 auto-adjusted.</p>
            </div>
          </div>
          <Btn variant="gold" size="sm" onClick={() => { setSuspended(false); showToast("Suspension lifted."); }}>Lift Suspension</Btn>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        <StatCard label="Total Present" value={presentTotal} sub={`of ${totalStudents} students`} accent="#10B981" icon={<Ic.check className="w-5 h-5" />} />
        <StatCard label="Absent Today" value={todayCounts.Absent} sub="needs follow-up" accent={B.maroon} icon={<Ic.alert className="w-5 h-5" />} />
        <StatCard label="Late / Very Late" value={todayCounts.Late + todayCounts["Very Late"]} sub="tardy today" accent="#F59E0B" icon={<Ic.calendar className="w-5 h-5" />} />
        <StatCard label="School-Wide Rate" value={`${rate}%`} sub={`${sy} | ${quarter}`} accent={B.blue} icon={<Ic.chart className="w-5 h-5" />} />
        <StatCard label="Total Sections" value={allClasses.length} sub="active classes" accent="#7C3AED" icon={<Ic.book className="w-5 h-5" />} />
        <StatCard label="SARDO Watch" value={sardo.length} sub="at-risk students" accent="#DC2626" icon={<Ic.shield className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Bar chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <p className="font-display text-sm font-bold mb-4" style={{ color: B.maroon }}>📊 Attendance Rate by Section — Today</p>
          <BarChart data={sectionBarData} />
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: B.maroon }}>Quick Actions</p>
            <div className="flex flex-col gap-2.5">
              <Btn variant="primary" size="sm" disabled={suspended} onClick={() => { setSuspended(true); showToast("⛔ Classes suspended."); }} className="w-full">
                🚨 Declare Suspension
              </Btn>
              <Btn variant="gold" size="sm" onClick={() => showToast("🎉 Event mode toggled!")} className="w-full">
                🎉 Event Mode
              </Btn>
            </div>
          </div>

          <div className="rounded-2xl p-5" style={{ background: `linear-gradient(135deg, ${B.maroonFade}, #FFF5F5)`, border: `1px solid ${B.maroon}15` }}>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: B.maroon }}>Active Period</p>
            <p className="font-display text-2xl font-bold mt-1" style={{ color: B.maroonDark }}>{sy}</p>
            <p className="text-sm font-semibold mt-1" style={{ color: B.gold }}>{quarter} — Gigaquit, SDN</p>
          </div>
        </div>
      </div>

      {/* SARDO Watchlist */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
        <div className="px-6 py-4 flex items-center justify-between flex-wrap gap-3" style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})` }}>
          <div>
            <p className="font-display text-white font-bold text-sm">🚨 SARDO Watchlist</p>
            <p className="text-white/50 text-xs mt-0.5">Students at Risk of Dropping Out — 3+ absences this month</p>
          </div>
          <span className="text-xs font-bold px-3 py-1 rounded-full" style={{ background: B.gold, color: B.maroonDark }}>{sardo.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["LRN", "Name", "Grade", "Section", "Absences", "Tardy", "Action"].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sardo.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-slate-400 text-sm">✅ No students at risk. Great attendance!</td></tr>
              ) : sardo.map((s, i) => (
                <tr key={s.id} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${i % 2 ? "bg-slate-50/40" : ""}`}>
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-400">{s.lrn}</td>
                  <td className="py-3.5 px-5 font-semibold" style={{ color: B.maroonDark }}>{s.name}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">Grade {s.grade}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">{s.section}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${(s.absences || 0) >= 5 ? "bg-red-100 text-maroon" : "bg-orange-100 text-orange-800"}`}>{s.absences || 0}d</span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">{s.tardyCount || 0}x</td>
                  <td className="py-3.5 px-5">
                    <Btn variant="ghost" size="sm" onClick={() => showToast(`Notifying parent of ${s.name}...`, "info")}>Notify Parent</Btn>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── ADVISER / SUBJECT DASHBOARD ──────────────────────────────────────────────
function AdviserDashboard({ user, classes, students, attendance, showToast, setActiveTab }) {
  const todayStr = fmt(TODAY);
  const myStudents = classes.flatMap(c => students[c.id] || []);

  const todayCounts = useMemo(() => {
    const c = { Present: 0, Late: 0, "Very Late": 0, Absent: 0 };
    classes.forEach(cl => {
      Object.values(attendance[cl.id]?.[todayStr] || {}).forEach(s => { if (c[s] !== undefined) c[s]++; });
    });
    return c;
  }, [attendance, classes]);

  const presentTotal = todayCounts.Present + todayCounts.Late + todayCounts["Very Late"];
  const rate = myStudents.length > 0 ? Math.round((presentTotal / myStudents.length) * 100) : 0;

  return (
    <div className="fade-up space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="My Sections" value={classes.length} accent={B.maroon} icon={<Ic.book className="w-5 h-5" />} />
        <StatCard label="Total Learners" value={myStudents.length} accent={B.blue} icon={<Ic.users className="w-5 h-5" />} />
        <StatCard label="Present Today" value={presentTotal} sub={`${rate}% rate`} accent="#10B981" icon={<Ic.check className="w-5 h-5" />} />
        <StatCard label="Absent Today" value={todayCounts.Absent} accent={B.maroon} icon={<Ic.alert className="w-5 h-5" />} />
      </div>

      <div className="rounded-2xl p-7 text-white" style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})` }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: B.gold }}>Quick Start</p>
        <p className="font-display text-2xl font-bold">Ready to take attendance?</p>
        <p className="text-white/55 text-sm mt-2">Select a section from the sidebar accordion and click Scan Attendance.</p>
        <Btn variant="gold" size="md" onClick={() => setActiveTab("scan")} className="mt-5">▶ Start Scanning →</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {classes.map(cl => {
          const recs = attendance[cl.id]?.[todayStr] || {};
          const vals = Object.values(recs);
          const pres = vals.filter(v => v !== "Absent").length;
          const total = (students[cl.id] || []).length;
          const r = total > 0 ? Math.round((pres / total) * 100) : 0;
          return (
            <div key={cl.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-semibold text-sm" style={{ color: B.maroonDark }}>Grade {cl.grade} — {cl.section}</p>
                  {cl.strand && <p className="text-xs text-slate-400 mt-0.5">{cl.strand}</p>}
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${r >= 90 ? "bg-emerald-100 text-emerald-800" : r >= 80 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-700"}`}>{r}%</span>
              </div>
              <div className="mt-4">
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full transition-all duration-700" style={{ width: `${r}%`, background: r >= 90 ? "#10B981" : r >= 80 ? "#F59E0B" : B.maroon }} />
                </div>
                <p className="text-xs text-slate-400 mt-2">{pres} present of {total} students</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SCANNER VIEW ─────────────────────────────────────────────────────────────
function ScannerView({ classInfo, classStudents, attendance, suspended, showToast, isArchived }) {
  const [input, setInput]               = useState("");
  const [scanned, setScanned]           = useState({});
  const [sessionActive, setSessionActive] = useState(false);
  const SESSION_KEY = `gnshi-session-type-${classInfo?.id}`;

  const [sessionType, setSessionType] = useState(
  () => localStorage.getItem(SESSION_KEY) || "Morning IN"
  );

  useEffect(() => {
  if (classInfo?.id) {
    localStorage.setItem(SESSION_KEY, sessionType);
  }
  }, [sessionType, classInfo?.id]);

  const [overrideModal, setOverrideModal] = useState(null);
  const [overrideReason, setOverrideReason] = useState("");
  const [facingMode, setFacingMode]     = useState("environment");

  // Custom schedule: cutoffs in minutes-from-midnight
  const [presentCutoff, setPresentCutoff] = useState(7 * 60 + 30); // 7:30
  const [lateCutoff, setLateCutoff]       = useState(7 * 60 + 40); // 7:40
  const [showSchedule, setShowSchedule]   = useState(false);

  const inputRef = useRef(null);
  const todayStr = fmt(TODAY);

  const getTimeStatus = useCallback(() => {
    const now  = new Date();
    const mins = now.getHours() * 60 + now.getMinutes();
    if (mins <= presentCutoff) return "Present";
    if (mins <= lateCutoff)    return "Late";
    return "Very Late";
  }, [presentCutoff, lateCutoff]);

  const handleScan = useCallback((rawData) => {
    let scannedText = "";
    if (typeof rawData === "string") {
      scannedText = rawData;
    } else if (Array.isArray(rawData) && rawData.length > 0) {
      scannedText = rawData[0].rawValue || rawData[0].text || String(rawData[0]);
    } else if (rawData && typeof rawData === "object") {
      scannedText = rawData.text || rawData.rawValue || JSON.stringify(rawData);
    }

    if (!scannedText) return;

    const match = scannedText.match(/\d{12}/);
    if (!match) {
      showToast(`Invalid QR Code scanned: ${scannedText}`, "error");
      return;
    }

    const lrn = match[0];
    const student = classStudents.find(s => String(s.lrn).trim() === lrn);

    if (!student) {
      showToast(`LRN "${lrn}" not found in this section.`, "error");
      setInput("");
      return;
    }

    if (scanned[lrn]) {
      showToast(`${student.name} already scanned!`, "error");
      setInput("");
      return;
    }

    const status = getTimeStatus();
    
    // 1. Update the UI counter immediately
    setScanned(prev => ({
      ...prev,
      [lrn]: { student, status, time: new Date().toLocaleTimeString() },
    }));

    // 2. SAVE TO FIREBASE IMMEDIATELY (Real-time sync)
    setDoc(
      doc(db, "attendance", classInfo.id, "records", todayStr),
      { [lrn]: status },
      { merge: true }
    ).catch(err => console.error("Database save error:", err));

    showToast(`✅ ${student.name} — ${status}`);
    setInput("");
    inputRef.current?.focus();
  }, [classStudents, scanned, getTimeStatus, showToast, classInfo.id, todayStr]);

  const endSession = async () => {
  const scannedLRNs = new Set(Object.keys(scanned));
  const newRec = {};
  Object.entries(scanned).forEach(([lrn, { status }]) => {
    newRec[lrn] = status;
  });
  classStudents
    .filter(s => !scannedLRNs.has(s.lrn))
    .forEach(s => { newRec[s.lrn] = "Absent"; });

  try {
    // Save attendance records
    await setDoc(
      doc(db, "attendance", classInfo.id, "records", todayStr),
      newRec,
      { merge: true }
    );

    // Also persist the session metadata so advisers can review what session was taken
    await setDoc(
      doc(db, "attendance", classInfo.id, "sessions", todayStr),
      {
        sessionType,
        presentCutoff,
        lateCutoff,
        scannedCount:  Object.keys(scanned).length,
        absentCount:   classStudents.length - scannedLRNs.size,
        completedAt:   serverTimestamp(),
      },
      { merge: true }
    );

    showToast(
      `Session ended. ${classStudents.length - scannedLRNs.size} marked absent.`
    );
  } catch {
    showToast("Failed to save attendance.", "error");
  }

  setSessionActive(false);
};

  const confirmOverride = async (newStatus) => {
    if (!overrideReason.trim()) { showToast("Reason is required.", "error"); return; }
    try {
      await updateDoc(doc(db, "attendance", classInfo.id, "records", todayStr), { [overrideModal.lrn]: newStatus });
    } catch {
      await setDoc(doc(db, "attendance", classInfo.id, "records", todayStr), { [overrideModal.lrn]: newStatus }, { merge: true });
    }
    showToast(`Override saved: ${overrideModal.name} → ${newStatus}`);
    setOverrideModal(null);
  };

  // Convert "HH:MM" string → minutes from midnight
  const hhmm = (mins) => {
    const h = String(Math.floor(mins / 60)).padStart(2, "0");
    const m = String(mins % 60).padStart(2, "0");
    return `${h}:${m}`;
  };
  const fromHhmm = (str) => {
    const [h, m] = str.split(":").map(Number);
    return h * 60 + m;
  };

  const todayRec = attendance[classInfo.id]?.[todayStr] || {};

  return (
    <div className="fade-up space-y-5">
      {/* Header */}
      <div className="rounded-2xl p-5 flex items-start justify-between flex-wrap gap-4"
        style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})` }}>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/45">Now Scanning</p>
          <h2 className="font-display text-2xl font-bold text-white mt-1">
            Grade {classInfo.grade} — {classInfo.section}
          </h2>
          <p className="text-sm font-semibold mt-1" style={{ color: B.gold }}>{sessionType}</p>
        </div>
        <div className="bg-white/10 rounded-xl px-5 py-3 text-center">
          <p className="font-display text-3xl font-bold text-white">{Object.keys(scanned).length}</p>
          <p className="text-[10px] text-white/55 font-bold mt-0.5">SCANNED</p>
        </div>
      </div>

      {suspended ? (
        <div className="rounded-2xl p-10 text-center border-2 border-dashed"
          style={{ background: B.maroonFade, borderColor: `${B.maroon}40` }}>
          <p className="text-4xl mb-3">🚨</p>
          <p className="font-semibold text-base" style={{ color: B.maroon }}>Classes Suspended</p>
          <p className="text-slate-400 text-sm mt-2">Scanning is disabled. Wait for the Admin to lift the suspension.</p>
        </div>

        ) : isArchived ? (
        <div className="rounded-2xl p-10 text-center border-2 border-dashed border-slate-200 bg-slate-50">
          <p className="text-4xl mb-3">🗂️</p>
          <p className="font-semibold text-base text-slate-600">Archived Period</p>
          <p className="text-slate-400 text-sm mt-2">
            Scanning is disabled for past school years. Switch to the current SY/Quarter to take attendance.
          </p>
        </div>
      ) : !sessionActive ? (

        // ── Pre-session setup ──
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-4">
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>Configure Session</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="float-wrap relative">
              <select value={sessionType} onChange={e => setSessionType(e.target.value)}>
                <option>Morning IN</option>
                <option>Afternoon IN</option>
                <option>Subject Period</option>
              </select>
              <label style={{ top: 8, transform: "none", fontSize: 10, fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase", color: B.maroon }}>
                Session Type
              </label>
            </div>
            <button
              onClick={() => setShowSchedule(s => !s)}
              className="h-12 px-4 rounded-xl border text-xs font-bold transition-all"
              style={{ borderColor: showSchedule ? B.maroon : B.border,
                color: showSchedule ? B.maroon : B.slate,
                background: showSchedule ? B.maroonFade : "white" }}
            >
              ⏰ {showSchedule ? "Hide" : "Edit"} Time Cutoffs
            </button>
          </div>

          {showSchedule && (
            <div className="rounded-xl p-4 bg-slate-50 border border-slate-200 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Present until
                </p>
                <input type="time" value={hhmm(presentCutoff)}
                  onChange={e => setPresentCutoff(fromHhmm(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-maroon" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">
                  Late until
                </p>
                <input type="time" value={hhmm(lateCutoff)}
                  onChange={e => setLateCutoff(fromHhmm(e.target.value))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg text-sm font-mono outline-none focus:border-maroon" />
              </div>
              <p className="col-span-2 text-xs text-slate-400">
                After {hhmm(lateCutoff)} → <strong>Very Late</strong>. These cutoffs apply only to this session.
              </p>
            </div>
          )}

          <Btn variant="primary"
            onClick={() => { setSessionActive(true); setScanned({}); setTimeout(() => inputRef.current?.focus(), 100); }}
            className="w-full h-12">
            ▶ Start Session
          </Btn>
        </div>
      ) : (
        // ── Active session ──
        <div className="space-y-3">
          <div className="rounded-2xl p-5 bg-emerald-50 border border-emerald-200 space-y-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
              📷 Point Camera at Student QR Card
            </p>

            {/* Camera scanner */}
            <div className="rounded-xl overflow-hidden border-2 border-emerald-300 relative"
              style={{ maxWidth: 360, margin: "0 auto" }}>
              <Scanner
                constraints={{ facingMode }}
                onScan={(result) => handleScan(result)}
                onResult={(text, result) => handleScan(text || result)}
                onError={(err) => {
                  if (err?.name !== "NotFoundException") {
                    console.error("Camera error:", err);
                  }
                }}
                styles={{ container: { borderRadius: 12 } }}
              />

              {/* Flip camera button */}
              <button
                onClick={() => setFacingMode(f => f === "environment" ? "user" : "environment")}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
              >
                🔄 Flip
              </button>
            </div>

            {/* Manual fallback */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-700 mb-2">
                Or enter LRN manually
              </p>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleScan(input)}
                  className="flex-1 border-2 border-emerald-300 rounded-xl px-4 py-3 text-sm font-mono outline-none focus:border-emerald-500 transition-all"
                  placeholder="Type LRN & press Enter"
                />
                <Btn onClick={() => handleScan(input)}
                  style={{ background: "#059669", color: "white", border: "none" }} size="md">
                  Go
                </Btn>
              </div>
            </div>

            <p className="text-xs text-emerald-700 font-semibold">
              {Object.keys(scanned).length} / {classStudents.length} scanned
            </p>
          </div>

          {/* Recent scans feed */}
          {Object.keys(scanned).length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 overflow-hidden max-h-48 overflow-y-auto">
              <p className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                Recent Scans
              </p>
              {Object.values(scanned).slice().reverse().slice(0, 8).map(({ student, status, time }) => (
                <div key={student.lrn}
                  className="flex items-center justify-between px-5 py-2.5 border-b border-slate-50 last:border-0">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: B.maroonDark }}>{student.name}</p>
                    <p className="text-xs font-mono text-slate-400">{student.lrn}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusPill status={status} />
                    <span className="text-xs text-slate-400">{time}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Btn variant="primary" onClick={endSession} className="w-full h-12">
            ⏹ End Session & Mark Absences
          </Btn>
        </div>
      )}

      {/* Master class list */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>
            Master Class List — {todayStr}
          </p>
          <span className="text-xs text-slate-400">{classStudents.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["#", "LRN", "Name", "Status", "Tardy", "Override"].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.map((s, i) => {
                const st = todayRec[s.lrn];
                return (
                  <tr key={s.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}>
                    <td className="py-3.5 px-5 text-xs text-slate-400 font-mono">{i + 1}</td>
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400">{s.lrn}</td>
                    <td className="py-3.5 px-5 font-semibold" style={{ color: B.maroonDark }}>{s.name}</td>
                    <td className="py-3.5 px-5">
                      {st ? <StatusPill status={st} /> : <span className="text-slate-300 text-sm">—</span>}
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-400">{s.tardyCount || 0}x</td>
                    <td className="py-3.5 px-5">
                      <button
                        onClick={() => { setOverrideModal(s); setOverrideReason(""); }}
                        className="flex items-center gap-1.5 text-xs font-semibold border-0 bg-transparent cursor-pointer transition-colors"
                        style={{ color: B.blue }}>
                        <Ic.edit className="w-4 h-4" /> Override
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {overrideModal && (
        <Modal title={`Override: ${overrideModal.name}`} onClose={() => setOverrideModal(null)}>
          <div className="flex flex-col gap-4">
            <FloatInput label="Reason for override (required)" id="ov-reason" type="text"
              value={overrideReason} onChange={e => setOverrideReason(e.target.value)} required />
            <div className="grid grid-cols-2 gap-2.5">
              {["Present", "Late", "Very Late", "Absent", "Official Business", "Excused"].map(s => (
                <Btn key={s} variant="outline" size="sm" onClick={() => confirmOverride(s)} className="justify-center">
                  → {s}
                </Btn>
              ))}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── STUDENT MANAGEMENT ───────────────────────────────────────────────────────
function StudentManagement({ classInfo, classStudents, showToast, isArchived }) {
  const [search, setSearch] = useState("");
  const [addModal, setAddModal] = useState(false);
  const [form, setForm] = useState({ lrn: "", name: "", gender: "M" });
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const importRef = useRef(null);

  const filtered = (classStudents || []).filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) || s.lrn?.includes(search)
  );

  const handleAdd = async () => {
    if (!form.lrn.trim() || !form.name.trim()) {
      showToast("LRN and Name are required.", "error"); return;
    }
    if (form.lrn.length !== 12 || !/^\d+$/.test(form.lrn)) {
      showToast("LRN must be exactly 12 digits.", "error"); return;
    }
    try {
      await addDoc(collection(db, "classes", classInfo.id, "students"), {
        lrn: form.lrn, name: form.name.toUpperCase(), gender: form.gender,
        grade: classInfo.grade, section: classInfo.section,
        absences: 0, tardyCount: 0, status: "active",
        createdAt: serverTimestamp(),
      });
      showToast(`✅ ${form.name} added.`);
      setAddModal(false);
      setForm({ lrn: "", name: "", gender: "M" });
    } catch (e) { showToast("Error adding student: " + e.message, "error"); }
  };

  const handleDelete = async (s) => {
    if (!window.confirm(`Delete ${s.name} from this class?`)) return;
    try {
      await deleteDoc(doc(db, "classes", classInfo.id, "students", s.id));
      showToast("Student removed.");
    } catch (e) { showToast("Error: " + e.message, "error"); }
  };

  const handleImportCSV = (e) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (ev) => {
    const text = ev.target.result;

    // Split on newline, strip carriage returns, drop blank lines
    const lines = text
      .split("\n")
      .map(l => l.replace(/\r/g, "").trim())
      .filter(Boolean);

    if (lines.length === 0) {
      showToast("CSV file is empty.", "error");
      return;
    }

    // Skip header row if it contains "lrn" (case-insensitive)
    const dataLines = lines[0].toLowerCase().includes("lrn")
      ? lines.slice(1)
      : lines;

    if (dataLines.length === 0) {
      showToast("CSV has a header but no data rows.", "error");
      return;
    }

    const batch      = writeBatch(db);
    const skipped    = [];   // { row, reason }
    let   queued     = 0;

    dataLines.forEach((line, idx) => {
      const rowNum = idx + 2; // 1-based, accounting for header

      // Handle quoted fields: split on commas not inside quotes
      const cols = line
        .split(/,(?=(?:[^"]*"[^"]*")*[^"]*$)/)
        .map(c => c.replace(/^"|"$/g, "").trim());

      const rawLrn  = cols[0] ?? "";
      const rawName = cols[1] ?? "";
      const rawGender = cols[2] ?? "M";

      // ── Validation ───────────────────────────────────────────────────────

      // LRN: must be exactly 12 numeric digits
      const lrn = rawLrn.replace(/\s+/g, "");
      if (!/^\d{12}$/.test(lrn)) {
        skipped.push({
          row: rowNum,
          reason: lrn
            ? `LRN "${lrn}" is not a valid 12-digit number`
            : "LRN column is empty",
        });
        return; // skip this row
      }

      // Name: must not be blank
      const name = rawName.trim();
      if (!name) {
        skipped.push({ row: rowNum, reason: `Row ${rowNum} has no name` });
        return;
      }

      // Gender: normalise — anything starting with F → "F", else "M"
      const gender = rawGender.toUpperCase().startsWith("F") ? "F" : "M";

      const ref = doc(collection(db, "classes", classInfo.id, "students"));
      batch.set(ref, {
        lrn,
        name:       name.toUpperCase(),
        gender,
        grade:      classInfo.grade,
        section:    classInfo.section,
        absences:   0,
        tardyCount: 0,
        status:     "active",
        createdAt:  serverTimestamp(),
      });
      queued++;
    });

    // ── Report skipped rows before committing ─────────────────────────────
    if (skipped.length > 0) {
      const preview = skipped
        .slice(0, 5)
        .map(s => `Row ${s.row}: ${s.reason}`)
        .join(" | ");
      const more = skipped.length > 5 ? ` (+${skipped.length - 5} more)` : "";
      showToast(`⚠️ Skipped ${skipped.length} row(s): ${preview}${more}`, "error");
    }

    if (queued === 0) {
      showToast("No valid rows found. Nothing was imported.", "error");
      e.target.value = "";
      return;
    }

    // ── Commit valid rows ─────────────────────────────────────────────────
    try {
      await batch.commit();
      showToast(
        `✅ ${queued} student(s) imported${skipped.length > 0 ? `, ${skipped.length} skipped` : ""}.`
      );
    } catch (err) {
      showToast("Import failed: " + err.message, "error");
    }

    e.target.value = ""; // reset so the same file can be re-used
  };

  reader.readAsText(file);
};

  return (
    <div className="fade-up space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>Student Records</h2>
          <p className="text-xs text-slate-400 mt-1">
            Grade {classInfo?.grade} — {classInfo?.section} • {classStudents?.length || 0} learners
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto mt-3 sm:mt-0">
          <input
            type="file" accept=".csv" ref={importRef}
            onChange={handleImportCSV} className="hidden"
          />
          {!isArchived && (
            <>
              <Btn variant="ghost" size="sm" onClick={() => importRef.current?.click()}>
                <Ic.upload className="w-4 h-4" /> Bulk CSV
              </Btn>
              <Btn variant="primary" size="sm" onClick={() => setAddModal(true)}>
                <Ic.plus className="w-4 h-4" /> Add Student
              </Btn>
            </>
          )}
          {isArchived && (
            <span className="h-9 flex items-center text-xs text-slate-400 italic px-2">
              🗂️ Archived — read only
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm outline-none font-sans transition-all"
          style={{ "--tw-ring-color": `${B.maroon}15` }}
          placeholder="Search by name or LRN…"
        />
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-base">🔍</span>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["#", "LRN", "Name", "Gender", "Absences", "Tardy", "QR Code", "Action"].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">No students found.</td>
                </tr>
              ) : filtered.map((s, i) => (
                <tr key={s.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}>
                  <td className="py-3.5 px-5 text-xs text-slate-400">{i + 1}</td>
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-400">{s.lrn}</td>
                  <td className="py-3.5 px-5 font-semibold" style={{ color: B.maroonDark }}>{s.name}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">{s.gender === "M" ? "♂ Male" : "♀ Female"}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${(s.absences || 0) >= 3 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"}`}>
                      {s.absences || 0}d
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">{s.tardyCount || 0}x</td>
                  <td className="py-3.5 px-5">
                    <QRCodeSVG value={s.lrn || "0"} size={36} level="M" />
                  </td>
                  <td className="py-3.5 px-5">
                    <button
                      onClick={() => handleDelete(s)}
                      className="bg-transparent border-0 cursor-pointer text-red-400 hover:text-red-600 transition-colors p-1"
                    >
                      <Ic.trash className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {addModal && (
        <Modal title="Add New Student" onClose={() => setAddModal(false)}>
          <div className="flex flex-col gap-4">
            <FloatInput label="LRN (12 digits)" id="s-lrn" value={form.lrn} onChange={e => sf("lrn", e.target.value)} required />
            <FloatInput label="Full Name (LAST, First Middle)" id="s-name" value={form.name} onChange={e => sf("name", e.target.value)} required />
            <FloatSelect label="Gender" id="s-gender" value={form.gender} onChange={e => sf("gender", e.target.value)}>
              <option value="M">Male</option>
              <option value="F">Female</option>
            </FloatSelect>
            <Btn variant="primary" onClick={handleAdd} className="w-full h-11">
              Add Student to {classInfo.section}
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── SF2 VIEW ─────────────────────────────────────────────────────────────────
function SF2View({ classInfo, classStudents, attendance, showToast, sy, isArchived }) {
  const year = parseInt(sy?.split("-")[0]) || 2025;
  const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const [selMonth, setSelMonth] = useState(
  () => localStorage.getItem("sf2-month") || "January"
  );
  const mIdx = MONTHS.indexOf(selMonth);

  const schoolDays = useMemo(() => {
    const days = [];
    for (let d = 1; d <= 31; d++) {
      const date = new Date(year, mIdx, d);
      if (date.getMonth() !== mIdx) break;
      const dow = date.getDay();
      if (dow !== 0 && dow !== 6) days.push(d);
    }
    return days;
  }, [mIdx, year]);

    useEffect(() => {
      localStorage.setItem("sf2-month", selMonth);
    }, [selMonth]);

  const getRec = (lrn, day) => {
    const dateStr = fmt(new Date(year, mIdx, day));
    return attendance[classInfo.id]?.[dateStr]?.[lrn] || null;
  };

  const getTotals = (lrn) => {
  let present = 0, absent = 0, tardy = 0;
  schoolDays.forEach(d => {
    const r = getRec(lrn, d);
    if (r === "Present" || r === "Late" || r === "Very Late") {
      present++;
      if (r === "Late" || r === "Very Late") tardy++;
    } else if (r === "Absent") {
      absent++;
    }
    // Note: If r is "Official Business" or "Excused", 
    // it simply doesn't increment 'present' or 'absent'.
  });
  
  const totalDays = schoolDays.length;
  const rate = totalDays > 0 
    ? ((present / totalDays) * 100).toFixed(1) 
    : "0.0";
    
  return { present, absent, tardy, rate };
};

  const cellCode = (r) => {
    if (r === "Present") return "P"; if (r === "Late") return "L";
    if (r === "Very Late") return "VL"; if (r === "Absent") return "A";
    if (r === "Official Business") return "OB"; if (r === "Excused") return "E";
    return "";
  };

  const exportCSV = () => {
  // Sort students alphabetically — same order as the rendered table
  const sorted = [...classStudents].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "")
  );

  const header = [
    "LRN",
    "Name",
    ...schoolDays.map(d => `${selMonth} ${d}`),
    "Present",
    "Absent",
    "Tardy",
    "Rate%",
  ];

  const rows = sorted.map(s => {
    const tots  = getTotals(s.lrn);
    const daily = schoolDays.map(d => {
      const r = getRec(s.lrn, d);
      // Explicit mapping — must match every string stored in Firebase exactly
      switch (r) {
        case "Present":          return "P";
        case "Late":             return "L";
        case "Very Late":        return "VL";
        case "Absent":           return "A";
        case "Official Business": return "OB";
        case "Excused":          return "E";
        default:                 return "-";
      }
    });
    return [
      s.lrn,
      s.name,
      ...daily,
      tots.present,
      tots.absent,
      tots.tardy,
      `${tots.rate}%`,
    ];
  });

  const csv = [header, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }); // BOM for Excel
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `SF2_Grade${classInfo.grade}_${classInfo.section}_${selMonth}${year}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast("📥 SF2 exported as CSV!");
};

  const cellColor = (r) => {
    if (r === "Present") return "#059669"; if (r === "Absent") return B.maroon;
    if (r === "Late") return "#D97706"; if (r === "Very Late") return "#EA580C";
    return B.blue;
  };

  return (
    <div className="fade-up space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>DepEd School Form 2</h2>
          <p className="text-xs text-slate-400 mt-1">Grade {classInfo?.grade} — {classInfo?.section} • Daily Attendance Record</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5 w-full sm:w-auto mt-3 sm:mt-0">
          <select value={selMonth} onChange={e => setSelMonth(e.target.value)}
            className="h-10 px-4 border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-maroon transition-colors"
            style={{ color: B.maroonDark }}>
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <Btn variant="primary" size="sm" onClick={exportCSV}>
            <Ic.download className="w-4 h-4" /> Export CSV
          </Btn>
        </div>
      </div>

      {isArchived && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold"
          style={{ background: B.goldFade, color: B.goldDark, border: `1px solid ${B.gold}50` }}>
          🗂️ You are viewing an <strong>archived</strong> school year. Data is read-only. CSV export is still available.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
        <div className="px-6 py-4 text-center" style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})` }}>
          <p className="font-display text-white font-bold text-sm">SCHOOL FORM 2 — DAILY ATTENDANCE REPORT OF LEARNERS</p>
          <p className="text-white/50 text-xs mt-1">Grade {classInfo?.grade} — {classInfo?.section} | {selMonth} {year} | {sy}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="border-collapse text-xs w-full min-w-[800px]">
            <thead>
              <tr style={{ background: B.maroonFade }}>
                <th className="border border-slate-200 py-2.5 px-4 text-left font-bold sticky left-0 z-10 min-w-[180px]" style={{ color: B.maroon, background: B.maroonFade }}>LEARNER'S NAME</th>
                {schoolDays.map(d => <th key={d} className="border border-slate-200 py-2 px-1.5 text-center font-bold min-w-[26px]" style={{ color: B.maroon }}>{d}</th>)}
                {[["P", "#059669"], ["A", B.maroon], ["T", "#D97706"], ["%", B.blue]].map(([h, c]) => (
                  <th key={h} className="border border-slate-200 py-2 px-2 text-center font-bold min-w-[30px]" style={{ color: c }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(classStudents || []).map((s, i) => {
                const tots = getTotals(s.lrn);
                return (
                  <tr key={s.id} className={i % 2 ? "bg-slate-50/40" : "bg-white"}>
                    <td className="border border-slate-100 py-2 px-4 font-semibold sticky left-0 z-10" style={{ color: B.maroonDark, background: i % 2 ? "#F8F9FA" : "white" }}>{s.name}</td>
                    {schoolDays.map(d => {
                      const r = getRec(s.lrn, d);
                      return <td key={d} className="border border-slate-100 text-center py-1.5 px-0.5 font-bold" style={{ color: cellColor(r) }}>{cellCode(r)}</td>;
                    })}
                    <td className="border border-slate-100 text-center py-1.5 px-2 font-bold text-emerald-700">{tots.present}</td>
                    <td className="border border-slate-100 text-center py-1.5 px-2 font-bold" style={{ color: B.maroon }}>{tots.absent}</td>
                    <td className="border border-slate-100 text-center py-1.5 px-2 font-bold text-amber-600">{tots.tardy}</td>
                    <td className="border border-slate-100 text-center py-1.5 px-2 font-bold" style={{ color: B.blue }}>{tots.rate}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-3 border-t border-slate-100 flex flex-wrap gap-4">
          {[["P", "Present", "#059669"], ["A", "Absent", B.maroon], ["L", "Late", "#D97706"], ["VL", "Very Late", "#EA580C"], ["OB", "Official Business", B.blue], ["E", "Excused", "#7C3AED"]].map(([code, label, color]) => (
            <span key={code} className="flex items-center gap-1.5 text-xs">
              <span className="font-bold" style={{ color }}>{code}</span>
              <span className="text-slate-400">=</span>
              <span className="text-slate-400">{label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── QR PRINT PAGE ────────────────────────────────────────────────────────────
function QRPrintPage({ allStudents }) {
  // Derive a display label from the first student that has grade/section data.
  // Falls back gracefully when the list is empty.
  const firstWithMeta = allStudents.find(s => s.grade && s.section);
  const classLabel    = firstWithMeta
    ? `Grade ${firstWithMeta.grade} — ${firstWithMeta.section}`
    : null;

  // Build a sorted, de-duplicated set of section labels for the subtitle
  // (handles edge-case where multiple sections share the same QR sheet)
  const sectionLabels = useMemo(() => {
    const seen = new Set();
    const out  = [];
    allStudents.forEach(s => {
      const key = `Grade ${s.grade} — ${s.section}`;
      if (s.grade && s.section && !seen.has(key)) {
        seen.add(key);
        out.push(key);
      }
    });
    return out.join(" · ");
  }, [allStudents]);

  return (
    <div className="fade-up">
      {/* ── Screen toolbar (hidden during print) ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3 print:hidden">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>
            QR Code Generator
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {allStudents.length} student{allStudents.length !== 1 ? "s" : ""}
            {sectionLabels ? ` · ${sectionLabels}` : ""} · Real scannable QR codes (LRN-based)
          </p>
        </div>
        <Btn variant="primary" onClick={() => window.print()}>
          <Ic.print className="w-5 h-5" /> Print A4 Sheet
        </Btn>
      </div>

      {/*
       * ── Print shell ──────────────────────────────────────────────────────
       * id="qr-print-shell" is targeted by @media print to lock the whole
       * block to a 210mm-wide centred column on the A4 page.
       * The Tailwind classes (mx-auto, max-w) do the same job on-screen.
       */}
      <div
        id="qr-print-shell"
        className="mx-auto"
        style={{ maxWidth: "210mm" }}
      >
        {/*
         * ── Print-only header ────────────────────────────────────────────
         * Hidden on screen via `hidden`; the @media print rule sets
         * `display: block` on #qr-print-header so it appears only on paper.
         */}
        <div
          id="qr-print-header"
          className="hidden"
          style={{ fontFamily: "'DM Sans', sans-serif" }}
        >
          <p
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: B.maroonDark,
              margin: 0,
              letterSpacing: "0.02em",
            }}
          >
            GNSHI Smart Attendance System
          </p>
          <p
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: B.slate,
              margin: "2px 0 0",
            }}
          >
            {sectionLabels || "Student QR Code Sheet"}
          </p>
          <p
            style={{
              fontSize: 9,
              color: "#94A3B8",
              margin: "1px 0 0",
            }}
          >
            Gigaquit National School of Home Industries · Printed{" "}
            {TODAY.toLocaleDateString("en-PH", {
              year:  "numeric",
              month: "long",
              day:   "numeric",
            })}
          </p>
          {/* Thin rule separating header from cards */}
          <div
            style={{
              height: 1,
              background: `linear-gradient(90deg, ${B.maroon}, transparent)`,
              marginTop: 5,
              marginBottom: 0,
            }}
          />
        </div>

        {/*
         * ── QR card grid ─────────────────────────────────────────────────
         * On-screen: auto-fill responsive grid.
         * In print:  @media print overrides to a strict 4-column grid.
         */}
        <div
          id="qr-print-area"
          className="grid w-full"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
            gap: 10,
          }}
        >
          {allStudents.map(s => (
            <div
              key={s.id}
              className="bg-white border border-slate-200 rounded-xl flex flex-col items-center gap-1.5"
              style={{
                padding: "10px 8px 8px",
                breakInside: "avoid",
                pageBreakInside: "avoid",
              }}
            >
              {/* QR code */}
              <div
                className="rounded-lg"
                style={{
                  padding: 4,
                  background: "white",
                  border: "1px solid #E2E8F0",
                  lineHeight: 0,
                }}
              >
                <QRCodeSVG
                  value={s.lrn || "000000000000"}
                  size={80}
                  level="H"
                  includeMargin={false}
                />
              </div>

              {/* Student info */}
              <div className="text-center w-full px-1">
                <p
                  className="font-bold leading-tight"
                  style={{
                    fontSize: 9,
                    color: B.maroonDark,
                    wordBreak: "break-word",
                  }}
                >
                  {s.name}
                </p>
                <p
                  className="font-mono"
                  style={{ fontSize: 8, color: "#94A3B8", marginTop: 2 }}
                >
                  {s.lrn}
                </p>
                {s.grade && s.section && (
                  <p style={{ fontSize: 8, color: "#CBD5E1", marginTop: 1 }}>
                    Gr.{s.grade} — {s.section}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── STAFF ACCOUNT MANAGER ────────────────────────────────────────────────────
function StaffAccountManager({ allClasses, showToast }) {
  const [staffList, setStaffList] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "adviser", classIds: [] });
  const sf = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const [saving, setSaving] = useState(false);

  // 1. FIXED USEEFFECT: Loads accounts and ignores case-sensitivity so no accounts disappear
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "users"), 
      snap => {
        const staff = snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(u => u.role && (u.role.toLowerCase() === "adviser" || u.role.toLowerCase() === "subject"));
        
        setStaffList(staff);
      },
      err => {
        console.error("Staff fetch error:", err);
        showToast("Failed to load staff list: " + err.message, "error");
      }
    );
    return () => unsub();
  }, []);

  const toggleClass = (cid) => {
    setForm(f => ({ ...f, classIds: f.classIds.includes(cid) ? f.classIds.filter(x => x !== cid) : [...f.classIds, cid] }));
  };

  const handleCreate = async () => {
    if (!form.name.trim() || !form.email.trim() || form.password.length < 6) {
      showToast("Name, email, and password (min 6 chars) are required.", "error"); return;
    }
    setSaving(true);
    try {
      const cred = await createUserWithEmailAndPassword(secondaryAuth, form.email, form.password);
      await setDoc(doc(db, "users", cred.user.uid), {
        name: form.name, email: form.email, role: form.role,
        classIds: form.classIds, createdAt: serverTimestamp(),
      });
      await signOut(secondaryAuth);
      showToast(`✅ Account created for ${form.name}`);
      setModal(false);
      setForm({ name: "", email: "", password: "", role: "adviser", classIds: [] });
    } catch (e) {
      showToast("Error: " + (e.code === "auth/email-already-in-use" ? "Email already exists." : e.message), "error");
    }
    setSaving(false);
  };

  const handleDelete = async (staff) => {
    if (!window.confirm(`Remove ${staff.name}'s profile from the system?`)) return;
    try { await deleteDoc(doc(db, "users", staff.id)); showToast("Profile removed."); }
    catch (e) { showToast("Error: " + e.message, "error"); }
  };

  // 2. FIXED RETURN: Modal is now outside the fade-up div!
  return (
    <>
      <div className="fade-up space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>Staff Account Manager</h2>
            <p className="text-xs text-slate-400 mt-1">Create and manage adviser &amp; subject teacher accounts</p>
          </div>
          <Btn variant="primary" onClick={() => setModal(true)}>
            <Ic.plus className="w-5 h-5" /> Create Staff Account
          </Btn>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["Name", "Email", "Role", "Assigned Classes", "Action"].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {staffList.length === 0 ? (
                <tr><td colSpan={5} className="py-12 text-center text-slate-400">No staff accounts yet.</td></tr>
              ) : staffList.map((s, i) => {
                const assignedClasses = allClasses.filter(c => s.classIds?.includes(c.id));
                return (
                  <tr key={s.id} className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}>
                    <td className="py-3.5 px-5 font-semibold" style={{ color: B.maroonDark }}>{s.name}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">{s.email}</td>
                    <td className="py-3.5 px-5">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${s.role === "adviser" ? "bg-blue-100 text-blue-800" : "bg-purple-100 text-purple-800"}`}>{s.role}</span>
                    </td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">{assignedClasses.map(c => `Gr.${c.grade} ${c.section}`).join(", ") || "None"}</td>
                    <td className="py-3.5 px-5">
                      <button onClick={() => handleDelete(s)} className="bg-transparent border-0 cursor-pointer text-red-400 hover:text-red-600 transition-colors p-1">
                        <Ic.trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="Create Staff Account" onClose={() => setModal(false)} size="md">
          <div className="flex flex-col gap-4">
            <FloatInput label="Full Name" id="st-name" value={form.name} onChange={e => sf("name", e.target.value)} required />
            <FloatInput label="Email Address" id="st-email" type="email" value={form.email} onChange={e => sf("email", e.target.value)} required />
            <FloatInput label="Password (min 6 characters)" id="st-pwd" type="password" value={form.password} onChange={e => sf("password", e.target.value)} required />
            <FloatSelect label="Role" id="st-role" value={form.role} onChange={e => sf("role", e.target.value)}>
              <option value="adviser">Adviser</option>
              <option value="subject">Subject Teacher</option>
            </FloatSelect>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2.5">Assign Classes</p>
              <div className="grid grid-cols-2 gap-2">
                {allClasses.map(c => (
                  <label key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl cursor-pointer transition-all border"
                    style={{ borderColor: form.classIds.includes(c.id) ? B.maroon : B.border, background: form.classIds.includes(c.id) ? B.maroonFade : "white" }}>
                    <input type="checkbox" checked={form.classIds.includes(c.id)} onChange={() => toggleClass(c.id)} style={{ accentColor: B.maroon }} />
                    <span className="text-xs font-semibold" style={{ color: form.classIds.includes(c.id) ? B.maroon : B.slate }}>Gr.{c.grade} — {c.section}</span>
                  </label>
                ))}
              </div>
            </div>

            <Btn variant="primary" disabled={saving} onClick={handleCreate} className="w-full h-11">
              {saving ? "Creating Account…" : "Create Account"}
            </Btn>
          </div>
        </Modal>
      )}
    </>
  );
}

// ─── SCHOOL SETTINGS ─────────────────────────────────────────────────────────
function SchoolSettings({ showToast }) {
  const [subjects, setSubjects]         = useState([]);
  const [newSubject, setNewSubject]     = useState("");
  const [newSectionForm, setNewSectionForm] = useState({
    grade: "7", section: "", track: "Academic", strand: "STEM",
  });
  const nsf   = (k, v) => setNewSectionForm(f => ({ ...f, [k]: v }));
  const isSHS = ["11", "12"].includes(newSectionForm.grade);

  // ── Load subjects via live snapshot ───────────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "subjects"),
      snap => {
        if (snap.exists()) {
          const list = snap.data().list;
          // Only update state when the value is actually an array
          if (Array.isArray(list)) setSubjects(list);
        } else {
          // Document doesn't exist yet — treat as empty
          setSubjects([]);
        }
      },
      err => console.error("Subjects snapshot error:", err.code, err.message)
    );
    return () => unsub();
  }, []);

  // ── Persist subjects — full overwrite ─────────────────────────────────────
  const saveSubjects = async (list) => {
    try {
      await setDoc(
        doc(db, "settings", "subjects"),
        { list },
        { merge: false } // full overwrite — no stale entries linger
      );
      showToast("Subjects saved.");
    } catch (e) {
      showToast("Failed to save subjects: " + e.message, "error");
      console.error("saveSubjects error:", e);
    }
  };

  const addSubject = () => {
    const trimmed = newSubject.trim();
    if (!trimmed) return;
    if (subjects.includes(trimmed)) {
      showToast("Subject already exists.", "error");
      return;
    }
    const updated = [...subjects, trimmed];
    setSubjects(updated);
    saveSubjects(updated);
    setNewSubject("");
  };

  const removeSubject = (idx) => {
    const updated = subjects.filter((_, j) => j !== idx);
    setSubjects(updated);
    saveSubjects(updated);
  };

  const createSection = async () => {
    const { grade, section, track, strand } = newSectionForm;
    if (!section.trim()) { showToast("Section name required.", "error"); return; }
    const id = `gr${grade}-${section.replace(/\s+/g, "-").toLowerCase()}`;
    try {
      await setDoc(doc(db, "classes", id), {
        grade,
        section: section.toUpperCase(),
        track:   isSHS ? track  : null,
        strand:  isSHS ? strand : null,
        createdAt: serverTimestamp(),
      });
      showToast(`✅ Grade ${grade} — ${section.toUpperCase()} created!`);
      setNewSectionForm(f => ({ ...f, section: "" }));
    } catch (e) {
      showToast("Failed to create section: " + e.message, "error");
    }
  };

  return (
    <div className="fade-up space-y-6">
      <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>
        School Structure &amp; Settings
      </h2>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* ── Subject manager ── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <p className="font-display text-sm font-bold mb-4" style={{ color: B.maroon }}>
            📚 Dynamic Subject Manager
          </p>

          {/* Add input */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <input
              value={newSubject}
              onChange={e => setNewSubject(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addSubject()}
              className="flex-1 h-10 px-4 border border-slate-200 rounded-xl text-sm outline-none transition-colors font-sans focus:border-maroon"
              placeholder="Add new subject…"
            />
            <Btn variant="primary" size="sm" onClick={addSubject}>+</Btn>
          </div>

          {/* Subject list */}
          <div className="max-h-64 overflow-y-auto space-y-1.5">
            {subjects.length === 0 && (
              <p className="text-xs text-center text-slate-400 py-4">
                No subjects yet. Add one above.
              </p>
            )}
            {subjects.map((s, i) => (
              <div
                key={`${s}-${i}`}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-50 group"
              >
                <span className="text-sm font-medium" style={{ color: B.maroonDark }}>
                  {s}
                </span>
                <button
                  onClick={() => removeSubject(i)}
                  title={`Remove "${s}"`}
                  className="bg-transparent border-0 cursor-pointer text-slate-300 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50 flex items-center"
                >
                  <Ic.trash className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          {subjects.length > 0 && (
            <p className="text-[10px] text-slate-400 mt-3 text-right">
              {subjects.length} subject{subjects.length !== 1 ? "s" : ""} total
            </p>
          )}
        </div>

        {/* ── New section ── */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <p className="font-display text-sm font-bold mb-4" style={{ color: B.maroon }}>
            🏫 Create New Section
          </p>
          <div className="flex flex-col gap-3.5">
            <FloatSelect
              label="Grade Level" id="ns-grade"
              value={newSectionForm.grade}
              onChange={e => nsf("grade", e.target.value)}
            >
              {GRADE_LEVELS.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </FloatSelect>

            {isSHS && (
              <>
                <FloatSelect
                  label="Track" id="ns-track"
                  value={newSectionForm.track}
                  onChange={e => {
                    nsf("track", e.target.value);
                    nsf("strand", STRANDS[e.target.value][0]);
                  }}
                >
                  {TRACKS.map(t => <option key={t}>{t}</option>)}
                </FloatSelect>
                <FloatSelect
                  label="Strand" id="ns-strand"
                  value={newSectionForm.strand}
                  onChange={e => nsf("strand", e.target.value)}
                >
                  {STRANDS[newSectionForm.track].map(s => (
                    <option key={s}>{s}</option>
                  ))}
                </FloatSelect>
              </>
            )}

            <FloatInput
              label="Section Name" id="ns-sec"
              value={newSectionForm.section}
              onChange={e => nsf("section", e.target.value)}
              placeholder=" "
            />
            <Btn variant="primary" onClick={createSection} className="w-full h-11">
              Create Section
            </Btn>
          </div>
        </div>
      </div>

      {/* ── Time logic reference ── */}
      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
        <p className="font-display text-sm font-bold mb-4" style={{ color: B.maroon }}>
          ⏰ Automated Time-Based Status Logic
        </p>
        <p className="text-xs text-slate-400 mb-3">
          Default cutoffs. Each session allows per-session overrides in the Scanner view.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {[
            ["Present",   "7:00 – 7:30 AM",  "#10B981", "#D1FAE5"],
            ["Late",      "7:31 – 7:40 AM",  "#D97706", "#FEF3C7"],
            ["Very Late", "7:41 AM onwards",  "#EA580C", "#FFEDD5"],
            ["Absent",    "End of Session",   B.maroon,  B.maroonFade],
          ].map(([label, time, c, bg]) => (
            <div key={label} className="rounded-xl p-4" style={{ background: bg, borderLeft: `4px solid ${c}` }}>
              <p className="font-semibold text-sm" style={{ color: c }}>{label}</p>
              <p className="text-xs mt-1 opacity-75" style={{ color: c }}>{time}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CALENDAR VIEW ────────────────────────────────────────────────────────────
function CalendarView({ user, sy, showToast }) {
  const year  = parseInt(sy?.split("-")[0]) || 2024;
  const [viewYear, setViewYear]   = useState(TODAY.getFullYear());
  const [viewMonth, setViewMonth] = useState(TODAY.getMonth()); // 0-indexed
  const [events, setEvents]       = useState([]);           // from Firestore
  const [selectedDate, setSelectedDate] = useState(null);   // "YYYY-MM-DD"
  const [dayModal, setDayModal]   = useState(false);
  const [saving, setSaving]       = useState(false);

  // Event form state (admin only)
  const [evtType, setEvtType]     = useState("event");      // "event"|"holiday"|"suspension"
  const [evtName, setEvtName]     = useState("");
  const [evtTime, setEvtTime]     = useState("morning");    // "morning"|"afternoon"

  const MONTH_NAMES = ["January","February","March","April","May","June",
                       "July","August","September","October","November","December"];
  const DOW_LABELS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

  // ── Load calendar events from Firestore ──────────────────────────────────
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "calendar"), snap => {
      setEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, err => console.error("Calendar snapshot error:", err));
    return () => unsub();
  }, []);

  // ── Build the grid ────────────────────────────────────────────────────────
  const firstDow  = new Date(viewYear, viewMonth, 1).getDay();   // 0=Sun
  const daysInMo  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevDays  = new Date(viewYear, viewMonth, 0).getDate();   // days in prev month

  // Full 6-row × 7-col grid
  const cells = [];
  // Leading days from previous month
  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ day: prevDays - i, type: "prev" });
  }
  // Current month
  for (let d = 1; d <= daysInMo; d++) {
    cells.push({ day: d, type: "cur" });
  }
  // Trailing days
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, type: "next" });
  }

  const dateStr = (d) => {
    if (d.type !== "cur") return null;
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(d.day).padStart(2, "0");
    return `${viewYear}-${mm}-${dd}`;
  };

  const eventsFor = (ds) => events.filter(e => e.date === ds);

  const isToday = (d) => {
    if (d.type !== "cur") return false;
    return dateStr(d) === fmt(TODAY);
  };

  const goMonth = (delta) => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m > 11) { m = 0;  y++; }
    if (m < 0)  { m = 11; y--; }
    setViewMonth(m);
    setViewYear(y);
  };

  // ── Open day modal ────────────────────────────────────────────────────────
  const openDay = (cell) => {
    const ds = dateStr(cell);
    if (!ds) return;                          // prev/next month cells → ignore
    setSelectedDate(ds);
    setEvtType("event");
    setEvtName("");
    setEvtTime("morning");
    setDayModal(true);
  };

  // ── Save event ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (evtType === "event" && !evtName.trim()) {
      showToast("Event name is required.", "error"); return;
    }
    setSaving(true);
    try {
      const payload = {
        date:      selectedDate,
        type:      evtType,
        name:      evtType === "event" ? evtName.trim() : evtType === "holiday" ? "Holiday" : "Suspension",
        timeSlot:  evtType === "event" ? evtTime : null,
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db, "calendar"), payload);
      showToast(`✅ ${payload.name} saved for ${selectedDate}`);
      setDayModal(false);
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    }
    setSaving(false);
  };

  // ── Delete event ─────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Remove this calendar entry?")) return;
    try {
      await deleteDoc(doc(db, "calendar", id));
      showToast("Entry removed.");
    } catch (e) {
      showToast("Error: " + e.message, "error");
    }
  };

  // ── Type colour map ───────────────────────────────────────────────────────
  const typeStyle = {
    event:      { bg: B.blueFade,    dot: B.blue,    label: "Event" },
    holiday:    { bg: "#D1FAE5",     dot: "#059669", label: "Holiday" },
    suspension: { bg: B.maroonFade,  dot: B.maroon,  label: "Suspension" },
  };

  const selectedEvents = selectedDate ? eventsFor(selectedDate) : [];

  return (
    <div className="fade-up space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>
            Academic Calendar
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            School Year {sy} — click any date to view or add entries
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => goMonth(-1)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-maroon hover:text-maroon transition-all">
            ‹
          </button>
          <span className="font-display font-bold text-sm px-3" style={{ color: B.maroonDark }}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </span>
          <button onClick={() => goMonth(1)}
            className="w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:border-maroon hover:text-maroon transition-all">
            ›
          </button>
          <button onClick={() => { setViewYear(TODAY.getFullYear()); setViewMonth(TODAY.getMonth()); }}
            className="ml-1 h-9 px-3 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-500 hover:border-maroon hover:text-maroon transition-all">
            Today
          </button>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex gap-4 flex-wrap">
        {Object.entries(typeStyle).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: v.dot }} />
            {v.label}
          </span>
        ))}
        {user.role === "admin" && (
          <span className="ml-auto text-xs text-slate-400 italic">Click a date to add an entry</span>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b border-slate-100">
          {DOW_LABELS.map(d => (
            <div key={d} className="py-2.5 text-center text-[10px] font-bold uppercase tracking-wider text-slate-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const ds       = dateStr(cell);
            const dayEvts  = ds ? eventsFor(ds) : [];
            const today    = isToday(cell);
            const isCur    = cell.type === "cur";
            const isSun    = idx % 7 === 0;
            const isSat    = idx % 7 === 6;
            const isWeekend = isSun || isSat;

            return (
              <div
                key={idx}
                onClick={() => isCur && openDay(cell)}
                className={`min-h-[80px] p-1.5 border-b border-r border-slate-100 relative transition-colors
                  ${isCur ? "cursor-pointer hover:bg-slate-50" : "bg-slate-50/40 cursor-default"}
                  ${today ? "bg-maroon-fade" : ""}
                `}
              >
                {/* Day number */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 ml-auto
                  ${today
                    ? "text-white"
                    : isCur
                    ? isWeekend ? "text-slate-400" : "text-slate-700"
                    : "text-slate-300"}
                `}
                  style={today ? { background: B.maroon } : {}}
                >
                  {cell.day}
                </div>

                {/* Event dots / pills */}
                <div className="space-y-0.5">
                  {dayEvts.slice(0, 2).map(ev => {
                    const s = typeStyle[ev.type] || typeStyle.event;
                    return (
                      <div key={ev.id}
                        className="truncate rounded px-1.5 py-0.5 text-[9px] font-bold leading-tight"
                        style={{ background: s.bg, color: s.dot }}
                      >
                        {ev.name}
                      </div>
                    );
                  })}
                  {dayEvts.length > 2 && (
                    <div className="text-[9px] font-semibold text-slate-400 px-1">
                      +{dayEvts.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Day modal ── */}
      {dayModal && selectedDate && (
        <Modal
          title={selectedDate}
          onClose={() => setDayModal(false)}
          size="sm"
        >
          <div className="space-y-5">
            {/* Existing entries */}
            {selectedEvents.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Entries for this day
                </p>
                {selectedEvents.map(ev => {
                  const s = typeStyle[ev.type] || typeStyle.event;
                  return (
                    <div key={ev.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                      style={{ background: s.bg }}>
                      <div>
                        <p className="text-xs font-bold" style={{ color: s.dot }}>{ev.name}</p>
                        {ev.timeSlot && (
                          <p className="text-[10px] capitalize" style={{ color: s.dot, opacity: 0.75 }}>
                            {ev.timeSlot} session
                          </p>
                        )}
                      </div>
                      {user.role === "admin" && (
                        <button onClick={() => handleDelete(ev.id)}
                          className="bg-transparent border-0 cursor-pointer p-1 opacity-50 hover:opacity-100 transition-opacity"
                          style={{ color: s.dot }}>
                          <Ic.trash className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add entry — admin only */}
            {user.role === "admin" ? (
              <div className="space-y-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Add entry
                </p>

                {/* Type toggle */}
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                  {[["event","📅 Event"],["holiday","🌿 Holiday"],["suspension","🚨 Suspend"]].map(([val, lbl]) => (
                    <button key={val} onClick={() => setEvtType(val)}
                      className="py-1.5 rounded-lg text-xs font-bold transition-all"
                      style={{
                        background: evtType === val ? B.maroon : "transparent",
                        color:      evtType === val ? "white"  : B.slate,
                      }}>
                      {lbl}
                    </button>
                  ))}
                </div>

                {evtType === "event" && (
                  <>
                    <FloatInput
                      label="Event Name"
                      id="cal-evtname"
                      value={evtName}
                      onChange={e => setEvtName(e.target.value)}
                      required
                    />
                    {/* Time slot */}
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        Time IN Slot
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[["morning","🌅 Morning"],["afternoon","🌇 Afternoon"]].map(([val, lbl]) => (
                          <button key={val} onClick={() => setEvtTime(val)}
                            className="py-2 rounded-xl text-xs font-bold border transition-all"
                            style={{
                              borderColor: evtTime === val ? B.maroon : B.border,
                              background:  evtTime === val ? B.maroonFade : "white",
                              color:       evtTime === val ? B.maroon : B.slate,
                            }}>
                            {lbl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {evtType === "holiday" && (
                  <div className="rounded-xl p-3 text-xs text-emerald-800 font-medium bg-emerald-50 border border-emerald-200">
                    📌 This day will be marked as a Holiday. SF2 will skip it automatically.
                  </div>
                )}

                {evtType === "suspension" && (
                  <div className="rounded-xl p-3 text-xs font-medium" style={{ background: B.maroonFade, color: B.maroon }}>
                    🚨 Classes will be marked suspended for this date. Attendance scanning will be disabled.
                  </div>
                )}

                <Btn variant="primary" disabled={saving} onClick={handleSave} className="w-full h-11">
                  {saving ? "Saving…" : "Save Entry"}
                </Btn>
              </div>
            ) : (
              selectedEvents.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">
                  No events scheduled for this day.
                </p>
              )
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}

function AdminMasterList({ allClasses, allStudents, showToast }) {
  const studentList = useMemo(() => {
    const all = Object.values(allStudents).flat();
    const currentGrade = typeof selectedGrade !== 'undefined' ? selectedGrade : "";
    const currentSection = typeof selectedSection !== 'undefined' ? selectedSection : "";
    const currentSearch = typeof search !== 'undefined' ? search : "";
    
    // 1. Filter the students based on search and dropdowns
    const filtered = all.filter(s => {
      const gradeMatch   = !selectedGrade   || String(s.grade).trim()   === String(selectedGrade).trim();
      const sectionMatch = !selectedSection || String(s.section).trim() === String(selectedSection).trim();
      const searchLower  = search.toLowerCase();
      const textMatch    = !search
        || s.name?.toLowerCase().includes(searchLower)
        || String(s.lrn ?? "").includes(search);
      return gradeMatch && sectionMatch && textMatch;
    });

    // 2. Sort the filtered list A-Z by name
    return filtered.sort((a, b) => 
      (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" })
    );
  }, [allStudents, selectedGrade, selectedSection, search]);

  // Shared style for always-floated labels
  const floatedLabelStyle = {
    top: 8,
    transform: "none",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.07em",
    textTransform: "uppercase",
    color: B.maroon,
  };

  return (
    <div className="fade-up space-y-5">
      <div>
        <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>Master Student List</h2>
        <p className="text-xs text-slate-400 mt-1">Browse all enrolled students across sections</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Grade */}
        <div className="float-wrap relative">
          <select
            value={selectedGrade}
            onChange={e => {
              setSelectedGrade(e.target.value);
              setSelectedSection("");
            }}
          >
            <option value="">All Grades</option>
            {gradeOptions.map(g => (
              <option key={g} value={g}>Grade {g}</option>
            ))}
          </select>
          {/* Always floated — no conditional positioning */}
          <label style={floatedLabelStyle}>Grade Level</label>
          <Ic.chevDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>

        {/* Section */}
        <div className="float-wrap relative">
          <select
            value={selectedSection}
            onChange={e => setSelectedSection(e.target.value)}
          >
            <option value="">All Sections</option>
            {sectionOptions.map(c => (
              <option key={c.id} value={c.section}>{c.section}</option>
            ))}
          </select>
          {/* Always floated — no conditional positioning */}
          <label style={floatedLabelStyle}>Section</label>
          <Ic.chevDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
        </div>

        {/* Search */}
        <div className="relative">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-[52px] pl-10 pr-4 border border-slate-200 rounded-xl text-sm outline-none font-sans transition-all"
            placeholder="Search name or LRN…"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
        <div className="px-6 py-3.5 border-b border-slate-100 flex justify-between items-center">
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>
            {studentList.length} student{studentList.length !== 1 ? "s" : ""}
            {selectedSection
              ? ` in ${selectedSection}`
              : selectedGrade
              ? ` in Grade ${selectedGrade}`
              : " school-wide"}
          </p>
          {(selectedGrade || selectedSection || search) && (
            <button
              onClick={() => { setSelectedGrade(""); setSelectedSection(""); setSearch(""); }}
              className="text-xs text-slate-400 hover:text-red-700 transition-colors font-semibold"
            >
              Clear filters ✕
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm min-w-[800px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["#","LRN","Name","Gender","Grade","Section","Absences","Tardy"].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {studentList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No students match the selected filters.
                  </td>
                </tr>
              ) : studentList.map((s, i) => (
                <tr
                  key={s.id || `${s.lrn}-${i}`}
                  className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}
                >
                  <td className="py-3.5 px-5 text-xs text-slate-400">{i + 1}</td>
                  <td className="py-3.5 px-5 font-mono text-xs text-slate-400">{s.lrn}</td>
                  <td className="py-3.5 px-5 font-semibold" style={{ color: B.maroonDark }}>{s.name}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">{s.gender === "M" ? "♂ Male" : "♀ Female"}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">Grade {s.grade}</td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">{s.section}</td>
                  <td className="py-3.5 px-5">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      (s.absences || 0) >= 3 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-500"
                    }`}>
                      {s.absences || 0}d
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-xs text-slate-500">{s.tardyCount || 0}x</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SubjectAssignment({ allClasses, showToast }) {
  const [subjects, setSubjects]         = useState([]);
  const [staffList, setStaffList]       = useState([]);
  const [assignments, setAssignments]   = useState([]);

  const [selSubject, setSelSubject]     = useState("");
  const [selClass, setSelClass]         = useState("");
  const [selTeacher, setSelTeacher]     = useState("");
  const [sectionSearch, setSectionSearch] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [saving, setSaving]             = useState(false);

  // Load subjects
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "subjects"), snap => {
      if (snap.exists() && Array.isArray(snap.data().list)) setSubjects(snap.data().list);
    });
    return () => unsub();
  }, []);

  // Load staff
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users"), where("role", "in", ["adviser", "subject"])),
      snap => setStaffList(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  // Load existing assignments
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "assignments"), snap => {
      setAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  const filteredClasses = allClasses.filter(c =>
    (c.section + " Grade " + c.grade).toLowerCase().includes(sectionSearch.toLowerCase())
  );

  const filteredStaff = staffList.filter(s =>
    s.name?.toLowerCase().includes(teacherSearch.toLowerCase())
  );

  const handleSave = async () => {
    if (!selSubject || !selClass || !selTeacher) {
      showToast("Please select a subject, section, and teacher.", "error");
      return;
    }
    setSaving(true);
    const classInfo = allClasses.find(c => c.id === selClass);
    const teacher   = staffList.find(s => s.id === selTeacher);
    try {
      // Use a deterministic doc ID so re-assigning replaces old
      const assignId = `${selClass}__${selSubject.replace(/\s+/g, "_")}`;
      await setDoc(doc(db, "assignments", assignId), {
        subjectName: selSubject,
        classId:     selClass,
        grade:       classInfo?.grade,
        section:     classInfo?.section,
        teacherId:   selTeacher,
        teacherName: teacher?.name,
        updatedAt:   serverTimestamp(),
      });
      showToast(`✅ ${selSubject} → ${classInfo?.section} assigned to ${teacher?.name}`);
      setSelSubject(""); setSelClass(""); setSelTeacher("");
    } catch (e) {
      showToast("Save failed: " + e.message, "error");
    }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this assignment?")) return;
    try { await deleteDoc(doc(db, "assignments", id)); showToast("Assignment removed."); }
    catch (e) { showToast("Error: " + e.message, "error"); }
  };

  // Group classes by grade for display
  const classGradeMap = {};
  filteredClasses.forEach(c => {
    if (!classGradeMap[c.grade]) classGradeMap[c.grade] = [];
    classGradeMap[c.grade].push(c);
  });

  return (
    <div className="fade-up space-y-6">
      <div>
        <h2 className="font-display text-xl font-bold" style={{ color: B.maroon }}>Subject Assignment</h2>
        <p className="text-xs text-slate-400 mt-1">Link a subject to a section and assign a teacher</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* ── Column 1: Select Subject ── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3">
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>1. Select Subject</p>
          {subjects.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              No subjects. Add them in School Settings first.
            </p>
          ) : (
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {subjects.map(s => (
                <button
                  key={s}
                  onClick={() => setSelSubject(s)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all border"
                  style={{
                    background:   selSubject === s ? B.maroonFade : "#F8F7F5",
                    borderColor:  selSubject === s ? B.maroon     : "transparent",
                    color:        selSubject === s ? B.maroon     : B.maroonDark,
                    fontWeight:   selSubject === s ? 700          : 500,
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Column 2: Select Section ── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3">
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>2. Select Section</p>
          <div className="relative">
            <input
              value={sectionSearch}
              onChange={e => setSectionSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-xs outline-none transition-all"
              placeholder="Search sections…"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.keys(classGradeMap).sort((a, b) => parseInt(a) - parseInt(b)).map(grade => (
              <div key={grade}>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 px-1 mb-1">
                  Grade {grade}
                </p>
                {classGradeMap[grade].map(c => (
                  <button
                    key={c.id}
                    onClick={() => setSelClass(c.id)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-all border mb-0.5"
                    style={{
                      background:  selClass === c.id ? B.maroonFade : "#F8F7F5",
                      borderColor: selClass === c.id ? B.maroon     : "transparent",
                      color:       selClass === c.id ? B.maroon     : B.maroonDark,
                      fontWeight:  selClass === c.id ? 700          : 500,
                    }}
                  >
                    {c.section}
                    {c.strand && <span className="ml-1.5 text-slate-400">• {c.strand}</span>}
                  </button>
                ))}
              </div>
            ))}
            {filteredClasses.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No sections match.</p>
            )}
          </div>
        </div>

        {/* ── Column 3: Select Teacher ── */}
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-card space-y-3">
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>3. Select Teacher</p>
          <div className="relative">
            <input
              value={teacherSearch}
              onChange={e => setTeacherSearch(e.target.value)}
              className="w-full h-9 pl-8 pr-3 border border-slate-200 rounded-lg text-xs outline-none transition-all"
              placeholder="Search teachers…"
            />
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
          </div>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {filteredStaff.length === 0 && (
              <p className="text-xs text-slate-400 py-4 text-center">No staff accounts found.</p>
            )}
            {filteredStaff.map(s => (
              <button
                key={s.id}
                onClick={() => setSelTeacher(s.id)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-sm transition-all border"
                style={{
                  background:  selTeacher === s.id ? B.maroonFade : "#F8F7F5",
                  borderColor: selTeacher === s.id ? B.maroon     : "transparent",
                  color:       selTeacher === s.id ? B.maroon     : B.maroonDark,
                  fontWeight:  selTeacher === s.id ? 700          : 500,
                }}
              >
                <span className="font-semibold">{s.name}</span>
                <span className="ml-2 text-[10px] capitalize px-1.5 py-0.5 rounded"
                  style={{ background: s.role === "adviser" ? "#DBEAFE" : "#F3E8FF",
                    color: s.role === "adviser" ? B.blue : "#6B21A8" }}>
                  {s.role}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <Btn variant="primary" size="lg" disabled={saving || !selSubject || !selClass || !selTeacher}
          onClick={handleSave}>
          {saving ? "Saving…" : "💾 Save Assignment"}
        </Btn>
      </div>

      {/* Existing assignments table */}
      {assignments.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-card">
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
            <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>
              Current Assignments
            </p>
            <span className="text-xs text-slate-400">{assignments.length} records</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  {["Subject", "Grade", "Section", "Teacher", "Remove"].map(h => (
                    <th key={h} className="py-3 px-5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {assignments.map((a, i) => (
                  <tr key={a.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}>
                    <td className="py-3.5 px-5 font-semibold" style={{ color: B.maroonDark }}>{a.subjectName}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">Grade {a.grade}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">{a.section}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">{a.teacherName}</td>
                    <td className="py-3.5 px-5">
                      <button onClick={() => handleDelete(a.id)}
                        className="bg-transparent border-0 cursor-pointer text-red-400 hover:text-red-600 transition-colors p-1">
                        <Ic.trash className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function SubjectDashboard({ assignment, classInfo, classStudents, attendance, suspended, showToast, isArchived }) {
  const todayStr = fmt(TODAY);
  const todayRec = attendance[assignment.classId]?.[todayStr] || {};

  const todayCounts = useMemo(() => {
    const vals = Object.values(todayRec);
    return {
      present: vals.filter(v => v === "Present").length,
      late: vals.filter(v => v === "Late" || v === "Very Late").length,
      absent: vals.filter(v => v === "Absent").length,
      total: classStudents.length,
    };
  }, [todayRec, classStudents]);

  const rate = todayCounts.total > 0
    ? Math.round(((todayCounts.present + todayCounts.late) / todayCounts.total) * 100)
    : 0;

  return (
    <div className="fade-up space-y-6">
      {/* Subject header */}
      <div
        className="rounded-2xl p-6 text-white"
        style={{ background: `linear-gradient(135deg, ${B.maroon}, ${B.maroonDark})` }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/45 mb-1">Subject Period</p>
        <h2 className="font-display text-2xl font-bold leading-tight">{assignment.subjectName}</h2>
        <p className="text-sm font-semibold mt-1" style={{ color: B.gold }}>
          Grade {assignment.grade} — {assignment.section}
        </p>

        {/* Mini KPI row */}
        <div className="grid grid-cols-4 gap-3 mt-5">
          {[
            { label: "Total", value: todayCounts.total, color: "rgba(255,255,255,0.7)" },
            { label: "Present", value: todayCounts.present, color: "#6EE7B7" },
            { label: "Late",    value: todayCounts.late,    color: "#FCD34D" },
            { label: "Absent",  value: todayCounts.absent,  color: "#FCA5A5" },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="rounded-xl px-3 py-2.5 text-center"
              style={{ background: "rgba(255,255,255,0.1)" }}
            >
              <p className="font-display text-xl font-bold" style={{ color }}>{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider mt-0.5 text-white/50">{label}</p>
            </div>
          ))}
        </div>

        {/* Attendance rate bar */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Today's Rate</p>
            <p className="text-xs font-bold text-white/70">{rate}%</p>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${rate}%`,
                background: rate >= 90 ? "#10B981" : rate >= 75 ? "#F59E0B" : "#EF4444",
              }}
            />
          </div>
        </div>
      </div>

      {/* Scanner section */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div
          className="px-6 py-4 border-b border-slate-100 flex items-center justify-between"
          style={{ background: "#F8F7F5" }}
        >
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>
            📷 Take Attendance
          </p>
          <span className="text-xs text-slate-400 font-medium">{todayStr}</span>
        </div>
        <div className="p-5">
          {classInfo ? (
            <ScannerView
              classInfo={classInfo}
              classStudents={classStudents}
              attendance={attendance}
              suspended={suspended}
              showToast={showToast}
              isArchived={isArchived}
            />
          ) : (
            <div className="text-center py-10 text-slate-400">
              <p className="text-3xl mb-3">⏳</p>
              <p className="text-sm font-medium">Loading class information…</p>
            </div>
          )}
        </div>
      </div>

      {/* Student list for this subject */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <p className="font-display text-sm font-bold" style={{ color: B.maroon }}>
            Class Roster
          </p>
          <span className="text-xs text-slate-400">{classStudents.length} students</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {["#", "LRN", "Name", "Gender", "Today's Status"].map(h => (
                  <th key={h} className="py-3 px-5 text-left text-[10px] font-bold uppercase tracking-wider text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {classStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-400 text-sm">
                    No students enrolled in this section yet.
                  </td>
                </tr>
              ) : classStudents.map((s, i) => {
                const status = todayRec[s.lrn];
                return (
                  <tr
                    key={s.id}
                    className={`border-b border-slate-50 hover:bg-slate-50/60 transition-colors ${i % 2 ? "bg-slate-50/30" : ""}`}
                  >
                    <td className="py-3.5 px-5 text-xs text-slate-400">{i + 1}</td>
                    <td className="py-3.5 px-5 font-mono text-xs text-slate-400">{s.lrn}</td>
                    <td className="py-3.5 px-5 font-semibold" style={{ color: B.maroonDark }}>{s.name}</td>
                    <td className="py-3.5 px-5 text-xs text-slate-500">
                      {s.gender === "M" ? "♂ Male" : "♀ Female"}
                    </td>
                    <td className="py-3.5 px-5">
                      {status
                        ? <StatusPill status={status} />
                        : <span className="text-slate-300 text-sm font-medium">—</span>
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState({});
  const [attendance, setAttendance] = useState({});
  const [suspended, setSuspended] = useState(false);
  const [sy, setSy] = useState("2024-2025");
  const [quarter, setQuarter] = useState("Q3");
  const [sideOpen, setSideOpen] = useState(true);
  const [calendarEvents, setCalendarEvents] = useState([]);

  const showToast = useCallback((msg, type = "success") => {
  if (type === "error")   hotToast.error(msg,   { duration: 3500 });
  else if (type === "info") hotToast(msg,        { duration: 3500, icon: "ℹ️" });
  else                    hotToast.success(msg,  { duration: 3500 });
}, []);

// ── SUBJECT TEACHER ASSIGNMENTS ───────────────────────────────────────────────
const [myAssignments, setMyAssignments] = useState([]);

useEffect(() => {
  if (!user || user.role === "admin") return;

  const unsub = onSnapshot(
    query(collection(db, "assignments"), where("teacherId", "==", user.id)),
    snap => {
      setMyAssignments(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    },
    err => console.error("Assignments snapshot error:", err.code, err.message)
  );

  return () => unsub();
}, [user]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const snap = await getDoc(doc(db, "users", fbUser.uid));
        if (snap.exists()) setUser({ id: fbUser.uid, ...snap.data() });
        else setUser(null);
      } else setUser(null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

useEffect(() => {
  if (!user) return;
  const unsub = onSnapshot(collection(db, "calendar"), snap => {
    setCalendarEvents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  }, () => {});
  return () => unsub();
}, [user]);

 // ── LOAD CLASSES ─────────────────────────────────────────────────────────────
    useEffect(() => {
      if (!user) return;

      let colRef;
      if (user.role === "admin") {
        colRef = collection(db, "classes");
      } else {
        const ids = user.classIds?.length ? user.classIds : ["__none__"];
        colRef = query(collection(db, "classes"), where(documentId(), "in", ids));
      }

      const unsub = onSnapshot(
        colRef,
        snap => {
          const data = snap.docs
            .map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => parseInt(a.grade) - parseInt(b.grade));

          setClasses(
            user.role === "admin"
              ? data
              : data.filter(c => user.classIds?.includes(c.id))
          );
        },
        err => console.error("Classes snapshot error:", err.code, err.message)
      );

      return () => unsub();
    }, [user]);

// ── DEFAULT SELECTED CLASS ────────────────────────────────────────────────────
useEffect(() => {
  if (classes.length > 0 && !selectedClassId) {
    setSelectedClassId(classes[0].id);
  }
}, [classes, selectedClassId]);

  // Replaces the existing students useEffect
useEffect(() => {
  if (!selectedClassId) return;

  const unsub = onSnapshot(
    collection(db, "classes", selectedClassId, "students"),
    snap => {
      const incoming = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setStudents(prev => {
        // Stringify comparison avoids React re-renders when data is identical
        const existing = prev[selectedClassId];
        if (
          existing &&
          existing.length === incoming.length &&
          JSON.stringify(existing) === JSON.stringify(incoming)
        ) {
          return prev; // bail out — nothing changed
        }
        return { ...prev, [selectedClassId]: incoming };
      });
    },
    err => console.error("Students snapshot error:", err.code, err.message)
  );

  return () => unsub();
}, [selectedClassId]); // ← correct single dependency

  // Replaces the existing attendance useEffect
useEffect(() => {
  if (!selectedClassId) return;

  const unsub = onSnapshot(
    collection(db, "attendance", selectedClassId, "records"),
    snap => {
      const byDate = {};
      snap.docs.forEach(d => { byDate[d.id] = d.data(); });
      setAttendance(prev => ({
        ...prev,
        [selectedClassId]: byDate,
      }));
    },
    err => console.error("Attendance snapshot error:", err.code, err.message)
  );

  return () => unsub();
}, [selectedClassId]); // ← correct single dependency

  // Replaces the existing global settings useEffect
useEffect(() => {
  // Bootstrap liveSy/liveQuarter from a one-time read first,
  // then keep both in sync via the snapshot listener below
  const unsub = onSnapshot(
    doc(db, "settings", "global"),
    snap => {
      if (!snap.exists()) return;
      const d = snap.data();

      // Update the user-facing dropdowns
      if (d.sy)                          setSy(d.sy);
      if (d.quarter)                     setQuarter(d.quarter);
      if (typeof d.suspended === "boolean") setSuspended(d.suspended);

      // Also keep the "live" reference values in sync so isArchived is accurate
      if (d.sy)                          setLiveSy(d.sy);
      if (d.quarter)                     setLiveQuarter(d.quarter);
    },
    err => console.error("Global settings snapshot error:", err.code, err.message)
  );

  return () => unsub();
}, []); // ← runs once on mount; the snapshot keeps it live

  const updateSyQuarter = async (newSy, newQ) => {
  try {
    await setDoc(doc(db, "settings", "global"), { sy: newSy, quarter: newQ }, { merge: true });
  } catch (e) {
    alert("⚠️ Failed to save SY/Quarter to server: " + e.message);
  }
};

  const handleLogout = async () => {
    await signOut(auth); setUser(null); setActiveTab("dashboard");
    setClasses([]); setStudents({}); setAttendance({});
    showToast("Signed out successfully.");
  };

const selectedClass = useMemo(() => classes.find(c => c.id === selectedClassId), [classes, selectedClassId]);
const selectedStudents = useMemo(() => {
const list = students[selectedClassId] || [];
  return [...list].sort((a, b) =>
    (a.name || "").localeCompare(b.name || "", "en", { sensitivity: "base" })
  );
}, [students, selectedClassId]);
  const allStudents = useMemo(() => Object.values(students).flat(), [students]);

  // ── Derived: is the currently-viewed SY/Quarter an archived period? ──────────
  // We treat a period as "live" if it matches the value stored in Firebase global
  // settings. If someone changes the dropdown to a *different* SY/Q, it is archived.
  const [liveSy, setLiveSy]           = useState("2024-2025");
  const [liveQuarter, setLiveQuarter] = useState("Q3");

  // Keep liveSy / liveQuarter in sync with the first snapshot from Firebase
  // (separate from the user-controlled dropdowns so we always know the "real" active period)
  useEffect(() => {
    getDoc(doc(db, "settings", "global")).then(snap => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.sy)      setLiveSy(d.sy);
        if (d.quarter) setLiveQuarter(d.quarter);
      }
    }).catch(() => {});
  }, []);

  const isArchived = (sy !== liveSy || quarter !== liveQuarter) && user?.role !== "admin";

  if (authLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${B.maroonDark}, ${B.maroon})` }}>
      <div className="text-center text-white">
        <div className="w-14 h-14 border-4 border-yellow-400 border-t-transparent rounded-full spin mx-auto mb-4" />
        <p className="font-display text-xl font-bold">GNSHI SAMS</p>
        <p className="text-white/50 text-sm mt-1">Connecting to server…</p>
      </div>
    </div>
  );

  if (!user) return (
  <>
    <LoginScreen />
    <Toaster position="bottom-right" />
  </>
);

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: B.offWhite }}>
      <Sidebar
        user={user}
        classes={classes}
        selectedClassId={selectedClassId}
        setSelectedClassId={setSelectedClassId}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sideOpen={sideOpen}
        setSideOpen={setSideOpen}
        onLogout={handleLogout}
        calendarEvents={calendarEvents}
        myAssignments={myAssignments}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <TopHeader
          user={user} activeTab={activeTab} selectedClass={selectedClass}
          suspended={suspended} sy={sy} setSy={setSy} quarter={quarter} setQuarter={setQuarter}
          onUpdateSyQuarter={updateSyQuarter}
        />

        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
            <div className="max-w-screen-2xl mx-auto">

              {activeTab === "dashboard" && user.role === "admin" && (
                <AdminDashboard allClasses={classes} allStudents={allStudents} attendance={attendance} suspended={suspended} setSuspended={setSuspended} showToast={showToast} sy={sy} quarter={quarter} />
              )}

              {activeTab === "dashboard" && user.role !== "admin" && (
                <AdviserDashboard user={user} classes={classes} students={students} attendance={attendance} showToast={showToast} setActiveTab={setActiveTab} />
              )}

              {activeTab === "masterlist" && user.role === "admin" && (
                <AdminMasterList allClasses={classes} allStudents={students} showToast={showToast} />
              )}

              {activeTab === "subjects" && user.role === "admin" && (
                <SubjectAssignment allClasses={classes} showToast={showToast} />
              )}

              {/* ── Subject Teacher: per-subject dashboard ── */}
              {myAssignments.map(assignment => {
                if (activeTab !== `subject_${assignment.id}`) return null;
                const classInfo = classes.find(c => c.id === assignment.classId)
                  || { id: assignment.classId, grade: assignment.grade, section: assignment.section };
                const classStudents = students[assignment.classId] || [];
                return (
                  <SubjectDashboard
                    key={assignment.id}
                    assignment={assignment}
                    classInfo={classInfo}
                    classStudents={classStudents}
                    attendance={attendance}
                    suspended={suspended}
                    showToast={showToast}
                    isArchived={isArchived}
                  />
                );
              })}

              {activeTab === "scan" && selectedClass && (
                <ScannerView
                  classInfo={selectedClass}
                  classStudents={selectedStudents}
                  attendance={attendance}
                  suspended={suspended}
                  showToast={showToast}
                  isArchived={isArchived}
                />
              )}

              {activeTab === "scan" && !selectedClass && (
                <div className="text-center py-20 text-slate-400">
                  <p className="text-5xl mb-4">📚</p>
                  <p className="font-semibold text-base">No class selected</p>
                  <p className="text-sm mt-2">Select a section from the sidebar to begin scanning.</p>
                </div>
              )}

              {activeTab === "sf2" && selectedClass && (
                <SF2View
                  classInfo={selectedClass}
                  classStudents={selectedStudents}
                  attendance={attendance}
                  showToast={showToast}
                  sy={sy}
                  isArchived={isArchived}
                />
              )}

              {activeTab === "students" && selectedClass && (
                <StudentManagement
                  classInfo={selectedClass}
                  classStudents={selectedStudents}
                  showToast={showToast}
                  isArchived={isArchived}
                />
              )}

              {activeTab === "qr" && <QRPrintPage allStudents={allStudents} />}

              {activeTab === "staff" && user.role === "admin" && (
                <StaffAccountManager allClasses={classes} showToast={showToast} />
              )}

              {activeTab === "settings" && user.role === "admin" && (
                <SchoolSettings showToast={showToast} />
              )}

              {activeTab === "calendar" && (
                <CalendarView user={user} sy={sy} showToast={showToast} />
              )}

              <Toaster
                position="bottom-right"
                toastOptions={{
                  style: {
                    fontFamily: "'DM Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 13,
                    borderRadius: 14,
                    padding: "12px 18px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                  },
                  success: {
                    iconTheme: { primary: "#059669", secondary: "#fff" },
                  },
                  error: {
                    iconTheme: { primary: "#7B1113", secondary: "#fff" },
                    style: { background: "#5A0C0E", color: "white" },
                  },
                }}
              />

            </div>
        </main>
      </div>
    </div>
  );
}