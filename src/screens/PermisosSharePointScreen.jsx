// ── PermisosSharePointScreen ──────────────────────────────────────────────
//
// Pantalla de administrador para gestionar el acceso de usuarios al sitio
// SharePoint SSOASCOMERCIAL.
//
// Funciones:
//   • Carga la lista de líderes registrados (todos activos) y muestra sus emails.
//   • Botón "Copiar emails" para pegar en el diálogo "Add users" de SharePoint.
//   • Botón "Descargar CSV" con Email, Nombre, Cargo, Instalación.
//   • Solicitudes de acceso pendientes (lista SolicitudesAccesoMRC) — próximamente.
//
// Solo visible para role === 'admin'.

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Download, CheckCircle2, Users, Loader, ShieldAlert, Cloud, CloudOff, RefreshCw } from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import { getLideres } from '../services/lideresService'
import { loadAddedEmails, saveAddedEmails } from '../services/spMembersAddedSync'

const SP_SITE = 'https://agrosuper.sharepoint.com/sites/SSOASCOMERCIAL'
const SP_MEMBERS_URL = `${SP_SITE}/_layouts/15/user.aspx`

export default function PermisosSharePointScreen() {
  const navigate = useNavigate()
  const role = useUserStore((s) => s.role)

  const [lideres,   setLideres]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [copied,    setCopied]    = useState(false)
  const [filter,    setFilter]    = useState('')

  // Set de "marcados como agregados". Se persiste en SharePoint
  // (mrc-sp-members-added.json) para que se sincronice entre dispositivos.
  // localStorage se mantiene como caché optimista para responder al toque.
  const ADDED_KEY = 'mrc-sp-members-added'
  const [addedSet, setAddedSet] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(ADDED_KEY) || '[]')) }
    catch { return new Set() }
  })
  // syncStatus: 'idle' | 'pulling' | 'pushing' | 'ok' | 'error'
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncError,  setSyncError]  = useState(null)
  const [lastSyncAt, setLastSyncAt] = useState(null)

  function persistLocal(set) {
    try { localStorage.setItem(ADDED_KEY, JSON.stringify([...set])) } catch { /* ignore */ }
  }

  // Push del set actual a SharePoint. fire-and-forget no — actualiza syncStatus.
  async function pushToCloud(setToPush) {
    setSyncStatus('pushing')
    setSyncError(null)
    try {
      await saveAddedEmails([...setToPush])
      setSyncStatus('ok')
      setLastSyncAt(new Date())
    } catch (err) {
      setSyncStatus('error')
      setSyncError(err?.message || 'Error al sincronizar con SharePoint')
    }
  }

  function toggleAdded(email) {
    let nextSet
    setAddedSet(prev => {
      nextSet = new Set(prev)
      if (nextSet.has(email)) nextSet.delete(email)
      else nextSet.add(email)
      persistLocal(nextSet)
      return nextSet
    })
    // Push inmediato — si falla, el indicador de error muestra "Reintentar".
    pushToCloud(nextSet)
  }

  function retryPush() {
    pushToCloud(addedSet)
  }

  useEffect(() => {
    if (role !== 'admin') return

    let cancelled = false

    // Carga paralela: líderes + set agregados desde SharePoint.
    Promise.all([
      getLideres(),
      loadAddedEmails().catch(err => {
        // No bloqueamos la pantalla si falla la sync; mostramos el error
        // como banner pero seguimos con el set local.
        setSyncStatus('error')
        setSyncError(err?.message || 'No se pudo leer el set compartido')
        return null
      }),
    ])
      .then(([lista, cloudData]) => {
        if (cancelled) return
        const seen = new Set()
        const dedup = lista.filter(l => {
          if (!l.email || seen.has(l.email)) return false
          seen.add(l.email)
          return true
        })
        setLideres(dedup.sort((a, b) => a.email.localeCompare(b.email)))

        if (cloudData?.added) {
          // SharePoint manda — sobreescribimos el set local con lo de la nube.
          // (En esta primera iteración no hay merge, gana el remoto.)
          const cloudSet = new Set(cloudData.added.map(e => e.toLowerCase()))
          setAddedSet(cloudSet)
          persistLocal(cloudSet)
          setSyncStatus('ok')
          setLastSyncAt(cloudData.updatedAt ? new Date(cloudData.updatedAt) : new Date())
        } else if (cloudData === null && syncStatus !== 'error') {
          // Primer uso: aún no existe el archivo en la nube. Subimos lo local
          // para inicializarlo.
          if (addedSet.size > 0) pushToCloud(addedSet)
          else setSyncStatus('ok')
        }
      })
      .catch(e => !cancelled && setError(e?.message || 'Error al cargar líderes'))
      .finally(() => !cancelled && setLoading(false))

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role])

  if (role !== 'admin') {
    return (
      <div style={{ minHeight: '100dvh', background: 'var(--color-navy)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <p style={{ color: 'var(--color-text-muted)', fontFamily: 'var(--font-body)', fontSize: 14 }}>
          Solo disponible para administradores.
        </p>
      </div>
    )
  }

  const filtered = filter.trim()
    ? lideres.filter(l =>
        l.email.includes(filter.toLowerCase()) ||
        l.nombre.toLowerCase().includes(filter.toLowerCase()) ||
        l.instalacion.toLowerCase().includes(filter.toLowerCase())
      )
    : lideres

  const pendingEmails = lideres.filter(l => !addedSet.has(l.email)).map(l => l.email)

  function handleCopy() {
    const text = pendingEmails.join(';')
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  function handleDownloadCsv() {
    const rows = [
      ['Email', 'Nombre', 'Cargo MRC', 'Instalación', 'Agregado'],
      ...lideres.map(l => [
        l.email, l.nombre, l.cargoMRC, l.instalacion,
        addedSet.has(l.email) ? 'Sí' : 'No',
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `MRC_Lideres_Permisos_${new Date().toISOString().slice(0,10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const addedCount   = lideres.filter(l => addedSet.has(l.email)).length
  const pendingCount = lideres.length - addedCount

  return (
    <div className="content-col" style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>
      <AppHeader title="Permisos SharePoint" onBack={() => navigate(-1)} />

      <div style={{ flex: 1, padding: '16px 16px 32px', overflowY: 'auto' }}>

        {/* Info card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          style={{
            background: 'rgba(47,128,237,0.08)', border: '1px solid rgba(47,128,237,0.25)',
            borderRadius: 12, padding: '12px 14px', marginBottom: 16,
            fontSize: 12, color: 'var(--color-text-muted)', lineHeight: 1.5,
          }}
        >
          <div style={{ fontWeight: 700, color: '#60A5FA', marginBottom: 4, fontFamily: 'var(--font-display)', fontSize: 13 }}>
            ¿Para qué sirve esta pantalla?
          </div>
          Todos los líderes aquí listados necesitan acceso <strong style={{ color: 'var(--color-text)' }}>Contribute</strong> al sitio
          SSOASCOMERCIAL para usar la app MRC correctamente.
          Usa el botón "Copiar emails" y pégalos en el diálogo <em>Add users</em> del grupo <strong style={{ color: 'var(--color-text)' }}>MRC Members</strong> en SharePoint.
        </motion.div>

        {/* Indicador de sync con SharePoint */}
        {(syncStatus !== 'idle') && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', marginBottom: 12,
            borderRadius: 8, fontSize: 12,
            background: syncStatus === 'error'
              ? 'rgba(239,68,68,0.08)'
              : syncStatus === 'ok'
                ? 'rgba(39,174,96,0.07)'
                : 'rgba(47,128,237,0.07)',
            border: `1px solid ${
              syncStatus === 'error'  ? 'rgba(239,68,68,0.3)'
              : syncStatus === 'ok'   ? 'rgba(39,174,96,0.3)'
              : 'rgba(47,128,237,0.25)'
            }`,
            color: syncStatus === 'error' ? '#F87171'
                 : syncStatus === 'ok'    ? '#27AE60'
                 : '#60A5FA',
          }}>
            {syncStatus === 'error' ? <CloudOff size={14} /> : <Cloud size={14} />}
            <span style={{ flex: 1 }}>
              {syncStatus === 'pulling' && 'Cargando set compartido…'}
              {syncStatus === 'pushing' && 'Sincronizando con SharePoint…'}
              {syncStatus === 'ok'      && `Sincronizado${lastSyncAt ? ` · ${lastSyncAt.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}` : ''}`}
              {syncStatus === 'error'   && (syncError || 'Error de sincronización')}
            </span>
            {syncStatus === 'error' && (
              <button
                onClick={retryPush}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  padding: '4px 8px', borderRadius: 6,
                  background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)',
                  color: '#F87171', fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <RefreshCw size={11} /> Reintentar
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ display: 'flex', gap: 10, marginBottom: 16 }}
        >
          {[
            { label: 'Total líderes', value: lideres.length, color: 'var(--color-text)' },
            { label: 'Pendientes',    value: pendingCount,    color: pendingCount > 0 ? '#F57C20' : '#27AE60' },
            { label: 'Agregados',     value: addedCount,      color: '#27AE60' },
          ].map(s => (
            <div key={s.label} style={{
              flex: 1, background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
              borderRadius: 10, padding: '10px 8px', textAlign: 'center',
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 800, color: s.color }}>
                {s.value}
              </div>
              <div style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Acciones */}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}
        >
          <button
            onClick={handleCopy}
            disabled={loading || pendingCount === 0}
            style={{
              flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 14px', borderRadius: 10, border: 'none', cursor: pendingCount === 0 ? 'not-allowed' : 'pointer',
              background: copied ? 'rgba(39,174,96,0.15)' : 'rgba(245,124,32,0.12)',
              color: copied ? '#27AE60' : '#F57C20',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
              borderColor: copied ? 'rgba(39,174,96,0.35)' : 'rgba(245,124,32,0.35)',
              borderWidth: 1, borderStyle: 'solid',
            }}
          >
            {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
            {copied ? '¡Copiado!' : `Copiar emails (${pendingCount})`}
          </button>

          <button
            onClick={handleDownloadCsv}
            disabled={loading || lideres.length === 0}
            style={{
              flex: 1, minWidth: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 14px', borderRadius: 10, border: '1px solid var(--color-border)',
              cursor: 'pointer', background: 'var(--color-navy-mid)',
              color: 'var(--color-text-muted)',
              fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
            }}
          >
            <Download size={14} />
            Descargar CSV
          </button>
        </motion.div>

        {/* Enlace directo a SharePoint Members */}
        <motion.a
          href={SP_MEMBERS_URL} target="_blank" rel="noopener noreferrer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.12 }}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 14px', marginBottom: 16,
            background: 'rgba(47,128,237,0.07)', border: '1px solid rgba(47,128,237,0.2)',
            borderRadius: 10, textDecoration: 'none',
            color: '#60A5FA', fontSize: 12, fontFamily: 'var(--font-body)',
          }}
        >
          <ShieldAlert size={14} />
          Abrir People and Groups → MRC Members en SharePoint ↗
        </motion.a>

        {/* Buscador */}
        <input
          type="text"
          placeholder="Filtrar por email, nombre o instalación…"
          value={filter}
          onChange={e => setFilter(e.target.value)}
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '10px 12px', marginBottom: 12,
            background: 'var(--color-input-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 8, color: 'var(--color-text)',
            fontSize: 13, fontFamily: 'var(--font-body)',
          }}
        />

        {/* Lista */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
            <Loader size={24} color="var(--color-text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        ) : error ? (
          <div style={{ color: '#EB5757', fontSize: 13, padding: 16, textAlign: 'center' }}>{error}</div>
        ) : filtered.length === 0 ? (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: 24, textAlign: 'center' }}>
            {filter ? 'Sin resultados para ese filtro.' : 'No hay líderes registrados.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map((l, i) => {
              const added = addedSet.has(l.email)
              return (
                <motion.div
                  key={l.email}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: added ? 'rgba(39,174,96,0.07)' : 'var(--color-navy-mid)',
                    border: `1px solid ${added ? 'rgba(39,174,96,0.25)' : 'var(--color-border)'}`,
                    borderRadius: 10, padding: '10px 12px',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: 'var(--color-text)', fontFamily: 'var(--font-body)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {l.email}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                      {[l.nombre, l.cargoMRC, l.instalacion].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleAdded(l.email)}
                    title={added ? 'Marcar como pendiente' : 'Marcar como agregado'}
                    style={{
                      background: added ? 'rgba(39,174,96,0.15)' : 'rgba(156,163,175,0.1)',
                      border: `1px solid ${added ? 'rgba(39,174,96,0.4)' : 'rgba(156,163,175,0.25)'}`,
                      borderRadius: 8, padding: '6px 10px', cursor: 'pointer',
                      color: added ? '#27AE60' : 'var(--color-text-muted)',
                      fontSize: 11, fontFamily: 'var(--font-display)', fontWeight: 700,
                      whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5,
                    }}
                  >
                    {added ? <><CheckCircle2 size={12} /> Agregado</> : <><Users size={12} /> Pendiente</>}
                  </button>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
