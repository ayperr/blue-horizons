import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  title:'Blue Horizons — Find your next escape',
  description:'Discover a JetBlue-inspired escape and plan your flights, stays, rental cars, and airport rides in one place. An independent travel concept.',
  robots: { index:false, follow:false }
};
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {
  return <html lang="en"><body>{children}</body></html>;
}
