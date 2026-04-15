import { useState } from "react";
import { supabase } from "./supabase";
import { QUESTIONS, CATEGORY_META, computeResults } from "./diagnosis-data";
import { COLORS } from "./colors";
import ResultsView from "./ResultsView";

const globalStyles = `
* { margin: 0; padding: 0; box-sizing: border-box; }
body { background: ${COLORS.bg}; color: ${COLORS.text}; font-family: "Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", sans-serif; }
input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; width: 22px; height: 22px; border-radius: 50%; background: ${COLORS.accent}; box-shadow: 0 0 12px ${COLORS.accent}; cursor: pointer; margin-top: -8px; }
input[type="range"]::-moz-range-thumb { width: 22px; height: 22px; border-radius: 50%; background: ${COLORS.accent}; box-shadow: 0 0 12px ${COLORS.accent}; cursor: pointer; border: none; }
input[type="range"]::-webkit-slider-runnable-track { height: 6px; background: transparent; }
input[type="range"]::-moz-range-track { height: 6px; background: transparent; }
button:hover { opacity: 0.88; }
::selection { background: ${COLORS.accentGlow}; }
`;

function SliderQuestion({ question, value, onChange }) {
  const val = value ?? 3;
  const pct = ((val - 1) / 4) * 100;
  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ color: COLORS.text, fontSize: 16, lineHeight: 1.7, marginBottom: 20 }}>{question.text}</p>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, gap: 16 }}>
        <span style={{ color: COLORS.accent, fontSize: 13, flex: 1, lineHeight: 1.5 }}>{question.labelA}</span>
        <span style={{ color: COLORS.pink, fontSize: 13, flex: 1, textAlign: "right", lineHeight: 1.5 }}>{question.labelB}</span>
      </div>
      <div style={{ position: "relative", padding: "10px 0" }}>
        <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 6, background: COLORS.surfaceLight, borderRadius: 3, transform: "translateY(-50%)" }} />
        <div style={{ position: "absolute", top: "50%", left: 0, width: `${pct}%`, height: 6, background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.purple})`, borderRadius: 3, transform: "translateY(-50%)", transition: "width 0.2s" }} />
        <input type="range" min={1} max={5} step={1} value={val} onChange={(e) => onChange(Number(e.target.value))} style={{ width: "100%", position: "relative", zIndex: 1, appearance: "none", WebkitAppearance: "none", background: "transparent", cursor: "pointer", height: 26 }} />
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted, background: COLORS.surfaceLight, padding: "2px 12px", borderRadius: 10 }}>
          {val === 1 ? "完全にA" : val === 2 ? "ややA" : val === 3 ? "どちらとも言えない" : val === 4 ? "ややB" : "完全にB"}
        </span>
      </div>
    </div>
  );
}

function Pick2Question({ question, value, onChange }) {
  const selected = value || [];
  const toggle = (key) => {
    if (selected.includes(key)) onChange(selected.filter((k) => k !== key));
    else if (selected.length < 2) onChange([...selected, key]);
  };
  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ color: COLORS.text, fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>{question.text}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt) => {
          const isSelected = selected.includes(opt.key);
          return (
            <button key={opt.key} onClick={() => toggle(opt.key)} style={{ padding: "14px 18px", border: `1.5px solid ${isSelected ? COLORS.accent : COLORS.border}`, borderRadius: 10, background: isSelected ? COLORS.accentGlow : COLORS.surfaceLight, color: isSelected ? COLORS.accent : COLORS.text, cursor: "pointer", textAlign: "left", fontSize: 15, transition: "all 0.2s", lineHeight: 1.5 }}>
              {opt.label}
            </button>
          );
        })}
      </div>
      <div style={{ textAlign: "right", marginTop: 6 }}>
        <span style={{ fontSize: 12, color: COLORS.textMuted }}>{selected.length}/2 選択済み</span>
      </div>
    </div>
  );
}

function Pick1of3Question({ question, value, onChange }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <p style={{ color: COLORS.text, fontSize: 16, lineHeight: 1.7, marginBottom: 16 }}>{question.text}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {question.options.map((opt) => {
          const isSelected = value === opt.key;
          return (
            <button key={opt.key} onClick={() => onChange(opt.key)} style={{ padding: "14px 18px", border: `1.5px solid ${isSelected ? COLORS.accent : COLORS.border}`, borderRadius: 10, background: isSelected ? COLORS.accentGlow : COLORS.surfaceLight, color: isSelected ? COLORS.accent : COLORS.text, cursor: "pointer", textAlign: "left", fontSize: 15, transition: "all 0.2s", lineHeight: 1.5 }}>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function App() {
  const [screen, setScreen] = useState("landing");
  const [answers, setAnswers] = useState({});
  const [currentQ, setCurrentQ] = useState(0);
  const [userName, setUserName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");
  const [results, setResults] = useState(null);
  const [resultUrl, setResultUrl] = useState("");

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const startQuiz = () => {
    if (!userName.trim()) { setFormError("お名前を入力してください"); return; }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFormError("有効なメールアドレスを入力してください"); return; }
    setFormError("");
    setScreen("quiz");
    setCurrentQ(0);
    scrollTop();
  };

  const isQuestionAnswered = (q) => {
    const a = answers[q.id];
    if (q.type === "slider") return true;
    if (q.type === "pick2") return a && a.length === 2;
    if (q.type === "pick1of3") return !!a;
    return false;
  };

  const goNext = () => { if (currentQ < QUESTIONS.length - 1) { setCurrentQ((c) => c + 1); scrollTop(); } };
  const goPrev = () => { if (currentQ > 0) { setCurrentQ((c) => c - 1); scrollTop(); } };

  const submitQuiz = async () => {
    const res = computeResults(answers);
    setResults(res);
    setScreen("results");
    scrollTop();
    try {
      const { data } = await supabase.from("diagnoses").insert({ name: userName, email, answers }).select("id").single();
      if (data && data.id) setResultUrl(`${window.location.origin}/result/${data.id}`);
    } catch (e) { console.error("Save error:", e); }
  };

  const resetToLanding = () => {
    setScreen("landing"); setAnswers({}); setCurrentQ(0); setResults(null); setResultUrl(""); setUserName(""); setEmail(""); scrollTop();
  };

  const q = QUESTIONS[currentQ];
  const allAnswered = QUESTIONS.every((qq) => isQuestionAnswered(qq));

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <style>{globalStyles}</style>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>

        {screen === "landing" && (
          <div>
            <div style={{ textAlign: "center", paddingTop: 40, marginBottom: 40 }}>
              <div style={{ display: "inline-block", padding: "6px 16px", border: `1px solid ${COLORS.borderLight}`, borderRadius: 20, color: COLORS.textMuted, fontSize: 12, marginBottom: 20, letterSpacing: 1 }}>THINKING TYPE DIAGNOSIS</div>
              <h1 style={{ color: COLORS.text, fontSize: 28, fontWeight: 700, lineHeight: 1.4, marginBottom: 16 }}>エンジニアリング<br />思考タイプ診断</h1>
              <p style={{ color: COLORS.textMuted, fontSize: 15, lineHeight: 1.8, marginBottom: 32 }}>14の質問に答えるだけで、<br />あなたの思考・行動パターンの傾向がわかります。<br /><span style={{ fontSize: 13 }}>所要時間：約7分</span></p>

              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, marginBottom: 28, textAlign: "left" }}>
                <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 14 }}>7つの軸であなたの傾向を分析します</p>
                {Object.entries(CATEGORY_META).map(([key, meta]) => (
                  <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: key !== "collaboration" ? `1px solid ${COLORS.border}` : "none" }}>
                    <span style={{ fontSize: 18 }}>{meta.icon}</span>
                    <span style={{ color: COLORS.text, fontSize: 14 }}>{meta.name}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginBottom: 12 }}>
                <input type="text" placeholder="お名前" value={userName} onChange={(e) => { setUserName(e.target.value); setFormError(""); }}
                  style={{ width: "100%", padding: "14px 18px", background: COLORS.surfaceLight, border: `1.5px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, fontSize: 15, outline: "none" }} />
              </div>
              <div style={{ marginBottom: 20 }}>
                <input type="email" placeholder="メールアドレス" value={email} onChange={(e) => { setEmail(e.target.value); setFormError(""); }}
                  style={{ width: "100%", padding: "14px 18px", background: COLORS.surfaceLight, border: `1.5px solid ${COLORS.border}`, borderRadius: 10, color: COLORS.text, fontSize: 15, outline: "none" }} />
                {formError && <p style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{formError}</p>}
              </div>

              <button onClick={startQuiz} style={{ width: "100%", padding: "16px", background: `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})`, color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 600, cursor: "pointer", letterSpacing: 1 }}>診断をはじめる</button>
            </div>
            <div style={{ textAlign: "center", marginTop: 40 }}>
              <a href="/admin" style={{ background: "none", border: "none", color: COLORS.textMuted, fontSize: 12, cursor: "pointer", opacity: 0.5, textDecoration: "none" }}>管理者ログイン</a>
            </div>
          </div>
        )}

        {screen === "quiz" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <span style={{ color: COLORS.textMuted, fontSize: 13 }}>{CATEGORY_META[q.category].icon} {CATEGORY_META[q.category].name}</span>
              <span style={{ color: COLORS.textMuted, fontSize: 13 }}>{currentQ + 1} / {QUESTIONS.length}</span>
            </div>
            <div style={{ height: 3, background: COLORS.surfaceLight, borderRadius: 2, marginBottom: 32, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${((currentQ + 1) / QUESTIONS.length) * 100}%`, background: `linear-gradient(90deg, ${COLORS.accent}, ${COLORS.purple})`, transition: "width 0.3s", borderRadius: 2 }} />
            </div>

            {q.type === "slider" && <SliderQuestion question={q} value={answers[q.id]} onChange={(val) => setAnswers((p) => ({ ...p, [q.id]: val }))} />}
            {q.type === "pick2" && <Pick2Question question={q} value={answers[q.id]} onChange={(val) => setAnswers((p) => ({ ...p, [q.id]: val }))} />}
            {q.type === "pick1of3" && <Pick1of3Question question={q} value={answers[q.id]} onChange={(val) => setAnswers((p) => ({ ...p, [q.id]: val }))} />}

            <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
              <button onClick={goPrev} disabled={currentQ === 0} style={{ flex: 1, padding: "14px", background: COLORS.surfaceLight, color: currentQ === 0 ? COLORS.borderLight : COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 10, fontSize: 14, cursor: currentQ === 0 ? "default" : "pointer" }}>← 前へ</button>
              {currentQ < QUESTIONS.length - 1 ? (
                <button onClick={goNext} disabled={!isQuestionAnswered(q)} style={{ flex: 1, padding: "14px", background: isQuestionAnswered(q) ? `linear-gradient(135deg, ${COLORS.accent}, ${COLORS.purple})` : COLORS.surfaceLight, color: isQuestionAnswered(q) ? "#fff" : COLORS.borderLight, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: isQuestionAnswered(q) ? "pointer" : "default" }}>次へ →</button>
              ) : (
                <button onClick={submitQuiz} disabled={!allAnswered} style={{ flex: 1, padding: "14px", background: allAnswered ? `linear-gradient(135deg, ${COLORS.green}, ${COLORS.accent})` : COLORS.surfaceLight, color: allAnswered ? "#fff" : COLORS.borderLight, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: allAnswered ? "pointer" : "default" }}>結果を見る</button>
              )}
            </div>
          </div>
        )}

        {screen === "results" && results && (
          <div>
            <ResultsView results={results} />
            {resultUrl && (
              <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 20, marginTop: 20, textAlign: "center" }}>
                <p style={{ color: COLORS.textMuted, fontSize: 13, marginBottom: 10 }}>以下のURLから、いつでも結果を確認できます</p>
                <div style={{ background: COLORS.surfaceLight, borderRadius: 8, padding: "10px 14px", wordBreak: "break-all", fontSize: 13, color: COLORS.accent, marginBottom: 12 }}>{resultUrl}</div>
                <button onClick={() => navigator.clipboard.writeText(resultUrl)} style={{ padding: "8px 20px", background: COLORS.accentGlow, color: COLORS.accent, border: `1px solid ${COLORS.accent}`, borderRadius: 8, cursor: "pointer", fontSize: 13 }}>URLをコピー</button>
              </div>
            )}
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button onClick={resetToLanding} style={{ padding: "10px 28px", background: COLORS.surfaceLight, color: COLORS.textMuted, border: `1px solid ${COLORS.border}`, borderRadius: 10, cursor: "pointer", fontSize: 14 }}>トップに戻る</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
