"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GoogleAuthProvider, signInWithPopup, signOut, type AuthError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { LogIn, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AuthButton() {
  const { user, loading } = useAuth();
  const { toast } = useToast();

  const handleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      const authError = error as AuthError;
      if (authError.code === 'auth/unauthorized-domain') {
        toast({
          variant: 'destructive',
          title: 'Unauthorized Domain',
          description: "This domain is not authorized for login. Please add it to your Firebase project's authorized domains list in the Authentication settings.",
          duration: 15000,
        });
      } else {
        console.error("Error signing in with Google", error);
        toast({
          variant: 'destructive',
          title: 'Sign-in Error',
          description: "An unexpected error occurred. Please try again or check the console.",
        });
      }
    }
  };

  const handleSignOut = async () => {
    if (!auth) return;
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
      toast({
        variant: 'destructive',
        title: 'Sign-out Error',
        description: 'Failed to sign out. Please try again.',
      });
    }
  };

  if (loading) {
    return <Button variant="ghost" className="w-36 animate-pulse rounded-md bg-muted" />;
  }

  if (!user) {
    return (
      <Button onClick={handleSignIn}>
        <LogIn className="mr-2 h-4 w-4" />
        Login with Google
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user.photoURL ?? ''} alt={user.displayName ?? 'User'} />
            <AvatarFallback>{user.displayName?.charAt(0).toUpperCase() ?? 'U'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.displayName}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
