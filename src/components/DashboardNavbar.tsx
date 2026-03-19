import { useRef, useCallback } from 'react';
import { NavLink as RouterNavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart3, Upload, ShoppingCart, Package, MapPin, Terminal, Lightbulb } from 'lucide-react';
import { useData } from '@/contexts/DataContext';

const links = [
  { to: '/', label: 'Overview', icon: BarChart3 },
  { to: '/products', label: 'Products', icon: ShoppingCart },
  { to: '/inventory', label: 'Inventory', icon: Package },
  { to: '/geographic', label: 'Geographic', icon: MapPin },
  { to: '/query', label: 'SQL Explorer', icon: Terminal },
  { to: '/insights', label: 'Insights', icon: Lightbulb },
];

export default function Navbar() {
  const location = useLocation();
  const { uploadCSV } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadCSV(file);
  }, [uploadCSV]);

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 glass-card border-b border-border px-4 py-3"
    >
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <BarChart3 className="w-5 h-5 text-primary" />
          </div>
          <span className="text-lg font-bold gradient-text">RetailIQ</span>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {links.map(link => {
            const isActive = location.pathname === link.to;
            return (
              <RouterNavLink
                key={link.to}
                to={link.to}
                className={`nav-link flex items-center gap-2 ${isActive ? 'nav-link-active' : ''}`}
              >
                <link.icon className="w-4 h-4" />
                <span className="text-xs lg:text-sm">{link.label}</span>
              </RouterNavLink>
            );
          })}
        </div>

        <div>
          <input ref={fileInputRef} type="file" accept=".csv,.xlsx" onChange={handleUpload} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="nav-link flex items-center gap-2 border border-primary/30 text-primary hover:bg-primary/10"
          >
            <Upload className="w-4 h-4" />
            <span className="text-xs lg:text-sm">Upload CSV</span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div className="flex md:hidden items-center gap-1 mt-2 overflow-x-auto pb-1">
        {links.map(link => {
          const isActive = location.pathname === link.to;
          return (
            <RouterNavLink
              key={link.to}
              to={link.to}
              className={`nav-link flex items-center gap-1.5 whitespace-nowrap ${isActive ? 'nav-link-active' : ''}`}
            >
              <link.icon className="w-3.5 h-3.5" />
              <span className="text-xs">{link.label}</span>
            </RouterNavLink>
          );
        })}
      </div>
    </motion.nav>
  );
}
