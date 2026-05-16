"use client";

import { Button } from "@codecon/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Input } from "@codecon/ui/components/input";
import { Label } from "@codecon/ui/components/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@codecon/ui/components/table";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { trpc } from "@/utils/trpc";

type Stadium = {
  id: number;
  name: string;
  city: string;
};

export default function Page() {
  const stadiums = useQuery(trpc.stadium.getAll.queryOptions());
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState<Stadium | null>(null);
  const [stadiumToDelete, setStadiumToDelete] = useState<Stadium | null>(null);

  const openCreateForm = () => {
    setSelectedStadium(null);
    setIsFormOpen(true);
  };

  const openEditForm = (stadium: Stadium) => {
    setSelectedStadium(stadium);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setSelectedStadium(null);
  };

  const handleSaved = () => {
    stadiums.refetch();
    closeForm();
  };

  const handleDeleted = () => {
    stadiums.refetch();
    setStadiumToDelete(null);
  };

  return (
    <div className="min-h-[calc(100vh-2.5rem)] p-2 sm:p-3">
      <Card className="min-w-0">
        <CardHeader className="flex flex-col gap-3 align-top sm:flex-row sm:justify-between">
          <div className="min-w-0">
            <CardTitle>Estádios</CardTitle>
            <CardDescription>
              Gerencie os estádios disponíveis para as partidas.
            </CardDescription>
          </div>
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={openCreateForm}
          >
            <Plus className="size-4" />
            Cadastrar estádio
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          {stadiums.isLoading && (
            <div className="flex justify-center py-4">
              <Loader2 className="size-5 animate-spin" />
            </div>
          )}

          {stadiums.isError && <div>Erro: {stadiums.error.message}</div>}

          {stadiums.data?.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nenhum estádio cadastrado.
            </div>
          )}

          {stadiums.data !== undefined && stadiums.data.length > 0 && (
            <Table>
              <TableHeader className="hidden sm:table-header-group">
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stadiums.data.map((stadium) => (
                  <StadiumRow
                    key={stadium.id}
                    stadium={stadium}
                    onEdit={() => openEditForm(stadium)}
                    onDelete={() => setStadiumToDelete(stadium)}
                  />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={isFormOpen}
        onOpenChange={(open) => {
          if (!open) closeForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedStadium ? "Editar estádio" : "Cadastrar estádio"}
            </DialogTitle>
            <DialogDescription>
              {selectedStadium
                ? "Atualize os dados do estádio selecionado."
                : "Informe os dados do novo estádio."}
            </DialogDescription>
          </DialogHeader>
          <StadiumForm
            key={selectedStadium?.id ?? "create"}
            stadium={selectedStadium}
            onCancel={closeForm}
            onSaved={handleSaved}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={stadiumToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setStadiumToDelete(null);
        }}
      >
        {stadiumToDelete && (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Excluir estádio</DialogTitle>
              <DialogDescription>
                Esta ação oculta {stadiumToDelete.name} da lista de estádios e
                das opções de Partidas. Partidas existentes manterão este
                estádio no histórico.
              </DialogDescription>
            </DialogHeader>
            <DeleteStadiumForm
              stadium={stadiumToDelete}
              onCancel={() => setStadiumToDelete(null)}
              onDeleted={handleDeleted}
            />
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function StadiumRow({
  stadium,
  onEdit,
  onDelete,
}: {
  stadium: Stadium;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <TableRow className="block p-3 sm:table-row sm:p-0">
      <TableCell className="block whitespace-normal p-0 font-medium sm:table-cell sm:p-2">
        <span className="break-words">{stadium.name}</span>
      </TableCell>
      <TableCell className="mt-2 flex justify-between gap-3 whitespace-normal p-0 text-xs sm:mt-0 sm:table-cell sm:p-2 sm:text-sm">
        <span className="text-muted-foreground sm:hidden">Cidade</span>
        <span className="break-words text-right sm:text-left">
          {stadium.city}
        </span>
      </TableCell>
      <TableCell className="block p-0 pt-3 text-right sm:table-cell sm:p-2">
        <div className="flex justify-stretch gap-2 sm:justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
            Editar
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="w-full sm:w-auto"
            onClick={onDelete}
          >
            <Trash2 className="size-3.5" />
            Excluir
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function StadiumForm({
  stadium,
  onSaved,
  onCancel,
}: {
  stadium: Stadium | null;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(stadium?.name ?? "");
  const [city, setCity] = useState(stadium?.city ?? "");

  const createStadium = useMutation(
    trpc.stadium.create.mutationOptions({
      onSuccess: () => {
        toast.success("Estádio cadastrado");
      },
    }),
  );

  const updateStadium = useMutation(
    trpc.stadium.update.mutationOptions({
      onSuccess: () => {
        toast.success("Estádio atualizado");
      },
    }),
  );

  const isPending = createStadium.isPending || updateStadium.isPending;
  const error = createStadium.error ?? updateStadium.error;
  const trimmedName = name.trim();
  const trimmedCity = city.trim();
  const canSubmit = trimmedName.length > 0 && trimmedCity.length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    try {
      if (stadium) {
        await updateStadium.mutateAsync({
          stadiumId: stadium.id,
          name: trimmedName,
          city: trimmedCity,
        });
      } else {
        await createStadium.mutateAsync({
          name: trimmedName,
          city: trimmedCity,
        });
      }
      onSaved();
    } catch {
      // The mutation state renders the inline error message.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid min-w-0 gap-4">
      <div className="min-w-0 space-y-2">
        <Label htmlFor="stadium-name">Nome</Label>
        <Input
          id="stadium-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          maxLength={120}
          required
        />
      </div>

      <div className="min-w-0 space-y-2">
        <Label htmlFor="stadium-city">Cidade</Label>
        <Input
          id="stadium-city"
          value={city}
          onChange={(event) => setCity(event.target.value)}
          disabled={isPending}
          maxLength={120}
          required
        />
      </div>

      {error && <p className="text-xs text-destructive">{error.message}</p>}

      <DialogFooter className="min-w-0 flex-wrap sm:[&_[data-slot=button]]:w-auto [&_[data-slot=button]]:w-full">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={!canSubmit || isPending}>
          {isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : stadium ? (
            "Salvar"
          ) : (
            "Cadastrar"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}

function DeleteStadiumForm({
  stadium,
  onDeleted,
  onCancel,
}: {
  stadium: Stadium;
  onDeleted: () => void;
  onCancel: () => void;
}) {
  const deleteStadium = useMutation(
    trpc.stadium.delete.mutationOptions({
      onSuccess: () => {
        toast.success("Estádio excluído");
      },
    }),
  );

  const handleDelete = async () => {
    try {
      await deleteStadium.mutateAsync({ stadiumId: stadium.id });
      onDeleted();
    } catch {
      // The mutation state renders the inline error message.
    }
  };

  return (
    <div className="grid min-w-0 gap-4">
      {deleteStadium.isError && (
        <p className="text-xs text-destructive">
          {deleteStadium.error.message}
        </p>
      )}

      <DialogFooter className="min-w-0 flex-wrap sm:[&_[data-slot=button]]:w-auto [&_[data-slot=button]]:w-full">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={deleteStadium.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={deleteStadium.isPending}
        >
          {deleteStadium.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            "Excluir estádio"
          )}
        </Button>
      </DialogFooter>
    </div>
  );
}
