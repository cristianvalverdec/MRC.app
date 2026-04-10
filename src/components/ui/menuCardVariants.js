// Framer Motion variants shared by screens that use MenuCard layout
export const cardVariants = {
  rest:  { scale: 1 },
  press: { scale: 0.97 },
}

export const containerVariants = {
  animate: { transition: { staggerChildren: 0.07 } },
}

export const itemVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
}
