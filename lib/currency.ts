import { supabase } from "./supabase-queries"

export interface CurrencyInfo {
  symbol: string
  code: string
  name: string
  id?: string
}

// Default currency mapping
export const CURRENCIES: Record<string, CurrencyInfo> = {
  INR: {
    symbol: "₹",
    code: "INR",
    name: "Indian Rupee",
  },
  USD: {
    symbol: "$",
    code: "USD",
    name: "US Dollar",
  },
}

// Default to Indian Rupee
export const DEFAULT_CURRENCY: CurrencyInfo = CURRENCIES.INR

// Cache for account currencies to avoid repeated queries
const accountCurrencyCache = new Map<string, CurrencyInfo>()

/**
 * Fetch the currency for a specific account
 * @param accountId - The account ID
 * @returns The currency info for the account
 */
export async function getAccountCurrency(accountId: string): Promise<CurrencyInfo> {
  // Return from cache if available
  if (accountCurrencyCache.has(accountId)) {
    return accountCurrencyCache.get(accountId)!
  }

  try {
    // Query the accounts table to get the currency_id
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("currency_id")
      .eq("id", accountId)
      .single()

    if (accountError || !account?.currency_id) {
      console.warn("Failed to fetch account currency, using default:", accountError)
      return DEFAULT_CURRENCY
    }

    // Query the currency table to get the currency details
    const { data: currency, error: currencyError } = await supabase
      .from("currency")
      .select("*")
      .eq("id", account.currency_id)
      .single()

    if (currencyError || !currency) {
      console.warn("Failed to fetch currency details, using default:", currencyError)
      return DEFAULT_CURRENCY
    }

    const currencyInfo: CurrencyInfo = {
      id: currency.id,
      symbol: currency.symbol,
      code: currency.code,
      name: currency.name,
    }

    // Cache the result
    accountCurrencyCache.set(accountId, currencyInfo)
    return currencyInfo
  } catch (error) {
    console.error("Error fetching account currency:", error)
    return DEFAULT_CURRENCY
  }
}

/**
 * Format amount with currency symbol
 * @param amount - The amount to format
 * @param currencyCode - The currency code (defaults to INR)
 * @param showCode - Whether to show currency code alongside symbol
 */
export function formatCurrency(amount: number | string, currencyCode = "INR", showCode = false): string {
  const numAmount = typeof amount === "string" ? Number.parseFloat(amount) : amount

  if (isNaN(numAmount)) {
    return `${CURRENCIES[currencyCode]?.symbol || "₹"}0`
  }

  const currency = CURRENCIES[currencyCode] || DEFAULT_CURRENCY

  // Format number with Indian locale for INR
  const formattedAmount =
    currencyCode === "INR"
      ? numAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })
      : numAmount.toLocaleString("en-US", { maximumFractionDigits: 2 })

  return showCode ? `${currency.symbol}${formattedAmount} ${currency.code}` : `${currency.symbol}${formattedAmount}`
}

/**
 * Get currency symbol
 * @param currencyCode - The currency code (defaults to INR)
 */
export function getCurrencySymbol(currencyCode = "INR"): string {
  return CURRENCIES[currencyCode]?.symbol || DEFAULT_CURRENCY.symbol
}

/**
 * Parse currency input (removes currency symbols and formatting)
 * @param input - The currency input string
 */
export function parseCurrency(input: string): number {
  return Number.parseFloat(input.replace(/[₹$,\s]/g, "")) || 0
}

/**
 * Clear the account currency cache
 * @param accountId - Optional account ID to clear specific cache entry
 */
export function clearCurrencyCache(accountId?: string): void {
  if (accountId) {
    accountCurrencyCache.delete(accountId)
  } else {
    accountCurrencyCache.clear()
  }
}
