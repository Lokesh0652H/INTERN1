import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface RawRow {
  'Order ID': string;
  'Customer Name': string;
  'Category': string;
  'Sub Category': string;
  'City': string;
  'Order Date': string;
  'Region': string;
  'Sales': string;
  'Discount': string;
  'Profit': string;
  'State': string;
}

export interface CleanRow {
  orderId: string;
  customerName: string;
  category: string;
  subCategory: string;
  city: string;
  orderDate: Date;
  region: string;
  sales: number;
  discount: number;
  profit: number;
  state: string;
  month: number;
  year: number;
  dayOfWeek: number;
  dayName: string;
  hour: number;
}

export interface DataSummary {
  rowsLoaded: number;
  rowsAfterCleaning: number;
  nullsRemoved: number;
  duplicatesRemoved: number;
}

export interface DerivedMetrics {
  totalRevenue: number;
  avgRevenuePerOrder: number;
  totalOrders: number;
  totalProfit: number;
  avgDiscount: number;
  revenueByCategory: Record<string, number>;
  revenueByCity: Record<string, number>;
  revenueByMonth: { month: string; revenue: number; year: number; monthNum: number }[];
  revenueByDayOfWeek: { day: string; revenue: number; orders: number }[];
  revenueByRegion: Record<string, number>;
  momGrowth: { month: string; growth: number }[];
  yoyGrowth: { year: number; revenue: number; growth: number | null }[];
  topProducts: { name: string; sales: number; revenue: number }[];
  deadStock: { name: string; sales: number }[];
  q4RevenueShare: number;
  topCity: string;
  peakDay: string;
  peakHour: number;
  ordersByCity: Record<string, number>;
  profitByCategory: Record<string, number>;
  salesBySubCategory: { name: string; sales: number; revenue: number }[];
  monthlyByCategory: { month: string; [key: string]: number | string }[];
  scatterData: { name: string; unitsSold: number; revenue: number; isDead: boolean }[];
  revenueByHour: { hour: number; orders: number }[];
  heatmapData: { day: number; hour: number; value: number }[];
}

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  const trimmed = dateStr.trim();
  // Try multiple formats
  const d = new Date(trimmed);
  if (!isNaN(d.getTime())) return d;
  // Try M/D/YY format
  const parts = trimmed.split('/');
  if (parts.length === 3) {
    let year = parseInt(parts[2]);
    if (year < 100) year += 2000;
    const month = parseInt(parts[0]) - 1;
    const day = parseInt(parts[1]);
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) return date;
  }
  return null;
}

export function parseAndCleanCSV(text: string): { data: CleanRow[]; summary: DataSummary } {
  const result = Papa.parse<RawRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  const rawRows = result.data;
  const rowsLoaded = rawRows.length;
  let nullsRemoved = 0;
  let duplicatesRemoved = 0;

  // Remove rows with null essential fields
  const nonNull = rawRows.filter(row => {
    const hasEssential = row['Order ID'] && row['Category'] && row['Sales'] && row['Order Date'];
    if (!hasEssential) nullsRemoved++;
    return hasEssential;
  });

  // Remove duplicates by Order ID
  const seen = new Set<string>();
  const unique = nonNull.filter(row => {
    const id = row['Order ID']?.trim();
    if (seen.has(id)) {
      duplicatesRemoved++;
      return false;
    }
    seen.add(id);
    return true;
  });

  const cleaned: CleanRow[] = [];
  for (const row of unique) {
    const orderDate = parseDate(row['Order Date']);
    if (!orderDate) { nullsRemoved++; continue; }
    const sales = parseFloat(row['Sales']);
    if (isNaN(sales)) { nullsRemoved++; continue; }

    cleaned.push({
      orderId: row['Order ID'].trim(),
      customerName: (row['Customer Name'] || '').trim(),
      category: (row['Category'] || '').trim(),
      subCategory: (row['Sub Category'] || '').trim(),
      city: (row['City'] || '').trim(),
      orderDate,
      region: (row['Region'] || '').trim(),
      sales,
      discount: parseFloat(row['Discount'] || '0') || 0,
      profit: parseFloat(row['Profit'] || '0') || 0,
      state: (row['State'] || '').trim(),
      month: orderDate.getMonth(),
      year: orderDate.getFullYear(),
      dayOfWeek: orderDate.getDay(),
      dayName: DAY_NAMES[orderDate.getDay()],
      hour: orderDate.getHours(),
    });
  }

  return {
    data: cleaned,
    summary: {
      rowsLoaded,
      rowsAfterCleaning: cleaned.length,
      nullsRemoved,
      duplicatesRemoved,
    },
  };
}

