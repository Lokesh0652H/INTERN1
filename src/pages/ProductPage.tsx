import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useData } from '@/contexts/DataContext';

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1', '#ec4899', '#14b8a6'];
const DAY_NAMES_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function ProductPage() {
  const { filteredMetrics: metrics } = useData();
  if (!metrics) return null;

  const categoryData = Object.entries(metrics.revenueByCategory)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);

  const pieData = categoryData.map((c, i) => ({
    ...c,
    fill: COLORS[i % COLORS.length],
    percent: ((c.revenue / metrics.totalRevenue) * 100).toFixed(1),
  }));

  // Heatmap
  const maxHeat = Math.max(...metrics.heatmapData.map(h => h.value), 1);
  const peakCell = metrics.heatmapData.reduce((max, c) => c.value > max.value ? c : max, metrics.heatmapData[0]);

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-[1600px] mx-auto px-4 py-6 space-y-6"
    >
      <motion.h1 variants={fadeUp} className="text-2xl font-bold gradient-text">Product Performance</motion.h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category Bar */}
        <motion.div variants={fadeUp} className="chart-container">
          <h3 className="section-title">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
              <Bar dataKey="revenue" radius={[0, 6, 6, 0]}>
                {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Donut */}
        <motion.div variants={fadeUp} className="chart-container">
          <h3 className="section-title">Revenue Share by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} dataKey="revenue" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={110} paddingAngle={2} label={({ name, percent }) => `${name} (${percent}%)`}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top 10 Products */}
      <motion.div variants={fadeUp} className="chart-container">
        <h3 className="section-title">Top 10 Products by Units Sold</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={metrics.topProducts} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
            <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={140} />
            <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} />
            <Bar dataKey="sales" fill="#00d4ff" radius={[0, 6, 6, 0]} name="Units Sold" />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Heatmap */}
      <motion.div variants={fadeUp} className="chart-container">
        <h3 className="section-title">Order Volume Heatmap (Day × Hour)</h3>
        <p className="text-sm text-muted-foreground mb-4">
          🔥 Peak: {DAY_NAMES_SHORT[peakCell?.day || 0]} {peakCell?.hour || 0}:00 ({peakCell?.value || 0} orders)
        </p>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <div className="flex gap-0.5 mb-1">
              <div className="w-12" />
              {Array.from({ length: 24 }, (_, h) => (
                <div key={h} className="flex-1 text-center text-[10px] text-muted-foreground">{h}</div>
              ))}
            </div>
            {[1, 2, 3, 4, 5, 6, 0].map(day => (
              <div key={day} className="flex gap-0.5 mb-0.5">
                <div className="w-12 text-xs text-muted-foreground flex items-center">{DAY_NAMES_SHORT[day]}</div>
                {Array.from({ length: 24 }, (_, h) => {
                  const cell = metrics.heatmapData.find(c => c.day === day && c.hour === h);
                  const intensity = cell ? cell.value / maxHeat : 0;
                  return (
                    <div
                      key={h}
                      className="flex-1 aspect-square rounded-sm transition-colors"
                      style={{
                        background: intensity > 0
                          ? `rgba(0, 212, 255, ${0.1 + intensity * 0.8})`
                          : 'hsl(222 30% 14%)',
                      }}
                      title={`${DAY_NAMES_SHORT[day]} ${h}:00 - ${cell?.value || 0} orders`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
