// ── QuestionPhoto.jsx ─────────────────────────────────────────────────────
// Permite capturar con cámara o seleccionar desde galería/archivos.
// value: string[] — array de data URLs (base64 JPEG comprimidas)
// onChange: (string[]) => void

import { useRef } from 'react'
import { Camera, FolderOpen, X, CheckCircle2, RefreshCw } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const MAX_PHOTOS   = 3
const MAX_WIDTH_PX = 1200
const JPEG_QUALITY = 0.78

// Comprime y redimensiona una imagen a JPEG base64
function compressImage(file) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const img    = new Image()
    const objUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objUrl)
      const ratio    = Math.min(1, MAX_WIDTH_PX / img.width)
      canvas.width   = Math.round(img.width  * ratio)
      canvas.height  = Math.round(img.height * ratio)
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY))
    }
    img.onerror = () => {
      URL.revokeObjectURL(objUrl)
      resolve(null)
    }
    img.src = objUrl
  })
}

export default function QuestionPhoto({ question, value = [], onChange }) {
  const cameraRef  = useRef(null)
  const galleryRef = useRef(null)
  const maxPhotos  = question.maxPhotos ?? MAX_PHOTOS
  const photos     = Array.isArray(value) ? value : []
  const canAdd     = photos.length < maxPhotos

  async function handleFiles(files) {
    const remaining  = maxPhotos - photos.length
    const selected   = Array.from(files).slice(0, remaining)
    const compressed = await Promise.all(selected.map(compressImage))
    const valid = compressed.filter(Boolean)
    if (valid.length) onChange(question.id, [...photos, ...valid])
  }

  function removePhoto(idx) {
    onChange(question.id, photos.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
        color: 'var(--color-text-secondary)', marginBottom: question.subtitle ? 4 : 10,
      }}>
        {question.label}
        {!question.required && (
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>
            (opcional)
          </span>
        )}
      </div>

      {question.subtitle && (
        <p style={{
          fontFamily: 'var(--font-body)', fontSize: 12,
          color: 'var(--color-text-muted)',
          margin: '0 0 10px', lineHeight: 1.4,
        }}>
          {question.subtitle}
        </p>
      )}

      {/* Previsualizaciones grandes — feedback principal */}
      <AnimatePresence>
        {photos.map((src, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{ position: 'relative', marginBottom: 10, borderRadius: 12, overflow: 'hidden', border: '2px solid #27AE60' }}
          >
            <img
              src={src}
              alt={`Evidencia ${idx + 1}`}
              style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
            />

            {/* Badge de éxito */}
            <div style={{
              position: 'absolute', top: 10, left: 10,
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'rgba(27,42,74,0.82)', backdropFilter: 'blur(4px)',
              borderRadius: 8, padding: '4px 10px',
              border: '1px solid #27AE60',
            }}>
              <CheckCircle2 size={13} color="#27AE60" />
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700,
                color: '#27AE60', letterSpacing: '0.04em',
              }}>
                {maxPhotos > 1 ? `Foto ${idx + 1}/${maxPhotos} adjuntada` : 'Foto adjuntada'}
              </span>
            </div>

            {/* Botón eliminar */}
            <button
              onClick={() => removePhoto(idx)}
              style={{
                position: 'absolute', top: 10, right: 10,
                width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(235,87,87,0.88)', backdropFilter: 'blur(4px)',
                border: '1.5px solid rgba(255,255,255,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', padding: 0,
              }}
            >
              <X size={14} color="#fff" strokeWidth={3} />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Botones de acción */}
      {canAdd && (
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => cameraRef.current?.click()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 14px', borderRadius: 10,
              background: 'rgba(26,82,184,0.12)',
              border: '1.5px solid rgba(26,82,184,0.3)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              color: 'var(--color-blue-btn)',
            }}
          >
            <Camera size={16} />
            Cámara
          </button>

          <button
            onClick={() => galleryRef.current?.click()}
            style={{
              flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 14px', borderRadius: 10,
              background: 'rgba(255,255,255,0.04)',
              border: '1.5px solid var(--color-border)',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              color: 'var(--color-text-secondary)',
            }}
          >
            <FolderOpen size={16} />
            Galería
          </button>
        </div>
      )}

      {/* Cuando ya se llenaron los slots: botón Cambiar foto */}
      {!canAdd && (
        <button
          onClick={() => galleryRef.current?.click()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            padding: '9px 14px', borderRadius: 10,
            background: 'rgba(39,174,96,0.08)',
            border: '1.5px solid rgba(39,174,96,0.35)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 600,
            color: '#27AE60',
          }}
        >
          <RefreshCw size={13} />
          Cambiar foto
        </button>
      )}

      {/* Inputs ocultos */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple={maxPhotos > 1}
        style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        multiple={maxPhotos > 1}
        style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
      />
    </div>
  )
}
