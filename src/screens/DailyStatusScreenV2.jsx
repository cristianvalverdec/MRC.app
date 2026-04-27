import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2, Building2, ChevronLeft, ChevronDown, ChevronUp,
  ChevronRight, ClipboardList, Eye, Megaphone, Upload, Check, X,
} from 'lucide-react'
import useUserStore from '../store/userStore'
import { useNetworkStatus } from '../hooks/useNetworkStatus'
import { useKPIsAllBranches } from '../hooks/useKPIs'
import useGoalsStore, { getTramo, DEFAULT_ACTIVITY_TARGETS, TRAMO_META } from '../store/goalsStore'
import AccessRequestCTA from '../components/ui/AccessRequestCTA'
import { useNavigation } from '../hooks/useNavigation'

// ── Fuentes ────────────────────────────────────────────────────────────────
const FD = "'Barlow Condensed', sans-serif"
const FB = "'Barlow', sans-serif"

// ── Colores semánticos ─────────────────────────────────────────────────────
const C = {
  orange:  '#F57C20',
  success: '#27AE60',
  warning: '#F2994A',
  danger:  '#EB5757',
  info:    '#2F80ED',
}

// ── Turnos ─────────────────────────────────────────────────────────────────
const TURNOS = [
  { key: 'M',   label: 'Mañana',         short: 'M', color: '#F5A623' },
  { key: 'T',   label: 'Tarde',          short: 'T', color: '#9B5CF5' },
  { key: 'N',   label: 'Noche',          short: 'N', color: '#4B8EF5' },
  { key: 'ADM', label: 'Administración', short: 'A', color: '#2FD17A' },
]

// ── Targets semanales fijos para dif ─────────────────────────────────────
const TARGETS_DIF = { M: 1, T: 1, N: 1, ADM: 1 }

// ── Instalaciones que se denominan "CD" (resto son "Suc.") ────────────────
const CD_INSTALACIONES = new Set(['Antofagasta', 'Miraflores'])
function instLabel(name) {
  return CD_INSTALACIONES.has(name) ? 'CD' : 'Suc.'
}

// ── Metas semanales por sucursal desde goalsStore (FA real del admin) ─────
function getPautaTargets(branchName) {
  const { getFAForBranch, activityTargets } = useGoalsStore.getState()
  const { fa } = getFAForBranch(branchName)
  const tramo = getTramo(fa)
  const t = activityTargets[tramo] || DEFAULT_ACTIVITY_TARGETS[tramo]
  return { M: t.pautasTurnos, T: t.pautasTurnos, N: t.pautasTurnos, ADM: t.pautasAdmin }
}
function getCaminataTarget(branchName) {
  const { getFAForBranch, activityTargets } = useGoalsStore.getState()
  const { fa } = getFAForBranch(branchName)
  const tramo = getTramo(fa)
  const t = activityTargets[tramo] || DEFAULT_ACTIVITY_TARGETS[tramo]
  return t.caminatas
}

// Color de riesgo (FA) de una sucursal — bajo=verde, medio=amarillo, alto=rojo
function getBranchRiskColor(branchName) {
  const { getFAForBranch } = useGoalsStore.getState()
  const { fa } = getFAForBranch(branchName)
  if (!fa || fa <= 0) return '#9AA5B8'           // sin dato → gris neutro
  return TRAMO_META[getTramo(fa)].color
}

// ── Sucursales (definición estática — valores vienen del hook) ────────────
const SUCURSALES = [
  { id: 'arica',      name: 'Arica',        region: 'Norte'  },
  { id: 'iquique',    name: 'Iquique',       region: 'Norte'  },
  { id: 'calama',     name: 'Calama',        region: 'Norte'  },
  { id: 'antofag',    name: 'Antofagasta',   region: 'Norte'  },
  { id: 'copiapo',    name: 'Copiapó',       region: 'Norte'  },
  { id: 'coquimbo',   name: 'Coquimbo',      region: 'Norte'  },
  { id: 'hijuelas',   name: 'Hijuelas',      region: 'Centro' },
  { id: 'vina',       name: 'Viña del Mar',  region: 'Centro' },
  { id: 'sanantonio', name: 'San Antonio',   region: 'Centro' },
  { id: 'miraflores', name: 'Miraflores',    region: 'RM'     },
  { id: 'huechuraba', name: 'Huechuraba',    region: 'RM'     },
  { id: 'loespejo',   name: 'Lo Espejo',     region: 'RM'     },
  { id: 'rancagua',   name: 'Rancagua',      region: 'Centro' },
  { id: 'sanfelipe',  name: 'San Felipe',    region: 'Centro' },
  { id: 'curico',     name: 'Curicó',        region: 'Centro' },
  { id: 'talca',      name: 'Talca',         region: 'Centro' },
  { id: 'chillan',    name: 'Chillán',       region: 'Sur'    },
  { id: 'losangeles', name: 'Los Ángeles',   region: 'Sur'    },
  { id: 'concepcion', name: 'Concepción',    region: 'Sur'    },
  { id: 'temuco',     name: 'Temuco',        region: 'Sur'    },
  { id: 'valdivia',   name: 'Valdivia',      region: 'Sur'    },
  { id: 'osorno',     name: 'Osorno',        region: 'Sur'    },
  { id: 'pmontt',     name: 'Puerto Montt',  region: 'Sur'    },
  { id: 'castro',     name: 'Castro',        region: 'Sur'    },
  { id: 'coyhaique',  name: 'Coyhaique',     region: 'Sur'    },
  { id: 'pantarenas', name: 'Punta Arenas',  region: 'Sur'    },
]

