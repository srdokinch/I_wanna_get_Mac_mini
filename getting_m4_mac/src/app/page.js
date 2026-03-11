export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          🍎 Apple整備品 在庫通知
        </h1>
        <p className="text-gray-600 mb-8 leading-relaxed">
          M4 Mac miniが入荷したら
          <br />
          すぐにLINEでお知らせします
        </p>
        <div className="rounded-xl bg-gray-100 py-4 px-6 text-gray-700 font-medium">
          LINEで通知を受け取る 🔔
        </div>
      </div>
    </div>
  );
}
