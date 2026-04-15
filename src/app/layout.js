import "./globals.css";

export const metadata = {
  title: "エンジニアリング思考タイプ診断",
  description: "14の質問に答えるだけで、あなたの思考・行動パターンの傾向がわかります",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ja">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
