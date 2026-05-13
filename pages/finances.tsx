"use client";

import { useState, useEffect } from "react";
import {
  PlusIcon,
  XIcon,
  TrendingUpIcon,
  WalletIcon,
  CreditCardIcon,
  CalendarIcon,
  AlertCircleIcon,
  TrashIcon,
  RefreshCwIcon,
  ArrowUpRightIcon,
  ArrowDownRightIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { getSupabase } from "@/lib/supabase";
import {
  calculateCorpTax,
  calculateDividendTax,
  calculatePAYE,
  formatCurrency,
  daysUntil,
} from "@/lib/tax";

interface Transaction {
  id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
}

interface TaxDeadline {
  id: string;
  name: string;
  date: string;
  amount: number;
  paid: boolean;
}

interface StripeSummary {
  totalRevenue30d: number;
  totalRevenue90d: number;
  mrr: number;
  activeSubscriptions: number;
  availableBalance: number;
  pendingBalance: number;
  currency: string;
  recentCharges: Array<{
    id: string;
    amount: number;
    currency: string;
    customer_name: string;
    created: number;
    description: string | null;
  }>;
  recentCustomers: Array<{
    id: string;
    name: string;
    email: string | null;
    created: number;
  }>;
  recentPayouts: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    arrival_date: number;
  }>;
  totalCustomers: number;
}

const personalCategories = ["Food", "Transport", "Rent", "Bills", "Entertainment", "Income", "Other"];

