"use client"

import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { MoreHorizontal, Edit, CreditCard, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useEffect, useState } from "react"
import type { Payment } from "@/app/types"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "id",
    header: "ID",
  },
  {
    accessorKey: "amount",
    header: "Amount",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "email",
    header: "Email",
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
          <DropdownMenuItem onClick={() => handleEditPayment(row.original)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Payment
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleMarkAsDone(row.original)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDeletePayment(row.original.id)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Payment
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

const data: Payment[] = [
  {
    id: "1",
    amount: 100,
    status: "pending",
    email: "test@example.com",
  },
  {
    id: "2",
    amount: 200,
    status: "paid",
    email: "test2@example.com",
  },
]

const handleEditPayment = (payment: Payment) => {
  alert(`Editing payment ${payment.id}`)
}

const handleMarkAsDone = (payment: Payment) => {
  alert(`Marking payment ${payment.id} as done`)
}

const handleDeletePayment = (id: string) => {
  alert(`Deleting payment ${id}`)
}

const PaymentsTable = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="container mx-auto py-10">
      <Table>
        <TableCaption>A list of your recent payments.</TableCaption>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                return (
                  <TableHead key={header.id}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default PaymentsTable
