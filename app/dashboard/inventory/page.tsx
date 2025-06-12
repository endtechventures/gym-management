"use client"

import { useEffect, useState } from "react"
import { type ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, ExternalLink, MoreHorizontal, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"

interface InventoryItem {
  id: string
  name: string
  description: string
  price: number
  quantity: number
}

const columns: ColumnDef<InventoryItem>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "price",
    header: "Price",
  },
  {
    accessorKey: "quantity",
    header: "Quantity",
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
          <DropdownMenuItem onClick={() => handleEditItem(row.original)}>
            <Edit className="mr-2 h-4 w-4" />
            Edit Item
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleViewItemDetails(row.original)}>
            <ExternalLink className="mr-2 h-4 w-4" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => handleDeleteItem(row.original.id)} className="text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

const data: InventoryItem[] = [
  {
    id: "1",
    name: "Widget A",
    description: "A high-quality widget.",
    price: 19.99,
    quantity: 50,
  },
  {
    id: "2",
    name: "Gadget B",
    description: "An innovative gadget.",
    price: 29.99,
    quantity: 30,
  },
  {
    id: "3",
    name: "Thingamajig C",
    description: "A useful thingamajig.",
    price: 9.99,
    quantity: 100,
  },
]

const InventoryPage = () => {
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>(data)
  const router = useRouter()

  useEffect(() => {
    // Simulate fetching data from an API
    // In a real application, you would fetch data from your backend here
    setInventoryData(data)
  }, [])

  const table = useReactTable({
    data: inventoryData,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  const handleEditItem = (item: InventoryItem) => {
    toast(`Edit item ${item.name}`)
  }

  const handleViewItemDetails = (item: InventoryItem) => {
    toast(`View details for ${item.name}`)
  }

  const handleDeleteItem = (itemId: string) => {
    setInventoryData((prevData) => prevData.filter((item) => item.id !== itemId))
    toast("Item deleted successfully!")
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => router.push("/dashboard/inventory/create")}>Add Item</Button>
      </div>
      <div className="rounded-md border">
        <Table>
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
    </div>
  )
}

export default InventoryPage
