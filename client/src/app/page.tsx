"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { Eye, EyeOff } from "lucide-react";
import { setUserName } from "@/features/userSlice";
import { login, saveAuthToken, getAuthToken } from "@/services/authService";

function Home() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  useEffect(() => {
    const token = getAuthToken();
    if (token) {
      router.replace("/chat/raywit");
    }
  }, [router]);

  const handleLogin = async () => {
    const normalizedPassword = password.trim();
    if (!normalizedPassword) {
      toast("Enter your password to continue.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const result = await login(normalizedPassword);
      saveAuthToken(result.token);
      dispatch(setUserName(result.userName));
      router.push("/chat/raywit");
    } catch (error) {
      console.error("Login error:", error);
      toast("Login failed. Check your password.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleLogin();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-10 bg-zinc-50 dark:bg-zinc-950">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg shadow-zinc-100/60 dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-black/10">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950 dark:text-white">
            Ray<span className="text-rose-500">Wit</span>
          </h1>
        </div>

        <div className="mt-8 space-y-4">
          <div className="rounded-2xl bg-zinc-100 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
            <p className="font-semibold text-zinc-900 dark:text-white">Login</p>
            <p>Enter your password</p>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Password"
                className="h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-3 flex items-center justify-center text-zinc-500 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>

          <Button
            onClick={handleLogin}
            disabled={isLoggingIn}
            className="w-full h-12 rounded-2xl bg-zinc-950 text-white hover:bg-zinc-900 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-100"
          >
            {isLoggingIn ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default Home;
