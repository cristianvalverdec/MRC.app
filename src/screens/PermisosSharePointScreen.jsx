// ── PermisosSharePointScreen ──────────────────────────────────────────────
//
// Pantalla de administrador para gestionar el acceso al sitio SharePoint
// SSOASCOMERCIAL. Tres bloques principales:
//
//   1. SOLICITUDES PENDIENTES — lee la lista SolicitudesAccesoMRC y deja
//      al admin marcar cada una como Procesada/Rechazada (PATCH al item).
//
//   2. AGREGAR EMAIL MANUAL — input para incluir un correo @agrosuper.com
//      arbitrario en el set MRC Members (útil para invitados o áreas que
//      no están en la lista de Líderes MRC). Se persiste en la nube como
//      parte de mrc-sp-members-added.json (campo `manual`).
//
//   3. LISTADO COMPLETO — líderes registrados + emails manuales, con
//      botón "Copiar emails" para pegar en el diálogo Add users de SP,
//      "Descargar CSV", y toggle Agregado/Pendiente por email.
//
// El estado "agregado" (set de emails ya añadidos al grupo) se sincroniza
// vía SharePoint para que se vea igual desde cualquier dispositivo.
//
// Solo visible para role === 'admin'.

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Copy, Download, CheckCircle2, Users, Loader, ShieldAlert,
  Cloud, CloudOff, RefreshCw, UserPlus, Inbox, X, Trash2, Mail, Clock,
  ShieldCheck, AlertTriangle, ChevronDown, ChevronUp, History,
} from 'lucide-react'
import AppHeader from '../components/layout/AppHeader'
import useUserStore from '../store/userStore'
import { getLideres } from '../services/lideresService'
import { loadAddedEmails, saveAddedEmails, AUDIT_MAX_ENTRIES } from '../services/spMembersAddedSync'
import { loadVerified, saveVerified } from '../services/spMembersVerifiedSync'
import { getMrcMembersEmails } from '../services/sharepointGroupService'
import { userExistsInAzureAD } from '../services/graphService'
import {
  getPendingAccessRequests,
  markAccessRequestProcessed,
} from '../services/accessRequestsListService'

const SP_SITE = 'https://agrosuper.sharepoint.com/sites/SSOASCOMERCIAL'
const SP_MEMBERS_URL = `${SP_SITE}/_layouts/15/user.aspx`
const ADDED_KEY  = 'mrc-sp-members-added'
const MANUAL_KEY = 'mrc-sp-members-manual'

const EMAIL_RE = /^[a-z0-9._%+-]+@agrosuper\.com$/i

// Lectura defensiva desde localStorage. Si el valor no es un array válido
// (puede haber quedado 'null' por flujos legacy o corrupción), retorna [].
// Esto fixea el bug "e is not iterable" que se disparaba al hacer spread
// sobre el resultado en componentes posteriores (en bundle minificado el
// spread sobre null se reportaba como "e is not iterable").
function safeArrayParse(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch { return [] }
}

