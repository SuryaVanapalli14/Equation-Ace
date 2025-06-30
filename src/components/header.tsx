import Link from 'next/link';
import AuthButton from './auth-button';

const Logo = () => (
  // Using an aria-label for accessibility
  <div aria-label="Equation Ace Logo">
    <svg
      width="180" // Adjusted width for better proportion
      height="58" // Adjusted to fit within the h-16 header
      viewBox="0 0 260 95" // Adjusted viewBox for letter spacing and layout
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          {/* Using colors that mimic the provided image's gradient */}
          <stop offset="0%" stopColor="#C2E0FF" />
          <stop offset="100%" stopColor="#A0C7F0" />
        </linearGradient>
      </defs>
      <text
        x="50%"
        y="45"
        fontFamily="Inter, sans-serif"
        fontSize="42"
        fontWeight="bold"
        fill="url(#logoGradient)"
        textAnchor="middle"
        letterSpacing="2"
      >
        EQUATION
      </text>
      <text
        x="50%"
        y="90" // Positioned below "EQUATION"
        fontFamily="Inter, sans-serif"
        fontSize="42"
        fontWeight="bold"
        fill="url(#logoGradient)"
        textAnchor="middle"
        letterSpacing="2"
      >
        ACE
      </text>
    </svg>
  </div>
);

export default function Header() {
  return (
    <header className="border-b border-border backdrop-blur-lg sticky top-0 z-50 bg-background/80">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center hover:opacity-90 transition-opacity">
            <Logo />
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
