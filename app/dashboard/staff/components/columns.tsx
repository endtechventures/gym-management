"use client"

import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Edit, Trash } from "lucide-react"

export type Staff = {
  id: string
  name: string
  email: string
  role: string
  phone: string
  status: "active" | "inactive"
  created_at: string
}

export const columns: ColumnDef<Staff>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      return (
        <Badge variant="outline" className="capitalize">
          {role}
        </Badge>
      )
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string
      return <Badge variant={status === "active" ? "default" : "secondary"}>{status}</Badge>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const staff = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(staff.id)}>Copy staff ID</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Edit staff
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash className="mr-2 h-4 w-4" />
              Delete staff
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]
