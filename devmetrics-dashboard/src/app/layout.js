import "./globals.css";
import Sidebar from "./components/Sidebar";

export const metadata = {
  title: "DevMetrics Dashboard",
  description: "Analytics and monitoring dashboard for your APIs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}