"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Edit, Trash2, MoreHorizontal, ExternalLink } from "lucide-react"
import { toast } from "react-hot-toast"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { AlertModal } from "@/components/modals/alert-modal"
import { ApiAlert } from "@/components/ui/api-alert"
import { useOrigin } from "@/hooks/use-origin"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface Trainer {
  id: string
  name: string
  email: string
  phone: string
  createdAt: string
}

const TrainersPage = () => {
  const router = useRouter()
  const origin = useOrigin()
  const [loading, setLoading] = useState(false)
  const [trainers, setTrainers] = useState<Trainer[]>([])
  const [open, setOpen] = useState(false)
  const [trainerIdToDelete, setTrainerIdToDelete] = useState<string | null>(null)
  const [search, setSearch] = useState("")

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/trainers`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setTrainers(data)
    } catch (error) {
      console.error("Failed to fetch trainers:", error)
      toast.error("Failed to fetch trainers.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const columns = [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "phone",
      header: "Phone",
    },
    {
      accessorKey: "createdAt",
      header: "Date",
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleEditTrainer(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Trainer
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleViewTrainerDetails(row.original)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => handleDeleteTrainer(row.original.id)} className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Trainer
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const handleAddTrainer = () => {
    router.push(`/dashboard/trainers/new`)
  }

  const handleEditTrainer = (trainer: Trainer) => {
    router.push(`/dashboard/trainers/${trainer.id}`)
  }

  const handleViewTrainerDetails = (trainer: Trainer) => {
    router.push(`/dashboard/trainers/${trainer.id}/details`)
  }

  const handleOpenConfirmation = (id: string) => {
    setOpen(true)
    setTrainerIdToDelete(id)
  }

  const handleCloseConfirmation = () => {
    setOpen(false)
    setTrainerIdToDelete(null)
  }

  const handleDeleteTrainer = async (id: string) => {
    setOpen(false)
    setLoading(true)
    try {
      const response = await fetch(`/api/trainers/${id}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      toast.success("Trainer deleted.")
      fetchData()
    } catch (error) {
      console.error("Failed to delete trainer:", error)
      toast.error("Failed to delete trainer.")
    } finally {
      setLoading(false)
      setTrainerIdToDelete(null)
    }
  }

  const filteredTrainers = trainers.filter(
    (trainer) =>
      trainer.name.toLowerCase().includes(search.toLowerCase()) ||
      trainer.email.toLowerCase().includes(search.toLowerCase()) ||
      trainer.phone.toLowerCase().includes(search.toLowerCase()),
  )

  return (
    <div className="flex-col">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <div className="flex items-center">
            <Label htmlFor="search">Search:</Label>
            <Input
              id="search"
              placeholder="Search trainers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="ml-2"
            />
          </div>
          <Button onClick={handleAddTrainer}>
            <Plus className="mr-2 h-4 w-4" /> Add Trainer
          </Button>
        </div>
        <Separator />
        <DataTable columns={columns} data={filteredTrainers} searchKey="name" />
      </div>
      <AlertModal
        isOpen={open}
        onClose={handleCloseConfirmation}
        onConfirm={() => handleDeleteTrainer(trainerIdToDelete!)}
        loading={loading}
      />
      {!origin ? (
        <ApiAlert
          title="NEXT_PUBLIC_API_URL not configured."
          description="Please configure the API URL in .env.local"
          variant="warning"
        />
      ) : null}
    </div>
  )
}

export default TrainersPage
