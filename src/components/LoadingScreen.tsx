import kelyaLogo from '@/assets/kelya-logo-dark.png';
import hacktualizeLogoDark from '@/assets/hacktualiz-logo-dark.png';
import { motion } from 'framer-motion';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden">
      {/* Splash radial with navy-red gradient */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.08)_0%,transparent_70%)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2.5, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* Dual logos */}
        <motion.div
          className="flex items-center gap-4"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <motion.img
            src={kelyaLogo}
            alt="Kelya Group"
            className="h-16 w-16 object-cover rounded-xl shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.span
            className="text-2xl font-light text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            transition={{ delay: 0.4 }}
          >
            ×
          </motion.span>
          <motion.img
            src={hacktualizeLogoDark}
            alt="Hacktualiz"
            className="h-16 w-16 object-cover rounded-xl shadow-lg"
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
        </motion.div>

        {/* Loading dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 bg-gradient-primary rounded-full"
              style={{ background: `linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)))` }}
              animate={{ scale: [1, 1.4, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>

        <motion.p
          className="text-muted-foreground text-sm font-light"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Chargement...
        </motion.p>
      </div>
    </div>
  );
};
