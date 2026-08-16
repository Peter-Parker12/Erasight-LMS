"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useAction } from "next-safe-action/hooks";
import { signIn } from "next-auth/react";

import { acceptInvitation } from "@/actions/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
});
type FormValues = z.infer<typeof schema>;

export function AcceptInviteForm({
  token,
  email,
  defaultName,
}: {
  token: string;
  email: string;
  defaultName: string;
}) {
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: defaultName, password: "", confirmPassword: "" },
  });

  const { execute, isExecuting } = useAction(acceptInvitation, {
    onSuccess: async () => {
      setIsSigningIn(true);
      const result = await signIn("credentials", {
        email,
        password: getValues("password"),
        redirect: false,
      });
      setIsSigningIn(false);

      if (!result || result.error) {
        toast.error("Account created — please sign in.");
        router.push("/sign-in");
        return;
      }

      router.push("/");
      router.refresh();
    },
    onError: ({ error }) => toast.error(error.serverError ?? "Failed to accept invitation."),
  });

  const onSubmit = (values: FormValues) => {
    if (values.password !== values.confirmPassword) {
      toast.error("Passwords don't match.");
      return;
    }
    execute({ token, name: values.name, password: values.password });
  };

  const isBusy = isExecuting || isSigningIn;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" type="password" {...register("confirmPassword")} />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isBusy}>
        Create account
      </Button>
    </form>
  );
}
