"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email({
    message: "Please enter a valid email",
  }),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  // Optional ?redirect= target (e.g. an invite link that required
  // login); falls back to /dashboard when absent.
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormValues) => {
      const result = await authClient.signIn.email({
        email: data.email,
        password: data.password,
        // Better Auth itself redirects honor the same target.
        callbackURL: redirectTo ?? "/dashboard",
      });

      if (result.error) {
        throw new Error(result.error.message || "Login failed");
      }

      return result;
    },
    onSuccess: () => {
      // Land on ?redirect= (invite flows) or /dashboard by default.
      // window.location (not router.push) because the target is a
      // dynamic string — typed routes only accept route literals —
      // and a full reload cleanly re-roots the app after login.
      window.location.assign(redirectTo ?? "/dashboard");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to login");
    },
  });

  const onSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  return (
    <div className={cn("flex flex-col gap-7", className)} {...props}>
      <div>
        <h1 className="text-[24px] leading-tight font-semibold tracking-tight">
          Sign in
        </h1>
        <p className="text-muted-foreground mt-1.5 text-[13px] leading-relaxed">
          Use the email address your workspace invite was sent to.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px]">Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    autoComplete="email"
                    placeholder="you@team.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-[12px]">Password</FormLabel>
                <FormControl>
                  <InputGroup>
                    <InputGroupInput
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      {...field}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        onClick={() => setShowPassword(!showPassword)}
                        size="icon-xs"
                        type="button"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="mt-2 w-full"
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {loginMutation.isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Form>

      <div className="border-border text-muted-foreground border-t pt-5 text-[13px]">
        No workspace yet?{" "}
        <Link
          href="/sign-up"
          className="text-foreground underline underline-offset-4 transition-colors hover:text-primary"
        >
          Open one
        </Link>
      </div>
    </div>
  );
}
