import LogAnalyzer from "@/components/log-analyzer/LogAnalyzer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-12 py-10 px-6 bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-700 rounded-xl shadow-lg text-center">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-5xl font-extrabold text-white mb-4 drop-shadow-md">
              Uncover the insights in your logs in{" "}
              <span className="text-yellow-300">seconds</span>
            </h1>
            <p className="text-xl text-gray-100 leading-relaxed max-w-1xl mx-auto">
              Transform raw log data into actionable insights with a powerful
              log analysis tool. Visualize patterns and detect anomalies in
              real-time.
            </p>
          </div>
        </header>

        <div className="bg-white rounded-lg shadow-md p-6">
          <LogAnalyzer />
        </div>

        <footer className="mt-12 text-center text-gray-500 text-sm">
          <p>
            © {new Date().getFullYear()} LogNessMonster - Uncover the insights
            in your logs
          </p>
        </footer>
      </div>
    </main>
  );
}