export function computeMetrics(data: CleanRow[]): DerivedMetrics {
  const totalRevenue = data.reduce((s, r) => s + r.sales, 0);
  const totalOrders = new Set(data.map(r => r.orderId)).size;
  const totalProfit = data.reduce((s, r) => s + r.profit, 0);
  const avgDiscount = data.reduce((s, r) => s + r.discount, 0) / data.length;

  // Revenue by category
  const revenueByCategory: Record<string, number> = {};
  const profitByCategory: Record<string, number> = {};
  data.forEach(r => {
    revenueByCategory[r.category] = (revenueByCategory[r.category] || 0) + r.sales;
    profitByCategory[r.category] = (profitByCategory[r.category] || 0) + r.profit;
  });

  // Revenue by city
  const revenueByCity: Record<string, number> = {};
  const ordersByCity: Record<string, number> = {};
  data.forEach(r => {
    revenueByCity[r.city] = (revenueByCity[r.city] || 0) + r.sales;
    ordersByCity[r.city] = (ordersByCity[r.city] || 0) + 1;
  });

  // Revenue by region
  const revenueByRegion: Record<string, number> = {};
  data.forEach(r => {
    revenueByRegion[r.region] = (revenueByRegion[r.region] || 0) + r.sales;
  });

  // Revenue by month (chronological)
  const monthMap = new Map<string, { revenue: number; year: number; monthNum: number }>();
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  data.forEach(r => {
    const key = `${r.year}-${String(r.month + 1).padStart(2, '0')}`;
    const existing = monthMap.get(key);
    if (existing) existing.revenue += r.sales;
    else monthMap.set(key, { revenue: r.sales, year: r.year, monthNum: r.month });
  });
  const revenueByMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({
      month: `${MONTH_NAMES[v.monthNum]} ${v.year}`,
      revenue: Math.round(v.revenue),
      year: v.year,
      monthNum: v.monthNum,
    }));

  // MoM growth
  const momGrowth = revenueByMonth.map((m, i) => {
    if (i === 0) return { month: m.month, growth: 0 };
    const prev = revenueByMonth[i - 1].revenue;
    return { month: m.month, growth: prev ? ((m.revenue - prev) / prev) * 100 : 0 };
  });

  // YoY
  const yearRevenue = new Map<number, number>();
  data.forEach(r => yearRevenue.set(r.year, (yearRevenue.get(r.year) || 0) + r.sales));
  const yoyGrowth = Array.from(yearRevenue.entries())
    .sort(([a], [b]) => a - b)
    .map(([year, revenue], i, arr) => ({
      year,
      revenue: Math.round(revenue),
      growth: i > 0 ? ((revenue - arr[i - 1][1]) / arr[i - 1][1]) * 100 : null,
    }));

  // Revenue by day of week
  const dayMap = new Map<number, { revenue: number; orders: number }>();
  data.forEach(r => {
    const e = dayMap.get(r.dayOfWeek) || { revenue: 0, orders: 0 };
    e.revenue += r.sales;
    e.orders += 1;
    dayMap.set(r.dayOfWeek, e);
  });
  const revenueByDayOfWeek = [1, 2, 3, 4, 5, 6, 0].map(d => ({
    day: DAY_NAMES[d].slice(0, 3),
    revenue: Math.round(dayMap.get(d)?.revenue || 0),
    orders: dayMap.get(d)?.orders || 0,
  }));

  // Revenue by hour
  const hourMap = new Map<number, number>();
  data.forEach(r => hourMap.set(r.hour, (hourMap.get(r.hour) || 0) + 1));
  const revenueByHour = Array.from({ length: 24 }, (_, h) => ({ hour: h, orders: hourMap.get(h) || 0 }));

  // Heatmap: day x hour
  const heatmap = new Map<string, number>();
  data.forEach(r => {
    const key = `${r.dayOfWeek}-${r.hour}`;
    heatmap.set(key, (heatmap.get(key) || 0) + 1);
  });
  const heatmapData: { day: number; hour: number; value: number }[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      heatmapData.push({ day: d, hour: h, value: heatmap.get(`${d}-${h}`) || 0 });
    }
  }

  // Top products by sub-category
  const subCatMap = new Map<string, { sales: number; revenue: number }>();
  data.forEach(r => {
    const e = subCatMap.get(r.subCategory) || { sales: 0, revenue: 0 };
    e.sales += 1;
    e.revenue += r.sales;
    subCatMap.set(r.subCategory, e);
  });
  const salesBySubCategory = Array.from(subCatMap.entries())
    .map(([name, v]) => ({ name, ...v }))
    .sort((a, b) => b.sales - a.sales);
  const topProducts = salesBySubCategory.slice(0, 10);

  // Dead stock: below 5th percentile of sales count
  const salesCounts = salesBySubCategory.map(s => s.sales).sort((a, b) => a - b);
  const p5Index = Math.floor(salesCounts.length * 0.05);
  const p5Threshold = salesCounts[p5Index] || 1;
  const deadStock = salesBySubCategory.filter(s => s.sales <= p5Threshold);

  // Q4 revenue share
  const q4Revenue = data.filter(r => r.month >= 9 && r.month <= 11).reduce((s, r) => s + r.sales, 0);
  const q4RevenueShare = totalRevenue > 0 ? (q4Revenue / totalRevenue) * 100 : 0;

  // Top city
  const topCity = Object.entries(revenueByCity).sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

  // Peak day
  const peakDayEntry = revenueByDayOfWeek.reduce((max, d) => d.revenue > max.revenue ? d : max);
  const peakDay = peakDayEntry.day;

  // Peak hour
  const peakHourEntry = revenueByHour.reduce((max, h) => h.orders > max.orders ? h : max);
  const peakHour = peakHourEntry.hour;

  // Scatter data
  const scatterData = salesBySubCategory.map(s => ({
    name: s.name,
    unitsSold: s.sales,
    revenue: Math.round(s.revenue),
    isDead: s.sales <= p5Threshold,
  }));

  // Monthly by category
  const monthCatMap = new Map<string, Record<string, number>>();
  const categories = Object.keys(revenueByCategory);
  data.forEach(r => {
    const key = `${MONTH_NAMES[r.month]} ${r.year}`;
    if (!monthCatMap.has(key)) {
      const obj: Record<string, number> = {};
      categories.forEach(c => obj[c] = 0);
      monthCatMap.set(key, obj);
    }
    const entry = monthCatMap.get(key)!;
    entry[r.category] = (entry[r.category] || 0) + r.sales;
  });
  // Sort chronologically
  const monthlyByCategory = Array.from(monthCatMap.entries())
    .sort(([a], [b]) => {
      const [am, ay] = a.split(' ');
      const [bm, by] = b.split(' ');
      const ai = MONTH_NAMES.indexOf(am) + parseInt(ay) * 12;
      const bi = MONTH_NAMES.indexOf(bm) + parseInt(by) * 12;
      return ai - bi;
    })
    .map(([month, cats]) => ({ month, ...cats }));

  return {
    totalRevenue: Math.round(totalRevenue),
    avgRevenuePerOrder: Math.round(totalRevenue / totalOrders),
    totalOrders,
    totalProfit: Math.round(totalProfit),
    avgDiscount,
    revenueByCategory,
    revenueByCity,
    revenueByMonth,
    revenueByDayOfWeek,
    revenueByRegion,
    momGrowth,
    yoyGrowth,
    topProducts,
    deadStock,
    q4RevenueShare: Math.round(q4RevenueShare * 10) / 10,
    topCity,
    peakDay,
    peakHour,
    ordersByCity,
    profitByCategory,
    salesBySubCategory,
    monthlyByCategory,
    scatterData,
    revenueByHour,
    heatmapData,
  };
}

export async function loadDataset(): Promise<{ data: CleanRow[]; summary: DataSummary; metrics: DerivedMetrics }> {
  const response = await fetch('/data/dataset.xlsx');
  const buffer = await response.arrayBuffer();
  
  // Try as text first (CSV)
  const text = new TextDecoder().decode(buffer);
  if (text.includes('Order ID') || text.includes('order_id')) {
    const { data, summary } = parseAndCleanCSV(text);
    const metrics = computeMetrics(data);
    return { data, summary, metrics };
  }
  
  // Parse as XLSX
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  const csvText = XLSX.utils.sheet_to_csv(firstSheet);
  const { data, summary } = parseAndCleanCSV(csvText);
  const metrics = computeMetrics(data);
  return { data, summary, metrics };
}
