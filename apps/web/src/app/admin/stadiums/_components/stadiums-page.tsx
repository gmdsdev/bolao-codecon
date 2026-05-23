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
  DialogHeader,
  DialogTitle,
} from "@codecon/ui/components/dialog";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";

import { trpc } from "@/utils/trpc";

import { DeleteStadiumForm } from "./delete-stadium-form";
import { StadiumForm } from "./stadium-form";
import { StadiumsTable } from "./stadiums-table";
import type { Stadium } from "./types";

export function StadiumsPage() {
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
          <StadiumsTable
            stadiums={stadiums.data}
            isLoading={stadiums.isLoading}
            errorMessage={stadiums.error?.message}
            onEdit={openEditForm}
            onDelete={setStadiumToDelete}
          />
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
