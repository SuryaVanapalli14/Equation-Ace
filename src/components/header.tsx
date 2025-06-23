import Link from 'next/link';
import { Calculator } from 'lucide-react';
import AuthButton from './auth-button';

export default function Header() {
  return (
    <header className="border-b border-border/40 backdrop-blur-lg sticky top-0 z-50 bg-background/95">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold font-headline hover:text-primary transition-colors">
            <Calculator className="w-7 h-7" />
            Equation Ace
          </Link>
          <AuthButton />
        </div>
      </div>
    </header>
  );
}
