import { SignIn, useAuth } from "@clerk/react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      setLocation("/");
    }
  }, [isLoaded, isSignedIn, setLocation]);

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center p-4">
      <SignIn
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </div>
  );
}
