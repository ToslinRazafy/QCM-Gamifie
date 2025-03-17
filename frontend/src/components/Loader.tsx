import { motion } from "framer-motion";

export default function Loader() {
  return (
    <motion.div
      className="flex items-center justify-center h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-8 h-8 border-4 border-t-4 border-[hsl(var(--primary))] border-solid rounded-full animate-spin"></div>
    </motion.div>
  );
}
