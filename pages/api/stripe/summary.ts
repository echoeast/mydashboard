import type { NextApiRequest, NextApiResponse } from 'next'
import { getStripe } from '@/lib/stripe'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const stripe = getStripe()

    const now = Math.floor(Date.now() / 1000)
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60

    const [charges, customers, balance, payouts, subscriptions] = await Promise.all([
      stripe.charges.list({ limit: 100, created: { gte: ninetyDaysAgo } }),
      stripe.customers.list({ limit: 10 }),
      stripe.balance.retrieve(),
      stripe.payouts.list({ limit: 10 }),
      stripe.subscriptions.list({ limit: 100, status: 'active' }),
    ])

    const successfulCharges = charges.data.filter((c) => c.paid && !c.refunded)
    const totalRevenue90d = successfulCharges.reduce((sum, c) => sum + c.amount, 0)
    const totalRevenue30d = successfulCharges
      .filter((c) => c.created >= thirtyDaysAgo)
      .reduce((sum, c) => sum + c.amount, 0)

    const mrr = subscriptions.data.reduce((sum, sub) => {
      const item = sub.items.data[0]
      if (!item) return sum
      const price = item.price
      const interval = price.recurring?.interval
      const amount = (price.unit_amount || 0) * (item.quantity || 1)
      if (interval === 'month') return sum + amount
      if (interval === 'year') return sum + amount / 12
      if (interval === 'week') return sum + (amount * 52) / 12
      if (interval === 'day') return sum + (amount * 365) / 12
      return sum
    }, 0)

    const recentCharges = successfulCharges.slice(0, 10).map((c) => ({
      id: c.id,
      amount: c.amount,
      currency: c.currency,
      customer_name: c.billing_details?.name || 'Anonymous',
      created: c.created,
      description: c.description,
    }))

    const recentCustomers = customers.data.map((c) => ({
      id: c.id,
      name: c.name || c.email || 'Unknown',
      email: c.email,
      created: c.created,
    }))

    const recentPayouts = payouts.data.map((p) => ({
      id: p.id,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      arrival_date: p.arrival_date,
    }))

    const availableBalance = balance.available.reduce((sum, b) => sum + b.amount, 0)
    const pendingBalance = balance.pending.reduce((sum, b) => sum + b.amount, 0)
    const currency = balance.available[0]?.currency || 'gbp'

    res.status(200).json({
      totalRevenue30d,
      totalRevenue90d,
      mrr,
      activeSubscriptions: subscriptions.data.length,
      availableBalance,
      pendingBalance,
      currency,
      recentCharges,
      recentCustomers,
      recentPayouts,
      totalCustomers: customers.data.length,
    })
  } catch (err: any) {
    console.error('Stripe API error:', err)
    res.status(500).json({ error: err.message || 'Internal error' })
  }
}
