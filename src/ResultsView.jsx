import {
  CATEGORY_META, SLIDER_RESULTS, CHANNEL_RESULTS, COLLAB_RESULTS,
  CHANNEL_LABELS, COLLAB_LABELS, getSliderLabel,
} from "./diagnosis-data";
import { COLORS } from "./colors";

function BarChart({ results }) {
  const sliderCats = ["initiative", "direction", "criteria", "change", "scope"];
  return (
    <div style={{ marginBottom: 32 }}>
      {sliderCats.map((cat) => {
        const meta = CATEGORY_META[cat];
        const score = results.sliderScores[cat];
        const pct = ((score.avg - 1) / 4) * 100;
        return (
          <div key={cat} style={{ marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: COLORS.accent }}>{meta.labelA}</span>
              <span style={{ color: COLORS.textMuted, fontWeight: 600 }}>{meta.icon} {meta.name}</span>
              <span style={{ color: COLORS.pink }}>{meta.labelB}</span>
            </div>
            <div style={{ height: 10, background: COLORS.surfaceLight, borderRadius: 5, position: "relative", overflow: "hidden" }}>
              <div style={{ position: "absolute", left: `${pct}%`, top: -2, width: 14, height: 14, borderRadius: "50%", background: COLORS.accent, transform: "translateX(-50%)", boxShadow: `0 0 10px ${COLORS.accent}` }} />
              <div style={{ position: "absolute", left: "50%", top: 0, width: 1, height: "100%", background: COLORS.borderLight }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ResultSection({ icon, name, label, result }) {
  if (!result) return null;
  return (
    <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <span style={{ fontSize: 22 }}>{icon}</span>
        <span style={{ color: COLORS.text, fontWeight: 700, fontSize: 17 }}>{name}</span>
        <span style={{ color: COLORS.accent, fontSize: 13, background: COLORS.accentGlow, padding: "3px 10px", borderRadius: 20, marginLeft: "auto" }}>{label}</span>
      </div>
      <p style={{ color: COLORS.text, lineHeight: 1.8, fontSize: 14, marginBottom: 14 }}>{result.tendency}</p>
      <div style={{ background: COLORS.accentGlow, borderRadius: 10, padding: 16, marginBottom: 10 }}>
        <p style={{ color: COLORS.green, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>💎 強み</p>
        <p style={{ color: COLORS.text, lineHeight: 1.8, fontSize: 14 }}>{result.strength}</p>
      </div>
      <div style={{ background: "rgba(251, 191, 36, 0.08)", borderRadius: 10, padding: 16 }}>
        <p style={{ color: COLORS.amber, fontWeight: 600, fontSize: 13, marginBottom: 6 }}>💡 意識すると良いこと</p>
        <p style={{ color: COLORS.text, lineHeight: 1.8, fontSize: 14 }}>{result.tip}</p>
      </div>
    </div>
  );
}

export default function ResultsView({ results, showClosing = true }) {
  const sliderCats = ["initiative", "direction", "criteria", "change", "scope"];
  const channelResult = CHANNEL_RESULTS[results.channelKey] || { tendency: "", strength: "", tip: "" };
  const channelLabel = results.channelKey.split("+").map((k) => CHANNEL_LABELS[k] || k).join(" × ");
  const collabResult = COLLAB_RESULTS[results.collabType] || { tendency: "", strength: "", tip: "" };

  return (
    <div>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ color: COLORS.text, fontSize: 22, fontWeight: 700, marginBottom: 8 }}>あなたの思考タイプ</h2>
        <p style={{ color: COLORS.textMuted, fontSize: 14 }}>7つの軸から見た、あなたの思考・行動パターンの傾向です</p>
      </div>

      <div style={{ background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 24, marginBottom: 24 }}>
        <h3 style={{ color: COLORS.text, fontSize: 16, fontWeight: 600, marginBottom: 20 }}>📊 サマリー</h3>
        <BarChart results={results} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <span style={{ background: COLORS.accentGlow, color: COLORS.accent, padding: "6px 14px", borderRadius: 20, fontSize: 13 }}>📡 {channelLabel}</span>
          <span style={{ background: COLORS.accentGlow, color: COLORS.accent, padding: "6px 14px", borderRadius: 20, fontSize: 13 }}>🤝 {COLLAB_LABELS[results.collabType]}</span>
        </div>
      </div>

      {sliderCats.map((cat) => {
        const meta = CATEGORY_META[cat];
        const score = results.sliderScores[cat];
        const label = getSliderLabel(cat, score.bucket);
        const result = SLIDER_RESULTS[cat]?.[score.bucket];
        return <ResultSection key={cat} icon={meta.icon} name={meta.name} label={label} result={result} />;
      })}

      <ResultSection icon="📡" name="情報のインプット方法" label={channelLabel} result={channelResult} />
      <ResultSection icon="🤝" name="連携スタイル" label={COLLAB_LABELS[results.collabType]} result={collabResult} />

      {showClosing && (
        <div style={{ background: `linear-gradient(135deg, ${COLORS.accentDark}, ${COLORS.surface})`, border: `1px solid ${COLORS.borderLight}`, borderRadius: 14, padding: 28, marginTop: 24, textAlign: "center" }}>
          <p style={{ color: COLORS.text, lineHeight: 1.8, fontSize: 15 }}>
            この診断はあなたの思考・行動パターンの<strong>&ldquo;傾向&rdquo;</strong>を示したものです。
            <br />
            セッションでは、この傾向をさらに深掘りし、
            <br />
            あなたのキャリアにどう活かすかを一緒に探っていきます。
          </p>
        </div>
      )}
    </div>
  );
}
