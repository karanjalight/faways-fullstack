"use client";

import * as React from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase-client";
import { Eye, EyeOff, GalleryVerticalEnd } from "lucide-react";

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: "admin",
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setMessage("Check your email to confirm your account.");
  }

  return (
    <form
      className={cn(
        "flex flex-col gap-8 rounded-3xl p-6",
        "md:p-8",
        className
      )}
      onSubmit={onSubmit}
      {...props}
    >
      <div className="space-y-2">
      <div className="flex justify-start gap-2 mb-4 ">
              <a href="#" className="flex items-center gap-2 font-semibold tracking-tight">
                <div className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-sm">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <span className="text-lg">Faways</span>
              </a>
            </div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/80">
          Get started
        </p>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Create your Faways account
        </h1>
        <p className="text-sm text-muted-foreground">
          Open an account in a few seconds and start managing your portfolio.
        </p>
      </div>
      <FieldGroup className="border-none bg-transparent p-0 shadow-none gap-5">
        {error && (
          <FieldDescription className="text-sm text-red-500">
            {error}
          </FieldDescription>
        )}
        {message && (
          <FieldDescription className="text-sm text-emerald-500">
            {message}
          </FieldDescription>
        )}
        <Field className="gap-1.5">
          <FieldLabel htmlFor="email">Work email</FieldLabel>
          <Input
            id="email"
            type="email"
            placeholder="you@company.com"
            className="h-11 rounded-xl bg-background/60 shadow-inner shadow-black/5"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="h-11 rounded-xl bg-background/60 shadow-inner shadow-black/5 pr-10"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </Field>
        <Field className="gap-1.5">
          <FieldLabel htmlFor="confirm-password">Confirm password</FieldLabel>
          <Input
            id="confirm-password"
            type="password"
            className="h-11 rounded-xl bg-background/60 shadow-inner shadow-black/5"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>
        <Field>
          <Button
            type="submit"
            disabled={loading}
            className="h-11 w-full rounded-full bg-blue-800 text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </Field>
        <FieldDescription className="text-left text-xs">
          Already have an account?{" "}
          <a href="/login" className="font-medium underline underline-offset-4">
            Log in
          </a>
        </FieldDescription>
      </FieldGroup>
    </form>
  );
}