// ── Helpers ────────────────────────────────────────────────────────────────
function calcPct(val, target) {
  if (!target) return null
  return Math.min(100, Math.round((val / target) * 100))
}
function calcPctCapped(val, target, cap = 120) {
  if (!target) return null
  return Math.min(cap, Math.round((val / target) * 100))
}
function statusColor(pct) {
  if (pct === null) return C.danger
  if (pct >= 80) return C.success
  if (pct >= 30) return C.warning
  return C.danger
}
function getWeekNumber() {
  const d    = new Date()
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()))
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7))
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7)
}

// Porcentaje global de cumplimiento de una sucursal (pautas + cam + dif) tope 120%
function calcOverallCompliance(kv, branchName) {
  if (!kv) return 0
  const pt = getPautaTargets(branchName)
  const pDone   = (kv.pautas?.M||0) + (kv.pautas?.T||0) + (kv.pautas?.N||0) + (kv.pautas?.ADM||0)
  const pTarget = pt.M + pt.T + pt.N + pt.ADM
  const cDone   = kv.cam || 0
  const dDone   = (kv.dif?.M||0) + (kv.dif?.T||0) + (kv.dif?.N||0) + (kv.dif?.ADM||0)
  const dTarget = TARGETS_DIF.M + TARGETS_DIF.T + TARGETS_DIF.N + TARGETS_DIF.ADM
  const totalDone   = pDone + cDone + dDone
  const totalTarget = pTarget + getCaminataTarget(branchName) + dTarget
  return calcPctCapped(totalDone, totalTarget, 120) ?? 0
}

function getGlobals(branchData) {
  let pDone = 0, pTarget = 0, camDone = 0, camTarget = 0, dDone = 0, dTarget = 0
  SUCURSALES.forEach(s => {
    const kv = branchData[s.name]
    if (!kv) return
    const pt = getPautaTargets(s.name)
    pDone   += (kv.pautas?.M||0) + (kv.pautas?.T||0) + (kv.pautas?.N||0) + (kv.pautas?.ADM||0)
    pTarget += pt.M + pt.T + pt.N + pt.ADM
    camDone  += kv.cam || 0
    camTarget += getCaminataTarget(s.name)
    dDone   += (kv.dif?.M||0) + (kv.dif?.T||0) + (kv.dif?.N||0) + (kv.dif?.ADM||0)
    dTarget += TARGETS_DIF.M + TARGETS_DIF.T + TARGETS_DIF.N + TARGETS_DIF.ADM
  })
  return { pDone, pTarget, camDone, camTarget, dDone, dTarget }
}

// ── Canvas helpers ─────────────────────────────────────────────────────────
function loadImg(src) {
  return new Promise(resolve => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload  = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = src
  })
}
function canvasRR(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}
function drawCell(ctx, x, y, w, h, val, key, color, isDark) {
  const has = val > 0
  ctx.fillStyle = has ? color + '33' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
  canvasRR(ctx, x, y, w, h, 5); ctx.fill()
  ctx.strokeStyle = has ? color : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)')
  ctx.lineWidth = 1.5
  canvasRR(ctx, x, y, w, h, 5); ctx.stroke()

  const label = key === 'ADM' ? 'A' : key
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = has ? color : (isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)')
  ctx.font = "800 17px 'Barlow Condensed', sans-serif"
  ctx.fillText('' + val, x + w / 2, y + h / 2 + 4)
  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.32)'
  ctx.font = "500 10px 'Barlow', sans-serif"
  ctx.fillText(label, x + w / 2, y + h - 5)
  ctx.textAlign = 'left'
}

