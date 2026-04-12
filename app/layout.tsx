import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { NavLinks } from "@/components/layout/NavLinks";
import { QueryProvider } from "@/components/providers/query-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Acompanhamento de Chegada de Moto",
  description: "Controle de chegada e status de motos da concessionaria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryProvider>
          <main className="bg-[#f7f9fa] min-h-screen">
            <Header />
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <NavLinks />
            </div>
            {children}
            {/* <ToastContainer
              position="top-right"
              autoClose={3000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
            /> */}
          </main>
        </QueryProvider>
      </body>
    </html>
  );
}
