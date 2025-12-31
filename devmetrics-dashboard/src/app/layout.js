import "./globals.css";
import { AuthLayout } from "./layouts/AuthLayout";

export const metadata = {
  title: "DevMetrics Dashboard",
  description: "Analytics and monitoring dashboard for your APIs",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthLayout>
          {children}
        </AuthLayout>
      </body>
    </html>
  );
}