// ── Generador de imagen PNG ────────────────────────────────────────────────
async function generateWhatsAppImage(dlTheme, branchData) {
  const isDark  = dlTheme === 'dark'
  const BASE    = import.meta.env.BASE_URL
  const statusC = (val, tgt) => {
    if (!tgt) return 'rgba(128,128,128,0.35)'
    const p = Math.round((val / tgt) * 100)
    if (p >= 80) return '#2FD17A'
    if (p >= 30) return '#F5B000'
    return '#FF5A5A'
  }

  const [logoAg, logoMrc] = await Promise.all([
    loadImg(BASE + 'agrosuper-logo.png'),
    loadImg(BASE + 'mrc-logo.png'),
  ])

  // ── Layout ──────────────────────────────────────────────────────────────
  const W         = 1080
  const PAD       = 44
  const HEADER_H  = 260
  const HDR_ROW_H = 44     // altura fila encabezado tabla
  const ROW_H     = 50     // altura filas de datos
  const FOOTER_H  = 140
  const TW        = W - PAD * 2

  const SGAP     = 14
  const COL_BAR  = 6
  const COL_NAME = 156
  const COL_CAM  = 88
  const PGAP     = 4
  // 8 celdas (4 pautas + 4 difusiones) + 6 PGAPs internos deben caber en el
  // espacio restante tras nombre, bar, cam y 4 SGAPs entre bloques.
  const CELL     = Math.floor((TW - COL_BAR - COL_NAME - COL_CAM - 4 * SGAP - 6 * PGAP) / 8)
  const BLOCK    = CELL * 4 + PGAP * 3

  // Recentramos la tabla: puede quedar residuo por redondeo, lo distribuimos
  const used     = COL_BAR + COL_NAME + COL_CAM + 2 * BLOCK + 4 * SGAP
  const xOffset  = PAD + Math.floor((TW - used) / 2)

  const xBar   = xOffset
  const xName  = xBar  + COL_BAR  + SGAP
  const xPauta = xName + COL_NAME + SGAP
  const xCam   = xPauta + BLOCK   + SGAP
  const xDif   = xCam  + COL_CAM  + SGAP

  const tblY = HEADER_H + 14
  const H    = tblY + HDR_ROW_H + SUCURSALES.length * ROW_H + FOOTER_H

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // ── Fondo ────────────────────────────────────────────────────────────────
  ctx.fillStyle = isDark ? '#0D1627' : '#EFF3FA'
  ctx.fillRect(0, 0, W, H)

  // ── Header navy ──────────────────────────────────────────────────────────
  ctx.fillStyle = '#1B2A4A'
  ctx.fillRect(0, 0, W, HEADER_H)

  // Logo Agrosuper — esquina superior DERECHA
  if (logoAg) {
    const lh = 46
    const lw = Math.round(logoAg.width * (lh / logoAg.height))
    ctx.drawImage(logoAg, W - PAD - lw, 26, lw, lh)
  }

  // Título
  ctx.fillStyle = '#ffffff'
  ctx.font = "800 46px 'Barlow Condensed', 'Helvetica Neue', sans-serif"
  ctx.textBaseline = 'alphabetic'
  ctx.fillText('ESTATUS DIARIO · SUCURSALES', PAD, 92)

  // Fecha
  ctx.fillStyle = 'rgba(255,255,255,0.62)'
  ctx.font = "500 18px 'Barlow', 'Helvetica Neue', sans-serif"
  const now     = new Date()
  const dateStr = now.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase()
  ctx.fillText(dateStr + '  ·  SEMANA ' + getWeekNumber(), PAD, 118)

  // KPI globales (3 columnas) — distribuidos uniformemente dentro del header
  const g = getGlobals(branchData)
  const kpis = [
    { l: 'PAUTAS VERIFICACIÓN', v: g.pDone,   tgt: g.pTarget,   color: '#F57C20' },
    { l: 'CAMINATAS',           v: g.camDone,  tgt: g.camTarget, color: '#4FB6FF' },
    { l: 'DIFUSIONES SSO',      v: g.dDone,    tgt: g.dTarget,   color: '#2FD17A' },
  ]
  const KPI_Y_NUM   = 182
  const KPI_Y_LABEL = 210
  const kpiColW     = Math.floor((W - PAD * 2) / kpis.length)
  kpis.forEach((k, i) => {
    const x = PAD + i * kpiColW
    const p = k.tgt > 0 ? Math.min(120, Math.round((k.v / k.tgt) * 100)) : 0
    ctx.fillStyle = k.color
    ctx.font = "800 40px 'Barlow Condensed', sans-serif"
    ctx.textAlign = 'left'
    ctx.fillText(k.v + ' / ' + k.tgt, x, KPI_Y_NUM)
    ctx.fillStyle = 'rgba(255,255,255,0.62)'
    ctx.font = "600 13px 'Barlow', sans-serif"
    ctx.letterSpacing = '0.08em'
    ctx.fillText(k.l + '  ·  ' + p + '%', x, KPI_Y_LABEL)
  })

  // Franja naranja — separador header / tabla
  ctx.fillStyle = '#F57C20'
  ctx.fillRect(0, HEADER_H - 6, W, 6)

  // ── Encabezado tabla ──────────────────────────────────────────────────────
  const tblX = xBar
  const tblW = (xDif + BLOCK) - xBar
  ctx.fillStyle = isDark ? '#243357' : '#1B2A4A'
  canvasRR(ctx, tblX, tblY, tblW, HDR_ROW_H, 8); ctx.fill()

  const hdrY = tblY + HDR_ROW_H / 2 + 6  // baseline centrada verticalmente
  ctx.font = "700 15px 'Barlow Condensed', sans-serif";
  [
    { text: 'SUCURSAL',                   cx: xName,              align: 'left',   color: 'rgba(255,255,255,0.75)' },
    { text: 'PAUTAS   M · T · N · A',     cx: xPauta + BLOCK / 2, align: 'center', color: '#F9A25A' },
    { text: 'CAMINATAS',                  cx: xCam + COL_CAM / 2, align: 'center', color: '#6FC4FF' },
    { text: 'DIFUSIONES   M · T · N · A', cx: xDif + BLOCK / 2,   align: 'center', color: '#5FDDA0' },
  ].forEach(h => {
    ctx.fillStyle = h.color
    ctx.textAlign = h.align
    ctx.fillText(h.text, h.cx, hdrY)
  })
  ctx.textAlign = 'left'

  // ── Filas de datos ────────────────────────────────────────────────────────
  SUCURSALES.forEach((suc, i) => {
    const y  = tblY + HDR_ROW_H + i * ROW_H
    const kv = branchData[suc.name] || { pautas: {M:0,T:0,N:0,ADM:0}, cam:0, dif:{M:0,T:0,N:0,ADM:0} }
    const pt  = getPautaTargets(suc.name)
    const tCam = getCaminataTarget(suc.name)

    if (i % 2 === 0) {
      ctx.fillStyle = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(27,42,74,0.04)'
      ctx.fillRect(tblX, y, tblW, ROW_H)
    }

    // Barra izquierda → color del Factor de Accidentabilidad de la sucursal
    const riskColor = getBranchRiskColor(suc.name)
    ctx.fillStyle = riskColor
    canvasRR(ctx, xBar, y + 8, COL_BAR, ROW_H - 16, 3); ctx.fill()

    ctx.fillStyle = isDark ? '#ffffff' : '#0F1830'
    ctx.font = "600 18px 'Barlow', sans-serif"
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(suc.name, xName, y + ROW_H / 2)
    ctx.textBaseline = 'alphabetic';

    ['M','T','N','ADM'].forEach((key, j) => {
      const val = kv.pautas?.[key] || 0
      drawCell(ctx, xPauta + j*(CELL+PGAP), y+6, CELL, ROW_H-12, val, key, statusC(val, pt[key]), isDark)
    })

    const camC = statusC(kv.cam||0, tCam)
    const camHasVal = (kv.cam||0) > 0
    ctx.fillStyle = camHasVal ? camC+'33' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)')
    canvasRR(ctx, xCam+4, y+6, COL_CAM-8, ROW_H-12, 6); ctx.fill()
    ctx.strokeStyle = camHasVal ? camC : (isDark ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.1)')
    ctx.lineWidth = 1.5
    canvasRR(ctx, xCam+4, y+6, COL_CAM-8, ROW_H-12, 6); ctx.stroke()
    ctx.fillStyle = camHasVal ? camC : (isDark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)')
    ctx.font = "800 17px 'Barlow Condensed', sans-serif"
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText((kv.cam||0) + '/' + tCam, xCam + COL_CAM/2, y + ROW_H/2)
    ctx.textBaseline = 'alphabetic'
    ctx.textAlign = 'left';

    ['M','T','N','ADM'].forEach((key, j) => {
      const val = kv.dif?.[key] || 0
      drawCell(ctx, xDif + j*(CELL+PGAP), y+6, CELL, ROW_H-12, val, key, statusC(val, TARGETS_DIF[key]), isDark)
    })

    ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    ctx.beginPath(); ctx.moveTo(tblX, y+ROW_H); ctx.lineTo(tblX+tblW, y+ROW_H); ctx.stroke()
  })

  // ── Footer ────────────────────────────────────────────────────────────────
  const footerY = tblY + HDR_ROW_H + SUCURSALES.length * ROW_H + 16

  // Separador sutil entre tabla y footer
  ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'
  ctx.lineWidth = 1
  ctx.beginPath(); ctx.moveTo(PAD, footerY); ctx.lineTo(W - PAD, footerY); ctx.stroke()

  // Leyenda de estado + créditos
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  const legendY = footerY + 32
  ;[['#2FD17A','≥ 80% OK'],['#F5B000','30–79% Parcial'],['#FF5A5A','< 30% Pendiente']].forEach(([c,l],i) => {
    const lx = PAD + i*200
    ctx.fillStyle = c
    canvasRR(ctx, lx, legendY - 10, 12, 12, 3); ctx.fill()
    ctx.fillStyle = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'
    ctx.font = "500 14px 'Barlow', sans-serif"
    ctx.fillText(l, lx + 18, legendY)
  })

  ctx.fillStyle = isDark ? 'rgba(255,255,255,0.38)' : 'rgba(0,0,0,0.38)'
  ctx.font = "500 13px 'Barlow', sans-serif"
  ctx.fillText('MRC App · Agrosuper Comercial SST · ' + now.toLocaleString('es-CL'), PAD, legendY + 26)

  // Logo MRC — esquina inferior derecha. Sin screen blend: se preservan colores.
  // En tema claro el logo tiene blanco de fondo, lo mostramos con ligera sombra suave.
  if (logoMrc) {
    const lh = 84
    const lw = Math.round(logoMrc.width * (lh / logoMrc.height))
    const lx = W - PAD - lw
    const ly = footerY + 16
    ctx.save()
    if (isDark) {
      // En oscuro: aplicamos un sutil "lighten" para integrar bordes blancos del PNG
      ctx.globalAlpha = 0.95
    } else {
      ctx.globalAlpha = 1.0
    }
    ctx.drawImage(logoMrc, lx, ly, lw, lh)
    ctx.restore()
  }

  return canvas
}

