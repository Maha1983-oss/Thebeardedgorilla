"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Login failed");
        toast.error("Login failed", {
          description:
            data.error || "Invalid email or password. Please try again.",
        });
        return;
      }

      toast.success("Login successful!", {
        description: `Welcome back! Redirecting to your dashboard...`,
      });

      // Navigate based on user role
      if (data.role === "admin") {
        router.push("/");
      } else if (data.role === "client1") {
        router.push("/client1");
      } else if (data.role === "client2") {
        router.push("/client2");
      } else {
        router.push("/");
      }

      // Force a refresh to update the session
      router.refresh();
    } catch (err) {
      setError("An error occurred. Please try again.");
      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again.",
      });
      console.error("Login error:", err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={cn(
        // keeps it centered and consistent without breaking parent layouts
        "mx-auto w-full max-w-md",
        className
      )}
      {...props}
    >
      <Card className="rounded-2xl border border-border/60 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <span>Welcome back</span>
          </div>
          <div className="flex items-center justify-center py-2">
            <img
              src="/logo.png"
              alt="Logo"
              className="h-12 w-12 object-contain"
            />
          </div>
          <CardTitle className="text-2xl leading-tight text-center">
            Login to your account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your credentials to continue. Your session is protected with
            secure authentication.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="grid gap-6">
            {error && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{error}</p>
              </div>
            )}

            <FieldGroup className="grid gap-5">
              {/* Email */}
              <Field className="grid gap-2">
                <FieldLabel htmlFor="email" className="text-foreground">
                  Email
                </FieldLabel>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="example@gmail.com"
                    required
                    className="h-11 w-full pl-9"
                    aria-label="Email address"
                  />
                </div>
              </Field>

              {/* Password row header */}
              <div className="flex items-baseline justify-between">
                <FieldLabel htmlFor="password" className="text-foreground">
                  Password
                </FieldLabel>
              </div>

              {/* Password */}
              <Field className="grid gap-2 -mt-3">
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="h-11 w-full pl-9 pr-10"
                    aria-label="Password"
                    placeholder="********"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:text-foreground"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <FieldDescription>
                  Use at least 8 characters with a mix of letters and numbers.
                </FieldDescription>
              </Field>

              {/* Submit */}
              <Field className="grid gap-3">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                      Signing in…
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2">
                      Login
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
