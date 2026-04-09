import { useState } from 'react'
import { motion } from 'framer-motion'
import AppHeader from '../components/layout/AppHeader'
import LoadingSpinner from '../components/ui/LoadingSpinner'

const FATIGA_URL = 'https://cristianvalverdec.github.io/test-fatiga-agrosuper/'

export default function MonitorFatigaScreen() {
  const [loaded, setLoaded] = useState(false)

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--color-navy)',
      }}
    >
      <AppHeader title="Monitor de Fatiga" />

      <div style={{ flex: 1, position: 'relative' }}>
        {!loaded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: 'var(--color-navy)',
            }}
          >
            <LoadingSpinner size={36} />
            <span
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                color: 'var(--color-text-muted)',
              }}
            >
              Cargando Monitor de Fatiga...
            </span>
          </motion.div>
        )}

        <iframe
          src={FATIGA_URL}
          title="Monitor de Fatiga Operacional"
          onLoad={() => setLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.3s ease',
            position: 'absolute',
            inset: 0,
          }}
          allow="fullscreen"
        />
      </div>
    </div>
  )
}
