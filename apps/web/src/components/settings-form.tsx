"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@codecon/ui/components/field";
import { Input } from "@codecon/ui/components/input";
import { Separator } from "@codecon/ui/components/separator";
import { useForm } from "@tanstack/react-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";

type SettingsFormProps = {
  initialName: string;
};

export default function SettingsForm({ initialName }: SettingsFormProps) {
  const router = useRouter();

  const profileForm = useForm({
    defaultValues: {
      name: initialName,
    },
    onSubmit: async ({ value }) => {
      await authClient.updateUser(
        {
          name: value.name.trim(),
        },
        {
          onSuccess: () => {
            router.refresh();
            toast.success("Nome atualizado com sucesso");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        name: z
          .string()
          .trim()
          .min(2, "O nome deve ter pelo menos 2 caracteres"),
      }),
    },
  });

  const passwordForm = useForm({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.changePassword(
        {
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        },
        {
          onSuccess: () => {
            formApi.reset();
            toast.success("Senha atualizada com sucesso");
          },
          onError: (error) => {
            toast.error(error.error.message || error.error.statusText);
          },
        },
      );
    },
    validators: {
      onSubmit: z
        .object({
          currentPassword: z
            .string()
            .min(8, "A senha atual deve ter pelo menos 8 caracteres"),
          newPassword: z
            .string()
            .min(8, "A nova senha deve ter pelo menos 8 caracteres")
            .max(128, "A nova senha deve ter no máximo 128 caracteres"),
          confirmPassword: z.string(),
        })
        .refine((value) => value.newPassword === value.confirmPassword, {
          message: "As senhas não conferem",
          path: ["confirmPassword"],
        }),
    },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 px-3 py-4 sm:px-4 sm:py-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-sm font-medium">Configurações</h1>
        <p className="text-xs text-muted-foreground">
          Gerencie as informações da sua conta.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Perfil</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              profileForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <profileForm.Field name="name">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Nome</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="name"
                  />
                  {field.state.meta.errors.map((error) => (
                    <FieldError key={error?.message}>
                      {error?.message}
                    </FieldError>
                  ))}
                </Field>
              )}
            </profileForm.Field>

            <profileForm.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Salvar nome"}
                </Button>
              )}
            </profileForm.Subscribe>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Senha</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              passwordForm.handleSubmit();
            }}
            className="space-y-4"
          >
            <passwordForm.Field name="currentPassword">
              {(field) => (
                <Field>
                  <FieldLabel htmlFor={field.name}>Senha atual</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="password"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    autoComplete="current-password"
                  />
                  {field.state.meta.errors.map((error) => (
                    <FieldError key={error?.message}>
                      {error?.message}
                    </FieldError>
                  ))}
                </Field>
              )}
            </passwordForm.Field>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <passwordForm.Field name="newPassword">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Nova senha</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      autoComplete="new-password"
                    />
                    {field.state.meta.errors.map((error) => (
                      <FieldError key={error?.message}>
                        {error?.message}
                      </FieldError>
                    ))}
                  </Field>
                )}
              </passwordForm.Field>

              <passwordForm.Field name="confirmPassword">
                {(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>
                      Confirmar senha
                    </FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      autoComplete="new-password"
                    />
                    {field.state.meta.errors.map((error) => (
                      <FieldError key={error?.message}>
                        {error?.message}
                      </FieldError>
                    ))}
                  </Field>
                )}
              </passwordForm.Field>
            </div>

            <FieldDescription>
              A nova senha deve ter entre 8 e 128 caracteres.
            </FieldDescription>

            <passwordForm.Subscribe
              selector={(state) => ({
                canSubmit: state.canSubmit,
                isSubmitting: state.isSubmitting,
              })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Salvando..." : "Alterar senha"}
                </Button>
              )}
            </passwordForm.Subscribe>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
