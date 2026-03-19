import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center z-50">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center gap-6"
      >
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div className="absolute inset-0 rounded-2xl animate-glow-pulse" style={{ boxShadow: 'var(--shadow-neon)' }} />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-foreground">Processing Dataset</h2>
          <p className="text-sm text-muted-foreground mt-1">Cleaning and computing analytics…</p>
        </div>
      </motion.div>
    </div>
  );
}
