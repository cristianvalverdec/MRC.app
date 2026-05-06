// Registro del Service Worker compartido entre UpdateBanner y ProfileScreen.
// UpdateBanner lo rellena al montar; ProfileScreen lo lee para forzar chequeos.
let _registration = null

export function setSharedRegistration(reg) { _registration = reg }
export function getSharedRegistration() { return _registration }
