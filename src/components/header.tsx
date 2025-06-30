import Link from 'next/link';
import AuthButton from './auth-button';
import Image from 'next/image';

const Logo = () => (
  <Image
    src="/logo.png"
    alt="Equation Ace Logo"
    width={160}
    height={50}
    priority
  />
);

export default function Header() {
  return (
    <header className="border-b border-border backdrop-blur-lg sticky top-0 z-50 bg-background/80">
      <div className="w-full px-6">
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
