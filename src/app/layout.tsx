import type { Metadata } from "next";
import "./globals.css";

/**
 * Default document metadata; locale layouts override it in V1.
 */
export const metadata: Metadata = {
  title: "Cineagenda",
  description: "Film in uscita nei cinema italiani, settimana per settimana.",
};

/**
 * Root layout: document shell shared by every route.
 */
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