export default function Finances() {
  const [tab, setTab] = useState<"personal" | "business" | "tax">("personal");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [deadlines, setDeadlines] = useState<TaxDeadline[]>([]);
  const [stripeData, setStripeData] = useState<StripeSummary | null>(null);
  const [stripeError, setStripeError] = useState<string | null>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [isTxDrawerOpen, setIsTxDrawerOpen] = useState(false);
  const [isDeadlineDrawerOpen, setIsDeadlineDrawerOpen] = useState(false);
  const [newTx, setNewTx] = useState({
    type: "expense" as "income" | "expense",
    category: "Food",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [newDeadline, setNewDeadline] = useState({
    name: "",
    date: new Date().toISOString().split("T")[0],
    amount: "",
  });

  // Tax estimate inputs
  const [profit, setProfit] = useState("");
  const [dividends, setDividends] = useState("");
  const [salary, setSalary] = useState("");

  useEffect(() => {
    fetchTransactions();
    fetchDeadlines();
  }, []);

  useEffect(() => {
    if (tab === "business" && !stripeData) {
      fetchStripeData();
    }
  }, [tab]);

  async function fetchTransactions() {
    const { data, error } = await getSupabase()
      .from("transactions")
      .select("*")
      .order("date", { ascending: false });
    if (!error && data) setTransactions(data);
  }

  async function fetchDeadlines() {
    const { data, error } = await getSupabase()
      .from("tax_deadlines")
      .select("*")
      .order("date", { ascending: true });
    if (!error && data) setDeadlines(data);
  }

  async function fetchStripeData() {
    setStripeLoading(true);
    setStripeError(null);
    try {
      const res = await fetch("/api/stripe/summary");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch Stripe data");
      setStripeData(data);
    } catch (err: any) {
      setStripeError(err.message);
    } finally {
      setStripeLoading(false);
    }
  }

  async function handleAddTx() {
    const { error } = await getSupabase().from("transactions").insert({
      type: newTx.type,
      category: newTx.category,
      amount: parseFloat(newTx.amount),
      description: newTx.description,
      date: newTx.date,
    });
    if (!error) {
      setIsTxDrawerOpen(false);
      setNewTx({
        type: "expense",
        category: "Food",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      fetchTransactions();
    }
  }

  async function handleDeleteTx(id: string) {
    await getSupabase().from("transactions").delete().eq("id", id);
    fetchTransactions();
  }

  async function handleAddDeadline() {
    const { error } = await getSupabase().from("tax_deadlines").insert({
      name: newDeadline.name,
      date: newDeadline.date,
      amount: parseFloat(newDeadline.amount) || 0,
      paid: false,
    });
    if (!error) {
      setIsDeadlineDrawerOpen(false);
      setNewDeadline({ name: "", date: new Date().toISOString().split("T")[0], amount: "" });
      fetchDeadlines();
    }
  }

  async function handleTogglePaid(deadline: TaxDeadline) {
    await getSupabase().from("tax_deadlines").update({ paid: !deadline.paid }).eq("id", deadline.id);
    fetchDeadlines();
  }

  async function handleDeleteDeadline(id: string) {
    await getSupabase().from("tax_deadlines").delete().eq("id", id);
    fetchDeadlines();
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);
  const netBalance = totalIncome - totalExpenses;

  const corpTaxEst = calculateCorpTax(parseFloat(profit) || 0);
  const divTaxEst = calculateDividendTax(parseFloat(dividends) || 0, parseFloat(salary) || 0);
  const payeEst = calculatePAYE(parseFloat(salary) || 0);

  return (
    <>
      <div className="w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800">
        <h1 className="text-lg font-bold">Finances</h1>
        <div className="ml-auto flex items-center gap-2">
          <div className="flex gap-1 bg-secondary p-1 rounded-lg">
            <Button
              variant={tab === "personal" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setTab("personal")}
            >
              Personal
            </Button>
            <Button
              variant={tab === "business" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setTab("business")}
            >
              Business
            </Button>
            <Button
              variant={tab === "tax" ? "default" : "ghost"}
              size="sm"
              className="h-7 text-xs cursor-pointer"
              onClick={() => setTab("tax")}
            >
              Tax
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl w-full mx-auto flex-1 p-8">
        {tab === "personal" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Card className="p-5 border-none">
                <p className="text-xs uppercase text-muted-foreground mb-2">Income</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {formatCurrency(totalIncome)}
                </p>
              </Card>
              <Card className="p-5 border-none">
                <p className="text-xs uppercase text-muted-foreground mb-2">Expenses</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(totalExpenses)}
                </p>
              </Card>
              <Card className="p-5 border-none">
                <p className="text-xs uppercase text-muted-foreground mb-2">Net Balance</p>
                <p className={`text-2xl font-bold ${netBalance >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {formatCurrency(netBalance)}
                </p>
              </Card>
            </div>

            <Card className="p-0 border-none overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-sm font-semibold">Transactions</h2>
                <Button size="sm" onClick={() => setIsTxDrawerOpen(true)} className="cursor-pointer">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Transaction
                </Button>
              </div>
              {transactions.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No transactions yet. Add your first one.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="flex items-center gap-4 px-5 py-3 hover:bg-neutral-50 dark:hover:bg-neutral-900/50">
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${tx.type === "income" ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"}`}>
                        {tx.type === "income" ? <ArrowDownRightIcon className="w-4 h-4" /> : <ArrowUpRightIcon className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tx.description || tx.category}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.category} · {new Date(tx.date).toLocaleDateString("en-GB")}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${tx.type === "income" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(Number(tx.amount))}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                        onClick={() => handleDeleteTx(tx.id)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        )}

        {tab === "business" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold">Stripe Data</h2>
                {stripeData && (
                  <Badge variant="outline" className="text-xs">Live</Badge>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStripeData}
                disabled={stripeLoading}
                className="cursor-pointer"
              >
                <RefreshCwIcon className={`w-4 h-4 mr-2 ${stripeLoading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>

            {stripeError && (
              <Card className="p-5 border-red-500/30 bg-red-500/5">
                <div className="flex items-start gap-3">
                  <AlertCircleIcon className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-600 dark:text-red-400">Could not load Stripe data</p>
                    <p className="text-xs text-muted-foreground mt-1">{stripeError}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      Make sure <code className="bg-secondary px-1 rounded">STRIPE_SECRET_KEY</code> is set in your environment.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {stripeLoading && !stripeData && (
              <Card className="p-12 text-center text-muted-foreground text-sm border-none">
                Loading Stripe data...
              </Card>
            )}

            {stripeData && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                  <Card className="p-5 border-none">
                    <p className="text-xs uppercase text-muted-foreground mb-2">Revenue (30d)</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stripeData.totalRevenue30d / 100, stripeData.currency.toUpperCase())}
                    </p>
                  </Card>
                  <Card className="p-5 border-none">
                    <p className="text-xs uppercase text-muted-foreground mb-2">MRR</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stripeData.mrr / 100, stripeData.currency.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{stripeData.activeSubscriptions} active subs</p>
                  </Card>
                  <Card className="p-5 border-none">
                    <p className="text-xs uppercase text-muted-foreground mb-2">Available Balance</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stripeData.availableBalance / 100, stripeData.currency.toUpperCase())}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatCurrency(stripeData.pendingBalance / 100, stripeData.currency.toUpperCase())} pending
                    </p>
                  </Card>
                  <Card className="p-5 border-none">
                    <p className="text-xs uppercase text-muted-foreground mb-2">Revenue (90d)</p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(stripeData.totalRevenue90d / 100, stripeData.currency.toUpperCase())}
                    </p>
                  </Card>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <Card className="p-0 border-none overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                      <h3 className="text-sm font-semibold">Recent Charges</h3>
                    </div>
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {stripeData.recentCharges.length === 0 ? (
                        <p className="p-5 text-sm text-muted-foreground text-center">No charges yet</p>
                      ) : (
                        stripeData.recentCharges.map((c) => (
                          <div key={c.id} className="px-5 py-3 flex items-center gap-3">
                            <CreditCardIcon className="w-4 h-4 text-muted-foreground" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{c.customer_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(c.created * 1000).toLocaleDateString("en-GB")}
                              </p>
                            </div>
                            <span className="text-sm font-semibold">
                              {formatCurrency(c.amount / 100, c.currency.toUpperCase())}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  <Card className="p-0 border-none overflow-hidden">
                    <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                      <h3 className="text-sm font-semibold">Recent Customers</h3>
                    </div>
                    <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                      {stripeData.recentCustomers.length === 0 ? (
                        <p className="p-5 text-sm text-muted-foreground text-center">No customers yet</p>
                      ) : (
                        stripeData.recentCustomers.map((c) => (
                          <div key={c.id} className="px-5 py-3">
                            <p className="text-sm font-medium truncate">{c.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {c.email || "no email"} · joined {new Date(c.created * 1000).toLocaleDateString("en-GB")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>
                </div>

                <Card className="p-0 border-none overflow-hidden">
                  <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                    <h3 className="text-sm font-semibold">Recent Payouts</h3>
                  </div>
                  <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                    {stripeData.recentPayouts.length === 0 ? (
                      <p className="p-5 text-sm text-muted-foreground text-center">No payouts yet</p>
                    ) : (
                      stripeData.recentPayouts.map((p) => (
                        <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                          <WalletIcon className="w-4 h-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{formatCurrency(p.amount / 100, p.currency.toUpperCase())}</p>
                            <p className="text-xs text-muted-foreground">
                              Arrives {new Date(p.arrival_date * 1000).toLocaleDateString("en-GB")}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">{p.status}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </>
            )}
          </div>
        )}

        {tab === "tax" && (
          <div className="space-y-4">
            <Card className="p-0 border-none overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-sm font-semibold">Tax Deadlines</h2>
                <Button size="sm" onClick={() => setIsDeadlineDrawerOpen(true)} className="cursor-pointer">
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Deadline
                </Button>
              </div>
              {deadlines.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  No tax deadlines set. Add Corp Tax, PAYE, or Self-Assessment dates.
                </div>
              ) : (
                <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
                  {deadlines.map((d) => {
                    const days = daysUntil(d.date);
                    const isOverdue = days < 0 && !d.paid;
                    const isUrgent = days >= 0 && days <= 30 && !d.paid;

                    return (
                      <div key={d.id} className="flex items-center gap-4 px-5 py-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          d.paid ? "bg-green-500/10 text-green-600" :
                          isOverdue ? "bg-red-500/10 text-red-600" :
                          isUrgent ? "bg-yellow-500/10 text-yellow-600" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          <CalendarIcon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{d.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(d.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                            {!d.paid && (
                              <span className={`ml-2 ${isOverdue ? "text-red-600" : isUrgent ? "text-yellow-600" : ""}`}>
                                · {isOverdue ? `${Math.abs(days)} days overdue` : `${days} days left`}
                              </span>
                            )}
                          </p>
                        </div>
                        {d.amount > 0 && (
                          <span className="text-sm font-semibold">{formatCurrency(Number(d.amount))}</span>
                        )}
                        <Button
                          variant={d.paid ? "default" : "outline"}
                          size="sm"
                          className="cursor-pointer"
                          onClick={() => handleTogglePaid(d)}
                        >
                          {d.paid ? "Paid" : "Mark Paid"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 cursor-pointer text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteDeadline(d.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            <Card className="p-0 border-none overflow-hidden">
              <div className="px-5 py-4 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-sm font-semibold">Tax Estimator (UK Ltd, 2025-26 rates)</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your figures to estimate Corporation Tax, Dividend Tax, and PAYE
                </p>
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Company Profit (annual)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={profit}
                    onChange={(e) => setProfit(e.target.value)}
                  />
                  <div className="mt-3 p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Corporation Tax</p>
                    <p className="text-lg font-bold">{formatCurrency(corpTaxEst)}</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Director Salary (annual)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={salary}
                    onChange={(e) => setSalary(e.target.value)}
                  />
                  <div className="mt-3 p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">PAYE (Income Tax + NI)</p>
                    <p className="text-lg font-bold">{formatCurrency(payeEst.total)}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tax: {formatCurrency(payeEst.income)} · NI: {formatCurrency(payeEst.ni)}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">Dividends (annual)</label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={dividends}
                    onChange={(e) => setDividends(e.target.value)}
                  />
                  <div className="mt-3 p-3 bg-secondary rounded-lg">
                    <p className="text-xs text-muted-foreground">Dividend Tax</p>
                    <p className="text-lg font-bold">{formatCurrency(divTaxEst)}</p>
                  </div>
                </div>
              </div>
              <div className="px-5 pb-5">
                <div className="p-4 bg-blue-500/5 border border-blue-500/20 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUpIcon className="w-4 h-4 text-blue-500" />
                      <p className="text-sm font-medium">Total Estimated Tax</p>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCurrency(corpTaxEst + payeEst.total + divTaxEst)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Transaction drawer */}
      <AnimatePresence>
        {isTxDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsTxDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">Add Transaction</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsTxDrawerOpen(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <div className="flex gap-2">
                    {(["expense", "income"] as const).map((t) => (
                      <Button
                        key={t}
                        variant={newTx.type === t ? "default" : "outline"}
                        size="sm"
                        className="flex-1 cursor-pointer capitalize"
                        onClick={() => setNewTx({ ...newTx, type: t })}
                      >
                        {t}
                      </Button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newTx.amount}
                    onChange={(e) => setNewTx({ ...newTx, amount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    className="w-full h-10 px-3 rounded-md border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-sm"
                    value={newTx.category}
                    onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                  >
                    {personalCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Description</label>
                  <Input
                    placeholder="What's this for?"
                    value={newTx.description}
                    onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={newTx.date}
                    onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsTxDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={handleAddTx}
                  disabled={!newTx.amount}
                >
                  Add
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Deadline drawer */}
      <AnimatePresence>
        {isDeadlineDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsDeadlineDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <h2 className="text-lg font-semibold">Add Tax Deadline</h2>
                <Button variant="ghost" size="icon" onClick={() => setIsDeadlineDrawerOpen(false)}>
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Deadline Name</label>
                  <Input
                    placeholder="e.g. Corp Tax FY2024"
                    value={newDeadline.name}
                    onChange={(e) => setNewDeadline({ ...newDeadline, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Date</label>
                  <Input
                    type="date"
                    value={newDeadline.date}
                    onChange={(e) => setNewDeadline({ ...newDeadline, date: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Amount Due (optional)</label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={newDeadline.amount}
                    onChange={(e) => setNewDeadline({ ...newDeadline, amount: e.target.value })}
                  />
                </div>
              </div>
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex gap-2">
                <Button variant="outline" className="flex-1 cursor-pointer" onClick={() => setIsDeadlineDrawerOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="flex-1 cursor-pointer"
                  onClick={handleAddDeadline}
                  disabled={!newDeadline.name || !newDeadline.date}
                >
                  Add
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
