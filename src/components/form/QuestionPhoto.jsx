// ── QuestionPhoto.jsx ─────────────────────────────────────────────────────
// Permite capturar con cámara o seleccionar desde galería/archivos.
// value: string[] — array de data URLs (base64 JPEG comprimidas)
// onChange: (string[]) => void

import { useRef } from 'react'
import { Camera, FolderOpen, X, ImagePlus } from 'lucide-react'
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
    const remaining = maxPhotos - photos.length
    const selected  = Array.from(files).slice(0, remaining)
    const compressed = await Promise.all(selected.map(compressImage))
    const valid = compressed.filter(Boolean)
    if (valid.length) onChange([...photos, ...valid])
  }

  function removePhoto(idx) {
    onChange(photos.filter((_, i) => i !== idx))
  }

  return (
    <div>
      {/* Label */}
      <div style={{
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
        color: 'var(--color-text-secondary)', marginBottom: 10,
      }}>
        {question.label}
        {!question.required && (
          <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 6 }}>
            (opcional)
          </span>
        )}
      </div>

      {/* Thumbnails */}
      <AnimatePresence>
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}
          >
            {photos.map((src, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                style={{ position: 'relative', width: 88, height: 88 }}
              >
                <img
                  src={src}
                  alt={`Foto ${idx + 1}`}
                  style={{
                    width: '100%', height: '100%',
                    objectFit: 'cover', borderRadius: 10,
                    border: '2px solid var(--color-border)',
                  }}
                />
                <button
                  onClick={() => removePhoto(idx)}
                  style={{
                    position: 'absolute', top: -6, right: -6,
                    width: 22, height: 22, borderRadius: '50%',
                    background: '#EB5757', border: '2px solid var(--color-navy)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', padding: 0,
                  }}
                >
                  <X size={11} color="#fff" strokeWidth={3} />
                </button>
                <div style={{
                  position: 'absolute', bottom: 4, left: 4,
                  background: 'rgba(0,0,0,0.55)', borderRadius: 4,
                  fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
                  color: '#fff', padding: '1px 4px',
                }}>
                  {idx + 1}/{maxPhotos}
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botones de acción */}
      {canAdd && (
        <div style={{ display: 'flex', gap: 10 }}>
          {/* Cámara */}
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

          {/* Galería / archivos */}
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

      {/* Slots vacíos visuales cuando ya hay fotos */}
      {!canAdd && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 12px', borderRadius: 8,
          background: 'rgba(39,174,96,0.08)', border: '1px solid rgba(39,174,96,0.2)',
        }}>
          <ImagePlus size={13} color="#27AE60" />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#27AE60' }}>
            Máximo {maxPhotos} foto{maxPhotos !== 1 ? 's' : ''} adjuntadas
          </span>
        </div>
      )}

      {/* Indicador de contador si hay fotos pero puede agregar más */}
      {canAdd && photos.length > 0 && (
        <div style={{
          marginTop: 8, fontFamily: 'var(--font-body)', fontSize: 11,
          color: 'var(--color-text-muted)', textAlign: 'right',
        }}>
          {photos.length} de {maxPhotos} foto{maxPhotos !== 1 ? 's' : ''}
        </div>
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
