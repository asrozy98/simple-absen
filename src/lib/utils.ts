import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function todayJakarta(date: Date = new Date()) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Jakarta" })
}
