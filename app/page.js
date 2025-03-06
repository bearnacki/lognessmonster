import LogAnalyzer from "@/components/log-analyzer/LogAnalyzer";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            LogNessMonster
          </h1>
          <p className="text-xl text-gray-600">
            Your logs analysis & visualization tool
          </p>
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
