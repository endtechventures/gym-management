"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { formatCurrency, DEFAULT_CURRENCY, type CurrencyInfo, getAccountCurrency } from "./currency"

interface Account {
  id: string
  name: string
  email: string
  phone: string
  onboarding_completed?: boolean
  currency?: CurrencyInfo
}

interface Subaccount {
  id: string
  name: string
  location: string
  account_id: string
}

interface GymContextType {
  currentAccountId: string | null
  currentSubaccountId: string | null
  currentAccount: Account | null
  currentSubaccount: Subaccount | null
  setCurrentContext: (accountId: string, subaccountId: string) => void
  isLoading: boolean
  refreshData: () => void
  contextVersion: number
  currentCurrency: CurrencyInfo
  formatAmount: (amount: number | string) => string
  getCurrencySymbol: () => string
}

const GymContext = createContext<GymContextType | undefined>(undefined)

export function GymProvider({ children }: { children: React.ReactNode }) {
  const [currentAccountId, setCurrentAccountId] = useState<string | null>(null)
  const [currentSubaccountId, setCurrentSubaccountId] = useState<string | null>(null)
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null)
  const [currentSubaccount, setCurrentSubaccount] = useState<Subaccount | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshCounter, setRefreshCounter] = useState(0)
  const [contextVersion, setContextVersion] = useState(0)
  const [currentCurrency, setCurrentCurrency] = useState<CurrencyInfo>(DEFAULT_CURRENCY)

  // Fetch currency when account changes
  useEffect(() => {
    async function fetchCurrency() {
      if (currentAccountId) {
        try {
          const currency = await getAccountCurrency(currentAccountId)
          setCurrentCurrency(currency)
        } catch (error) {
          console.error("Error fetching currency:", error)
          // Keep default currency on error
        }
      }
    }

    if (currentAccountId) {
      fetchCurrency()
    }
  }, [currentAccountId])

  useEffect(() => {
    // Load from localStorage on mount
    const accountId = localStorage.getItem("current_account_id")
    const subaccountId = localStorage.getItem("current_subaccount_id")

    console.log("Loading from localStorage:", { accountId, subaccountId })

    if (accountId && subaccountId) {
      setCurrentAccountId(accountId)
      setCurrentSubaccountId(subaccountId)

      // Create mock objects for immediate use with default currency
      setCurrentAccount({
        id: accountId,
        name: "Current Gym",
        email: "",
        phone: "",
        currency: DEFAULT_CURRENCY,
      })
      setCurrentSubaccount({
        id: subaccountId,
        name: "Current Location",
        location: "",
        account_id: accountId,
      })
    }

    setIsLoading(false)
  }, [])

  const setCurrentContext = (accountId: string, subaccountId: string) => {
    console.log("Setting current context:", { accountId, subaccountId })

    // Only update if the context actually changed
    if (currentAccountId === accountId && currentSubaccountId === subaccountId) {
      console.log("Context unchanged, skipping update")
      return
    }

    setIsLoading(true)
    setCurrentAccountId(accountId)
    setCurrentSubaccountId(subaccountId)
    localStorage.setItem("current_account_id", accountId)
    localStorage.setItem("current_subaccount_id", subaccountId)

    // Set mock objects for immediate use with default currency
    setCurrentAccount({
      id: accountId,
      name: "Current Gym",
      email: "",
      phone: "",
      currency: DEFAULT_CURRENCY,
    })
    setCurrentSubaccount({
      id: subaccountId,
      name: "Current Location",
      location: "",
      account_id: accountId,
    })

    // Increment context version to force re-renders
    setContextVersion((prev) => prev + 1)

    // Trigger a refresh of data without full page reload
    setTimeout(() => {
      setRefreshCounter((prev) => prev + 1)
      setIsLoading(false)
    }, 100) // Reduced delay for faster switching
  }

  const refreshData = () => {
    setRefreshCounter((prev) => prev + 1)
    setContextVersion((prev) => prev + 1)
  }

  const formatAmount = (amount: number | string) => {
    return formatCurrency(amount, currentCurrency.code)
  }

  const getCurrencySymbol = () => {
    return currentCurrency.symbol
  }

  return (
    <GymContext.Provider
      value={{
        currentAccountId,
        currentSubaccountId,
        currentAccount,
        currentSubaccount,
        setCurrentContext,
        isLoading,
        refreshData,
        contextVersion,
        currentCurrency,
        formatAmount,
        getCurrencySymbol,
      }}
    >
      {children}
    </GymContext.Provider>
  )
}

export function useGymContext() {
  const context = useContext(GymContext)
  if (context === undefined) {
    throw new Error("useGymContext must be used within a GymProvider")
  }
  return context
}

// Export alias for backward compatibility
export const useGym = useGymContext
