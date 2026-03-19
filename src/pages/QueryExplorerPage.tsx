import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useData } from '@/contexts/DataContext';

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface QueryDef {
  id: string;
  label: string;
  sql: string;
}

const QUERIES: QueryDef[] = [
  {
    id: 'rev_city',
    label: 'Total revenue by city',
    sql: `SELECT City, SUM(Sales) AS Total_Revenue, COUNT(*) AS Order_Count
FROM retail_sales
GROUP BY City
ORDER BY Total_Revenue DESC;`,
  },
  {
    id: 'best_products',
    label: 'Best-selling products by volume',
    sql: `SELECT Sub_Category, COUNT(*) AS Units_Sold, SUM(Sales) AS Revenue
FROM retail_sales
GROUP BY Sub_Category
ORDER BY Units_Sold DESC
LIMIT 10;`,
  },
  {
    id: 'peak_hours',
    label: 'Peak sales hours',
    sql: `SELECT EXTRACT(HOUR FROM Order_Date) AS Hour, COUNT(*) AS Order_Volume
FROM retail_sales
GROUP BY Hour
ORDER BY Order_Volume DESC;`,
  },
  {
    id: 'monthly_trend',
    label: 'Monthly revenue trend',
    sql: `SELECT DATE_TRUNC('month', Order_Date) AS Month, SUM(Sales) AS Revenue
FROM retail_sales
GROUP BY Month
ORDER BY Month ASC;`,
  },
  {
    id: 'rev_region',
    label: 'Revenue by region',
    sql: `SELECT Region, SUM(Sales) AS Total_Revenue, AVG(Sales) AS Avg_Order_Value,
       COUNT(*) AS Orders
FROM retail_sales
GROUP BY Region
ORDER BY Total_Revenue DESC;`,
  },
  {
    id: 'dead_stock',
    label: 'Dead stock products',
    sql: `WITH product_counts AS (
  SELECT Sub_Category, COUNT(*) AS units_sold
  FROM retail_sales
  GROUP BY Sub_Category
),
percentile AS (
  SELECT PERCENTILE_CONT(0.05) WITHIN GROUP (ORDER BY units_sold) AS p5
  FROM product_counts
)
SELECT pc.Sub_Category, pc.units_sold
FROM product_counts pc, percentile p
WHERE pc.units_sold <= p.p5
ORDER BY pc.units_sold ASC;`,
  },
];

export default function QueryExplorerPage() {
  const { filteredMetrics: metrics } = useData();
  const [selectedQuery, setSelectedQuery] = useState(QUERIES[0].id);

  const query = QUERIES.find(q => q.id === selectedQuery)!;

  const resultData = useMemo(() => {
    if (!metrics) return { table: [] as any[], columns: [] as string[] };

    switch (selectedQuery) {
      case 'rev_city': {
        const rows = Object.entries(metrics.revenueByCity)
          .map(([city, rev]) => ({ City: city, Total_Revenue: Math.round(rev), Orders: metrics.ordersByCity[city] || 0 }))
          .sort((a, b) => b.Total_Revenue - a.Total_Revenue);
        return { table: rows, columns: ['City', 'Total_Revenue', 'Orders'] };
      }
      case 'best_products': {
        const rows = metrics.topProducts.map(p => ({ Sub_Category: p.name, Units_Sold: p.sales, Revenue: Math.round(p.revenue) }));
        return { table: rows, columns: ['Sub_Category', 'Units_Sold', 'Revenue'] };
      }
      case 'peak_hours': {
        const rows = [...metrics.revenueByHour].sort((a, b) => b.orders - a.orders).map(h => ({ Hour: `${h.hour}:00`, Order_Volume: h.orders }));
        return { table: rows, columns: ['Hour', 'Order_Volume'] };
      }
      case 'monthly_trend': {
        const rows = metrics.revenueByMonth.map(m => ({ Month: m.month, Revenue: m.revenue }));
        return { table: rows, columns: ['Month', 'Revenue'] };
      }
      case 'rev_region': {
        const rows = Object.entries(metrics.revenueByRegion)
          .map(([region, rev]) => ({ Region: region, Total_Revenue: Math.round(rev) }))
          .sort((a, b) => b.Total_Revenue - a.Total_Revenue);
        return { table: rows, columns: ['Region', 'Total_Revenue'] };
      }
      case 'dead_stock': {
        const rows = metrics.deadStock.map(d => ({ Sub_Category: d.name, Units_Sold: d.sales }));
        return { table: rows, columns: ['Sub_Category', 'Units_Sold'] };
      }
      default:
        return { table: [], columns: [] };
    }
  }, [selectedQuery, metrics]);

  if (!metrics) return null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-[1600px] mx-auto px-4 py-6 space-y-6"
    >
      <motion.h1 variants={fadeUp} className="text-2xl font-bold gradient-text">SQL Query Explorer</motion.h1>

      <motion.div variants={fadeUp} className="glass-card p-4">
        <label className="text-sm text-muted-foreground block mb-2">Select a query:</label>
        <select
          value={selectedQuery}
          onChange={e => setSelectedQuery(e.target.value)}
          className="filter-select w-full md:w-auto"
        >
          {QUERIES.map(q => <option key={q.id} value={q.id}>{q.label}</option>)}
        </select>
      </motion.div>

      <motion.div variants={fadeUp} className="chart-container">
        <h3 className="section-title">SQL Query</h3>
        <div className="code-block whitespace-pre">{query.sql}</div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={fadeUp} className="chart-container overflow-x-auto">
          <h3 className="section-title">Result ({resultData.table.length} rows)</h3>
          <table className="data-table">
            <thead>
              <tr>
                {resultData.columns.map(c => <th key={c}>{c}</th>)}
              </tr>
            </thead>
            <tbody>
              {resultData.table.slice(0, 20).map((row: any, i: number) => (
                <tr key={i}>
                  {resultData.columns.map(c => (
                    <td key={c}>{typeof row[c] === 'number' ? row[c].toLocaleString() : row[c]}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {resultData.table.length > 20 && <p className="text-xs text-muted-foreground mt-2">Showing first 20 of {resultData.table.length} rows</p>}
        </motion.div>

        <motion.div variants={fadeUp} className="chart-container">
          <h3 className="section-title">Visualization</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resultData.table.slice(0, 15)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 20% 18%)" />
              <XAxis dataKey={resultData.columns[0]} tick={{ fill: '#94a3b8', fontSize: 10 }} angle={-45} textAnchor="end" height={80} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: 'hsl(222 40% 10%)', border: '1px solid hsl(222 20% 20%)', borderRadius: '8px', color: '#e2e8f0' }} />
              <Bar dataKey={resultData.columns[1]} radius={[6, 6, 0, 0]}>
                {resultData.table.slice(0, 15).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
}
