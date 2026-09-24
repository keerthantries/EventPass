"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/lib/auth";
import { ApiClientError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

const schema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast({
        title: `Welcome back, ${user.name.split(" ")[0]}!`,
        variant: "success",
      });
      router.push("/overview");
    } catch (err) {
      toast({
        title: "Sign in failed",
        description:
          err instanceof ApiClientError ? err.message : "Please try again.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="overflow-hidden shadow-lg">
      <div className="h-0.5 bg-gradient-to-r from-primary via-primary-hover to-secondary" aria-hidden />
      <CardHeader className="px-5 pb-1 pt-5">
        <CardTitle className="text-base">Sign in</CardTitle>
        <CardDescription>Access your EventPass workspace.</CardDescription>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="space-y-4"
          noValidate
        >
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-xs text-danger">{errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                className="pr-11"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="absolute right-0 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center text-fg-muted transition-colors hover:text-fg sm:right-0 sm:size-9"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {errors.password ? (
              <p className="text-xs text-danger">{errors.password.message}</p>
            ) : null}
          </div>
          <Button type="submit" size="lg" className="w-full" loading={submitting}>
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-fg-secondary">
          No account?{" "}
          <Link
            href="/register"
            className="font-medium text-primary hover:text-primary-hover"
          >
            Create one
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
