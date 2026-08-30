import React from 'react';
import { ShieldCheck, Lock, Key, Database, RefreshCw, X, CheckCircle2, AlertTriangle, FileCode } from 'lucide-react';

interface SecurityModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SecurityModal: React.FC<SecurityModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const threatZones = [
    {
      zone: '1. Input Surfaces',
      risk: 'Malicious prompt injection, payload tampering, XSS injection via journal text.',
      mitigation: 'Strict input sanitization, max length bounding, JSON payload size caps (1MB), plain text rendering.',
      owasp: 'OWASP LLM01 / A03'
    },
    {
      zone: '2. Planning & Reasoning',
      risk: 'Model hallucination, system instruction escape, toxic guidance.',
      mitigation: 'Strict socratic system instructions, multi-turn role boundary demarcation, defensive parsing.',
      owasp: 'OWASP LLM02 / LLM05'
    },
    {
      zone: '3. Tool & API Execution',
      risk: 'Gemini API key leakage on client, SSRF, unauthenticated model exhaustion.',
      mitigation: 'Server-side API proxy (/api/*), zero API keys in client code, resilient fallback ladder.',
      owasp: 'OWASP A05 / LLM04'
    },
    {
      zone: '4. Memory & State',
      risk: 'Cross-user data leakage in Firestore, unauthorized reads/writes of private reflections.',
      mitigation: 'Strict owner-bound Firestore security rules (request.auth.uid == userId), Firebase Auth JWT verification.',
      owasp: 'OWASP A01 (Broken Access Control)'
    },
    {
      zone: '5. Inter-System Communication',
      risk: 'Token theft, unverified bearer tokens, CORS replay attacks.',
      mitigation: 'Firebase Admin SDK verifyIdToken on every backend request, HTTPS-only transport, UID matching.',
      owasp: 'OWASP A07 / A02'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div 
        id="security-modal-container"
        className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-stone-200 shadow-2xl p-6 sm:p-8"
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200/60">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-stone-900 font-display">Security Architecture &amp; Threat Model</h2>
              <p className="text-xs text-stone-500">OWASP Top 10 + LLM Security Directives &amp; Verification</p>
            </div>
          </div>
          <button 
            id="close-security-modal-btn"
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Security Posture Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-6">
          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs mb-1">
              <Lock className="w-3.5 h-3.5" />
              <span>Auth &amp; Data Isolation</span>
            </div>
            <p className="text-sm font-medium text-stone-800">Owner-Bound Rules</p>
            <p className="text-xs text-stone-500 mt-0.5">UID-matched Firestore paths</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs mb-1">
              <Key className="w-3.5 h-3.5" />
              <span>Secret Safety</span>
            </div>
            <p className="text-sm font-medium text-stone-800">Zero Client Secrets</p>
            <p className="text-xs text-stone-500 mt-0.5">Gemini key confined to server</p>
          </div>

          <div className="p-4 bg-stone-50 rounded-xl border border-stone-200/70">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs mb-1">
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Model Resilience</span>
            </div>
            <p className="text-sm font-medium text-stone-800">Fallback Ladder</p>
            <p className="text-xs text-stone-500 mt-0.5">gemini-2.5-flash + fallbacks</p>
          </div>
        </div>

        {/* Threat Model Table */}
        <div className="my-6">
          <h3 className="text-sm font-bold text-stone-900 mb-3 flex items-center gap-2">
            <span>5-Zone Threat Summary Table</span>
          </h3>
          <div className="overflow-x-auto rounded-xl border border-stone-200">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-100/80 text-stone-700 font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-3">Threat Zone</th>
                  <th className="p-3">Identified Risk</th>
                  <th className="p-3">Implemented Countermeasure</th>
                  <th className="p-3">Standard</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-700">
                {threatZones.map((tz, i) => (
                  <tr key={i} className="hover:bg-stone-50/60">
                    <td className="p-3 font-semibold text-stone-900 whitespace-nowrap">{tz.zone}</td>
                    <td className="p-3">{tz.risk}</td>
                    <td className="p-3 font-medium text-emerald-900">{tz.mitigation}</td>
                    <td className="p-3 whitespace-nowrap text-stone-500 font-mono text-[11px]">{tz.owasp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Firestore Security Rule Code */}
        <div className="my-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-stone-600" />
              <span>Active Firestore Security Rules (firestore.rules)</span>
            </h3>
            <span className="text-[11px] font-medium bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md">
              Deployed &amp; Verified
            </span>
          </div>
          <pre className="p-4 bg-stone-900 text-stone-200 rounded-xl text-xs font-mono overflow-x-auto">
{`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/sessions/{sessionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}`}
          </pre>
        </div>

        <div className="pt-4 border-t border-stone-100 flex justify-end">
          <button
            id="close-security-modal-bottom-btn"
            onClick={onClose}
            className="px-5 py-2 bg-stone-900 text-white text-sm font-medium rounded-xl hover:bg-stone-800 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
