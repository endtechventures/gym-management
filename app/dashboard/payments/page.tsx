"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Plus,
  Search,
  Download,
  CreditCard,
  DollarSign,
  TrendingUp,
  Calendar,
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
} from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { AddPaymentModal } from "@/components/payments/add-payment-modal"
import { useGymContext } from "@/lib/gym-context"
import { getPayments } from "@/lib/supabase-queries"
import type { Payment } from "@/types/database"
import { DashboardSkeleton } from "@/components/dashboard/skeleton-loader"
import { formatCurrency } from "@/lib/currency"

export default function PaymentsPage() {
  const { currentSubaccountId, isLoading: contextLoading } = useGymContext()
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentSubaccountId && !contextLoading) {
      loadPayments()
    }
  }, [currentSubaccountId, contextLoading])

  const loadPayments = async () => {
    if (!currentSubaccountId) {
      console.log("No subaccount ID available")
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      console.log("Loading payments for subaccount:", currentSubaccountId)
      const data = await getPayments(currentSubaccountId)
      console.log("Loaded payments:", data)
      setPayments(data || [])
    } catch (error) {
      console.error("Error loading payments:", error)
      setPayments([])
    } finally {
      setIsLoading(false)
    }
  }

  const filteredPayments = payments.filter((payment) => {
    const matchesSearch =
      payment.member?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.plan?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.payment_method?.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const handlePaymentAdded = () => {
    loadPayments()
    setShowAddModal(false)
  }

  const exportCSV = () => {
    const headers = ["Member", "Plan", "Base Amount", "Discount", "Final Amount", "Payment Method", "Date", "Notes"]
    const csvContent = [
      headers.join(","),
      ...filteredPayments.map((payment) =>
        [
          payment.member?.name || "",
          payment.plan?.name || "",
          formatCurrency(payment.amount),
          formatCurrency(payment.discount),
          formatCurrency(payment.final_amount),
          payment.payment_method?.name || "",
          new Date(payment.paid_at).toLocaleDateString(),
          payment.notes || "",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "payments.csv"
    a.click()
  }

  const columns = [
    {
      header: "Member",
      accessorKey: "member",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">{row.original.member?.name?.charAt(0) || "M"}</span>
          </div>
          <span className="font-medium">{row.original.member?.name || "Unknown"}</span>
        </div>
      ),
    },
    {
      header: "Plan",
      accessorKey: "plan",
      cell: ({ row }: any) => <Badge variant="outline">{row.original.plan?.name || "No Plan"}</Badge>,
    },
    {
      header: "Base Amount",
      accessorKey: "amount",
      cell: ({ row }: any) => <span className="font-medium">{formatCurrency(row.original.amount)}</span>,
    },
    {
      header: "Discount",
      accessorKey: "discount",
      cell: ({ row }: any) => <span className="text-red-600">-{formatCurrency(row.original.discount)}</span>,
    },
    {
      header: "Final Amount",
      accessorKey: "final_amount",
      cell: ({ row }: any) => (
        <span className="font-medium text-green-600">{formatCurrency(row.original.final_amount)}</span>
      ),
    },
    {
      header: "Payment Method",
      accessorKey: "payment_method",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-2">
          <CreditCard className="h-4 w-4" />
          <span className="capitalize">{row.original.payment_method?.name || "Unknown"}</span>
        </div>
      ),
    },
    {
      header: "Date",
      accessorKey: "paid_at",
      cell: ({ row }: any) => new Date(row.original.paid_at).toLocaleDateString(),
    },
    {
      header: "",
      cell: ({ row }: any) => (
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Payment
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  if (contextLoading || isLoading) {
    return <DashboardSkeleton />
  }

  // Show message if no subaccount is selected
  if (!currentSubaccountId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">No Franchise Selected</h2>
          <p className="text-gray-600">Please select a franchise to view payments</p>
        </div>
      </div>
    )
  }

  const totalRevenue = payments.reduce((sum, p) => sum + p.final_amount, 0)
  const totalDiscount = payments.reduce((sum, p) => sum + p.discount, 0)
  const thisMonthRevenue = payments
    .filter((p) => new Date(p.paid_at).getMonth() === new Date().getMonth())
    .reduce((sum, p) => sum + p.final_amount, 0)
  const todayPayments = payments.filter((p) => {
    const paymentDate = new Date(p.paid_at).toDateString()
    const today = new Date().toDateString()
    return paymentDate === today
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-gray-600">Track and manage all payment transactions</p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Payment
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalRevenue)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-green-100 text-green-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(thisMonthRevenue)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-blue-100 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payments</p>
                <p className="text-2xl font-bold text-gray-900">{payments.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Discounts</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDiscount)}</p>
              </div>
              <div className="p-3 rounded-2xl bg-orange-100 text-orange-600">
                <Calendar className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Export */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" onClick={exportCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payments ({filteredPayments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center py-8">
              <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No payments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? "No payments match your search criteria." : "Get started by adding your first payment."}
              </p>
              {!searchTerm && (
                <div className="mt-6">
                  <Button onClick={() => setShowAddModal(true)} className="bg-green-600 hover:bg-green-700">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Payment
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <DataTable columns={columns} data={filteredPayments} searchKey="member" />
          )}
        </CardContent>
      </Card>

      <AddPaymentModal open={showAddModal} onClose={() => setShowAddModal(false)} onPaymentAdded={handlePaymentAdded} />
    </div>
  )
}
