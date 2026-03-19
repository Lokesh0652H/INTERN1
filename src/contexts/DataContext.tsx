import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CleanRow, DataSummary, DerivedMetrics, loadDataset, parseAndCleanCSV, computeMetrics } from '@/lib/dataProcessor';
import Papa from 'papaparse';

interface Filters {
  dateRange: [Date | null, Date | null];
  cities: string[];
  region: string;
  category: string;
}

interface DataContextType {
  rawData: CleanRow[];
  filteredData: CleanRow[];
  summary: DataSummary | null;
  metrics: DerivedMetrics | null;
  filteredMetrics: DerivedMetrics | null;
  loading: boolean;
  error: string | null;
  filters: Filters;
  setFilters: (f: Partial<Filters>) => void;
  allCities: string[];
  allCategories: string[];
  allRegions: string[];
  uploadCSV: (file: File) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [rawData, setRawData] = useState<CleanRow[]>([]);
  const [summary, setSummary] = useState<DataSummary | null>(null);
  const [metrics, setMetrics] = useState<DerivedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<Filters>({
    dateRange: [null, null],
    cities: [],
    region: 'All',
    category: 'All',
  });

  const processData = useCallback((data: CleanRow[], sum: DataSummary) => {
    setRawData(data);
    setSummary(sum);
    setMetrics(computeMetrics(data));
    setLoading(false);
  }, []);

  useEffect(() => {
    loadDataset()
      .then(({ data, summary }) => processData(data, summary))
      .catch(e => { setError(e.message); setLoading(false); });
  }, [processData]);

  const uploadCSV = useCallback((file: File) => {
    setLoading(true);
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        const { data, summary } = parseAndCleanCSV(text);
        processData(data, summary);
      } catch (err: any) {
        setError(err.message);
        setLoading(false);
      }
    };
    reader.readAsText(file);
  }, [processData]);

  const setFilters = useCallback((partial: Partial<Filters>) => {
    setFiltersState(prev => ({ ...prev, ...partial }));
  }, []);

  const filteredData = React.useMemo(() => {
    let result = rawData;
    if (filters.cities.length > 0) {
      result = result.filter(r => filters.cities.includes(r.city));
    }
    if (filters.region !== 'All') {
      result = result.filter(r => r.region === filters.region);
    }
    if (filters.category !== 'All') {
      result = result.filter(r => r.category === filters.category);
    }
    if (filters.dateRange[0]) {
      result = result.filter(r => r.orderDate >= filters.dateRange[0]!);
    }
    if (filters.dateRange[1]) {
      result = result.filter(r => r.orderDate <= filters.dateRange[1]!);
    }
    return result;
  }, [rawData, filters]);

  const filteredMetrics = React.useMemo(() => {
    if (filteredData.length === 0) return metrics;
    return computeMetrics(filteredData);
  }, [filteredData, metrics]);

  const allCities = React.useMemo(() => [...new Set(rawData.map(r => r.city))].sort(), [rawData]);
  const allCategories = React.useMemo(() => [...new Set(rawData.map(r => r.category))].sort(), [rawData]);
  const allRegions = React.useMemo(() => [...new Set(rawData.map(r => r.region))].sort(), [rawData]);

  return (
    <DataContext.Provider value={{
      rawData, filteredData, summary, metrics, filteredMetrics,
      loading, error, filters, setFilters, allCities, allCategories, allRegions, uploadCSV,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
