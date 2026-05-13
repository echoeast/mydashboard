// UK Ltd Company tax helpers (rates as of 2025-26 tax year)

export interface TaxRates {
  corpTaxSmall: number // applies if profit <= small profits threshold
  corpTaxSmallThreshold: number
  corpTaxMain: number // applies if profit >= upper threshold
  corpTaxMainThreshold: number
  marginalReliefFraction: number
  dividendAllowance: number
  dividendBasicRate: number
  dividendHigherRate: number
  dividendAdditionalRate: number
  personalAllowance: number
  basicRateThreshold: number
  higherRateThreshold: number
  basicIncomeTax: number
  higherIncomeTax: number
  additionalIncomeTax: number
}

export const DEFAULT_UK_RATES: TaxRates = {
  corpTaxSmall: 0.19,
  corpTaxSmallThreshold: 50000,
  corpTaxMain: 0.25,
  corpTaxMainThreshold: 250000,
  marginalReliefFraction: 3 / 200,
  dividendAllowance: 500,
  dividendBasicRate: 0.0875,
  dividendHigherRate: 0.3375,
  dividendAdditionalRate: 0.3935,
  personalAllowance: 12570,
  basicRateThreshold: 50270,
  higherRateThreshold: 125140,
  basicIncomeTax: 0.2,
  higherIncomeTax: 0.4,
  additionalIncomeTax: 0.45,
}

export function calculateCorpTax(profit: number, rates: TaxRates = DEFAULT_UK_RATES): number {
  if (profit <= 0) return 0
  if (profit <= rates.corpTaxSmallThreshold) return profit * rates.corpTaxSmall
  if (profit >= rates.corpTaxMainThreshold) return profit * rates.corpTaxMain
  // Marginal relief
  const mainTax = profit * rates.corpTaxMain
  const relief = (rates.corpTaxMainThreshold - profit) * rates.marginalReliefFraction
  return mainTax - relief
}

export function calculateDividendTax(
  dividendsTotal: number,
  otherIncome: number = 0,
  rates: TaxRates = DEFAULT_UK_RATES
): number {
  if (dividendsTotal <= 0) return 0
  const taxableDividends = Math.max(0, dividendsTotal - rates.dividendAllowance)
  if (taxableDividends <= 0) return 0

  const otherPlusAllowance = otherIncome + rates.dividendAllowance
  let remaining = taxableDividends
  let tax = 0

  // Basic rate band
  const basicRoom = Math.max(0, rates.basicRateThreshold - otherPlusAllowance)
  const inBasic = Math.min(remaining, basicRoom)
  tax += inBasic * rates.dividendBasicRate
  remaining -= inBasic

  if (remaining > 0) {
    // Higher rate band
    const higherRoom = Math.max(0, rates.higherRateThreshold - Math.max(otherPlusAllowance, rates.basicRateThreshold))
    const inHigher = Math.min(remaining, higherRoom)
    tax += inHigher * rates.dividendHigherRate
    remaining -= inHigher
  }

  if (remaining > 0) {
    tax += remaining * rates.dividendAdditionalRate
  }

  return tax
}

export function calculatePAYE(salary: number, rates: TaxRates = DEFAULT_UK_RATES): { income: number; ni: number; total: number } {
  if (salary <= 0) return { income: 0, ni: 0, total: 0 }

  let income = 0
  if (salary > rates.personalAllowance) {
    const basic = Math.min(salary, rates.basicRateThreshold) - rates.personalAllowance
    income += Math.max(0, basic) * rates.basicIncomeTax
  }
  if (salary > rates.basicRateThreshold) {
    const higher = Math.min(salary, rates.higherRateThreshold) - rates.basicRateThreshold
    income += Math.max(0, higher) * rates.higherIncomeTax
  }
  if (salary > rates.higherRateThreshold) {
    income += (salary - rates.higherRateThreshold) * rates.additionalIncomeTax
  }

  // Employee Class 1 NI: simplified - 8% on £12,570-£50,270, 2% above
  let ni = 0
  if (salary > rates.personalAllowance) {
    const niBasic = Math.min(salary, rates.basicRateThreshold) - rates.personalAllowance
    ni += Math.max(0, niBasic) * 0.08
  }
  if (salary > rates.basicRateThreshold) {
    ni += (salary - rates.basicRateThreshold) * 0.02
  }

  return { income, ni, total: income + ni }
}

export function formatCurrency(amount: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount)
}

export function daysUntil(date: string): number {
  const target = new Date(date).getTime()
  const now = new Date().setHours(0, 0, 0, 0)
  return Math.ceil((target - now) / (1000 * 60 * 60 * 24))
}
