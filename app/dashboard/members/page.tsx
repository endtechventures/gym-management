"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { useGymContext } from "@/lib/gym-context"
import { getMembers } from "@/lib/supabase-queries"
import { AddMemberModal } from "@/components/members/add-member-modal"
import { EditMemberModal } from "@/components/members/edit-member-modal"
import { DataTable } from "@/components/ui/data-table"
import type { Member } from "@/types/database"
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  CreditCard,
  User,
  Calendar,
  Phone,
  Mail,
  ExternalLink,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function MembersPage() {
  const { currentSubaccountId } = useGymContext()
  const { toast } = useToast()
  const router = useRouter()
  const [members, setMembers] = useState<Member[]>([])
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([])
  const [monthlyRevenue, setMonthlyRevenue] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editModalTab, setEditModalTab] = useState("details")
  const [selectedMember, setSelectedMember] = useState<Member | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (currentSubaccountId) {
      loadMembers()
      loadMonthlyRevenue()
    }
  }, [currentSubaccountId])

  useEffect(() => {
    const filtered = members.filter(
      (member) =>
        member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        member.phone?.includes(searchTerm),
    )
    setFilteredMembers(filtered)
  }, [members, searchTerm])

  const loadMembers = async () => {
    try {
      setIsLoading(true)
      const data = await getMembers(currentSubaccountId!)
      setMembers(data || [])
    } catch (error) {
      console.error("Error loading members:", error)
      toast({
        title: "Error",
        description: "Failed to load members",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const loadMonthlyRevenue = async () => {
    try {
      if (!currentSubaccountId) return

      // Get current month and year
      const now = new Date()
      const currentMonth = now.getMonth()
      const currentYear = now.getFullYear()

      // Fetch payments for current month
      const { data: payments, error } = await supabase
        .from("payments")
        .select(`
          *,
          member:members!inner(*)
        `)
        .eq("member.subaccount_id", currentSubaccountId)

      if (error) {
        console.error("Error fetching payments:", error)
        return
      }

      // Filter payments for current month and calculate revenue
      const currentMonthPayments = (payments || []).filter((payment) => {
        const paymentDate = new Date(payment.paid_at)
        return paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear
      })

      // Calculate total revenue using final_amount
      const totalRevenue = currentMonthPayments.reduce((sum, payment) => {
        return sum + Number(payment.final_amount || 0)
      }, 0)

      setMonthlyRevenue(totalRevenue)
    } catch (error) {
      console.error("Error calculating monthly revenue:", error)
    }
  }

  const handleEditMember = (member: Member, tab = "details") => {
    setSelectedMember(member)
    setEditModalTab(tab)
    setShowEditModal(true)
  }

  const handleAddPayment = (member: Member) => {
    handleEditMember(member, "payments")
  }

  const handleViewMemberDetails = (member: Member) => {
    router.push(`/dashboard/members/${member.id}`)
  }

  const columns = [
    {
      header: "Member",
      accessorKey: "name",
      cell: ({ row }: any) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0 h-10 w-10">
            <div className="h-10 w-10 rounded-full bg-teal-100 flex items-center justify-center">
              <User className="h-5 w-5 text-teal-600" />
            </div>
          </div>
          <div>
            <div
              className="text-sm font-medium text-gray-900 hover:text-teal-600 cursor-pointer"
              onClick={() => handleViewMemberDetails(row.original)}
            >
              {row.original.name}
            </div>
            <div className="text-sm text-gray-500 flex items-center">
              {row.original.email && (
                <>
                  <Mail className="h-3 w-3 mr-1" />
                  {row.original.email}
                </>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      accessorKey: "phone",
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.phone && (
            <div className="flex items-center text-gray-600">
              <Phone className="h-3 w-3 mr-1" />
              {row.original.phone}
            </div>
          )}
        </div>
      ),
    },
    {
      header: "Plan",
      accessorKey: "plan",
      cell: ({ row }: any) => (
        <div>
          {row.original.plan ? (
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              {row.original.plan.name}
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gray-50 text-gray-500">
              No Plan
            </Badge>
          )}
        </div>
      ),
    },
    {
      header: "Join Date",
      accessorKey: "join_date",
      cell: ({ row }: any) => (
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="h-3 w-3 mr-1" />
          {new Date(row.original.join_date).toLocaleDateString()}
        </div>
      ),
    },
    {
      header: "Next Payment",
      accessorKey: "next_payment",
      cell: ({ row }: any) => (
        <div className="text-sm">
          {row.original.next_payment ? (
            <span className="text-orange-600 font-medium">
              {new Date(row.original.next_payment).toLocaleDateString()}
            </span>
          ) : (
            <span className="text-gray-400">No date</span>
          )}
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "is_active",
      cell: ({ row }: any) => (
        <Badge variant={row.original.is_active ? "default" : "secondary"}>
          {row.original.is_active ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewMemberDetails(row.original)}>
              <ExternalLink className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditMember(row.original)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Member
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleAddPayment(row.original)}>
              <CreditCard className="mr-2 h-4 w-4" />
              Add Payment
            </DropdownMenuItem>
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Member
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  const activeMembers = members.filter((member) => member.is_active).length

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Members</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Members</h1>
        <Button onClick={() => setShowAddModal(true)} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="mr-2 h-4 w-4" />
          Add Member
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Members</p>
                <p className="text-2xl font-bold text-gray-900">{members.length}</p>
              </div>
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <User className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Members</p>
                <p className="text-2xl font-bold text-gray-900">{activeMembers}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <User className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${monthlyRevenue.toFixed(2)}</p>
              </div>
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <CreditCard className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">
                  {
                    members.filter((member) => {
                      const joinDate = new Date(member.join_date)
                      const now = new Date()
                      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear()
                    }).length
                  }
                </p>
              </div>
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <Plus className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search members by name, email, or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Members ({filteredMembers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={filteredMembers} searchKey="name" />
        </CardContent>
      </Card>

      <AddMemberModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        onMemberAdded={() => {
          loadMembers()
          loadMonthlyRevenue() // Refresh revenue when new member added
        }}
      />

      <EditMemberModal
        open={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setEditModalTab("details")
        }}
        onMemberUpdated={() => {
          loadMembers()
          loadMonthlyRevenue() // Refresh revenue when member updated
        }}
        member={selectedMember}
        initialTab={editModalTab}
      />
    </div>
  )
}
