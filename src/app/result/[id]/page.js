"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { computeResults } from "@/lib/diagnosis-data";
import { COLORS } from "@/lib/colors";
import ResultsView from "@/components/ResultsView";

export default function ResultPage() {
  const params = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("diagnoses")
          .select("*")
          .eq("id", params.id)
          .single();

        if (fetchError || !data) {
          setError("診断結果が見つかりませんでした");
          setLoading(false);
          return;
        }

        const res = computeResults(data.answers);
        setResults(res);
      } catch (e) {
        setError("エラーが発生しました");
      }
      setLoading(false);
    })();
  }, [params.id]);

  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg }}>
      <div style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px 60px" }}>
        {loading && (
          <p style={{ color: COLORS.textMuted, textAlign: "center", paddingTop: 60 }}>読み込み中...</p>
        )}
        {error && (
          <div style={{ textAlign: "center", paddingTop: 60 }}>
            <p style={{ color: "#f87171", fontSize: 16, marginBottom: 16 }}>{error}</p>
            <a href="/" style={{ color: COLORS.accent, fontSize: 14 }}>トップページへ</a>
          </div>
        )}
        {results && <ResultsView results={results} />}
      </div>
    </div>
  );
}