export default function PermisosSharePointScreen() {
  const navigate  = useNavigate()
  const role      = useUserStore((s) => s.role)
  const adminMail = useUserStore((s) => s.email)

  const [lideres,   setLideres]   = useState([])
  const [loading,   setLoading]   = useState(true)
  const [error,     setError]     = useState(null)
  const [copied,    setCopied]    = useState(false)
  const [filter,    setFilter]    = useState('')

  const [addedSet, setAddedSet] = useState(() => new Set(safeArrayParse(ADDED_KEY)))
  const [manualEntries, setManualEntries] = useState(() => safeArrayParse(MANUAL_KEY))
  const [auditLog, setAuditLog] = useState([])
  const [cloudVersion, setCloudVersion] = useState(0)

  // Estado de verificación de membresía real en MRC Members (SP REST)
  const [verifiedSet,    setVerifiedSet]    = useState(new Set())
  const [verifiedAt,     setVerifiedAt]     = useState(null)
  const [verifyStatus,   setVerifyStatus]   = useState('idle') // 'idle' | 'fetching' | 'ok' | 'error'
  const [verifyError,    setVerifyError]    = useState(null)
  const [orphanEmails,   setOrphanEmails]   = useState([])    // en grupo SP, no en listado app
  const [auditOpen,      setAuditOpen]      = useState(false)

  // syncStatus: 'idle' | 'pulling' | 'pushing' | 'ok' | 'error'
  const [syncStatus, setSyncStatus] = useState('idle')
  const [syncError,  setSyncError]  = useState(null)
  const [lastSyncAt, setLastSyncAt] = useState(null)

  const [pendingRequests,  setPendingRequests]  = useState([])
  const [requestsLoading,  setRequestsLoading]  = useState(true)
  const [requestsError,    setRequestsError]    = useState(null)
  const [processingId,     setProcessingId]     = useState(null)

  const [newEmail, setNewEmail] = useState('')
  const [newName,  setNewName]  = useState('')
  const [emailErr, setEmailErr] = useState(null)

  // ── Persistencia local (caché optimista) ──────────────────────────────
  function persistLocalAdded(set) {
    try { localStorage.setItem(ADDED_KEY, JSON.stringify([...set])) } catch { /* ignore */ }
  }
  function persistLocalManual(arr) {
    try { localStorage.setItem(MANUAL_KEY, JSON.stringify(arr)) } catch { /* ignore */ }
  }

  // ── Push del estado actual a SharePoint ──────────────────────────────
  // Usa la firma nueva con objeto-payload para incluir audit log + version.
  const pushToCloud = useCallback(async (setToPush, manualToPush, auditToPush, versionToPush) => {
    setSyncStatus('pushing')
    setSyncError(null)
    try {
      await saveAddedEmails({
        added:   [...setToPush],
        manual:  manualToPush,
        audit:   auditToPush || [],
        version: typeof versionToPush === 'number' ? versionToPush : 0,
      })
      setSyncStatus('ok')
      setLastSyncAt(new Date())
      setCloudVersion(v => (typeof versionToPush === 'number' ? versionToPush : v) + 1)
    } catch (err) {
      setSyncStatus('error')
      setSyncError(err?.message || 'Error al sincronizar con SharePoint')
    }
  }, [])

  function toggleAdded(email) {
    let nextSet
    let nowAdded = false
    setAddedSet(prev => {
      nextSet = new Set(prev)
      if (nextSet.has(email)) nextSet.delete(email)
      else { nextSet.add(email); nowAdded = true }
      persistLocalAdded(nextSet)
      return nextSet
    })
    const nextAudit = [...auditLog, {
      ts:     new Date().toISOString(),
      by:     adminMail || '',
      action: nowAdded ? 'toggle_added' : 'toggle_pending',
      email,
    }].slice(-AUDIT_MAX_ENTRIES)
    setAuditLog(nextAudit)
    pushToCloud(nextSet, manualEntries, nextAudit, cloudVersion)
  }

  function retryPush() {
    pushToCloud(addedSet, manualEntries, auditLog, cloudVersion)
  }

  // ── Email manual: agregar / quitar ───────────────────────────────────
  const [verifyingEmail, setVerifyingEmail] = useState(false)

  async function handleAddManual() {
    const email = newEmail.trim().toLowerCase()
    if (!email) {
      setEmailErr('Ingresa un correo @agrosuper.com')
      return
    }
    if (!EMAIL_RE.test(email)) {
      setEmailErr('Solo correos @agrosuper.com son válidos')
      return
    }
    // Duplicado en líderes
    if (lideres.some(l => l.email.toLowerCase() === email)) {
      setEmailErr('Ese correo ya está en el listado de líderes registrados')
      return
    }
    if (manualEntries.some(m => m.email.toLowerCase() === email)) {
      setEmailErr('Ese correo ya fue agregado manualmente')
      return
    }

    // Validar contra Azure AD para evitar typos
    setVerifyingEmail(true)
    setEmailErr(null)
    const adCheck = await userExistsInAzureAD(email)
    setVerifyingEmail(false)

    if (!adCheck.exists) {
      setEmailErr(
        adCheck.error
          ? `No se pudo validar (${adCheck.error}). Revisa el correo.`
          : 'Este correo no existe en Azure AD Agrosuper. Revisa por typos.'
      )
      return
    }

    const entry = {
      email,
      // Si el usuario no tipeó nombre, usamos el de AD
      name:    newName.trim() || adCheck.displayName || '',
      addedBy: adminMail || '',
      addedAt: new Date().toISOString(),
    }
    const next = [...manualEntries, entry]
    setManualEntries(next)
    persistLocalManual(next)
    setNewEmail('')
    setNewName('')
    setEmailErr(null)
    const nextAudit = [...auditLog, {
      ts: new Date().toISOString(), by: adminMail || '',
      action: 'manual_add', email, meta: { name: entry.name },
    }].slice(-AUDIT_MAX_ENTRIES)
    setAuditLog(nextAudit)
    pushToCloud(addedSet, next, nextAudit, cloudVersion)
  }

  function handleRemoveManual(email) {
    const next = manualEntries.filter(m => m.email !== email)
    setManualEntries(next)
    persistLocalManual(next)
    let nextSet = addedSet
    if (addedSet.has(email)) {
      nextSet = new Set(addedSet)
      nextSet.delete(email)
      setAddedSet(nextSet)
      persistLocalAdded(nextSet)
    }
    const nextAudit = [...auditLog, {
      ts: new Date().toISOString(), by: adminMail || '',
      action: 'manual_remove', email,
    }].slice(-AUDIT_MAX_ENTRIES)
    setAuditLog(nextAudit)
    pushToCloud(nextSet, next, nextAudit, cloudVersion)
  }

  // ── Verificación real de membresía en MRC Members (SP REST) ──────────
  async function handleVerifyMembership() {
    setVerifyStatus('fetching')
    setVerifyError(null)
    try {
      const result = await getMrcMembersEmails()
      if (!result) return // redirigió a consent — la página recarga
      const { emails: groupEmails, fetchedAt, total } = result

      setVerifiedSet(groupEmails)
      setVerifiedAt(new Date(fetchedAt))
      setVerifyStatus('ok')

      // Reconciliación: si hay emails marcados "Agregado" pero NO están
      // en el grupo, los desmarcamos automáticamente y avisamos.
      // Si hay emails en el grupo pero NO marcados "Agregado", los marcamos.
      const allListedEmails = new Set([
        ...lideres.map(l => l.email.toLowerCase()),
        ...manualEntries.map(m => m.email.toLowerCase()),
      ])
      const reconciledAdded = new Set()
      for (const email of allListedEmails) {
        if (groupEmails.has(email)) reconciledAdded.add(email)
      }

      // Detectar huérfanos: en grupo pero no en listado app
      const orphans = []
      for (const email of groupEmails) {
        if (!allListedEmails.has(email)) orphans.push(email)
      }
      setOrphanEmails(orphans)

      // Solo persistir si hay diferencias reales con el set local
      const sameSize = reconciledAdded.size === addedSet.size
      const sameContent = sameSize && [...reconciledAdded].every(e => addedSet.has(e))
      if (!sameContent) {
        setAddedSet(reconciledAdded)
        persistLocalAdded(reconciledAdded)
        const nextAudit = [...auditLog, {
          ts: fetchedAt, by: adminMail || '',
          action: 'verify_run', email: '',
          meta: { totalInGroup: total, reconciled: reconciledAdded.size, orphans: orphans.length },
        }].slice(-AUDIT_MAX_ENTRIES)
        setAuditLog(nextAudit)
        pushToCloud(reconciledAdded, manualEntries, nextAudit, cloudVersion)
      } else {
        const nextAudit = [...auditLog, {
          ts: fetchedAt, by: adminMail || '',
          action: 'verify_run', email: '',
          meta: { totalInGroup: total, orphans: orphans.length },
        }].slice(-AUDIT_MAX_ENTRIES)
        setAuditLog(nextAudit)
      }

      // Cache compartida en la nube — fire-and-forget
      saveVerified({
        verifiedEmails: [...groupEmails],
        verifiedBy:     adminMail || '',
        totalInGroup:   total,
      }).catch(e => console.warn('[verify] saveVerified falló:', e?.message))
    } catch (err) {
      setVerifyStatus('error')
      setVerifyError(err?.message || 'Error al verificar membresía')
    }
  }

  function handleAcceptOrphan(email) {
    const lowerEmail = email.toLowerCase()
    if (manualEntries.some(m => m.email === lowerEmail)) return

    const entry = {
      email:   lowerEmail,
      name:    '',
      addedBy: adminMail || '',
      addedAt: new Date().toISOString(),
    }
    const nextManual = [...manualEntries, entry]
    setManualEntries(nextManual)
    persistLocalManual(nextManual)

    const nextSet = new Set(addedSet)
    nextSet.add(lowerEmail)
    setAddedSet(nextSet)
    persistLocalAdded(nextSet)

    setOrphanEmails(prev => prev.filter(e => e !== email))

    const nextAudit = [...auditLog, {
      ts: new Date().toISOString(), by: adminMail || '',
      action: 'orphan_accept', email: lowerEmail,
    }].slice(-AUDIT_MAX_ENTRIES)
    setAuditLog(nextAudit)
    pushToCloud(nextSet, nextManual, nextAudit, cloudVersion)
  }

  // ── Solicitudes pendientes: cargar y procesar ────────────────────────
  const loadRequests = useCallback(async () => {
    setRequestsLoading(true)
    setRequestsError(null)
    try {
      const list = await getPendingAccessRequests()
      setPendingRequests(list)
    } catch (err) {
      setRequestsError(err?.message || 'No se pudieron cargar las solicitudes')
    } finally {
      setRequestsLoading(false)
    }
  }, [])

  async function processRequest(req, status = 'Procesada') {
    setProcessingId(req.id)
    try {
      await markAccessRequestProcessed(req.id, {
        status,
        processedBy: adminMail || '',
      })
      // Si fue procesada (no rechazada), añadimos su email al set de
      // "agregados" para que el admin no tenga que buscarlo después.
      if (status === 'Procesada' && req.requesterEmail) {
        const email = req.requesterEmail.toLowerCase()
        const nextSet = new Set(addedSet)
        nextSet.add(email)
        setAddedSet(nextSet)
        persistLocalAdded(nextSet)
        // Y si el email no estaba en líderes ni en manuales, lo
        // agregamos como manual para que aparezca en el listado.
        const existsInLideres = lideres.some(l => l.email.toLowerCase() === email)
        const existsInManual  = manualEntries.some(m => m.email.toLowerCase() === email)
        let nextManual = manualEntries
        if (!existsInLideres && !existsInManual) {
          nextManual = [
            ...manualEntries,
            {
              email,
              name:    req.requesterName || '',
              addedBy: adminMail || '',
              addedAt: new Date().toISOString(),
            },
          ]
          setManualEntries(nextManual)
          persistLocalManual(nextManual)
        }
        pushToCloud(nextSet, nextManual, auditLog, cloudVersion)
      }
      // Quitamos la solicitud del listado pendientes localmente
      setPendingRequests(prev => prev.filter(r => r.id !== req.id))
    } catch (err) {
      setRequestsError(err?.message || 'Error al procesar solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  // ── Bootstrap: paralelo lista líderes + sync nube + solicitudes ──────
  useEffect(() => {
    if (role !== 'admin') return
    let cancelled = false

    Promise.all([
      getLideres(),
      loadAddedEmails().catch(err => {
        setSyncStatus('error')
        setSyncError(err?.message || 'No se pudo leer el set compartido')
        return null
      }),
      loadVerified().catch(() => null),
    ])
      .then(([lista, cloudData, verifiedData]) => {
        if (cancelled) return
        const seen = new Set()
        const dedup = lista.filter(l => {
          if (!l.email || seen.has(l.email)) return false
          seen.add(l.email)
          return true
        })
        setLideres(dedup.sort((a, b) => a.email.localeCompare(b.email)))

        if (cloudData?.added) {
          const validAdded = (Array.isArray(cloudData.added) ? cloudData.added : [])
            .filter(e => typeof e === 'string' && e.includes('@'))
            .map(e => e.toLowerCase())
          const cloudSet = new Set(validAdded)
          setAddedSet(cloudSet)
          persistLocalAdded(cloudSet)
          const validManual = (Array.isArray(cloudData.manual) ? cloudData.manual : [])
            .filter(m => m && typeof m.email === 'string')
          setManualEntries(validManual)
          persistLocalManual(validManual)
          setAuditLog(Array.isArray(cloudData.audit) ? cloudData.audit : [])
          setCloudVersion(typeof cloudData.version === 'number' ? cloudData.version : 0)
          setSyncStatus('ok')
          setLastSyncAt(cloudData.updatedAt ? new Date(cloudData.updatedAt) : new Date())
        } else if (cloudData === null) {
          if (addedSet.size > 0 || manualEntries.length > 0) {
            pushToCloud(addedSet, manualEntries, auditLog, cloudVersion)
          } else {
            setSyncStatus('ok')
          }
        }

        // Cache de verificación previa — solo lectura, no es la fuente de verdad
        if (verifiedData?.verifiedEmails) {
          setVerifiedSet(new Set(verifiedData.verifiedEmails.map(e => e.toLowerCase())))
          setVerifiedAt(verifiedData.verifiedAt ? new Date(verifiedData.verifiedAt) : null)
        }
      })
      .catch(e => !cancelled && setError(e?.message || 'Error al cargar líderes'))
      .finally(() => !cancelled && setLoading(false))

    loadRequests()

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

  // ── Vista combinada: líderes + emails manuales como filas extra ──────
  const allEntries = [
    ...lideres,
    ...manualEntries.map(m => ({
      email:       m.email,
      nombre:      m.name || '',
      cargoMRC:    'Agregado manual',
      instalacion: m.addedBy ? `por ${m.addedBy}` : '',
      _manual:     true,
    })),
  ]

  const filtered = filter.trim()
    ? allEntries.filter(l =>
        l.email.includes(filter.toLowerCase()) ||
        (l.nombre || '').toLowerCase().includes(filter.toLowerCase()) ||
        (l.instalacion || '').toLowerCase().includes(filter.toLowerCase())
      )
    : allEntries

  const pendingEmails = allEntries.filter(l => !addedSet.has(l.email)).map(l => l.email)

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
      ...allEntries.map(l => [
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

  const addedCount   = allEntries.filter(l => addedSet.has(l.email)).length
  const pendingCount = allEntries.length - addedCount

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
          Usa "Copiar emails" y pégalos en el diálogo <em>Add users</em> del grupo <strong style={{ color: 'var(--color-text)' }}>MRC Members</strong> en SharePoint.
        </motion.div>

        {/* ── Solicitudes pendientes ─────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }}
          style={{ marginBottom: 18 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Inbox size={15} color="#F57C20" />
            <h3 style={{
              margin: 0, fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 800,
              color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Solicitudes pendientes
            </h3>
            <span style={{
              background: pendingRequests.length > 0 ? 'rgba(245,124,32,0.15)' : 'rgba(156,163,175,0.1)',
              color: pendingRequests.length > 0 ? '#F57C20' : 'var(--color-text-muted)',
              borderRadius: 999, padding: '2px 8px', fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--font-display)',
            }}>
              {pendingRequests.length}
            </span>
            <button
              onClick={loadRequests}
              disabled={requestsLoading}
              title="Recargar"
              style={{
                marginLeft: 'auto', background: 'transparent', border: 'none',
                color: 'var(--color-text-muted)', cursor: requestsLoading ? 'wait' : 'pointer',
                padding: 4,
              }}
            >
              <RefreshCw size={13} style={requestsLoading ? { animation: 'spin 1s linear infinite' } : {}} />
            </button>
          </div>

          {requestsError && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '8px 12px', fontSize: 12, color: '#F87171',
              marginBottom: 8,
            }}>
              {requestsError}
            </div>
          )}

          {requestsLoading ? (
            <div style={{ padding: 16, textAlign: 'center' }}>
              <Loader size={18} color="var(--color-text-muted)" style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div style={{
              padding: '14px 12px', borderRadius: 8,
              background: 'rgba(39,174,96,0.06)', border: '1px solid rgba(39,174,96,0.2)',
              fontSize: 12, color: 'var(--color-text-muted)', textAlign: 'center',
            }}>
              Sin solicitudes pendientes.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <AnimatePresence>
                {pendingRequests.map(req => (
                  <motion.div
                    key={req.id}
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                    style={{
                      background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
                      borderRadius: 10, padding: '10px 12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 13, color: 'var(--color-text)',
                          fontWeight: 700, fontFamily: 'var(--font-body)',
                        }}>
                          {req.requesterName || '(sin nombre)'}
                        </div>
                        <div style={{ fontSize: 11, color: '#60A5FA', marginTop: 1 }}>
                          {req.requesterEmail || '(sin email)'}
                        </div>
                        {req.reason && (
                          <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4, fontStyle: 'italic' }}>
                            "{req.reason}"
                          </div>
                        )}
                        {req.createdAt && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--color-text-muted)', marginTop: 4 }}>
                            <Clock size={10} />
                            {new Date(req.createdAt).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <button
                        onClick={() => processRequest(req, 'Procesada')}
                        disabled={processingId === req.id || !req.requesterEmail}
                        style={{
                          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                          padding: '7px 10px', borderRadius: 7,
                          background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.4)',
                          color: '#27AE60', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
                          cursor: processingId === req.id ? 'wait' : 'pointer',
                        }}
                      >
                        <CheckCircle2 size={12} /> Marcar procesada
                      </button>
                      <button
                        onClick={() => processRequest(req, 'Rechazada')}
                        disabled={processingId === req.id}
                        style={{
                          padding: '7px 10px', borderRadius: 7,
                          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                          color: '#F87171', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
                          cursor: processingId === req.id ? 'wait' : 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.section>

        {/* ── Indicador de sync con SharePoint ───────────────────────── */}
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
            { label: 'Total',      value: allEntries.length, color: 'var(--color-text)' },
            { label: 'Pendientes', value: pendingCount,      color: pendingCount > 0 ? '#F57C20' : '#27AE60' },
            { label: 'Agregados',  value: addedCount,        color: '#27AE60' },
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
              padding: '11px 14px', borderRadius: 10, cursor: pendingCount === 0 ? 'not-allowed' : 'pointer',
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
            disabled={loading || allEntries.length === 0}
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

        {/* ── Botón Verificar permisos en SharePoint ───────────────────── */}
        <motion.button
          onClick={handleVerifyMembership}
          disabled={verifyStatus === 'fetching'}
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.11 }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '12px 14px', marginBottom: 16,
            borderRadius: 10, border: '1px solid rgba(47,128,237,0.45)',
            background: verifyStatus === 'fetching' ? 'rgba(47,128,237,0.08)' : 'rgba(47,128,237,0.18)',
            color: '#60A5FA', cursor: verifyStatus === 'fetching' ? 'wait' : 'pointer',
            fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700,
          }}
        >
          {verifyStatus === 'fetching'
            ? <><Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Consultando MRC Members…</>
            : <><ShieldCheck size={14} /> Verificar permisos en SharePoint</>}
        </motion.button>

        {/* Estado de verificación */}
        {(verifyStatus === 'ok' || verifyStatus === 'error' || verifiedAt) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', marginBottom: 12, borderRadius: 8, fontSize: 12,
            background: verifyStatus === 'error' ? 'rgba(239,68,68,0.08)' : 'rgba(39,174,96,0.06)',
            border: `1px solid ${verifyStatus === 'error' ? 'rgba(239,68,68,0.3)' : 'rgba(39,174,96,0.25)'}`,
            color: verifyStatus === 'error' ? '#F87171' : 'var(--color-text-muted)',
          }}>
            <ShieldCheck size={13} color={verifyStatus === 'error' ? '#F87171' : '#27AE60'} />
            <span style={{ flex: 1 }}>
              {verifyStatus === 'error'
                ? (verifyError || 'Error al verificar')
                : verifiedAt
                  ? `Verificado ${verifiedAt.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} · ${verifiedSet.size} en grupo MRC Members`
                  : 'Sin verificar todavía'}
            </span>
          </div>
        )}

        {/* ── Huérfanos: en grupo SP pero no en listado app ────────────── */}
        {orphanEmails.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            style={{
              background: 'rgba(242,201,76,0.08)', border: '1px solid rgba(242,201,76,0.35)',
              borderRadius: 10, padding: '12px 14px', marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <AlertTriangle size={14} color="#F2C94C" />
              <h3 style={{
                margin: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
                color: '#F2C94C', textTransform: 'uppercase', letterSpacing: 0.5,
              }}>
                Huérfanos detectados ({orphanEmails.length})
              </h3>
            </div>
            <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
              Estos correos están en MRC Members en SharePoint pero no aparecen en el
              listado de Líderes ni como manuales. Probablemente alguien los agregó
              directo desde SharePoint UI sin pasar por la app.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {orphanEmails.map(email => (
                <div key={email} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 10px', background: 'var(--color-navy-mid)',
                  border: '1px solid rgba(242,201,76,0.25)', borderRadius: 7,
                }}>
                  <span style={{ flex: 1, fontSize: 12, color: 'var(--color-text)' }}>{email}</span>
                  <button
                    onClick={() => handleAcceptOrphan(email)}
                    style={{
                      padding: '4px 9px', borderRadius: 6,
                      background: 'rgba(39,174,96,0.15)', border: '1px solid rgba(39,174,96,0.4)',
                      color: '#27AE60', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-display)',
                      cursor: 'pointer',
                    }}
                  >
                    Aceptar como manual
                  </button>
                </div>
              ))}
            </div>
          </motion.section>
        )}

        {/* ── Agregar email manual ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.13 }}
          style={{
            background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <UserPlus size={14} color="#60A5FA" />
            <h3 style={{
              margin: 0, fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 800,
              color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: 0.5,
            }}>
              Agregar email manual
            </h3>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 11, color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            Para correos @agrosuper.com que no están en la lista de Líderes MRC pero
            necesitan acceso al sitio (invitados, áreas extra, etc.). Aparecerán en el
            listado de abajo y se incluirán al copiar emails.
          </p>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <input
              type="email"
              placeholder="correo@agrosuper.com"
              value={newEmail}
              onChange={e => { setNewEmail(e.target.value); setEmailErr(null) }}
              onKeyDown={e => { if (e.key === 'Enter') handleAddManual() }}
              style={{
                flex: '2 1 220px', boxSizing: 'border-box',
                padding: '9px 10px', background: 'var(--color-input-bg)',
                border: `1px solid ${emailErr ? 'rgba(239,68,68,0.5)' : 'var(--color-border)'}`,
                borderRadius: 7, color: 'var(--color-text)', fontSize: 12,
                fontFamily: 'var(--font-body)',
              }}
            />
            <input
              type="text"
              placeholder="Nombre (opcional)"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddManual() }}
              style={{
                flex: '1 1 140px', boxSizing: 'border-box',
                padding: '9px 10px', background: 'var(--color-input-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 7, color: 'var(--color-text)', fontSize: 12,
                fontFamily: 'var(--font-body)',
              }}
            />
            <button
              onClick={handleAddManual}
              disabled={verifyingEmail}
              style={{
                padding: '9px 14px', borderRadius: 7, border: 'none',
                background: verifyingEmail ? 'rgba(245,124,32,0.5)' : '#F57C20', color: '#fff',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                cursor: verifyingEmail ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 5,
              }}
            >
              {verifyingEmail
                ? <><Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> Validando AD…</>
                : <><UserPlus size={13} /> Agregar</>}
            </button>
          </div>
          {emailErr && (
            <div style={{ fontSize: 11, color: '#F87171', marginTop: 4 }}>{emailErr}</div>
          )}
        </motion.section>

        {/* Enlace directo a SharePoint Members */}
        <motion.a
          href={SP_MEMBERS_URL} target="_blank" rel="noopener noreferrer"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.16 }}
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
              const added       = addedSet.has(l.email)
              const emailLower  = l.email.toLowerCase()
              // Estado del semáforo:
              //   verde  — verificado en el grupo MRC Members
              //   rojo   — marcado "Agregado" pero AUSENTE del grupo (alerta)
              //   gris   — sin verificación todavía (estado neutro)
              let ledColor = '#9CA3AF'  // gris por defecto
              let ledTitle = 'Sin verificar — presiona "Verificar permisos"'
              if (verifiedAt) {
                if (verifiedSet.has(emailLower)) {
                  ledColor = '#27AE60'
                  ledTitle = 'Confirmado en grupo MRC Members'
                } else if (added) {
                  ledColor = '#EB5757'
                  ledTitle = 'Marcado como Agregado pero NO está en MRC Members'
                } else {
                  ledColor = '#9CA3AF'
                  ledTitle = 'No está en MRC Members (correcto, marcado como Pendiente)'
                }
              }
              return (
                <motion.div
                  key={l.email}
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.01, 0.5) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: added ? 'rgba(39,174,96,0.07)' : 'var(--color-navy-mid)',
                    border: `1px solid ${added ? 'rgba(39,174,96,0.25)' : 'var(--color-border)'}`,
                    borderRadius: 10, padding: '10px 12px',
                  }}
                >
                  {/* LED semáforo de verificación SP */}
                  <span
                    title={ledTitle}
                    style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: ledColor,
                      boxShadow: `0 0 6px ${ledColor}`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 13, color: 'var(--color-text)',
                      fontFamily: 'var(--font-body)', fontWeight: 600,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      {l._manual && <Mail size={11} color="#60A5FA" />}
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
                  {l._manual && (
                    <button
                      onClick={() => handleRemoveManual(l.email)}
                      title="Eliminar email manual"
                      style={{
                        background: 'transparent', border: 'none', cursor: 'pointer',
                        color: '#F87171', padding: 4,
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── Audit log (colapsable) ────────────────────────────────────── */}
        {auditLog.length > 0 && (
          <motion.section
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
            style={{
              marginTop: 20, background: 'var(--color-navy-mid)',
              border: '1px solid var(--color-border)', borderRadius: 10,
              overflow: 'hidden',
            }}
          >
            <button
              onClick={() => setAuditOpen(o => !o)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 14px', background: 'transparent', border: 'none',
                color: 'var(--color-text)', cursor: 'pointer',
                fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: 0.5,
              }}
            >
              <History size={13} color="#60A5FA" />
              <span style={{ flex: 1, textAlign: 'left' }}>Historial de cambios ({auditLog.length})</span>
              {auditOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {auditOpen && (
              <div style={{
                maxHeight: 320, overflowY: 'auto',
                borderTop: '1px solid var(--color-border)',
              }}>
                {[...auditLog].reverse().map((a, idx) => (
                  <div key={idx} style={{
                    padding: '8px 14px',
                    borderBottom: idx < auditLog.length - 1 ? '1px solid var(--color-border)' : 'none',
                    fontSize: 11, color: 'var(--color-text-muted)',
                    display: 'flex', flexDirection: 'column', gap: 2,
                  }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{
                        background: 'rgba(47,128,237,0.12)', color: '#60A5FA',
                        padding: '1px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700,
                      }}>{a.action}</span>
                      <span style={{ color: 'var(--color-text)' }}>{a.email || '—'}</span>
                    </div>
                    <div style={{ fontSize: 10 }}>
                      {new Date(a.ts).toLocaleString('es-CL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {a.by && ` · ${a.by}`}
                      {a.meta && ` · ${JSON.stringify(a.meta)}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.section>
        )}
      </div>
    </div>
  )
}
