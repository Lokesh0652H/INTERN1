import { Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, ZAxis, LineChart, Line } from 'recharts';
import { AlertTriangle, Package } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const InventoryCube = lazy(() => import('@/components/3d/InventoryCube'));

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function InventoryPage() {
  const { filteredMetrics: metrics } = useData();
  if (!metrics) return null;

  const categories = Object.keys(metrics.revenueByCategory);

  const cubeMetrics = {
    totalUnits: metrics.totalOrders,
    deadStock: metrics.deadStock.length,
    fastMovers: Math.ceil(metrics.salesBySubCategory.length * 0.2),
    q4Forecast: `${metrics.q4RevenueShare}%`,
    stockoutRisk: metrics.deadStock.length,
    reorderAlerts: metrics.deadStock.length,
  };

  // Forecast: take last 3 months avg and project
  const lastMonths = metrics.revenueByMonth.slice(-3);
  const avgRecent = lastMonths.reduce((s, m) => s + m.revenue, 0) / lastMonths.length;
  const forecastData = [
    ...metrics.revenueByMonth.map(m => ({ ...m, forecast: undefined as number | undefined })),
    ...['Forecast +1', 'Forecast +2', 'Forecast +3'].map((month, i) => ({
      month,
      revenue: undefined as number | undefined,
      forecast: Math.round(avgRecent * (1 + (i + 1) * 0.02)),
      year: 0,
      monthNum: 0,
    })),
  ];
  // Add forecast connection point
  if (forecastData.length > 3 && metrics.revenueByMonth.length > 0) {
    const lastReal = metrics.revenueByMonth.length - 1;
    forecastData[lastReal] = { ...forecastData[lastReal], forecast: forecastData[lastReal].revenue };
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-[1600px] mx-auto px-4 py-6 space-y-6"
    >
      <motion.h1 variants={fadeUp} className="text-2xl font-bold gradient-text">Inventory & Forecasting</motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cube */}
        <motion.div variants={fadeUp} className="chart-container lg:col-span-1">
          <h3 className="section-title">Inventory Cube</h3>
          <Suspense fallback={<div className="h-64 flex items-center justify-center text-muted-foreground">Loading 3D...</div>}>
            <InventoryCube metrics={cubeMetrics} />
          </Suspense>
        </motion.div>

        {/* Scatter */}
        <motion.div variants={fadeUp} className="chart-container lg:col-span-2">
          <h3 className="section-title">Units Sold vs Revenue (per Product)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
              <XAxis dataKey="unitsSold" name="Units" tick={{ fill: '#94a3b8', fontSize: 11 }} label={{ value: 'Units Sold', position: 'insideBottom', offset: -5, fill: '#94a3b8' }} />
              <YAxis dataKey="revenue" name="Revenue" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <ZAxis range={[40, 200]} />
              <Tooltip
                contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }}
                formatter={(v: number, name: string) => [name === 'Revenue' ? `₹${v.toLocaleString()}` : v, name]}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
              />
              <Scatter data={metrics.scatterData.filter(s => !s.isDead)} fill="#00d4ff" name="Products" />
              <Scatter data={metrics.scatterData.filter(s => s.isDead)} fill="#ef4444" name="Dead Stock" />
            </ScatterChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Forecast */}
      <motion.div variants={fadeUp} className="chart-container">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title mb-0">Revenue Forecast</h3>
          <span className="badge-positive">Q4 = {metrics.q4RevenueShare}% of annual revenue</span>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
            <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
            <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} />
            <Line type="monotone" dataKey="revenue" stroke="#00d4ff" strokeWidth={2} dot={false} name="Actual" />
            <Line type="monotone" dataKey="forecast" stroke="#7c3aed" strokeWidth={2} strokeDasharray="8 4" dot={false} name="Forecast" />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Dead Stock Alerts */}
      {metrics.deadStock.length > 0 && (
        <motion.div variants={fadeUp} className="chart-container">
          <h3 className="section-title flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Dead Stock / Reorder Alerts
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {metrics.deadStock.map(product => (
              <div key={product.name} className="flex items-center gap-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Package className="w-4 h-4 text-destructive" />
                <div>
                  <span className="text-sm font-medium text-foreground">{product.name}</span>
                  <span className="text-xs text-muted-foreground block">{product.sales} units sold</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
