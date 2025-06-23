"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (!isFirebaseConfigured) {
    return (
      <div className="dark bg-background text-foreground flex items-center justify-center min-h-screen p-4">
        <Alert variant="destructive" className="max-w-2xl">
          <Terminal className="h-4 w-4" />
          <AlertTitle>Firebase Not Configured</AlertTitle>
          <AlertDescription>
              <div className="space-y-2">
                <p>Your Firebase configuration seems to be missing or incomplete.</p>
                <p>Please copy the contents of <strong>.env.example</strong> to a new file named <strong>.env</strong> and fill in the values from your Firebase project's settings.</p>
                <p className="text-xs text-muted-foreground">You can find these in your Firebase Console: Project settings &gt; General &gt; Your apps &gt; Web app.</p>
                <p className="text-xs text-muted-foreground">After updating the .env file, you must restart the development server for the changes to take effect.</p>
              </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);