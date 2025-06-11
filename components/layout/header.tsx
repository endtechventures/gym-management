"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Menu,
  Search,
  Bell,
  Settings,
  User,
  Building2,
  MapPin,
  LogOut,
  Plus,
  Store,
  Mail,
  Loader2,
  Check,
  X,
  Users,
  UserCheck,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu"
import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { supabase } from "@/lib/supabase"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { useGymContext } from "@/lib/gym-context"

interface HeaderProps {
  setSidebarOpen: (open: boolean) => void
  onNotificationClick?: () => void
}

interface Account {
  id: string
  name: string
  email: string
  phone: string
  onboarding_completed?: boolean
}

interface Subaccount {
  id: string
  name: string
  location: string
  account_id: string
}

interface UserAccount {
  id: string
  account_id: string
  subaccount_id: string
  is_owner: boolean
  role?: {
    id: string
    name: string
  }
  account: Account
  subaccount: Subaccount
}

interface Invitation {
  id: string
  email: string
  role: {
    id: string
    name: string
  }
  status: {
    id: string
    name: string
  }
  subaccount: {
    id: string
    name: string
    location: string
    account: {
      id: string
      name: string
    }
  }
  invited_at: string
  token: string
}

interface SearchResult {
  id: string
  name: string
  email: string
  type: "member" | "staff"
  role?: string
  status?: string
}

