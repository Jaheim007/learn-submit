import hacktualizLogo from '@/assets/hacktualiz-main-logo.jpeg';
import { motion } from 'framer-motion';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background overflow-hidden">
      {/* Radial glow */}
      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.06)_0%,transparent_60%)]"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 2.5, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />

      <div className="relative z-10 flex flex-col items-center gap-8">
        {/* Logo with native spring bounce */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          <motion.img
            src={hacktualizLogo}
            alt="Hacktualiz"
            className="h-20 w-20 object-cover rounded-[22px] shadow-xl shadow-primary/10"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>

        {/* Native iOS-style spinner */}
        <motion.div
          className="relative w-8 h-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-primary/20"
          />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary"
            animate={{ rotate: 360 }}
            transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>

        <motion.p
          className="text-muted-foreground text-sm font-medium tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          Chargement...
        </motion.p>
      </div>
    </div>
  );
};
