"use client";

import { TrendingUpIcon, ArrowRightIcon, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import Link from "next/link";
import { useState, useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { statsCards, revenueData, recentUsers, checkoutConversionData } from '@/lib/mockData';
import { motion, AnimatePresence } from "framer-motion";
import { XIcon } from "lucide-react";

interface HomeProps {
  isMiddleChatVisible?: boolean;
  setIsMiddleChatVisible?: (value: boolean) => void;
}

export default function Home({ isMiddleChatVisible = false, setIsMiddleChatVisible }: HomeProps) {
  const [timeRange, setTimeRange] = useState<'30' | '90'>('90');
  const [isAIDrawerOpen, setIsAIDrawerOpen] = useState(false);

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    const days = timeRange === '30' ? 30 : 90;
    return revenueData.slice(-days).map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [timeRange]);

  // Custom tooltip component
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-3 py-2 rounded-lg shadow-lg text-xs border border-neutral-700 dark:border-neutral-300">
          <div className="text-xs text-white dark:text-black mb-1">{payload[0].payload.date}</div>
          <div className="text-white dark:text-black text-sm font-bold">
            MRR: ${payload[0].value.toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  // Checkout tooltip component
  const CheckoutTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-3 py-2 rounded-lg shadow-lg text-xs border border-neutral-700 dark:border-neutral-300">
          <div className="text-xs text-white dark:text-black mb-1">{payload[0].payload.date}</div>
          <div className="text-white dark:text-black text-sm font-bold">
            Rate: {payload[0].value.toFixed(2)}%
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className='w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800'>
        <h1 className='text-lg font-bold'>Welcome back, John</h1>
        <div className="ml-auto">
          <Button
            variant="outline"
            className="cursor-pointer"
            size="sm"
            onClick={() => setIsAIDrawerOpen(true)}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
        </div>
      </div>

      <div className="max-w-7xl w-full mx-auto flex-1 p-8">
       
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
          {statsCards.map((stat) => (
            <Card key={stat.title} className="p-5 hover:shadow-md transition-shadow border-none mb-0">
              <div className="flex items-start justify-between">
                <div className="space-y-1 w-full">
                  <p className="text-xs uppercase text-muted-foreground mb-8">{stat.title}</p>
                  <p className="text-3xl font-bold mb-2">{stat.value}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}>
                      {stat.trend === "up" && <TrendingUpIcon className="w-3 h-3 inline mr-1" />}
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 grid-cols-1 flex-col gap-2 mt-2">
          {/* MRR Growth Chart */}
          <Card className="p-6 pb-0 flex-1 border-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">MRR Growth (USD)</h2>
                <p className="text-xs text-muted-foreground">Last {timeRange} Days</p>
              </div>
              <div className="flex gap-2 bg-background p-1 rounded-lg">
                <Button
                  variant={timeRange === '90' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs cursor-pointer"
                  onClick={() => setTimeRange('90')}
                >
                  90D
                </Button>
                <Button
                  variant={timeRange === '30' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs cursor-pointer"
                  onClick={() => setTimeRange('30')}
                >
                  30D
                </Button>
              </div>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={filteredData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(59, 130, 246)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(59, 130, 246)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="border-neutral-200/20 opacity-30"
                    opacity={0.3}
                    vertical={true}
                    horizontal={false}
                  />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval={timeRange === '90' ? 14 : 4}
                  />
                  <YAxis
                    hide={true}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgb(59, 130, 246)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="mrr"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMrr)"
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Recent Users */}
          <Card className="bg-card border-none p-0 overflow-hidden md:flex-1">
            <div className="flex items-center justify-between bg-card px-4 py-3 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-sm font-semibold">Recent Users</h2>
              <Link href="/contacts" className="flex flex-row items-center gap-1 text-xs">
                View All
                <ArrowRightIcon className="w-3 h-3 ml-1" />
              </Link>
            </div>
            <div>
              {recentUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center border-b border-border gap-3 px-3 py-3  hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                >
                  <Avatar className="size-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>
                      {user.name.split(' ').map((n: string) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 pl-2">
                    <p className="font-medium text-sm truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground mr-10">{user.signedUp}</span>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant={user.plan === "Pro" ? "default" : "outline"} className="text-xs">
                      {user.plan}
                    </Badge>
                    
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Checkout Conversion & Account Balance */}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2 mt-2">

          {/* Account Balance */}
          <Card className="p-6 border-none flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Account Balance</h2>
              <Button size="sm" variant="default" className="h-8 text-xs bg-sky-500 text-white">
                Withdraw
              </Button>
            </div>

              <div>
                <p className="text-4xl font-semibold">$655.19</p>
                <p className="text-xs text-muted-foreground mt-1">Available to withdraw</p>
              </div>
              <div className="pt-4 mt-auto">
                <div className="bg-secondary p-4 rounded-lg">
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                     
                      <div>
                        <p className="text-lg ">$11,651.42</p>
                        <p className="text-xs text-muted-foreground">Jan 5, 2026</p>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-500/10 px-2 py-2 rounded-md">Succeeded</span>
                  </div>
                </div>
              </div>

          </Card>


          {/* Checkout Conversion Rate */}
          <Card className="p-6 pb-0 border-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Checkout Conversion Rate</h2>
                <p className="text-xs text-muted-foreground">Last 31 Days</p>
              </div>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={checkoutConversionData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCheckout" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(14 165 233)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="rgb(14 165 233)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="border-neutral-200/20 opacity-30"
                    opacity={0.3}
                    vertical={true}
                    horizontal={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                    interval={4}
                  />
                  <YAxis hide={true} />
                  <Tooltip content={<CheckoutTooltip />} cursor={{ stroke: 'rgb(59, 130, 246)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="rgb(14 165 233)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCheckout)"
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          
        </div>


      </div>

      {/* AI Insights Drawer */}
      <AnimatePresence>
        {isAIDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsAIDrawerOpen(false)}
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full md:w-[500px] bg-white dark:bg-neutral-950 shadow-xl z-50 border-l border-neutral-200 dark:border-neutral-800 flex flex-col"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  <h2 className="text-lg font-semibold">AI Insights</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAIDrawerOpen(false)}
                >
                  <XIcon className="w-4 h-4" />
                </Button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-6 overflow-y-auto">
                <div className="space-y-6">
                  {/* Overview Section */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Overview</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Your MRR is growing steadily at $1,760, up 3.4% from last week</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>You have 49 active power users (4+ days/week), showing strong engagement</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Free to paid conversion rate is at 6.2%, which is above industry average</span>
                      </li>
                    </ul>
                  </div>

                  {/* Growth Trends */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Growth Trends</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>MRR has shown consistent upward trajectory over the last 90 days</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Recent user signups include 3 Pro plan subscribers in the last week</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Checkout conversion rate is volatile, ranging from 1% to 5.8%</span>
                      </li>
                    </ul>
                  </div>

                  {/* Key Metrics */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Key Metrics</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Account balance of $655.19 is available for withdrawal</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Last successful transaction was $11,651.42 on Jan 5, 2026</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Failed dictations remain low at 0.35% over the last 24 hours</span>
                      </li>
                    </ul>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Recommendations</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Consider A/B testing the checkout flow to stabilize conversion rates</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Engage with power users for testimonials and case studies</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Monitor the 49 active power users for potential upsell opportunities</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-foreground">•</span>
                        <span>Review recent user feedback to identify common feature requests</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-6 border-t border-neutral-200 dark:border-neutral-800">
                <p className="text-xs text-muted-foreground text-center">
                  AI insights generated based on your dashboard data
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}