export function Header({ setSidebarOpen, onNotificationClick }: HeaderProps) {
  const router = useRouter()
  const { setCurrentContext, currentSubaccountId } = useGymContext()
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [selectedSubaccount, setSelectedSubaccount] = useState<Subaccount | null>(null)
  const [userName, setUserName] = useState("")
  const [userInitials, setUserInitials] = useState("JD")
  const [showNewFranchiseDialog, setShowNewFranchiseDialog] = useState(false)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState("")
  const [hasOwnedGym, setHasOwnedGym] = useState(false)
  const [isOwnerOfCurrentGym, setIsOwnerOfCurrentGym] = useState(false)
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null)
  const [creatingFranchise, setCreatingFranchise] = useState(false)
  const [newFranchise, setNewFranchise] = useState({
    name: "",
    location: "",
  })

  // Search functionality state
  const [searchTerm, setSearchTerm] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout>()
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadUserData()
    loadInvitations()
  }, [])

  // Debounced search function
  const debouncedSearch = useCallback(
    (term: string) => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      searchTimeoutRef.current = setTimeout(() => {
        if (term.trim().length >= 2 && currentSubaccountId) {
          performSearch(term.trim())
        } else if (term.trim().length === 0) {
          setSearchResults([])
          setShowSearchResults(false)
        }
      }, 300)
    },
    [currentSubaccountId],
  )

  // Perform the actual search
  const performSearch = async (term: string) => {
    if (!currentSubaccountId) return

    try {
      setIsSearching(true)
      setShowSearchResults(true) // Show dropdown immediately
      const results: SearchResult[] = []

      console.log("Searching for:", term, "in subaccount:", currentSubaccountId) // Debug log

      // Search members with more flexible matching
      const { data: members, error: membersError } = await supabase
        .from("members")
        .select("id, name, email, is_active")
        .eq("subaccount_id", currentSubaccountId)
        .ilike("name", `%${term}%`)
        .limit(10)

      console.log("Members found:", members, "Error:", membersError) // Debug log

      if (!membersError && members && members.length > 0) {
        results.push(
          ...members.map((member) => ({
            id: member.id,
            name: member.name,
            email: member.email || "",
            type: "member" as const,
            status: member.is_active ? "Active" : "Inactive",
          })),
        )
      }

      // Also search by email if no name matches found
      if (results.length === 0) {
        const { data: membersByEmail, error: membersEmailError } = await supabase
          .from("members")
          .select("id, name, email, is_active")
          .eq("subaccount_id", currentSubaccountId)
          .ilike("email", `%${term}%`)
          .limit(10)

        if (!membersEmailError && membersByEmail) {
          results.push(
            ...membersByEmail.map((member) => ({
              id: member.id,
              name: member.name,
              email: member.email || "",
              type: "member" as const,
              status: member.is_active ? "Active" : "Inactive",
            })),
          )
        }
      }

      // Search staff (users table) with more flexible matching
      const { data: staff, error: staffError } = await supabase
        .from("users")
        .select(`
  id,
  name,
  email,
  is_active,
  role:roles(name)
`)
        .eq("subaccount_id", currentSubaccountId)
        .ilike("name", `%${term}%`)
        .limit(10)

      console.log("Staff found:", staff, "Error:", staffError) // Debug log

      if (!staffError && staff && staff.length > 0) {
        results.push(
          ...staff.map((staffMember) => ({
            id: staffMember.id,
            name: staffMember.name,
            email: staffMember.email || "",
            type: "staff" as const,
            role: staffMember.role?.name || "Staff",
            status: staffMember.is_active ? "Active" : "Inactive",
          })),
        )
      }

      // Also search staff by email if no name matches found
      if (results.filter((r) => r.type === "staff").length === 0) {
        const { data: staffByEmail, error: staffEmailError } = await supabase
          .from("users")
          .select(`
    id,
    name,
    email,
    is_active,
    role:roles(name)
  `)
          .eq("subaccount_id", currentSubaccountId)
          .ilike("email", `%${term}%`)
          .limit(10)

        if (!staffEmailError && staffByEmail) {
          results.push(
            ...staffByEmail.map((staffMember) => ({
              id: staffMember.id,
              name: staffMember.name,
              email: staffMember.email || "",
              type: "staff" as const,
              role: staffMember.role?.name || "Staff",
              status: staffMember.is_active ? "Active" : "Inactive",
            })),
          )
        }
      }

      console.log("Total results:", results) // Debug log
      setSearchResults(results)
      // Keep dropdown visible even if no results
    } catch (error) {
      console.error("Search error:", error)
    } finally {
      setIsSearching(false)
    }
  }

  // Handle search input change
  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    debouncedSearch(value)
  }

  // Handle search result click
  const handleSearchResultClick = (result: SearchResult) => {
    if (result.type === "member") {
      router.push(`/dashboard/members/${result.id}`)
    } else if (result.type === "staff") {
      router.push(`/dashboard/staff`) // Could be enhanced to go to specific staff member page
    }

    // Clear search
    setSearchTerm("")
    setSearchResults([])
    setShowSearchResults(false)
    if (searchInputRef.current) {
      searchInputRef.current.blur()
    }
  }

  // Handle search input focus/blur
  const handleSearchFocus = () => {
    if (searchTerm.length >= 2) {
      performSearch(searchTerm)
    }
  }

  const handleSearchBlur = () => {
    // Don't hide results immediately to allow clicking
    // The onMouseDown event will handle the click before blur
  }

  // Clear search when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (searchInputRef.current && !searchInputRef.current.contains(target)) {
        // Check if click is on search results
        const searchResults = document.querySelector("[data-search-results]")
        if (!searchResults || !searchResults.contains(target)) {
          setShowSearchResults(false)
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const loadUserData = async () => {
    try {
      setLoading(true)

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth")
        return
      }

      // Get user info from users table with role - don't use single() as user might not exist yet
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("name, email, role:roles(id, name)")
        .eq("id", user.id)

      // Handle user data
      if (userError) {
        console.error("Error fetching user data:", userError)
      }

      // If user exists in our database
      if (userData && userData.length > 0) {
        const currentUser = userData[0]
        setUserName(currentUser.name || currentUser.email || "User")
        setUserRole(currentUser.role?.name || "")

        // Get initials
        const initials = (currentUser.name || currentUser.email || "User")
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
        setUserInitials(initials)
      } else {
        // Use auth data if user not in our database yet
        setUserName(user.user_metadata?.name || user.email || "User")

        // Get initials from auth data
        const initials = (user.user_metadata?.name || user.email || "User")
          .split(" ")
          .map((part) => part[0])
          .join("")
          .toUpperCase()
          .substring(0, 2)
        setUserInitials(initials)
      }

      // Get user's accounts and subaccounts - ONLY the ones they have access to
      const { data: userAccountsData, error: accountsError } = await supabase
        .from("user_accounts")
        .select(`
          id,
          account_id,
          subaccount_id,
          is_owner,
          role:roles(id, name),
          account:accounts(id, name, email, phone, onboarding_completed),
          subaccount:subaccounts(id, name, location, account_id)
        `)
        .eq("user_id", user.id)

      if (accountsError) {
        console.error("Error fetching user accounts:", accountsError)
        return
      }

      if (userAccountsData && userAccountsData.length > 0) {
        setUserAccounts(userAccountsData as UserAccount[])

        // Check if user owns ANY gym
        const hasOwnership = userAccountsData.some((ua) => ua.is_owner)
        setHasOwnedGym(hasOwnership)

        // Set default selections - prioritize current localStorage values
        const storedAccountId = localStorage.getItem("current_account_id")
        const storedSubaccountId = localStorage.getItem("current_subaccount_id")

        let selectedUserAccount = null

        // Try to find stored account/subaccount combination
        if (storedAccountId && storedSubaccountId) {
          selectedUserAccount = userAccountsData.find(
            (ua) => ua.account.id === storedAccountId && ua.subaccount.id === storedSubaccountId,
          )
        }

        // If not found, use first available
        if (!selectedUserAccount && userAccountsData.length > 0) {
          selectedUserAccount = userAccountsData[0] as UserAccount
        }

        if (selectedUserAccount) {
          setSelectedAccount(selectedUserAccount.account)
          setSelectedSubaccount(selectedUserAccount.subaccount)
          setIsOwnerOfCurrentGym(selectedUserAccount.is_owner)

          // Store in localStorage for persistence
          localStorage.setItem("current_account_id", selectedUserAccount.account.id)
          localStorage.setItem("current_subaccount_id", selectedUserAccount.subaccount.id)
        } else {
          // If no accounts found, redirect to onboarding
          router.push("/onboarding")
        }
      } else {
        // If no accounts found, redirect to onboarding
        router.push("/onboarding")
      }
    } catch (error) {
      console.error("Error loading user data:", error)
    } finally {
      setLoading(false)
    }
  }

  const loadInvitations = async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get pending invitations for this user that they haven't already accepted
      const { data: invitationsData, error: invitationsError } = await supabase
        .from("user_invitations")
        .select(`
          id,
          email,
          role:roles(id, name),
          status:status(id, name),
          subaccount:subaccounts(
            id,
            name,
            location,
            account:accounts(id, name)
          ),
          invited_at,
          token
        `)
        .eq("email", user.email)
        .eq("status.name", "pending")

      if (invitationsError) {
        console.error("Error fetching invitations:", invitationsError)
        return
      }

      // Filter out invitations for subaccounts the user already has access to
      if (invitationsData) {
        const { data: userAccountsData } = await supabase
          .from("user_accounts")
          .select("subaccount_id")
          .eq("user_id", user.id)

        const userSubaccountIds = userAccountsData?.map((ua) => ua.subaccount_id) || []

        const filteredInvitations = invitationsData.filter(
          (invitation) => !userSubaccountIds.includes(invitation.subaccount.id),
        )

        setInvitations(filteredInvitations || [])
      }
    } catch (error) {
      console.error("Error loading invitations:", error)
    }
  }

  const handleAccountChange = (userAccount: UserAccount) => {
    // Update local state
    setSelectedAccount(userAccount.account)
    setSelectedSubaccount(userAccount.subaccount)
    setIsOwnerOfCurrentGym(userAccount.is_owner)

    // Update context (which will trigger data refresh in components)
    setCurrentContext(userAccount.account.id, userAccount.subaccount.id)
  }

  const handleSubaccountChange = (subaccount: Subaccount) => {
    // Find the user account for this subaccount to get ownership status
    const userAccount = userAccounts.find((ua) => ua.subaccount.id === subaccount.id)

    // Update local state
    setSelectedSubaccount(subaccount)
    setIsOwnerOfCurrentGym(userAccount?.is_owner || false)

    // Update context (which will trigger data refresh in components)
    if (selectedAccount) {
      setCurrentContext(selectedAccount.id, subaccount.id)
    }
  }

  const handleCreateNewGym = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Check if user already owns any gym
      const { data: existingOwnedAccounts, error: ownedAccountError } = await supabase
        .from("user_accounts")
        .select("account:accounts(id, name, onboarding_completed)")
        .eq("user_id", user.id)
        .eq("is_owner", true)

      if (ownedAccountError) {
        console.error("Error checking owned accounts:", ownedAccountError)
        toast({
          title: "Error",
          description: "Error checking existing gyms",
          variant: "destructive",
        })
        return
      }

      if (existingOwnedAccounts && existingOwnedAccounts.length > 0) {
        // User already owns a gym
        const ownedAccount = existingOwnedAccounts[0].account
        if (!ownedAccount.onboarding_completed) {
          // If onboarding not completed, redirect to complete it
          router.push("/onboarding")
        } else {
          // If already completed, show message
          toast({
            title: "You already own a gym",
            description: "You can only own one gym at a time",
            variant: "destructive",
          })
        }
        return
      }

      // Get OWNER role ID
      const { data: ownerRole, error: roleError } = await supabase
        .from("roles")
        .select("id")
        .eq("name", "OWNER")
        .single()

      if (roleError || !ownerRole) {
        toast({
          title: "Error",
          description: "Error setting up user role",
          variant: "destructive",
        })
        return
      }

      // Create initial account with onboarding_completed = false
      const { data: accountData, error: accountError } = await supabase
        .from("accounts")
        .insert({
          name: `${user.user_metadata?.name || user.email?.split("@")[0]}'s Gym`,
          email: user.email!,
          onboarding_completed: false,
        })
        .select()
        .single()

      if (accountError) {
        console.error("Account creation error:", accountError)
        toast({
          title: "Error",
          description: "Error creating gym account",
          variant: "destructive",
        })
        return
      }

      // Create user_account record linking user to the new account as owner
      const { error: userAccountError } = await supabase.from("user_accounts").insert({
        user_id: user.id,
        account_id: accountData.id,
        role_id: ownerRole.id,
        is_owner: true,
      })

      if (userAccountError) {
        console.error("User account linking error:", userAccountError)
        toast({
          title: "Error",
          description: "Error linking user to account",
          variant: "destructive",
        })
        return
      }

      toast({
        title: "Success",
        description: "Gym account created! Complete your setup.",
      })

      // Redirect to onboarding to complete gym setup
      router.push("/onboarding")
    } catch (error) {
      console.error("Error creating new gym:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    }
  }

  const handleCreateNewFranchise = async () => {
    if (!selectedAccount || creatingFranchise) return

    setCreatingFranchise(true)

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Check if franchise with same name already exists for this account
      const { data: existingFranchise } = await supabase
        .from("subaccounts")
        .select("id")
        .eq("account_id", selectedAccount.id)
        .eq("name", newFranchise.name)
        .single()

      if (existingFranchise) {
        toast({
          title: "Error",
          description: "A franchise with this name already exists",
          variant: "destructive",
        })
        return
      }

      // Get OWNER role ID
      const { data: ownerRole } = await supabase.from("roles").select("id").eq("name", "OWNER").single()

      if (!ownerRole) {
        toast({
          title: "Error",
          description: "Error getting owner role",
          variant: "destructive",
        })
        return
      }

      // Create new subaccount
      const { data: newSubaccountData, error: subaccountError } = await supabase
        .from("subaccounts")
        .insert({
          account_id: selectedAccount.id,
          name: newFranchise.name,
          location: newFranchise.location,
        })
        .select()
        .single()

      if (subaccountError) {
        console.error("Error creating subaccount:", subaccountError)
        toast({
          title: "Error",
          description: "Error creating franchise",
          variant: "destructive",
        })
        return
      }

      // Create user_account entry for this new subaccount
      const { error: userAccountError } = await supabase.from("user_accounts").insert({
        user_id: user.id,
        account_id: selectedAccount.id,
        subaccount_id: newSubaccountData.id,
        role_id: ownerRole.id,
        is_owner: true,
      })

      if (userAccountError) {
        console.error("Error creating user account:", userAccountError)
        toast({
          title: "Error",
          description: "Error linking user to franchise",
          variant: "destructive",
        })
        return
      }

      // Close dialog and reset form
      setShowNewFranchiseDialog(false)
      setNewFranchise({
        name: "",
        location: "",
      })

      toast({
        title: "Success",
        description: "Franchise created successfully",
      })

      // Reload user data and update UI
      await loadUserData()

      // Switch to the new franchise
      handleSubaccountChange(newSubaccountData)
    } catch (error) {
      console.error("Error creating franchise:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setCreatingFranchise(false)
    }
  }

  const handleAcceptInvitation = async (invitation: Invitation) => {
    if (processingInvitation === invitation.id) return // Prevent multiple clicks

    setProcessingInvitation(invitation.id)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push("/auth")
        return
      }

      // Get the accepted status ID
      const { data: acceptedStatus, error: statusError } = await supabase
        .from("status")
        .select("id")
        .eq("name", "accepted")
        .single()

      if (statusError || !acceptedStatus) {
        console.error("Error getting status:", statusError)
        toast({
          title: "Error",
          description: "Could not process invitation",
          variant: "destructive",
        })
        return
      }

      // Check if user already has access to this subaccount
      const { data: existingUserAccount, error: existingError } = await supabase
        .from("user_accounts")
        .select("id")
        .eq("user_id", user.id)
        .eq("account_id", invitation.subaccount.account.id)
        .eq("subaccount_id", invitation.subaccount.id)
        .single()

      if (existingUserAccount) {
        // User already has access, just update invitation status
        const { error: invitationError } = await supabase
          .from("user_invitations")
          .update({
            status_id: acceptedStatus.id,
            responded_at: new Date().toISOString(),
          })
          .eq("id", invitation.id)

        if (invitationError) {
          console.error("Error updating invitation:", invitationError)
          toast({
            title: "Error",
            description: "Could not update invitation status",
            variant: "destructive",
          })
          return
        }

        // Remove from local state
        setInvitations(invitations.filter((inv) => inv.id !== invitation.id))

        toast({
          title: "Already a member",
          description: `You already have access to ${invitation.subaccount.name}`,
        })
        return
      }

      // Check if user already exists in users table
      const { data: existingUser, error: userCheckError } = await supabase.from("users").select("id").eq("id", user.id)

      // Create or update user record
      if (!existingUser || existingUser.length === 0) {
        const { error: userError } = await supabase.from("users").insert({
          id: user.id,
          subaccount_id: invitation.subaccount.id,
          name: user.user_metadata?.name || user.email?.split("@")[0],
          email: user.email!,
          role_id: invitation.role.id,
          is_active: true,
        })

        if (userError) {
          console.error("Error creating user record:", userError)
          toast({
            title: "Error",
            description: "Could not create user record",
            variant: "destructive",
          })
          return
        }
      }

      // Create user_account record
      const { error: userAccountError } = await supabase.from("user_accounts").insert({
        user_id: user.id,
        account_id: invitation.subaccount.account.id,
        subaccount_id: invitation.subaccount.id,
        role_id: invitation.role.id,
        is_owner: false,
      })

      if (userAccountError) {
        console.error("Error linking user to account:", userAccountError)
        toast({
          title: "Error",
          description: "Could not link user to account",
          variant: "destructive",
        })
        return
      }

      // Update invitation status
      const { error: invitationError } = await supabase
        .from("user_invitations")
        .update({
          status_id: acceptedStatus.id,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)

      if (invitationError) {
        console.error("Error updating invitation:", invitationError)
        toast({
          title: "Error",
          description: "Could not update invitation status",
          variant: "destructive",
        })
        return
      }

      // Remove from local state immediately
      setInvitations(invitations.filter((inv) => inv.id !== invitation.id))

      toast({
        title: "Success",
        description: `You've joined ${invitation.subaccount.name} as ${invitation.role.name}`,
      })

      // Reload user data to update the UI
      await loadUserData()
    } catch (err) {
      console.error("Error accepting invitation:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleDeclineInvitation = async (invitation: Invitation) => {
    if (processingInvitation === invitation.id) return // Prevent multiple clicks

    setProcessingInvitation(invitation.id)

    try {
      // Get the declined status ID
      const { data: declinedStatus, error: statusError } = await supabase
        .from("status")
        .select("id")
        .eq("name", "declined")
        .single()

      if (statusError || !declinedStatus) {
        console.error("Error getting status:", statusError)
        toast({
          title: "Error",
          description: "Could not process invitation",
          variant: "destructive",
        })
        return
      }

      // Update invitation status
      const { error: invitationError } = await supabase
        .from("user_invitations")
        .update({
          status_id: declinedStatus.id,
          responded_at: new Date().toISOString(),
        })
        .eq("id", invitation.id)

      if (invitationError) {
        console.error("Error updating invitation:", invitationError)
        toast({
          title: "Error",
          description: "Could not update invitation status",
          variant: "destructive",
        })
        return
      }

      // Remove from local state immediately
      setInvitations(invitations.filter((inv) => inv.id !== invitation.id))

      toast({
        title: "Invitation declined",
        description: `You've declined the invitation to join ${invitation.subaccount.name}`,
      })
    } catch (err) {
      console.error("Error declining invitation:", err)
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setProcessingInvitation(null)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    localStorage.clear()
    router.push("/auth")
  }

  // Format date to relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffSecs = Math.round(diffMs / 1000)
    const diffMins = Math.round(diffSecs / 60)
    const diffHours = Math.round(diffMins / 60)
    const diffDays = Math.round(diffHours / 24)

    if (diffSecs < 60) return `${diffSecs} second${diffSecs !== 1 ? "s" : ""} ago`
    if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`

    // If older than a month, return the date
    return date.toLocaleDateString()
  }

  // Group user accounts by account (gym) - only show accounts user has access to
  const accountGroups = userAccounts.reduce(
    (groups, userAccount) => {
      const accountId = userAccount.account.id
      if (!groups[accountId]) {
        groups[accountId] = {
          account: userAccount.account,
          subaccounts: [],
        }
      }
      groups[accountId].subaccounts.push(userAccount.subaccount)
      return groups
    },
    {} as Record<string, { account: Account; subaccounts: Subaccount[] }>,
  )

  const currentSubaccounts = selectedAccount ? accountGroups[selectedAccount.id]?.subaccounts || [] : []

  // Check if user can create new gym (users who don't own ANY gym OR have incomplete onboarding)
  const canCreateNewGym = !hasOwnedGym

  // Check if user can create new franchise (owners of the current gym only)
  const canCreateNewFranchise = isOwnerOfCurrentGym && selectedAccount

  if (loading) {
    return (
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-teal-600"></div>
          <span className="text-sm text-gray-500">Loading...</span>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
        <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
          <span className="sr-only">Open sidebar</span>
          <Menu className="h-6 w-6" />
        </button>

        {/* Separator */}
        <div className="h-6 w-px bg-gray-200 lg:hidden" />

        <div className="flex flex-1 gap-x-2 self-stretch lg:gap-x-4">
          {/* Current Context Display */}
          <div className="flex items-center gap-x-2 text-sm text-gray-600">
            {selectedAccount && (
              <>
                <Building2 className="h-4 w-4" />
                <span className="font-medium">{selectedAccount.name}</span>
                {/* Show role tag for current gym */}
                {(() => {
                  const currentUserAccount = userAccounts.find(
                    (ua) => ua.account.id === selectedAccount.id && ua.subaccount.id === selectedSubaccount?.id,
                  )
                  const currentRole = currentUserAccount?.role?.name
                  const isOwner = currentUserAccount?.is_owner

                  if (isOwner) {
                    return (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        Owner
                      </Badge>
                    )
                  } else if (currentRole) {
                    return (
                      <Badge variant="outline" className="text-xs">
                        {currentRole}
                      </Badge>
                    )
                  }
                  return null
                })()}
              </>
            )}

            {selectedAccount && selectedSubaccount && (
              <>
                <span className="text-gray-400">/</span>
                <MapPin className="h-4 w-4" />
                <span>{selectedSubaccount.name}</span>
              </>
            )}
          </div>

          {/* Enhanced Search with Results */}
          <div className="relative flex flex-1 items-center">
            <Search className="pointer-events-none absolute left-3 h-4 w-4 text-gray-400" />
            <Input
              ref={searchInputRef}
              placeholder="Search members, staff..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={handleSearchFocus}
              onBlur={handleSearchBlur}
              className="w-full border-0 bg-gray-50 pl-10 pr-4 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-teal-500"
            />

            {/* Search Results Dropdown */}
            {(showSearchResults || isSearching) && searchTerm.length >= 2 && (
              <div
                data-search-results
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-[60] max-h-80 overflow-y-auto"
              >
                {isSearching ? (
                  <div className="p-4 text-center">
                    <Loader2 className="h-4 w-4 animate-spin mx-auto mb-2" />
                    <span className="text-sm text-gray-500">Searching...</span>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={`${result.type}-${result.id}`}
                        onMouseDown={(e) => {
                          e.preventDefault() // Prevent blur from firing before click
                          handleSearchResultClick(result)
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0"
                      >
                        <div className="flex-shrink-0">
                          {result.type === "member" ? (
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                              <UserCheck className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{result.name}</p>
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                result.type === "member"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : "bg-green-50 text-green-700 border-green-200"
                              }`}
                            >
                              {result.type === "member" ? "Member" : "Staff"}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 truncate">{result.email}</p>
                          {result.status && (
                            <p className={`text-xs ${result.status === "Active" ? "text-green-600" : "text-gray-500"}`}>
                              {result.status}
                            </p>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No results found</p>
                    <p className="text-xs">Try searching by name, email, or ID</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-x-1 lg:gap-x-4">
            {/* Invitations Dropdown */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Mail className="h-5 w-5" />
                  {invitations.length > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-blue-500 text-xs text-white p-0 flex items-center justify-center">
                      {invitations.length}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-80 p-0">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-lg">Invitations</h3>
                  <p className="text-sm text-gray-500">
                    {invitations.length > 0
                      ? `You have ${invitations.length} pending invitation${invitations.length !== 1 ? "s" : ""}`
                      : "No pending invitations"}
                  </p>
                </div>

                <ScrollArea className="max-h-[300px]">
                  {invitations.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      <Mail className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                      <p>No pending invitations</p>
                    </div>
                  ) : (
                    <div className="divide-y">
                      {invitations.map((invitation) => (
                        <div key={invitation.id} className="p-4">
                          <div className="mb-2">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">{invitation.subaccount.account.name}</h4>
                                <p className="text-sm text-gray-600">{invitation.subaccount.name}</p>
                              </div>
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {invitation.role.name}
                              </Badge>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              Invited {formatRelativeTime(invitation.invited_at)}
                            </p>
                          </div>

                          <div className="flex gap-2 mt-3">
                            <Button
                              size="sm"
                              className="w-full"
                              onClick={() => handleAcceptInvitation(invitation)}
                              disabled={processingInvitation === invitation.id}
                            >
                              {processingInvitation === invitation.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4 mr-1" />
                              )}
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full"
                              onClick={() => handleDeclineInvitation(invitation)}
                              disabled={processingInvitation === invitation.id}
                            >
                              {processingInvitation === invitation.id ? (
                                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <X className="h-4 w-4 mr-1" />
                              )}
                              Decline
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            {/* Notifications */}
            {/* <Button variant="ghost" size="sm" className="relative" onClick={onNotificationClick}>
              <Bell className="h-5 w-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white p-0 flex items-center justify-center">
                3
              </Badge>
            </Button> */}

            {/* Profile dropdown with gym switching */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0 overflow-hidden">
                  <div className="p-1 h-full w-full rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-sm border-2 border-white">
                    <span className="text-sm font-medium text-white">{userInitials}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span>{userName}</span>
                    <span className="text-xs text-gray-500">
                      {selectedAccount ? `${selectedAccount.name}` : "No gym selected"}
                    </span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>

                <DropdownMenuSeparator />

                {/* Gym Switching - only show gyms user has access to */}
                <DropdownMenuLabel>Your Gyms</DropdownMenuLabel>
                <DropdownMenuGroup>
                  {Object.values(accountGroups).map(({ account, subaccounts }) => {
                    const userAccount = userAccounts.find((ua) => ua.account.id === account.id)
                    const isAccountOwner = userAccount?.is_owner || false
                    const truncatedName =
                      account.name.length > 20 ? `${account.name.substring(0, 20)}...` : account.name

                    return (
                      <DropdownMenuItem
                        key={account.id}
                        onClick={() => {
                          if (userAccount) handleAccountChange(userAccount)
                        }}
                        title={account.name.length > 20 ? account.name : undefined}
                      >
                        <Building2 className="mr-2 h-4 w-4 flex-shrink-0" />
                        <span className={`${selectedAccount?.id === account.id ? "font-medium" : ""} truncate`}>
                          {truncatedName}
                        </span>
                        <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                          {isAccountOwner && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Owner
                            </Badge>
                          )}
                          <span className="text-xs text-gray-400">
                            {subaccounts.length} location{subaccounts.length !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    )
                  })}
                </DropdownMenuGroup>

                {/* Create New Gym - only show for users who don't own ANY gym */}
                {canCreateNewGym && (
                  <DropdownMenuItem onClick={handleCreateNewGym}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create New Gym
                  </DropdownMenuItem>
                )}

                <DropdownMenuSeparator />

                {/* Franchise Switching - only show franchises user has access to */}
                {selectedAccount && currentSubaccounts.length > 0 && (
                  <>
                    <DropdownMenuLabel>Locations</DropdownMenuLabel>
                    <DropdownMenuGroup>
                      {currentSubaccounts.map((subaccount) => {
                        const userAccount = userAccounts.find((ua) => ua.subaccount.id === subaccount.id)
                        const isSubaccountOwner = userAccount?.is_owner || false
                        const currentUserRole = userAccount
                          ? userAccounts.find((ua) => ua.subaccount.id === subaccount.id)?.role?.name || ""
                          : ""
                        const truncatedName =
                          subaccount.name.length > 20 ? `${subaccount.name.substring(0, 20)}...` : subaccount.name
                        const truncatedLocation =
                          subaccount.location.length > 15
                            ? `${subaccount.location.substring(0, 15)}...`
                            : subaccount.location

                        return (
                          <DropdownMenuItem
                            key={subaccount.id}
                            onClick={() => handleSubaccountChange(subaccount)}
                            title={`${subaccount.name} - ${subaccount.location}`}
                          >
                            <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
                            <div className="flex flex-col min-w-0 flex-1">
                              <span
                                className={`${selectedSubaccount?.id === subaccount.id ? "font-medium" : ""} truncate`}
                              >
                                {truncatedName}
                              </span>
                              <span className="text-xs text-gray-400 truncate">{truncatedLocation}</span>
                            </div>
                            <div className="ml-auto flex items-center gap-1 flex-shrink-0">
                              {isSubaccountOwner ? (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-green-50 text-green-700 border-green-200"
                                >
                                  Owner
                                </Badge>
                              ) : (
                                currentUserRole && (
                                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                    {currentUserRole}
                                  </Badge>
                                )
                              )}
                            </div>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuGroup>

                    {/* Create New Franchise - only show for owners of current gym */}
                    {canCreateNewFranchise && (
                      <DropdownMenuItem onClick={() => setShowNewFranchiseDialog(true)}>
                        <Store className="mr-2 h-4 w-4" />
                        Add New Location
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                  </>
                )}

                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* New Franchise Dialog - only show for owners of current gym */}
      {canCreateNewFranchise && (
        <Dialog open={showNewFranchiseDialog} onOpenChange={setShowNewFranchiseDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Add New Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="franchiseName">Location Name</Label>
                <Input
                  id="franchiseName"
                  value={newFranchise.name}
                  onChange={(e) => setNewFranchise({ ...newFranchise, name: e.target.value })}
                  placeholder="Downtown Branch"
                  required
                  disabled={creatingFranchise}
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="franchiseLocation">Address/Location</Label>
                <Textarea
                  id="franchiseLocation"
                  value={newFranchise.location}
                  onChange={(e) => setNewFranchise({ ...newFranchise, location: e.target.value })}
                  placeholder="123 Fitness Street, Gym City, GC 12345"
                  required
                  disabled={creatingFranchise}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewFranchiseDialog(false)} disabled={creatingFranchise}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateNewFranchise}
                disabled={!newFranchise.name || !newFranchise.location || creatingFranchise}
              >
                {creatingFranchise ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Add Location"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  )
}
