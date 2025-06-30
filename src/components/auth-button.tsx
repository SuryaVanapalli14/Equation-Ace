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
import { LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const GoogleGIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512 110.3 512 0 401.7 0 265.2 0 128.5 110.3 19.2 244 19.2c71.2 0 130.3 27.8 177.1 72.8l-66.3 64.4c-26-24.5-60.6-39.7-110.8-39.7-84.3 0-152.4 68.8-152.4 153.2 0 84.4 68.1 153.2 152.4 153.2 97.4 0 135.2-67.5 140.8-102.7H244v-75h244z"></path>
    </svg>
);


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
      <Button onClick={handleSignIn} variant="google">
        <GoogleGIcon />
        Login
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
