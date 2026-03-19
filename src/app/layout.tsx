import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "API Canvas - The Figma for API Documentation",
  description: "A beautiful, developer-first API documentation editor with live preview",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var s=localStorage.getItem('api-canvas-dark-mode');if(s==='true'||(s===null&&window.matchMedia('(prefers-color-scheme:dark)').matches)){d.classList.add('dark')}}catch(e){}})()`,
          }}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Inter,system-ui,sans-serif] antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
