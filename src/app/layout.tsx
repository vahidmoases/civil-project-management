import React from 'react';
import Header from '@/components/Header';
import localFont from 'next/font/local';
import './globals.css';

// تعریف فونت با فرمت TTF به صورت آفلاین
const vazirFont = localFont({
  src: [
    {
      path: '../../public/fonts/Vazirmatn-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/Vazirmatn-Bold.ttf', // اگر نسخه Bold را هم داری (اختیاری)
      weight: '700',
      style: 'normal',
    }
  ],
  variable: '--font-vazir',
});

export const metadata = {
  title: 'Flowza Civil System',
  description: 'Civil Engineering Invoice Management System',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fa" dir="rtl" className={vazirFont.variable}>
      <body className="bg-gray-50 text-gray-900 antialiased font-sans" style={{ fontFamily: 'var(--font-vazir), sans-serif' }}>
        <Header />
        {children}
      </body>
    </html>
  );
}