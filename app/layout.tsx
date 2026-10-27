import { Cormorant_Garamond, Montserrat } from 'next/font/google';
import Nav from './nav';
import StatsTracker from './stats-tracker';
import './globals.css';

const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: '500',
  style: 'italic',
  variable: '--font-cormorant',
});

export const metadata = {
  title: {
    default: 'Daily',
    template: '%s · Daily',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${montserrat.variable} ${cormorant.variable}`}>
      <body>
        <Nav siteName="Daily" />
        <StatsTracker />
        <div className="content">
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
