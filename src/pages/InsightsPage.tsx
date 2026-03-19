import { useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, AlertTriangle, MapPin, Clock, Package, Download, BarChart3, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from 'recharts';
import { useData } from '@/contexts/DataContext';
import jsPDF from 'jspdf';

const COLORS = ['#00d4ff', '#7c3aed', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];
const fadeUp = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

interface Insight {
  icon: typeof TrendingUp;
  title: string;
  description: string;
  color: string;
  sparkData: { v: number }[];
}

export default function InsightsPage() {
  const { filteredMetrics: metrics } = useData();

  const insights: Insight[] = useMemo(() => {
    if (!metrics) return [];

    const topCityRev = Object.entries(metrics.revenueByCity).sort(([, a], [, b]) => b - a);
    const topCityPct = topCityRev[0] ? ((topCityRev[0][1] / metrics.totalRevenue) * 100).toFixed(1) : '0';
    const topCategory = Object.entries(metrics.revenueByCategory).sort(([, a], [, b]) => b - a)[0];
    const topRegion = Object.entries(metrics.revenueByRegion).sort(([, a], [, b]) => b - a)[0];

    return [
      {
        icon: TrendingUp,
        title: `${metrics.peakDay}s generate the highest revenue`,
        description: `Across all locations, ${metrics.peakDay} consistently shows the highest sales volume. Consider scheduling targeted promotions and increasing staff on ${metrics.peakDay}s.`,
        color: '#00d4ff',
        sparkData: metrics.revenueByDayOfWeek.map(d => ({ v: d.revenue })),
      },
      {
        icon: ShoppingCart,
        title: `Q4 (Oct–Dec) = ${metrics.q4RevenueShare}% of annual sales`,
        description: `The holiday quarter represents a significant portion of revenue. Recommend building inventory reserves by September and launching targeted Q4 promotions.`,
        color: '#7c3aed',
        sparkData: metrics.yoyGrowth.map(y => ({ v: y.revenue })),
      },
      {
        icon: AlertTriangle,
        title: `${metrics.deadStock.length} products flagged as dead stock`,
        description: `These products fall below the 5th percentile in sales velocity. Consider clearance discounts, bundling strategies, or discontinuation to free up capital.`,
        color: '#ef4444',
        sparkData: metrics.deadStock.slice(0, 7).map(d => ({ v: d.sales })),
      },
      {
        icon: MapPin,
        title: `${topCityRev[0]?.[0] || 'N/A'} contributes ${topCityPct}% of total revenue`,
        description: `This city is the highest revenue generator and should be treated as a priority market. Consider expanding delivery coverage and running localized campaigns.`,
        color: '#f59e0b',
        sparkData: topCityRev.slice(0, 7).map(([, v]) => ({ v })),
      },
      {
        icon: Clock,
        title: `Peak hour is ${metrics.peakHour}:00`,
        description: `Order volume peaks around ${metrics.peakHour}:00. Schedule flash sales, push notifications, and increased customer service staffing during this window.`,
        color: '#10b981',
        sparkData: metrics.revenueByHour.slice(Math.max(0, metrics.peakHour - 3), metrics.peakHour + 4).map(h => ({ v: h.orders })),
      },
      {
        icon: Package,
        title: `${topCategory?.[0] || 'N/A'} leads in revenue`,
        description: `The ${topCategory?.[0]} category generates ₹${Math.round(topCategory?.[1] || 0).toLocaleString()} in revenue. Expanding product variety in this category could drive further growth.`,
        color: '#6366f1',
        sparkData: Object.values(metrics.revenueByCategory).slice(0, 7).map(v => ({ v })),
      },
      {
        icon: BarChart3,
        title: `${topRegion?.[0] || 'N/A'} is the strongest region`,
        description: `The ${topRegion?.[0]} region outperforms others with ₹${Math.round(topRegion?.[1] || 0).toLocaleString()} in total revenue. Prioritize distribution and marketing here.`,
        color: '#ec4899',
        sparkData: Object.values(metrics.revenueByRegion).map(v => ({ v })),
      },
      {
        icon: Zap,
        title: `Average order value is ₹${metrics.avgRevenuePerOrder.toLocaleString()}`,
        description: `Consider upselling and cross-selling strategies to increase AOV. Bundle popular items with complementary products and implement tiered discounts.`,
        color: '#14b8a6',
        sparkData: metrics.revenueByMonth.slice(-6).map(m => ({ v: m.revenue })),
      },
    ];
  }, [metrics]);

  const exportPDF = useCallback(() => {
    if (!metrics) return;
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('RetailIQ - Insights Report', 20, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 28);
    doc.setFontSize(12);

    let y = 45;
    insights.forEach((insight, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text(`${i + 1}. ${insight.title}`, 20, y);
      y += 7;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(insight.description, 170);
      doc.text(lines, 20, y);
      y += lines.length * 5 + 10;
    });

    doc.save('RetailIQ_Insights_Report.pdf');
  }, [insights, metrics]);

  if (!metrics) return null;

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{ show: { transition: { staggerChildren: 0.1 } } }}
      className="max-w-[1600px] mx-auto px-4 py-6 space-y-6"
    >
      <div className="flex items-center justify-between">
        <motion.h1 variants={fadeUp} className="text-2xl font-bold gradient-text">Actionable Insights</motion.h1>
        <motion.button
          variants={fadeUp}
          onClick={exportPDF}
          className="nav-link flex items-center gap-2 border border-primary/30 text-primary hover:bg-primary/10"
        >
          <Download className="w-4 h-4" />
          Export PDF
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            variants={fadeUp}
            className="insight-card"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${insight.color}20` }}>
              <insight.icon className="w-5 h-5" style={{ color: insight.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-sm mb-1">{insight.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{insight.description}</p>
              <div className="mt-3 h-8">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={insight.sparkData}>
                    <Bar dataKey="v" radius={[2, 2, 0, 0]}>
                      {insight.sparkData.map((_, j) => <Cell key={j} fill={insight.color} opacity={0.6} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
