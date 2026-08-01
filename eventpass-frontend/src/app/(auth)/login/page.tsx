"use client";

import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const user = await login(values.email, values.password);
      toast({ title: `Welcome back, ${user.name.split(" ")[0]}!`, variant: "success" });
      router.push("/overview");
    } catch (err) {
      toast({ title: "Sign in failed", description: err instanceof ApiClientError ? err.message : "Please try again.", variant: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Access your EventPass workspace.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />
            {errors.email ? <p className="text-xs text-danger">{errors.email.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input id="password" type="password" autoComplete="current-password" placeholder="••••••••" {...register("password")} />
            {errors.password ? <p className="text-xs text-danger">{errors.password.message}</p> : null}
          </div>
          <Button type="submit" className="w-full" loading={submitting}>
            Sign in
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-fg-secondary">
          No account?{" "}
          <Link href="/register" className="font-medium text-primary hover:text-primary-hover">
            Create one
          </Link>
        </p>
        <div className="mt-6 rounded-md border border-border bg-surface-2 p-3 text-xs text-fg-muted">
          <p className="mb-1 font-medium text-fg-secondary">Demo accounts</p>
          <p>organizer: priya@eventpass.dev / organizer123</p>
          <p>security: gate1@eventpass.dev / security123</p>
        </div>
      </CardContent>
    </Card>
  );
}
