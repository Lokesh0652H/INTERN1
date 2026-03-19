import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, ShoppingBag, TrendingUp, MapPin, Database, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useData } from '@/contexts/DataContext';
import AnimatedCounter from '@/components/AnimatedCounter';
import GlobalFilters from '@/components/GlobalFilters';

const RevenueWave = lazy(() => import('@/components/3d/RevenueWave'));

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function OverviewPage() {
  const { summary, filteredMetrics: metrics, loading } = useData();

  if (loading || !metrics || !summary) return null;

  const lastMoM = metrics.momGrowth[metrics.momGrowth.length - 1];

  const kpis = [
    { label: 'Total Revenue', value: metrics.totalRevenue, prefix: '₹', icon: DollarSign, color: 'text-primary' },
    { label: 'Total Orders', value: metrics.totalOrders, prefix: '', icon: ShoppingBag, color: 'text-neon-violet' },
    { label: 'Avg Revenue/Order', value: metrics.avgRevenuePerOrder, prefix: '₹', icon: TrendingUp, color: 'text-neon-emerald' },
    { label: 'Top City', value: 0, prefix: '', icon: MapPin, color: 'text-neon-amber', textValue: metrics.topCity },
  ];

  return (
    <div className="relative min-h-screen">
      <Suspense fallback={null}>
        <RevenueWave />
      </Suspense>

      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="relative z-10 max-w-[1600px] mx-auto px-4 py-6 space-y-6"
      >
        {/* Data Summary */}
        <motion.div variants={fadeUp} className="glass-card p-4 flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-primary" />
            <span className="text-muted-foreground">Data Summary</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-neon-emerald" />
            <span><strong>{summary.rowsLoaded}</strong> rows loaded</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-neon-emerald" />
            <span><strong>{summary.rowsAfterCleaning}</strong> after cleaning</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-neon-amber" />
            <span><strong>{summary.nullsRemoved}</strong> nulls removed</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-neon-amber" />
            <span><strong>{summary.duplicatesRemoved}</strong> duplicates removed</span>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div variants={fadeUp}>
          <GlobalFilters />
        </motion.div>

        {/* KPI Cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <motion.div
              key={kpi.label}
              variants={fadeUp}
              className="kpi-card"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground">{kpi.label}</span>
                <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div className="text-2xl font-bold text-foreground">
                {kpi.textValue ? (
                  kpi.textValue
                ) : (
                  <AnimatedCounter value={kpi.value} prefix={kpi.prefix} />
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Revenue Trend */}
        <motion.div variants={fadeUp} className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title mb-0">Revenue Trend (12-Month)</h3>
            {lastMoM && (
              <span className={lastMoM.growth >= 0 ? 'badge-positive' : 'badge-negative'}>
                MoM: {lastMoM.growth >= 0 ? '+' : ''}{lastMoM.growth.toFixed(1)}%
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={metrics.revenueByMonth}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00d4ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00d4ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} angle={-45} textAnchor="end" height={60} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }}
                formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#00d4ff" fill="url(#revenueGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Day of Week + YoY */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} className="chart-container">
            <h3 className="section-title">Revenue by Day of Week</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metrics.revenueByDayOfWeek}>
                <defs>
                  <linearGradient id="dayGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
                <XAxis dataKey="day" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#7c3aed" fill="url(#dayGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div variants={fadeUp} className="chart-container">
            <h3 className="section-title">Year-over-Year Revenue</h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={metrics.yoyGrowth}>
                <defs>
                  <linearGradient id="yoyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
                <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="url(#yoyGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
