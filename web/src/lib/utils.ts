import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import slugify from "slugify"
import { addHours } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function applyPhoneMask(input: string): string {
  let phone = input.replace(/\D/g, "")
  if (!phone) return ""
  if (phone.length > 2) phone = `(${phone.slice(0, 2)}) ${phone.slice(2)}`
  if (phone.length > 9) phone = `${phone.slice(0, 9)}-${phone.slice(9, 14)}`
  if (phone.length === 15) {
    const original = input.replace(/\D/g, "")
    phone = `(${original.slice(0, 2)}) ${original.slice(2, 3)} ${original.slice(3, 7)}-${original.slice(7, 11)}`
  }
  return phone
}

export function formatPhoneToE164(phone: string, countryCode: string = "55"): string | null {
  // Remove tudo que não for número
  const digits = phone.replace(/\D/g, "")

  // Verifica se o número tem pelo menos um DDD e um número válido
  if (digits.length < 10 || digits.length > 11) return null

  // Se for um número de 11 dígitos (celular), mantém tudo
  // Se for um número de 10 dígitos (fixo), mantém tudo
  return `+${countryCode}${digits}`
}

export function applyDateMask(input: string): string {
  let date = input.replace(/\D/g, "")
  if (!date) return ""
  if (date.length > 2) date = `${date.slice(0, 2)}/${date.slice(2)}`
  if (date.length > 5) date = `${date.slice(0, 5)}/${date.slice(5)}`
  if (date.length > 10) date = `${date.slice(0, 5)}/${date.slice(5, 10)}`
  return date
}

export function isDateValid(input: string): boolean {
  // console.error("Validating date:", input)
  if (input.length !== 10) {
    // console.error("Invalid date length:", input.length)
    return false
  }

  const [day, month, year] = input.split("/").map(Number)

  // console.error("Parsed date components:", { day, month, year })

  const date = addHours(new Date(`${year}-${month}-${day}`), 5)

  // console.error("Date validity check:", date instanceof Date && !isNaN(date.getTime()))
  // console.error("Date components check:", date.getDate() === day, date.getMonth() === month - 1, date.getFullYear() === year)

  // Check if date is valid in calendar
  if (!date || date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    // console.error("Date is invalid in calendar")
    return false
  }
  return true
}

interface FormatCurrencyOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  appendSignage?: boolean,
  currency?: string,
  currencySymbol?: string,
  hideCurrency?: boolean
}

export function formatCurrency(value: number = 0, options?: FormatCurrencyOptions) {
  const signage = options?.appendSignage ? (value < 0 ? "-" : "+") : ""
  const currency = options?.currency || "BRL"

  if (options?.hideCurrency) {
    return value.toFixed(2).replace(".", ",")
  }

  return `${signage} ${options?.currencySymbol || "R$"} ${Intl.NumberFormat("pt-BR", {
    currency: currency,
    minimumFractionDigits: options?.minimumFractionDigits || 2,
    maximumFractionDigits: options?.maximumFractionDigits || 2,
    currencyDisplay: "name"
  }).format(value)}`
}

interface FormatPercentageOptions {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  appendSignage?: boolean
  hidePercentage?: boolean
}

export function formatPercentage(value: number = 0, options?: FormatPercentageOptions) {
  const signage = options?.appendSignage ? (value < 0 ? "" : "+") : ""

  if (options?.hidePercentage) {
    return signage + (value / 100).toFixed(2).replace(".", ",")
  }

  return `${signage}${Intl.NumberFormat("pt-BR", {
    style: "percent",
    minimumFractionDigits: options?.minimumFractionDigits || 2,
    maximumFractionDigits: options?.maximumFractionDigits || 2
  }).format(value / 100)}`
}

export function generateUserName(name: string | undefined): string {
  if (!name) return ""

  const parts = name.trim().split(/\s+/)
  if (parts.length < 2) return slugify(name, { lower: true, strict: true, trim: true }) // fallback para nome único

  const firstLetter = parts[0][0].toLowerCase()
  const lastName = parts[parts.length - 1].toLowerCase()

  return slugify(firstLetter + lastName, { lower: true, strict: true, trim: true })
}

