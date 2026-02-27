import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { AuthForm } from "./AuthForm";

export function AuthScreen() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (email: string, password: string) => {
    if (mode === "sign-in") {
      await signIn(email, password);
    } else {
      await signUp(email, password);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Inkling</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Chat with your documents
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-zinc-200 mb-4">
            {mode === "sign-in" ? "Sign In" : "Create Account"}
          </h2>

          <AuthForm mode={mode} onSubmit={handleSubmit} />

          <div className="mt-4 text-center">
            <button
              onClick={() =>
                setMode(mode === "sign-in" ? "sign-up" : "sign-in")
              }
              className="text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {mode === "sign-in"
                ? "Don't have an account? Sign up"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
