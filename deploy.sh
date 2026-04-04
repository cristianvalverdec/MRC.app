#!/bin/bash
# ─────────────────────────────────────────────────────────────────
#  Misión Riesgo Cero — Script de Deploy
#  Uso: bash deploy.sh
# ─────────────────────────────────────────────────────────────────

cd "$(dirname "$0")"

echo ""
echo "========================================="
echo "  Misión Riesgo Cero — Deploy"
echo "========================================="
echo ""

# ── Leer versión actual ───────────────────────────────────────────
CURRENT_VERSION=$(grep '"version"' package.json | head -1 | sed 's/.*"\([0-9.]*\)".*/\1/')
echo "  Versión actual: v$CURRENT_VERSION"
echo ""

# ── Solicitar nueva versión ──────────────────────────────────────
read -p "  Nueva versión (Enter para mantener v$CURRENT_VERSION): " NEW_VERSION
if [ -z "$NEW_VERSION" ]; then
  NEW_VERSION="$CURRENT_VERSION"
fi

echo ""

# ── Solicitar descripción del deploy ────────────────────────────
echo "  Describe los cambios de esta versión (resumen breve):"
read -p "  > " DEPLOY_DESC
if [ -z "$DEPLOY_DESC" ]; then
  DEPLOY_DESC="deploy v$NEW_VERSION"
fi

echo ""

# ── Actualizar package.json si la versión cambió ─────────────────
if [ "$NEW_VERSION" != "$CURRENT_VERSION" ]; then
  echo "▸ Actualizando package.json a v$NEW_VERSION..."
  sed -i '' "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
  echo "  ✅ package.json actualizado"
  echo ""
fi

# ── Agregar entrada al CHANGELOG ─────────────────────────────────
TODAY=$(date +%Y-%m-%d)
if [ -f CHANGELOG.md ]; then
  echo "▸ Actualizando CHANGELOG.md..."
  # Inserta nueva entrada después del primer separador ---
  awk -v ver="$NEW_VERSION" -v fecha="$TODAY" -v desc="$DEPLOY_DESC" '
    /^---$/ && !inserted {
      print
      print ""
      print "## [" ver "] — " fecha
      print ""
      print "### Cambios"
      print "- " desc
      print ""
      print "---"
      print ""
      inserted=1
      next
    }
    { print }
  ' CHANGELOG.md > CHANGELOG_tmp.md && mv CHANGELOG_tmp.md CHANGELOG.md
  echo "  ✅ CHANGELOG.md actualizado"
  echo ""
fi

# ── Build ─────────────────────────────────────────────────────────
echo "▸ Paso 1/4: Compilando v$NEW_VERSION..."
PATH=/usr/local/bin:$PATH npm run build
if [ $? -ne 0 ]; then
  echo "❌ Error en la compilación"
  read -p "Presiona Enter para cerrar..."
  exit 1
fi
echo "  ✅ Compilación exitosa"
echo ""

# ── Commit de los cambios ─────────────────────────────────────────
echo "▸ Paso 2/4: Guardando cambios en git..."
git add package.json package-lock.json CHANGELOG.md
git add -u
git commit -m "deploy: v$NEW_VERSION — $DEPLOY_DESC

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>" 2>/dev/null || echo "  (sin cambios adicionales que commitear)"
echo "  ✅ Listo"
echo ""

# ── Deploy a GitHub Pages ─────────────────────────────────────────
echo "▸ Paso 3/4: Desplegando a GitHub Pages..."
PATH=/usr/local/bin:$PATH node node_modules/.bin/gh-pages -d dist -b gh-pages --dotfiles -m "deploy: v$NEW_VERSION — $DEPLOY_DESC"
if [ $? -ne 0 ]; then
  echo "❌ Error en el deploy a GitHub Pages"
  read -p "Presiona Enter para cerrar..."
  exit 1
fi
echo "  ✅ Deploy exitoso"
echo ""

# ── Push a main ───────────────────────────────────────────────────
echo "▸ Paso 4/4: Subiendo código fuente a GitHub..."
PATH=/usr/local/bin:$PATH git push origin main
echo "  ✅ Push completado"
echo ""

echo "========================================="
echo "  ✅ Deploy v$NEW_VERSION completado!"
echo "  📅 $TODAY"
echo "  📝 $DEPLOY_DESC"
echo "  🌐 https://agrosuper-comercial.github.io/MRC.app/"
echo "========================================="
echo ""
read -p "Presiona Enter para cerrar..."
