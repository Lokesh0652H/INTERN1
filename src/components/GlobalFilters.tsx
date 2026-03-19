import { useData } from '@/contexts/DataContext';

export default function GlobalFilters() {
  const { filters, setFilters, allCities, allRegions, allCategories } = useData();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={filters.region}
        onChange={e => setFilters({ region: e.target.value })}
        className="filter-select"
      >
        <option value="All">All Regions</option>
        {allRegions.map(r => <option key={r} value={r}>{r}</option>)}
      </select>

      <select
        value={filters.category}
        onChange={e => setFilters({ category: e.target.value })}
        className="filter-select"
      >
        <option value="All">All Categories</option>
        {allCategories.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <select
        value={filters.cities.length === 1 ? filters.cities[0] : ''}
        onChange={e => setFilters({ cities: e.target.value ? [e.target.value] : [] })}
        className="filter-select"
      >
        <option value="">All Cities</option>
        {allCities.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {(filters.region !== 'All' || filters.category !== 'All' || filters.cities.length > 0) && (
        <button
          onClick={() => setFilters({ region: 'All', category: 'All', cities: [] })}
          className="text-xs text-primary hover:underline"
        >
          Clear Filters
        </button>
      )}
    </div>
  );
}
