import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '@/contexts/DataContext';

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444'];
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function GeographicPage() {
  const { filteredMetrics: metrics } = useData();

  const cityTable = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.revenueByCity)
      .map(([city, revenue]) => ({
        city,
        orders: metrics.ordersByCity[city] || 0,
        revenue: Math.round(revenue),
        avgOrder: Math.round(revenue / (metrics.ordersByCity[city] || 1)),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [metrics]);

  const top5 = cityTable.slice(0, 5);

  const regionData = useMemo(() => {
    if (!metrics) return [];
    return Object.entries(metrics.revenueByRegion)
      .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [metrics]);

  if (!metrics) return null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-[1600px] mx-auto px-4 py-6 space-y-6"
    >
      <motion.h1 variants={fadeUp} className="text-2xl font-bold gradient-text">Geographic Sales</motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Cities */}
        <motion.div variants={fadeUp} className="chart-container">
          <h3 className="section-title">Top 5 Cities by Revenue</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={top5}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
              <XAxis dataKey="city" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {top5.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Revenue by Region */}
        <motion.div variants={fadeUp} className="chart-container">
          <h3 className="section-title">Revenue by Region</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" fill="#7c3aed" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* City Bubble Map Alternative - Visual representation */}
      <motion.div variants={fadeUp} className="chart-container">
        <h3 className="section-title">City Distribution</h3>
        <div className="flex flex-wrap gap-3 justify-center py-4">
          {cityTable.slice(0, 20).map((city, i) => {
            const maxRev = cityTable[0].revenue;
            const size = 40 + (city.revenue / maxRev) * 80;
            const opacity = 0.3 + (city.revenue / maxRev) * 0.7;
            return (
              <motion.div
                key={city.city}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring' }}
                className="flex items-center justify-center rounded-full text-center cursor-default transition-transform hover:scale-110"
                style={{
                  width: size,
                  height: size,
                  background: `rgba(0, 212, 255, ${opacity * 0.2})`,
                  border: `1px solid rgba(0, 212, 255, ${opacity * 0.5})`,
                }}
                title={`${city.city}: ₹${city.revenue.toLocaleString()}`}
              >
                <span className="text-[9px] text-foreground font-medium leading-tight px-1">{city.city}</span>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Data Table */}
      <motion.div variants={fadeUp} className="chart-container overflow-x-auto">
        <h3 className="section-title">City-Level Sales Data</h3>
        <table className="data-table">
          <thead>
            <tr>
              <th>City</th>
              <th>Orders</th>
              <th>Revenue</th>
              <th>Avg Order Value</th>
            </tr>
          </thead>
          <tbody>
            {cityTable.map(row => (
              <tr key={row.city}>
                <td className="font-medium">{row.city}</td>
                <td>{row.orders}</td>
                <td>₹{row.revenue.toLocaleString()}</td>
                <td>₹{row.avgOrder.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
