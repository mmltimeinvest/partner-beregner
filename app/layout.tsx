import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";

export const metadata: Metadata = {
  title: "Partner-beregner • TimeInvest",
  description: "Interaktiv model til partnerindtjening",
};

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="da" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
