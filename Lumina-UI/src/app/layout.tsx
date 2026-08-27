import type { Metadata, Viewport } from 'next';
import { DM_Sans, Manrope } from 'next/font/google';
import './globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const manrope = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-manrope',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.luminadentalstudio.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: 'Lumina Dental Clinic | Precision Dentistry, Complete Comfort',
  description: 'Modern, pain-managed dentistry with transparent pricing, digital intake, and calm clinical care in Northbridge. Accepting new patients.',
  keywords: [
    'Dental clinic',
    'Dentist Northbridge',
    'Laser teeth whitening',
    'Dental cleaning checkup',
    'Clear aligners',
    'Porcelain veneers',
    'Emergency dentist',
    'Lumina Dental Clinic',
  ],
  authors: [{ name: 'Lumina Dental Clinic' }],
  creator: 'Lumina Dental Clinic',
  publisher: 'Lumina Dental Clinic',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: siteUrl,
  },
  icons: {
    icon: [
      { url: '/images/Lumina Dental Clinic Logo.png' },
      { url: '/images/lumina-logo.png' },
    ],
    apple: '/images/lumina-logo.png',
    shortcut: '/images/lumina-logo.png',
  },
  openGraph: {
    title: 'Lumina Dental Clinic | Precision Dentistry, Complete Comfort',
    description: 'Modern, pain-managed dentistry with transparent pricing, digital intake, and calm clinical care in Northbridge. Accepting new patients.',
    url: siteUrl,
    siteName: 'Lumina Dental Clinic',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lumina Dental Clinic | Precision Dentistry, Complete Comfort',
    description: 'Modern, pain-managed dentistry with transparent pricing, digital intake, and calm clinical care. Accepting new patients.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0d9488',
  width: 'device-width',
  initialScale: 1,
};

const dentistSchema = {
  '@context': 'https://schema.org',
  '@type': 'Dentist',
  name: 'Lumina Dental Clinic',
  description: 'Modern, pain-managed dental clinic with transparent pricing, digital intake, and comprehensive specialized dentistry.',
  url: siteUrl,
  telephone: '(415) 555-0142',
  email: 'luminadentalclinic2026@gmail.com',
  priceRange: '$$',
  openingHoursSpecification: [
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:00',
      closes: '18:00',
    },
    {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Saturday'],
      opens: '09:00',
      closes: '15:00',
    },
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '4.9',
    reviewCount: '450',
    bestRating: '5',
    worstRating: '1',
  },
  medicalSpecialty: 'Dentistry',
};

import LumiChatWidget from '@/components/LumiChatWidget';
import AnalyticsTracker from '@/components/AnalyticsTracker';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(dentistSchema) }}
        />
      </head>
      <body>
        <AnalyticsTracker />
        {children}
        <LumiChatWidget />
      </body>
    </html>
  );
}
