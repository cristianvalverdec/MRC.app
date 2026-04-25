// ── AccessRequestCTA ──────────────────────────────────────────────────────
//
// Botón + modal para solicitar acceso al sitio SharePoint cuando el usuario
// recibe un 403. Reutilizable en cualquier pantalla donde detectemos
// accessDenied o PERMISSION_DENIED.
//
// Props:
//   compact  — boolean  — si true muestra solo el botón sin card exterior
//   onSent   — callback — se llama cuando la solicitud se envía con éxito

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldAlert, Send, CheckCircle2, Clock, X } from 'lucide-react'
import useUserStore from '../../store/userStore'
import { requestSiteAccess, isRequestOnCooldown, getLastRequestTime } from '../../services/accessRequestService'

export default function AccessRequestCTA({ compact = false, onSent }) {
  // userStore guarda los campos planos (name, email, role) — NO existe `profile`.
  // Si se vuelve a leer `s.profile`, las solicitudes llegan al admin sin
  // identificar al solicitante (regresión documentada en sec. 10 del CLAUDE.md).
  const name  = useUserStore((s) => s.name)
  const email = useUserStore((s) => s.email)
  const role  = useUserStore((s) => s.role)

  const [open,    setOpen]    = useState(false)
  const [reason,  setReason]  = useState('')
  const [sending, setSending] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState(null)

  const cooldown   = isRequestOnCooldown()
  const lastSentAt = getLastRequestTime()
  const hasIdentity = Boolean(email)

  function formatCooldownMsg() {
    if (!lastSentAt) return ''
    const d = new Date(lastSentAt)
    const hhmm = d.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    const date  = d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' })
    return `Solicitud enviada el ${date} a las ${hhmm}. Puedes volver a solicitar en 24 h.`
  }

  async function handleSend() {
    setSending(true)
    setError(null)
    if (!email) {
      setError('No se detectó tu correo corporativo. Cierra e inicia sesión nuevamente con tu cuenta @agrosuper.com antes de solicitar acceso.')
      setSending(false)
      return
    }
    try {
      await requestSiteAccess({
        name,
        email,
        role:   role || 'user',
        reason,
      })
      setSent(true)
      setTimeout(() => {
        setOpen(false)
        onSent?.()
      }, 2500)
    } catch (err) {
      setError(err?.message || 'No se pudo enviar la solicitud.')
    } finally {
      setSending(false)
    }
  }

  // ── Botón principal ────────────────────────────────────────────────────
  const btn = !hasIdentity ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: compact ? '6px 10px' : '8px 14px',
      borderRadius: 8,
      background: 'rgba(239,68,68,0.08)',
      border: '1px solid rgba(239,68,68,0.3)',
      color: '#F87171',
      fontSize: 12, lineHeight: 1.4,
    }}>
      <ShieldAlert size={14} />
      <span>Sin sesión válida — vuelve a iniciar sesión</span>
    </div>
  ) : cooldown ? (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: compact ? '6px 10px' : '8px 14px',
      borderRadius: 8,
      background: 'rgba(156,163,175,0.1)',
      border: '1px solid rgba(156,163,175,0.25)',
      color: 'var(--color-text-muted)',
      fontSize: 13,
    }}>
      <Clock size={14} />
      <span>Solicitud enviada (24 h)</span>
    </div>
  ) : (
    <button
      onClick={() => { setOpen(true); setSent(false); setError(null); setReason('') }}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: compact ? '6px 12px' : '10px 16px',
        borderRadius: 8,
        background: 'rgba(245,124,32,0.12)',
        border: '1px solid rgba(245,124,32,0.35)',
        color: '#F57C20',
        fontSize: 13, fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'var(--font-body)',
      }}
    >
      <ShieldAlert size={14} />
      Solicitar acceso
    </button>
  )

  // ── Card exterior (modo no-compact) ───────────────────────────────────
  const card = compact ? btn : (
    <div style={{
      background: 'rgba(245,124,32,0.07)',
      border: '1px solid rgba(245,124,32,0.25)',
      borderRadius: 12,
      padding: '14px 16px',
      display: 'flex', alignItems: 'flex-start', gap: 12,
    }}>
      <ShieldAlert size={18} color="#F57C20" style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <p style={{
          margin: '0 0 6px', fontSize: 13, fontWeight: 600,
          color: '#F57C20', fontFamily: 'var(--font-display)',
        }}>
          Sin acceso al sitio SharePoint
        </p>
        <p style={{ margin: '0 0 10px', fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Tu cuenta necesita permiso para acceder a los datos de la app MRC.
          {cooldown && ` ${formatCooldownMsg()}`}
        </p>
        {btn}
      </div>
    </div>
  )

  // ── Modal ──────────────────────────────────────────────────────────────
  const modal = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <motion.div
            initial={{ y: 80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 80, opacity: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 280 }}
            style={{
              width: '100%', maxWidth: 480,
              background: 'var(--color-surface)',
              borderRadius: '20px 20px 0 0',
              padding: '24px 20px 32px',
              boxShadow: '0 -8px 40px rgba(0,0,0,0.4)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldAlert size={20} color="#F57C20" />
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--color-text)' }}>
                  Solicitar acceso MRC
                </span>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Contenido éxito */}
            {sent ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <CheckCircle2 size={44} color="#4ADE80" style={{ marginBottom: 12 }} />
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--color-text)', margin: '0 0 6px' }}>
                  ¡Solicitud enviada!
                </p>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: 0 }}>
                  Un admin MRC revisará tu solicitud y te dará acceso pronto.
                </p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 13, color: 'var(--color-text-muted)', margin: '0 0 16px', lineHeight: 1.5 }}>
                  Se enviará una solicitud de acceso a los administradores MRC con tu nombre y correo corporativo.
                </p>

                {/* Datos del solicitante */}
                <div style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 8,
                  padding: '10px 12px', marginBottom: 14,
                  fontSize: 12, color: 'var(--color-text-muted)',
                }}>
                  <div><strong style={{ color: 'var(--color-text)' }}>Nombre:</strong> {name || '—'}</div>
                  <div><strong style={{ color: 'var(--color-text)' }}>Correo:</strong> {email || '—'}</div>
                  <div><strong style={{ color: 'var(--color-text)' }}>Rol actual:</strong> {role || 'user'}</div>
                </div>

                {/* Razón opcional */}
                <label style={{ fontSize: 12, color: 'var(--color-text-muted)', display: 'block', marginBottom: 6 }}>
                  Razón (opcional)
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ej: Necesito enviar pautas diarias para mi sucursal"
                  maxLength={300}
                  rows={3}
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--color-input-bg)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 8, padding: '10px 12px',
                    color: 'var(--color-text)', fontSize: 13,
                    fontFamily: 'var(--font-body)',
                    resize: 'none', marginBottom: 6,
                  }}
                />
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'right', marginBottom: 16 }}>
                  {reason.length}/300
                </div>

                {/* Error */}
                {error && (
                  <div style={{
                    background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                    borderRadius: 8, padding: '10px 12px', marginBottom: 14,
                    fontSize: 12, color: '#F87171',
                  }}>
                    {error}
                  </div>
                )}

                {/* Botón enviar */}
                <button
                  onClick={handleSend}
                  disabled={sending}
                  style={{
                    width: '100%', padding: '13px',
                    borderRadius: 10, border: 'none',
                    background: sending ? 'rgba(245,124,32,0.4)' : '#F57C20',
                    color: '#fff', fontSize: 14, fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    cursor: sending ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}
                >
                  {sending ? (
                    <>Enviando…</>
                  ) : (
                    <><Send size={15} /> Enviar solicitud</>
                  )}
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return (
    <>
      {card}
      {modal}
    </>
  )
}
