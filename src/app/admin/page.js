"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { CATEGORY_META, computeResults, getSliderLabel } from "@/lib/diagnosis-data";
import { COLORS } from "@/lib/colors";
import ResultsView from "@/components/ResultsView";

const ADMIN_PASS = "ryomat76";

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pass, setPass] = useState("");
  const [passError, setPassError] = useState("");
  const [entries, setEntries] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    if (pass === ADMIN_PASS) { setAuthed(true); setPassError(""); }
    else setPassError("パスワードが正しくありません");
  };

  useEffect(() => {
    if (!authed) return;
    setLoading(true);
    (async () => {
      const { data } = await supabase
        .from("diagnoses")
        .select("*")
        .order("created_at", { ascending: false });
      setEntries(data || []);
      setLoading(false);
    })();
  }, [authed]);

  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg }}>
        <div style={{ maxWidth: 400, margin: "0 auto", padding: "80px 20px", textAlign: "center" }}>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 600, marginBottom: 24 }}>管理者ログイン</h2>
          <input type="password" placeholder="パスワード" value={pass}
            onChange={(e) => { setPass(e.target.value); setPassError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            style={{ width: "100%", padding: "14px 18px", background: COLORS.surfaceLight, border: `1.5px solid ${passError ? "#f87171" : COLORS.border}`, borderRadius: 10, color: COLORS.text, fontSize: 15, outline: "none", marginBottom: 12 }} />
          {passError && <p style={{ color: "#f87171", fontSize: 12, marginBottom: 12 }}>{passError}</p>}
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <a href="/" style={{ padding: "12px 24px", background: COLORS.surfaceLight, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 10, textDecoration: "none", fontSize: 14 }}>戻る</a>
            <button onClick={handleLogin} style={{ padding: "12px 24px", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`, color: "#fff", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>ログイン</button>
          </div>
        </div>
      </div>
    );
  }

  if (selected) {
    const results = computeResults(selected.answers);
    return (
      <div style={{ minHeight: "100vh", background: COLORS.bg }}>
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
          <button onClick={() => setSelected(null)} style={{ padding: "8px 18px", background: COLORS.surfaceLight, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 8, cursor: "pointer", fontSize: 13, marginBottom: 20 }}>← 一覧に戻る</button>
          <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 20 }}>
            <p style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, marginBottom: 4 }}>{selected.name}</p>
            <p style={{ color: COLORS.accent, fontSize: 14, marginBottom: 4 }}>{selected.email}</p>
            <p style={{ color: COLORS.textMuted, fontSize: 12 }}>{new Date(selected.created_at).toLocaleString("ja-JP")}</p>
          </div>
          <ResultsView results={results} showClosing={false} />
        </div>
      </div>
    );
  }

  const sliderCats = ["initiative", "direction", "criteria", "change", "scope"];

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h2 style={{ color: COLORS.text, fontSize: 20, fontWeight: 700 }}>管理画面</h2>
          <a href="/" style={{ padding: "8px 18px", background: COLORS.surfaceLight, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 8, textDecoration: "none", fontSize: 13 }}>トップに戻る</a>
        </div>

        {loading ? (
          <p style={{ color: COLORS.textMuted, textAlign: "center", padding: 40 }}>読み込み中...</p>
        ) : entries.length === 0 ? (
          <p style={{ color: COLORS.textMuted, textAlign: "center", padding: 40 }}>まだ受診データがありません</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {entries.map((entry) => {
              const res = computeResults(entry.answers);
              return (
                <button key={entry.id} onClick={() => setSelected(entry)} style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, cursor: "pointer", textAlign: "left", transition: "border-color 0.2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ color: COLORS.text, fontSize: 14, fontWeight: 600 }}>{entry.name}</span>
                    <span style={{ color: COLORS.textMuted, fontSize: 12 }}>{new Date(entry.created_at).toLocaleString("ja-JP")}</span>
                  </div>
                  <div style={{ marginBottom: 6 }}>
                    <span style={{ color: COLORS.accent, fontSize: 13 }}>{entry.email}</span>
                  </div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {sliderCats.map((cat) => (
                      <span key={cat} style={{ fontSize: 11, color: COLORS.textMuted, background: COLORS.surfaceLight, padding: "2px 8px", borderRadius: 10 }}>
                        {CATEGORY_META[cat].name}:{getSliderLabel(cat, res.sliderScores[cat].bucket)}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
