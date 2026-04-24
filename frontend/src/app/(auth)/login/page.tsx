"use client";

import { useState, Suspense } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api";
import Link from "next/link";

function AuthForm() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams?.get("tab") === "signup" ? "signup" : "login";

  // Login State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Forgot Password Mockup State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);

  const handleForgotSubmit = (e: any) => {
    e.preventDefault();
    if (!forgotEmail) return;
    // Mock API call
    setTimeout(() => setForgotSent(true), 1000);
  };

  // Signup State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"CUSTOMER" | "SELLER">("CUSTOMER");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((state) => state.login);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: loginEmail,
        password: loginPassword,
      });
      if (res.token) {
        login(res.user, res.token);
        if (res.user.role === "ADMIN") {
          router.push("/dashboard/admin");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(res.message || "Login failed");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during login");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: any = { name, email, password, role };

      // Fix for Seller Signup: Backend requires location if role is SELLER
      if (role === "SELLER") {
        payload.location = {
          lat: 51.505, // Default/Mock location
          lng: -0.09,
          address: "Unknown Location",
        };
      }

      const res = await api.post("/auth/signup", payload);

      if (res.token) {
        login(res.user, res.token);
        router.push("/dashboard");
      } else if (res.message) {
        // Pending approval case
        setError(res.message);
        // Force switch to login tab to see the error? Or just show it here.
        // Showing it here is fine.
      } else {
        if (res.errors) {
          // Zod errors
          const msgs = res.errors
            .map((e: any) => `${e.path.join(".")}: ${e.message}`)
            .join(", ");
          setError(msgs);
        } else {
          setError(res.message || "Signup failed");
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.message || "An error occurred during signup. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    // Mock Google Auth
    alert(
      "Google Auth integration would happen here via NextAuth or Firebase.",
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="flex w-full items-center p-6 bg-card border-b border-border">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold text-xl text-green-700"
        >
          BudPlug
        </Link>
      </header>
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-[450px]">
          <CardHeader className="text-center flex flex-col items-center">
            <CardTitle className="text-2xl font-bold text-green-700 mb-2">
              BudPlug
            </CardTitle>
            <img src="/logo.png" alt="BudPlug Logo" className="w-20 h-20 object-contain rounded-full shadow-lg mb-2" />
            <CardDescription>
              Welcome to your local plant marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                {!showForgot ? (
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="m@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <PasswordInput
                        id="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setShowForgot(true)}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Forgot Password?
                        </button>
                      </div>
                    </div>
                    {error && (
                      <div
                        className={`text-sm p-2 rounded ${error.includes("pending") ? "bg-yellow-50 text-yellow-800 border border-yellow-200" : "bg-red-50 text-red-600 border border-red-200"}`}
                      >
                        {error}
                      </div>
                    )}
                    <Button
                      type="submit"
                      className="w-full bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      {loading ? "Logging in..." : "Login"}
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    {!forgotSent ? (
                      <>
                        <div className="text-center space-y-2">
                          <h3 className="font-semibold text-gray-900">
                            Reset Password
                          </h3>
                          <p className="text-sm text-gray-500">
                            Enter your email to receive a reset link.
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="forgot-email">Email</Label>
                          <Input
                            id="forgot-email"
                            type="email"
                            value={forgotEmail}
                            onChange={(e) => setForgotEmail(e.target.value)}
                            placeholder="m@example.com"
                          />
                        </div>
                        <Button
                          type="button"
                          onClick={handleForgotSubmit}
                          className="w-full bg-green-600 hover:bg-green-700"
                        >
                          Send Reset Link
                        </Button>
                        <button
                          type="button"
                          onClick={() => setShowForgot(false)}
                          className="w-full text-sm text-gray-500 hover:underline"
                        >
                          Back to Login
                        </button>
                      </>
                    ) : (
                      <div className="text-center space-y-4 py-4">
                        <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 text-2xl">
                          ✉️
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            Check your email
                          </h3>
                          <p className="text-sm text-gray-500 mt-1">
                            We sent a password reset link to <br />{" "}
                            <span className="font-medium text-gray-900">
                              {forgotEmail}
                            </span>
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowForgot(false);
                            setForgotSent(false);
                          }}
                          className="w-full"
                        >
                          Back to Login
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-email">Email</Label>
                    <Input
                      id="s-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">I want to</Label>
                    <Select value={role} onValueChange={(v: any) => setRole(v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CUSTOMER">Buy Products</SelectItem>
                        <SelectItem value="SELLER">Sell Products</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="s-password">Password</Label>
                    <PasswordInput
                      id="s-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                  {error && (
                    <div
                      className={`text-sm p-2 rounded ${error.includes("pending") || error.includes("approval") ? "bg-blue-50 text-blue-800 border border-blue-200" : "bg-red-50 text-red-600 border border-red-200"}`}
                    >
                      {error}
                    </div>
                  )}
                  <Button
                    type="submit"
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={loading}
                  >
                    {loading ? "Creating Account..." : "Sign Up"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogle}
            >
              <svg
                className="mr-2 h-4 w-4"
                aria-hidden="true"
                focusable="false"
                data-prefix="fab"
                data-icon="google"
                role="img"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                ></path>
              </svg>
              Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthForm />
    </Suspense>
  );
}