// ── ProgressBar ────────────────────────────────────────────────────────────
function ProgressBar({ pct, color, height = 4 }) {
  return (
    <div style={{ height, borderRadius: height, background: 'var(--color-border)', overflow: 'hidden', marginTop: 4 }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct ?? 0}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{ height: '100%', borderRadius: height, background: color }}
      />
    </div>
  )
}

// ── MiniTurnoDot ───────────────────────────────────────────────────────────
function MiniTurnoDot({ val, target, turno, size = 15 }) {
  const p    = calcPct(val, target)
  const color = statusColor(p)
  const done  = val >= target && target > 0
  return (
    <div title={`${turno.label}: ${val}/${target}`} style={{
      width: size, height: size, borderRadius: 4, flexShrink: 0,
      background: done ? color : val > 0 ? `${color}55` : 'var(--color-border)',
      border: `1.5px solid ${done ? color : val > 0 ? color : 'var(--color-border)'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <span style={{ fontFamily: FD, fontSize: 8, fontWeight: 800, lineHeight: 1, color: done ? '#fff' : val > 0 ? color : 'var(--color-text-muted)' }}>
        {turno.short}
      </span>
    </div>
  )
}

// ── SucursalRow ────────────────────────────────────────────────────────────
function SucursalRow({ suc, kv, onClick, index }) {
  const pt      = getPautaTargets(suc.name)
  const tCam    = getCaminataTarget(suc.name)
  const pTotal  = (kv.pautas?.M||0)+(kv.pautas?.T||0)+(kv.pautas?.N||0)+(kv.pautas?.ADM||0)
  const pTarget = pt.M + pt.T + pt.N + pt.ADM
  const barColor = statusColor(calcPct(pTotal, pTarget))
  const camColor = statusColor(calcPct(kv.cam||0, tCam))

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={onClick}
      onMouseEnter={e => { e.currentTarget.style.background = `${C.orange}10` }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
      style={{
        display: 'grid', gridTemplateColumns: '4px 70px 1fr 52px 1fr 16px',
        alignItems: 'center', gap: '0 6px', padding: '8px 14px',
        borderBottom: '1px solid var(--color-border)',
        cursor: 'pointer', transition: 'background 0.1s',
      }}
    >
      <div style={{ width: 4, height: 34, borderRadius: 2, background: barColor }} />
      <div>
        <div style={{ fontFamily: FB, fontSize: 11, fontWeight: 700, color: 'var(--color-text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {suc.name}
        </div>
        <div style={{ fontFamily: FD, fontSize: 8, color: 'var(--color-text-muted)', marginTop: 1 }}>{suc.region}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{ fontFamily: FD, fontSize: 7, fontWeight: 700, color: C.orange, letterSpacing: '0.06em' }}>PAUTA</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {TURNOS.map(trn => <MiniTurnoDot key={trn.key} val={kv.pautas?.[trn.key]||0} target={pt[trn.key]} turno={trn} size={15} />)}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{ fontFamily: FD, fontSize: 7, fontWeight: 700, color: C.info, letterSpacing: '0.06em' }}>CAM</div>
        <div style={{
          width: 40, height: 22, borderRadius: 6,
          background: (kv.cam||0) > 0 ? `${camColor}22` : 'var(--color-border)',
          border: `1.5px solid ${(kv.cam||0) > 0 ? camColor : 'var(--color-border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: FD, fontSize: 12, fontWeight: 800, color: camColor, lineHeight: 1 }}>
            {kv.cam||0}<span style={{ fontSize: 8, color: 'var(--color-text-muted)', fontWeight: 600 }}>/{tCam}</span>
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <div style={{ fontFamily: FD, fontSize: 7, fontWeight: 700, color: C.success, letterSpacing: '0.06em' }}>DIF</div>
        <div style={{ display: 'flex', gap: 2 }}>
          {TURNOS.map(trn => <MiniTurnoDot key={trn.key} val={kv.dif?.[trn.key]||0} target={TARGETS_DIF[trn.key]} turno={trn} size={15} />)}
        </div>
      </div>
      <ChevronRight size={12} color="var(--color-text-muted)" />
    </motion.div>
  )
}

// ── KPITurnoCard ───────────────────────────────────────────────────────────
function KPITurnoCard({ title, accent, turnos, icon: Icon, delay = 0 }) {
  const total  = turnos.reduce((a, x) => a + x.done, 0)
  const target = turnos.reduce((a, x) => a + x.target, 0)
  const p      = calcPctCapped(total, target, 120)
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      style={{ padding: 14, marginBottom: 10, borderRadius: 'var(--radius-card)', background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: `${accent}22`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} color={accent} />
        </div>
        <div style={{ fontFamily: FD, fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', flex: 1 }}>{title}</div>
        <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 800, color: statusColor(p) }}>
          {total}<span style={{ fontSize: 12, color: 'var(--color-text-muted)', fontWeight: 600 }}>/{target}</span>
        </div>
      </div>
      {turnos.map((trn, i) => {
        const tp = calcPctCapped(trn.done, trn.target, 120)
        const tc = trn.target === 0 ? 'var(--color-border)' : statusColor(tp)
        return (
          <div key={trn.key} style={{ marginBottom: i < turnos.length - 1 ? 10 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, background: `${trn.color}22`, border: `1.5px solid ${trn.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: FD, fontSize: 9, fontWeight: 800, color: trn.color }}>{trn.short}</span>
              </div>
              <div style={{ fontFamily: FB, fontSize: 12, color: 'var(--color-text-secondary)', flex: 1 }}>{trn.label}</div>
              {trn.target === 0 ? (
                <div style={{ fontFamily: FD, fontSize: 10, color: 'var(--color-text-muted)' }}>N/A</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
                  <div style={{ fontFamily: FD, fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{trn.done}</div>
                  <div style={{ fontFamily: FD, fontSize: 10, color: 'var(--color-text-muted)' }}>/{trn.target}</div>
                  <div style={{ fontFamily: FD, fontSize: 10, fontWeight: 700, color: tc, minWidth: 28, textAlign: 'right' }}>{tp}%</div>
                </div>
              )}
            </div>
            {trn.target > 0 && (
              <div style={{ marginLeft: 30 }}>
                <ProgressBar pct={Math.min(tp, 100)} color={tc} height={4} />
                <div style={{ marginTop: 2, fontFamily: FD, fontSize: 9, fontWeight: 700, color: tp >= 80 ? C.success : tp >= 30 ? C.warning : C.danger }}>
                  {tp >= 100 ? '✓ Completado' : tp >= 80 ? '✓ Casi completo' : tp >= 30 ? '⚡ En progreso' : '⚠ Pendiente'}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </motion.div>
  )
}

// ── Modal de descarga ──────────────────────────────────────────────────────
function DownloadModal({ onClose, branchData }) {
  const [dlTheme, setDlTheme]         = useState('dark')
  const [downloading, setDownloading] = useState(false)
  const week = getWeekNumber()

  const handleDownload = useCallback(async () => {
    setDownloading(true)
    try {
      const canvas = await generateWhatsAppImage(dlTheme, branchData)
      const link = document.createElement('a')
      link.download = `MRC-Estatus-Semana${week}-${dlTheme}-${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      document.body.appendChild(link); link.click(); document.body.removeChild(link)
    } catch (e) { console.error('[MRC] Error generando imagen:', e) }
    setDownloading(false)
  }, [dlTheme, branchData, week])

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
      style={{ position: 'absolute', inset: 0, zIndex: 300, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end' }}
    >
      <motion.div
        initial={{ y: 80 }} animate={{ y: 0 }} exit={{ y: 80 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', background: 'var(--color-navy-mid)', borderRadius: '16px 16px 0 0', padding: '20px 16px 32px', border: '1px solid var(--color-border)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          <div style={{ fontFamily: FD, fontSize: 15, fontWeight: 800, color: 'var(--color-text-primary)', flex: 1, letterSpacing: '0.06em' }}>
            DESCARGAR ESTATUS
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <X size={18} color="var(--color-text-muted)" />
          </button>
        </div>
        <div style={{ fontFamily: FB, fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 14 }}>
          Elige el tema del PNG para compartir por WhatsApp
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {[['dark','🌙 Oscuro'],['light','☀️ Claro']].map(([v, l]) => (
            <button key={v} onClick={() => setDlTheme(v)} style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: `1.5px solid ${dlTheme === v ? C.orange : 'var(--color-border)'}`,
              background: dlTheme === v ? `${C.orange}18` : 'transparent',
              color: dlTheme === v ? C.orange : 'var(--color-text-secondary)',
              fontFamily: FD, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
            }}>{l}</button>
          ))}
        </div>
        <button onClick={handleDownload} disabled={downloading} style={{
          width: '100%', height: 44, borderRadius: 10, border: `1px solid ${C.orange}55`,
          background: `${C.orange}15`, color: C.orange,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          fontFamily: FD, fontSize: 12, fontWeight: 800, letterSpacing: '0.08em',
          cursor: downloading ? 'default' : 'pointer', opacity: downloading ? 0.6 : 1,
        }}>
          <Upload size={14} color={C.orange} />
          {downloading ? 'GENERANDO…' : `DESCARGAR SEMANA ${week}`}
        </button>
      </motion.div>
    </motion.div>
  )
}

// ── Vista "Todas las sucursales" ───────────────────────────────────────────
function VistaTodas({ onSelectCD, isOnline, branchData, loading }) {
  const role              = useUserStore(s => s.role)
  const [showDL, setShowDL] = useState(false)
  const globals = getGlobals(branchData)
  const week    = getWeekNumber()
  const { goBack } = useNavigation()

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}>

      {/* Header custom — diseño compacto V2 con botón retroceso integrado */}
      <div style={{ padding: '8px 14px 4px', flexShrink: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, minWidth: 0 }}>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={goBack}
              aria-label="Volver"
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 4, marginLeft: -4, marginTop: -2,
                display: 'flex', alignItems: 'center', flexShrink: 0,
                color: C.orange,
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </motion.button>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ fontFamily: FD, fontSize: 22, fontWeight: 800, color: 'var(--color-text-primary)', letterSpacing: '-0.01em', lineHeight: 1 }}>
                  Estatus diario
                </div>
                <div style={{ padding: '2px 8px', borderRadius: 6, background: `${C.orange}22`, fontFamily: FD, fontSize: 10, fontWeight: 700, color: C.orange }}>
                  SEM {week}
                </div>
              </div>
              <div style={{ fontFamily: FB, fontSize: 12, color: 'var(--color-text-muted)', marginTop: 3 }}>
                {new Date().toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
            {role === 'admin' && (
              <button onClick={() => setShowDL(true)} title="Descargar imagen" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <Upload size={16} color={C.orange} />
              </button>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: isOnline ? C.success : C.danger, boxShadow: `0 0 8px ${isOnline ? C.success : C.danger}` }} />
              <span style={{ fontFamily: FD, fontSize: 9, color: 'var(--color-text-muted)' }}>SYNC</span>
            </div>
          </div>
        </div>
      </div>

      {/* KPI pills globales */}
      <div style={{ padding: '6px 14px 8px', display: 'flex', gap: 6, flexShrink: 0 }}>
        {[
          { l: 'Pautas',     v: globals.pDone,   tgt: globals.pTarget,   color: C.orange,  Icon: ClipboardList },
          { l: 'Caminatas',  v: globals.camDone,  tgt: globals.camTarget, color: C.info,    Icon: Eye },
          { l: 'Difusiones', v: globals.dDone,    tgt: globals.dTarget,   color: C.success, Icon: Megaphone },
        ].map(k => {
          const p = calcPctCapped(k.v, k.tgt, 120)
          const c = statusColor(p)
          return (
            <div key={k.l} style={{ flex: 1, padding: '8px 8px 6px', borderRadius: 10, background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                <k.Icon size={12} color={k.color} />
                <div style={{ fontFamily: FD, fontSize: 8, color: k.color, fontWeight: 700, letterSpacing: '0.06em' }}>{k.l.toUpperCase()}</div>
              </div>
              <div style={{ fontFamily: FD, fontSize: 18, fontWeight: 800, color: c, lineHeight: 1 }}>
                {k.v}<span style={{ fontSize: 10, color: 'var(--color-text-muted)', fontWeight: 600 }}>/{k.tgt}</span>
              </div>
              <ProgressBar pct={Math.min(p, 100)} color={c} height={3} />
            </div>
          )
        })}
      </div>

      {/* Leyenda turnos */}
      <div style={{ padding: '0 14px 6px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', flexShrink: 0 }}>
        <div style={{ fontFamily: FD, fontSize: 8, color: 'var(--color-text-muted)' }}>M=Mañana T=Tarde N=Noche A=Adm.</div>
        {[{ c: C.success, l: 'OK' }, { c: C.warning, l: 'Parcial' }, { c: C.danger, l: 'Pendiente' }].map(x => (
          <div key={x.l} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: x.c }} />
            <span style={{ fontFamily: FD, fontSize: 8, color: 'var(--color-text-muted)' }}>{x.l}</span>
          </div>
        ))}
      </div>

      {/* Header tabla */}
      <div style={{
        display: 'grid', gridTemplateColumns: '4px 70px 1fr 52px 1fr 16px',
        alignItems: 'center', gap: '0 6px', padding: '4px 14px 5px',
        background: 'var(--color-navy-light)',
        borderBottom: '1px solid var(--color-border)', borderTop: '1px solid var(--color-border)',
        flexShrink: 0,
      }}>
        <div /><div style={{ fontFamily: FD, fontSize: 8, color: 'var(--color-text-muted)', fontWeight: 700 }}>INSTALACIÓN</div>
        <div style={{ fontFamily: FD, fontSize: 8, color: C.orange,  fontWeight: 700, textAlign: 'center' }}>PAUTA</div>
        <div style={{ fontFamily: FD, fontSize: 8, color: C.info,    fontWeight: 700, textAlign: 'center' }}>CAM</div>
        <div style={{ fontFamily: FD, fontSize: 8, color: C.success, fontWeight: 700, textAlign: 'center' }}>DIF</div>
        <div />
      </div>

      {/* Lista */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <motion.div key={i} animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.1 }}
              style={{ height: 50, margin: '0 14px', borderRadius: 8, background: 'var(--color-navy-mid)', marginBottom: 4, marginTop: i === 0 ? 4 : 0 }} />
          ))
        ) : (
          SUCURSALES.map((suc, i) => {
            const kv = branchData[suc.name] || { pautas:{M:0,T:0,N:0,ADM:0}, cam:0, dif:{M:0,T:0,N:0,ADM:0} }
            return <SucursalRow key={suc.id} suc={suc} kv={kv} index={i} onClick={() => onSelectCD(suc.id)} />
          })
        )}
      </div>

      {/* Modal descarga */}
      <AnimatePresence>
        {showDL && <DownloadModal onClose={() => setShowDL(false)} branchData={branchData} />}
      </AnimatePresence>
    </div>
  )
}

// ── Vista "Por instalación" ────────────────────────────────────────────────
function VistaCD({ cdId, onBack, branchData }) {
  const [cdSel, setCdSel]           = useState(cdId || SUCURSALES[0].id)
  const [showPicker, setShowPicker] = useState(false)
  const suc = SUCURSALES.find(s => s.id === cdSel) || SUCURSALES[0]
  const kv  = branchData[suc.name] || { pautas:{M:0,T:0,N:0,ADM:0}, cam:0, dif:{M:0,T:0,N:0,ADM:0} }
  const pt  = getPautaTargets(suc.name)

  const pautaTurnos = TURNOS.map(trn => ({ ...trn, done: kv.pautas?.[trn.key]||0, target: pt[trn.key] }))
  const difTurnos   = TURNOS.map(trn => ({ ...trn, done: kv.dif?.[trn.key]||0,    target: TARGETS_DIF[trn.key] }))

  // Cumplimiento global: pautas + cam + dif vs sus metas (tope 120%)
  const overallPct = calcOverallCompliance(kv, suc.name)
  const overallColor = statusColor(overallPct)

  const label = instLabel(suc.name)

  const activity = [
    { user: 'J. Pérez',    action: 'Pauta RO · Turno Mañana', time: '09:14', color: TURNOS[0].color },
    { user: 'M. González', action: 'Caminata de Seguridad',    time: '08:52', color: C.info },
    { user: 'A. Torres',   action: 'Difusión SSO · Tarde',     time: '08:30', color: TURNOS[1].color },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--color-navy)' }}
      onClick={() => showPicker && setShowPicker(false)}>

      {/* Header */}
      <div style={{ padding: '6px 14px 8px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
        <button onClick={e => { e.stopPropagation(); onBack() }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, flexShrink: 0 }}>
          <ChevronLeft size={20} color={C.orange} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: FD, fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: 'var(--color-text-muted)' }}>
            INSTALACIÓN
          </div>
          <button onClick={e => { e.stopPropagation(); setShowPicker(v => !v) }} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ fontFamily: FD, fontSize: 20, fontWeight: 800, color: 'var(--color-text-primary)' }}>
              {label} {suc.name}
            </div>
            {showPicker ? <ChevronUp size={16} color={C.orange} /> : <ChevronDown size={16} color={C.orange} />}
          </button>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: FD, fontSize: 24, fontWeight: 800, color: overallColor, lineHeight: 1 }}>
            {overallPct}%
          </div>
          <div style={{ fontFamily: FD, fontSize: 9, color: 'var(--color-text-muted)' }}>CUMPLIMIENTO</div>
        </div>
      </div>

      {/* Picker */}
      {showPicker && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'absolute', top: 112, left: 14, right: 14, zIndex: 200,
          background: 'var(--color-navy-mid)', border: '1px solid var(--color-border)',
          borderRadius: 14, boxShadow: '0 16px 40px rgba(0,0,0,0.3)',
          maxHeight: 240, overflowY: 'auto',
        }}>
          {SUCURSALES.map((s, i) => {
            const skv  = branchData[s.name] || { pautas:{M:0,T:0,N:0,ADM:0}, cam:0, dif:{M:0,T:0,N:0,ADM:0} }
            const spt  = getPautaTargets(s.name)
            const sPct = calcPct(
              (skv.pautas?.M||0)+(skv.pautas?.T||0)+(skv.pautas?.N||0)+(skv.pautas?.ADM||0),
              spt.M + spt.T + spt.N + spt.ADM
            )
            return (
              <button key={s.id} onClick={() => { setCdSel(s.id); setShowPicker(false) }} style={{
                width: '100%', textAlign: 'left', padding: '10px 14px',
                borderBottom: i < SUCURSALES.length - 1 ? '1px solid var(--color-border)' : 'none',
                background: s.id === cdSel ? `${C.orange}15` : 'transparent',
                border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{ width: 4, height: 22, borderRadius: 2, background: statusColor(sPct), flexShrink: 0 }} />
                <div style={{ fontFamily: FB, fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary)', flex: 1 }}>
                  {instLabel(s.name)} {s.name}
                </div>
                <div style={{ fontFamily: FD, fontSize: 10, color: 'var(--color-text-muted)' }}>{s.region}</div>
                {s.id === cdSel && <Check size={12} color={C.orange} strokeWidth={3} />}
              </button>
            )
          })}
        </div>
      )}

      {/* Contenido scrollable */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 14px 16px' }}>
        {/* Mini chips turno */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
          {pautaTurnos.map(trn => {
            const p = calcPctCapped(trn.done, trn.target, 120)
            const c = statusColor(p)
            return (
              <motion.div key={trn.key}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                style={{ flex: 1, padding: '7px 0', borderRadius: 9, textAlign: 'center', background: 'var(--color-navy-mid)', border: `1.5px solid ${p >= 80 ? c : 'var(--color-border)'}` }}
              >
                <div style={{ width: 22, height: 22, borderRadius: 5, background: `${trn.color}22`, border: `1.5px solid ${trn.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 3px' }}>
                  <span style={{ fontFamily: FD, fontSize: 10, fontWeight: 800, color: trn.color }}>{trn.short}</span>
                </div>
                <div style={{ fontFamily: FD, fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', lineHeight: 1 }}>{trn.done}</div>
                <div style={{ fontFamily: FD, fontSize: 8, color: 'var(--color-text-muted)' }}>/{trn.target}</div>
                <div style={{ fontFamily: FD, fontSize: 9, fontWeight: 700, color: c, marginTop: 2 }}>
                  {p >= 100 ? '✓' : p >= 80 ? '~' : p >= 30 ? '→' : '!'}
                </div>
              </motion.div>
            )
          })}
        </div>

        <KPITurnoCard title="Pautas de Verificación" accent={C.orange}   icon={ClipboardList} turnos={pautaTurnos} delay={0}    />

        {/* Caminatas */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.35, delay:0.05 }}
          style={{ padding:14, marginBottom:10, borderRadius:'var(--radius-card)', background:'var(--color-navy-mid)', border:'1px solid var(--color-border)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <div style={{ width:30,height:30,borderRadius:8,background:`${C.info}22`,display:'flex',alignItems:'center',justifyContent:'center' }}>
              <Eye size={15} color={C.info} />
            </div>
            <div style={{ fontFamily:FD, fontSize:13, fontWeight:800, color:'var(--color-text-primary)', flex:1 }}>Caminatas de Seguridad</div>
            <div style={{ fontFamily:FD, fontSize:18, fontWeight:800, color:statusColor(calcPctCapped(kv.cam||0, getCaminataTarget(suc.name), 120)) }}>
              {kv.cam||0}<span style={{ fontSize:12, color:'var(--color-text-muted)', fontWeight:600 }}>/{getCaminataTarget(suc.name)}</span>
            </div>
          </div>
          <ProgressBar pct={Math.min(calcPctCapped(kv.cam||0, getCaminataTarget(suc.name), 120), 100)} color={statusColor(calcPctCapped(kv.cam||0, getCaminataTarget(suc.name), 120))} height={6} />
          <div style={{ marginTop:6, fontFamily:FB, fontSize:11, color:'var(--color-text-muted)' }}>
            {(kv.cam||0) >= getCaminataTarget(suc.name) ? 'Meta semanal alcanzada ✓' : `Faltan ${getCaminataTarget(suc.name)-(kv.cam||0)} caminata${getCaminataTarget(suc.name)-(kv.cam||0)!==1?'s':''} esta semana`}
          </div>
        </motion.div>

        <KPITurnoCard title="Difusiones SSO" accent={C.success} icon={Megaphone}     turnos={difTurnos}   delay={0.1}  />

        {/* Actividad */}
        <div style={{ fontFamily:FD, fontSize:11, fontWeight:800, letterSpacing:'0.1em', color:'var(--color-text-muted)', marginTop:4, marginBottom:8 }}>
          ACTIVIDAD DE HOY
        </div>
        {activity.map((a, i) => (
          <div key={i} style={{ display:'flex', gap:10, padding:'9px 0', borderBottom: i<activity.length-1 ? '1px solid var(--color-border)' : 'none' }}>
            <div style={{ width:28,height:28,borderRadius:'50%',background:`${a.color}22`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
              <Check size={12} color={a.color} strokeWidth={3} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:FB, fontSize:12, fontWeight:700, color:'var(--color-text-primary)' }}>{a.action}</div>
              <div style={{ fontFamily:FB, fontSize:11, color:'var(--color-text-muted)', marginTop:1 }}>{a.user}</div>
            </div>
            <div style={{ fontFamily:FD, fontSize:10, color:'var(--color-text-muted)' }}>{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Pantalla principal ─────────────────────────────────────────────────────
export default function DailyStatusScreenV2() {
  const { isOnline }                     = useNetworkStatus()
  const { data, loading, accessDenied }  = useKPIsAllBranches()
  const [view, setView]                  = useState('todas')
  const [cdId, setCdId]                  = useState(null)

  // Normalizar keys del hook → nombre canónico de SUCURSALES
  const branchData = data

  // ── Sin acceso al sitio SharePoint ────────────────────────────────────────
  if (!loading && accessDenied) {
    return (
      <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--color-navy)', padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <AccessRequestCTA />
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', background: 'var(--color-navy)' }}>

      {/* Tab bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50,
        display: 'flex', borderTop: '1px solid var(--color-border)',
        background: 'var(--color-navy)', paddingBottom: 'env(safe-area-inset-bottom, 4px)',
      }}>
        {[
          { id: 'todas', label: 'Todas',        Icon: BarChart2 },
          { id: 'cd',    label: 'Por instalación', Icon: Building2 },
        ].map(tab => (
          <button key={tab.id} onClick={() => {
            if (tab.id === 'todas') setView('todas')
            else { setCdId(v => v || SUCURSALES[0].id); setView('cd') }
          }} style={{ flex: 1, padding: '10px 0 6px', border: 'none', cursor: 'pointer', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <tab.Icon size={20} color={view === tab.id ? C.orange : 'var(--color-text-muted)'} strokeWidth={view === tab.id ? 2.5 : 1.8} />
            <div style={{ fontFamily: FD, fontSize: 10, fontWeight: 800, letterSpacing: '0.04em', color: view === tab.id ? C.orange : 'var(--color-text-muted)' }}>
              {tab.label.toUpperCase()}
            </div>
            {view === tab.id && <div style={{ width: 18, height: 2, borderRadius: 1, background: C.orange }} />}
          </button>
        ))}
      </div>

      {/* Contenido */}
      <div style={{ flex: 1, overflow: 'hidden', paddingBottom: 60 }}>
        <AnimatePresence mode="wait">
          {view === 'todas' ? (
            <motion.div key="todas"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.18 }} style={{ height: '100%' }}>
              <VistaTodas isOnline={isOnline} branchData={branchData} loading={loading}
                onSelectCD={id => { setCdId(id); setView('cd') }} />
            </motion.div>
          ) : (
            <motion.div key="cd"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.18 }} style={{ height: '100%', position: 'relative' }}>
              <VistaCD cdId={cdId} onBack={() => setView('todas')} branchData={branchData} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
