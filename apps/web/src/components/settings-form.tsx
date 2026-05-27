"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@codecon/ui/components/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@codecon/ui/components/field";
import { Input } from "@codecon/ui/components/input";
import { Separator } from "@codecon/ui/components/separator";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import z from "zod";

import { authClient } from "@/lib/auth-client";
import { trpc } from "@/utils/trpc";

type SettingsFormProps = {
  initialEmail: string;
  initialName: string;
};

export default function SettingsForm({
  initialEmail,
  initialName,
}: SettingsFormProps) {
  const router = useRouter();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmationEmail, setDeleteConfirmationEmail] = useState("");
  const deleteAccount = useMutation(trpc.account.delete.mutationOptions());

  const normalizedInitialEmail = initialEmail.trim().toLowerCase();
  const normalizedConfirmationEmail = deleteConfirmationEmail
    .trim()
    .toLowerCase();
  const isDeleteConfirmed =
    normalizedInitialEmail.length > 0 &&
    normalizedConfirmationEmail === normalizedInitialEmail;

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

  const handleDeleteAccount = async () => {
    if (!isDeleteConfirmed) {
      toast.error("Digite seu email para confirmar a exclusão");
      return;
    }

    try {
      await deleteAccount.mutateAsync({
        email: deleteConfirmationEmail.trim(),
      });
      setIsDeleteDialogOpen(false);
      toast.success("Conta excluída");
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.replace("/sign-in");
            router.refresh();
          },
          onError: () => {
            router.replace("/sign-in");
            router.refresh();
          },
        },
      });
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a conta",
      );
    }
  };

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
              A nova senha deve ter no mínimo 8 caracteres.
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

      <Card>
        <CardHeader>
          <CardTitle>Zona de perigo</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium">Excluir conta</p>
            <p className="text-xs text-muted-foreground">
              Exclui permanentemente sua conta e encerra sua sessão atual.
            </p>
          </div>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            <Trash2 />
            Delete account
          </Button>
        </CardContent>
      </Card>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => {
          setIsDeleteDialogOpen(open);
          if (!open) {
            setDeleteConfirmationEmail("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete account</DialogTitle>
            <DialogDescription>
              Esta ação é permanente. Para confirmar, digite o email da sua
              conta.
            </DialogDescription>
          </DialogHeader>

          <Field>
            <FieldLabel htmlFor="delete-account-email">Email</FieldLabel>
            <Input
              id="delete-account-email"
              name="delete-account-email"
              type="email"
              value={deleteConfirmationEmail}
              onChange={(e) => setDeleteConfirmationEmail(e.target.value)}
              autoComplete="email"
              placeholder={initialEmail}
              aria-invalid={
                deleteConfirmationEmail.length > 0 && !isDeleteConfirmed
              }
            />
            {deleteConfirmationEmail.length > 0 && !isDeleteConfirmed && (
              <FieldError>O email digitado não confere.</FieldError>
            )}
          </Field>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={deleteAccount.isPending}
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={!isDeleteConfirmed || deleteAccount.isPending}
              onClick={handleDeleteAccount}
            >
              {deleteAccount.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Trash2 />
              )}
              Delete account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
