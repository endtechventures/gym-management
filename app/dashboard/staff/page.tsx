import { columns } from "./components/columns"
import { DataTable } from "@/components/ui/data-table"

interface StaffMember {
  id: string
  name: string
  email: string
  role: string
  status: string
}

const staffMembers: StaffMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "Manager",
    status: "Active",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "Developer",
    status: "Inactive",
  },
  {
    id: "3",
    name: "Peter Jones",
    email: "peter.jones@example.com",
    role: "Designer",
    status: "Active",
  },
]

const StaffPage = () => {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-semibold mb-5">Staff Management</h1>
      <DataTable columns={columns} data={staffMembers} />
    </div>
  )
}

export default StaffPage
