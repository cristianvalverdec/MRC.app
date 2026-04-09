import { motion, AnimatePresence } from 'framer-motion'

const pageVariants = {
  initial: { opacity: 0, x: 24, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1 },
  exit:    { opacity: 0, x: -24, scale: 0.98 },
}

const pageTransition = {
  type: 'tween',
  ease: 'easeInOut',
  duration: 0.22,
}

export default function PageTransition({ children, keyProp }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={keyProp}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
