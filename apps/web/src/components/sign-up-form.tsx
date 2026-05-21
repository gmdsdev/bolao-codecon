"use client";

import { Button } from "@codecon/ui/components/button";
import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

import Loader from "./loader";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import { Field, FieldError, FieldLabel } from "@codecon/ui/components/field";
import Link from "next/link";

export default function SignUpForm() {
  const router = useRouter();
  const { isPending } = authClient.useSession();

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
      name: "",
    },
    onSubmit: async ({ value }) => {
      await authClient.signUp.email(
        {
          email: value.email,
          password: value.password,
          name: value.name,
        },
        {
          onSuccess: () => {
            router.push("/");
            toast.success("Cadastro realizado com sucesso");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
        email: z.email("Endereço de email inválido"),
        password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres"),
      }),
    },
  });

  if (isPending) {
    return <Loader />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <form.Field name="name">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Nome</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  autoFocus
                />
                {field.state.meta.errors.map((error) => (
                  <FieldError key={error?.message}>{error?.message}</FieldError>
                ))}
              </Field>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <Field>
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <FieldError key={error?.message}>{error?.message}</FieldError>
                ))}
              </Field>
            )}
          </form.Field>

          <form.Field name="password">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Senha</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  type="password"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                />
                {field.state.meta.errors.map((error) => (
                  <FieldError key={error?.message}>{error?.message}</FieldError>
                ))}
              </Field>
            )}
          </form.Field>

          <form.Subscribe
            selector={(state) => ({
              canSubmit: state.canSubmit,
              isSubmitting: state.isSubmitting,
            })}
          >
            {({ canSubmit, isSubmitting }) => (
              <Button
                type="submit"
                className="w-full"
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? "Enviando..." : "Cadastrar"}
              </Button>
            )}
          </form.Subscribe>
        </form>
      </CardContent>
      <CardFooter>
        <Link
          href="/sign-in"
          className="text-muted-foreground hover:text-foreground"
        >
          Já tem uma conta? Entrar
        </Link>
      </CardFooter>
    </Card>
  );
}
