"use client";

import { useState, useMemo } from "react";
import { TrendingUpIcon, TrendingDownIcon, Download, Users2, Clock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface AnalyticsProps {
  isMiddleChatVisible?: boolean;
  setIsMiddleChatVisible?: (value: boolean) => void;
}

const statsCards = [
  {
    title: "Total Visitors",
    value: "124,583",
    change: "+12.3%",
    subtext: "vs last month",
    trend: "up",
    icon: Users2,
  },
  {
    title: "App Downloads",
    value: "8,429",
    change: "+8.7%",
    subtext: "this month",
    trend: "up",
    icon: Download,
  },
  {
    title: "Active Users",
    value: "45,291",
    change: "+15.2%",
    subtext: "daily active",
    trend: "up",
    icon: Users2,
  },
  {
    title: "Avg. Session",
    value: "4m 32s",
    change: "+2.1%",
    subtext: "per user",
    trend: "up",
    icon: Clock,
  },
];

// Visitors data for the chart (90 days)
const visitorsData = [
  { date: "2025-10-05", visitors: 1235 },
  { date: "2025-10-06", visitors: 1342 },
  { date: "2025-10-07", visitors: 1128 },
  { date: "2025-10-08", visitors: 1455 },
  { date: "2025-10-09", visitors: 1568 },
  { date: "2025-10-10", visitors: 1475 },
  { date: "2025-10-11", visitors: 1690 },
  { date: "2025-10-12", visitors: 1582 },
  { date: "2025-10-13", visitors: 1395 },
  { date: "2025-10-14", visitors: 1710 },
  { date: "2025-10-15", visitors: 1605 },
  { date: "2025-10-16", visitors: 1498 },
  { date: "2025-10-17", visitors: 1815 },
  { date: "2025-10-18", visitors: 1728 },
  { date: "2025-10-19", visitors: 1842 },
  { date: "2025-10-20", visitors: 1635 },
  { date: "2025-10-21", visitors: 1950 },
  { date: "2025-10-22", visitors: 1745 },
  { date: "2025-10-23", visitors: 1862 },
  { date: "2025-10-24", visitors: 1978 },
  { date: "2025-10-25", visitors: 2085 },
  { date: "2025-10-26", visitors: 1992 },
  { date: "2025-10-27", visitors: 1788 },
  { date: "2025-10-28", visitors: 2105 },
  { date: "2025-10-29", visitors: 1898 },
  { date: "2025-10-30", visitors: 2215 },
  { date: "2025-10-31", visitors: 2128 },
  { date: "2025-11-01", visitors: 2242 },
  { date: "2025-11-02", visitors: 2138 },
  { date: "2025-11-03", visitors: 2355 },
  { date: "2025-11-04", visitors: 2248 },
  { date: "2025-11-05", visitors: 2465 },
  { date: "2025-11-06", visitors: 2378 },
  { date: "2025-11-07", visitors: 2585 },
  { date: "2025-11-08", visitors: 2492 },
  { date: "2025-11-09", visitors: 2288 },
  { date: "2025-11-10", visitors: 2605 },
  { date: "2025-11-11", visitors: 2715 },
  { date: "2025-11-12", visitors: 2508 },
  { date: "2025-11-13", visitors: 2822 },
  { date: "2025-11-14", visitors: 2735 },
  { date: "2025-11-15", visitors: 2948 },
  { date: "2025-11-16", visitors: 2842 },
  { date: "2025-11-17", visitors: 2655 },
  { date: "2025-11-18", visitors: 3068 },
  { date: "2025-11-19", visitors: 2975 },
  { date: "2025-11-20", visitors: 3182 },
  { date: "2025-11-21", visitors: 2978 },
  { date: "2025-11-22", visitors: 3092 },
  { date: "2025-11-23", visitors: 3205 },
  { date: "2025-11-24", visitors: 2998 },
  { date: "2025-11-25", visitors: 3315 },
  { date: "2025-11-26", visitors: 3228 },
  { date: "2025-11-27", visitors: 3435 },
  { date: "2025-11-28", visitors: 3342 },
  { date: "2025-11-29", visitors: 3138 },
  { date: "2025-11-30", visitors: 3552 },
  { date: "2025-12-01", visitors: 3465 },
  { date: "2025-12-02", visitors: 3258 },
  { date: "2025-12-03", visitors: 3672 },
  { date: "2025-12-04", visitors: 3788 },
  { date: "2025-12-05", visitors: 3695 },
  { date: "2025-12-06", visitors: 3802 },
  { date: "2025-12-07", visitors: 3598 },
  { date: "2025-12-08", visitors: 3915 },
  { date: "2025-12-09", visitors: 3825 },
  { date: "2025-12-10", visitors: 3718 },
  { date: "2025-12-11", visitors: 3932 },
  { date: "2025-12-12", visitors: 4045 },
  { date: "2025-12-13", visitors: 4155 },
  { date: "2025-12-14", visitors: 3948 },
  { date: "2025-12-15", visitors: 4262 },
  { date: "2025-12-16", visitors: 4175 },
  { date: "2025-12-17", visitors: 4385 },
  { date: "2025-12-18", visitors: 4292 },
  { date: "2025-12-19", visitors: 4088 },
  { date: "2025-12-20", visitors: 4402 },
  { date: "2025-12-21", visitors: 4515 },
  { date: "2025-12-22", visitors: 4308 },
  { date: "2025-12-23", visitors: 4122 },
  { date: "2025-12-24", visitors: 3828 },
  { date: "2025-12-25", visitors: 3235 },
  { date: "2025-12-26", visitors: 3542 },
  { date: "2025-12-27", visitors: 3938 },
  { date: "2025-12-28", visitors: 4252 },
  { date: "2025-12-29", visitors: 4465 },
  { date: "2025-12-30", visitors: 4258 },
  { date: "2025-12-31", visitors: 4072 },
  { date: "2026-01-01", visitors: 3685 },
  { date: "2026-01-02", visitors: 4192 },
];

// Downloads by platform
const downloadsData = [
  { platform: "iOS", downloads: 4823, color: "rgb(59, 130, 246)" },
  { platform: "Android", downloads: 3606, color: "rgb(34, 197, 94)" },
];

// Top countries
const countriesData = [
  { country: "United States", flag: "🇺🇸", visitors: 42583, percentage: 34.2 },
  { country: "United Kingdom", flag: "🇬🇧", visitors: 28492, percentage: 22.9 },
  { country: "Germany", flag: "🇩🇪", visitors: 18734, percentage: 15.0 },
  { country: "Canada", flag: "🇨🇦", visitors: 14926, percentage: 12.0 },
  { country: "Australia", flag: "🇦🇺", visitors: 9848, percentage: 7.9 },
  { country: "Others", flag: "🌍", visitors: 10000, percentage: 8.0 },
];

// Device types
const deviceData = [
  { name: "Mobile", value: 68234, color: "rgb(59, 130, 246)" },
  { name: "Desktop", value: 42158, color: "rgb(34, 197, 94)" },
  { name: "Tablet", value: 14191, color: "rgb(168, 85, 247)" },
];

export default function Analytics({ isMiddleChatVisible = false, setIsMiddleChatVisible }: AnalyticsProps) {
  const [timeRange, setTimeRange] = useState<'30' | '90'>('90');

  // Filter data based on selected time range
  const filteredData = useMemo(() => {
    const days = timeRange === '30' ? 30 : 90;
    return visitorsData.slice(-days).map(d => ({
      ...d,
      displayDate: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }));
  }, [timeRange]);

  // Custom tooltip component
  const VisitorsTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-neutral-900 dark:bg-neutral-100 text-white dark:text-black px-3 py-2 rounded-lg shadow-lg text-xs border border-neutral-700 dark:border-neutral-300">
          <div className="text-xs text-white dark:text-black mb-1">{payload[0].payload.date}</div>
          <div className="text-white dark:text-black text-sm font-bold">
            Visitors: {payload[0].value.toLocaleString()}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <>
      <div className='w-full sticky top-0 z-50 bg-white dark:bg-neutral-950 flex-shrink-0 flex flex-row h-16 items-center px-8 border-b border-neutral-200 dark:border-neutral-800'>
        <h1 className='text-lg font-bold'>Analytics</h1>
        <div className="ml-4 flex gap-2">
          <Badge variant="outline" className="text-xs">
            Last 30 Days
          </Badge>
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
                    <span className={`text-sm font-medium ${stat.trend === "up" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                      {stat.trend === "up" ? <TrendingUpIcon className="w-3 h-3 inline mr-1" /> : <TrendingDownIcon className="w-3 h-3 inline mr-1" />}
                      {stat.change}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 grid-cols-1 flex-col gap-2 mt-2">
          {/* Visitors Chart */}
          <Card className="p-6 pb-0 flex-1 border-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Visitors Over Time</h2>
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
                    <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
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
                  <Tooltip content={<VisitorsTooltip />} cursor={{ stroke: 'rgb(59, 130, 246)', strokeWidth: 1 }} />
                  <Area
                    type="monotone"
                    dataKey="visitors"
                    stroke="rgb(59, 130, 246)"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorVisitors)"
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Downloads by Platform */}
          <Card className="p-6 pb-0 border-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Downloads by Platform</h2>
                <p className="text-xs text-muted-foreground">This Month</p>
              </div>
            </div>
            <div className="w-full h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={downloadsData}
                  margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="currentColor"
                    className="border-neutral-200/20 opacity-30"
                    opacity={0.3}
                    vertical={false}
                    horizontal={true}
                  />
                  <XAxis
                    dataKey="platform"
                    tick={{ fontSize: 11 }}
                    className="text-muted-foreground"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis hide={true} />
                  <Tooltip
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'black'
                    }}
                  />
                  <Bar
                    dataKey="downloads"
                    radius={[8, 8, 0, 0]}
                    animationDuration={800}
                    animationEasing="ease-in-out"
                  >
                    {downloadsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Top Countries & Device Types */}
        <div className="grid md:grid-cols-2 grid-cols-1 gap-2 mt-2">

          {/* Top Countries */}
          <Card className="bg-card border-none p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold">Top Countries</h2>
              <Badge variant="outline" className="text-xs">
                Last 30 Days
              </Badge>
            </div>
            <div className="space-y-4">
              {countriesData.map((country) => (
                <div key={country.country}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{country.flag}</span>
                      <div>
                        <p className="text-sm font-medium">{country.country}</p>
                        <p className="text-xs text-muted-foreground">{country.visitors.toLocaleString()} visitors</p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold">{country.percentage}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${country.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Device Types */}
          <Card className="p-6 border-none">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold">Device Types</h2>
                <p className="text-xs text-muted-foreground">Usage Distribution</p>
              </div>
            </div>
            <div className="w-full h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deviceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    animationDuration={800}
                    stroke="none"
                    animationEasing="ease-in-out"
                  >
                    {deviceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'white',
                      //border: '1px solid rgb(64, 64, 64)',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'white'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    wrapperStyle={{ fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>

        </div>

      </div>

    </>
  );
}
