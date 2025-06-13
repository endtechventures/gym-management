"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, CreditCard, DollarSign, MoreHorizontal, Edit, Trash2, Eye, FileText, Clock } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import { AddPaymentModal } from "@/components/payments/add-payment-modal"
import { useGymContext } from "@/lib/gym-context"
import { getPayments } from "@/lib/supabase-queries"
import type { Payment } from "@/types/database"
import { DashboardSkeleton } from "@/components/dashboard/skeleton-loader"
import { formatCurrency } from "@/lib/currency"
import { CreatePlanModal } from "@/components/packages/create-plan-modal"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter } from "next/navigation"

export default function PaymentsPage() {
  const { currentSubaccountId, isLoading: contextLoading } = useGymContext()
  const [payments, setPayments] = useState<Payment[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const router = useRouter()

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

  const handlePlanCreated = () => {
    router.refresh()
    setShowCreateModal(false)
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
          <p className="text-gray-600">Manage payments, invoices, and subscription plans</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Plan
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6 pt-6">
          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$45,231.89</div>
                <p className="text-xs text-muted-foreground">+20.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Subscriptions</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+2350</div>
                <p className="text-xs text-muted-foreground">+180.1% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+12,234</div>
                <p className="text-xs text-muted-foreground">+19% from last month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Invoices</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">+201 since last hour</p>
              </CardContent>
            </Card>
          </div>

          {/* More content for the overview tab */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{/* Add more cards or content here */}</div>
        </TabsContent>
        <TabsContent value="invoices" className="space-y-6 pt-6">
          {/* Invoices content */}
          <Card>
            <CardHeader>
              <CardTitle>Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Invoice content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="subscriptions" className="space-y-6 pt-6">
          {/* Subscriptions content */}
          <Card>
            <CardHeader>
              <CardTitle>Subscriptions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Subscription content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="transactions" className="space-y-6 pt-6">
          {/* Transactions content */}
          <Card>
            <CardHeader>
              <CardTitle>Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Transaction content will go here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Plan Modal */}
      <CreatePlanModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onPlanCreated={handlePlanCreated}
      />

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
