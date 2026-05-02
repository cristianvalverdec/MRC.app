// ── Definiciones de formularios MRC ─────────────────────────────────────────
// Estructura cargada localmente en Sprint 3. En Sprint 4+ se migra a SharePoint.
//
// Tipos de pregunta:
//   yesno   → Sí / No / N/A
//   rating  → Escala 1–5
//   text    → Área de texto libre
//   select  → Selección única de opciones

export const formDefinitions = {

  // ── 1. PAUTA DE VERIFICACIÓN ─────────────────────────────────────────────
  'pauta-verificacion': {
    id: 'pauta-verificacion',
    title: 'Pauta de Verificación',
    description: 'Control de condiciones del área de trabajo',
    sections: [
      {
        id: 's1',
        title: 'Orden y Aseo',
        questions: [
          { id: 'pv_1', type: 'yesno', label: 'El área de trabajo está limpia y ordenada', required: true },
          { id: 'pv_2', type: 'yesno', label: 'Los pasillos están despejados y debidamente señalizados', required: true },
          { id: 'pv_3', type: 'yesno', label: 'Las superficies de trabajo están libres de objetos innecesarios', required: true },
          { id: 'pv_4', type: 'yesno', label: 'Los residuos se depositan en los contenedores correspondientes', required: true },
        ],
      },
      {
        id: 's2',
        title: 'Equipos e Instalaciones',
        questions: [
          { id: 'pv_5', type: 'yesno', label: 'Los equipos de trabajo se encuentran en buen estado', required: true },
          { id: 'pv_6', type: 'yesno', label: 'Las instalaciones eléctricas están en buen estado y sin riesgos', required: true },
          { id: 'pv_7', type: 'yesno', label: 'Los EPP están disponibles, completos y en buen estado', required: true },
          { id: 'pv_8', type: 'yesno', label: 'Los elementos de izaje y carga están en condiciones seguras', required: false },
        ],
      },
      {
        id: 's3',
        title: 'Señalización y Emergencia',
        questions: [
          { id: 'pv_9',  type: 'yesno', label: 'Las vías de evacuación están despejadas y señalizadas', required: true },
          { id: 'pv_10', type: 'yesno', label: 'Los extintores están vigentes, accesibles y con carga', required: true },
          { id: 'pv_11', type: 'yesno', label: 'La señalética de seguridad está visible y en buen estado', required: true },
          { id: 'pv_12', type: 'yesno', label: 'El botiquín de primeros auxilios está completo y vigente', required: true },
        ],
      },
      {
        id: 's4',
        title: 'Evaluación y Observaciones',
        questions: [
          { id: 'pv_13', type: 'rating', label: 'Calificación general de las condiciones del área', required: true },
          { id: 'pv_14', type: 'text',   label: 'Observaciones, hallazgos y acciones correctivas requeridas', required: false, placeholder: 'Describe los hallazgos encontrados y las acciones a tomar…' },
        ],
      },
    ],
  },

  // ── 2. CAMINATA DE SEGURIDAD ─────────────────────────────────────────────
  'caminata-seguridad': {
    id: 'caminata-seguridad',
    title: 'Caminata de Seguridad',
    description: 'Caminata de Seguridad SSO (Líderes)',
    supersededSections: ['s1', 's2', 's3', 's4', 'cierre_cond'],
    permanentlyRemovedQuestions: ['cs_fri_alm_nombre','cs_fri_alm_rut','cs_fri_epp_nombre','cs_fri_epp_rut','cs_fri_mmc_nombre','cs_fri_mmc_rut','cs_fri_tran_nombre','cs_fri_tran_rut','cs_fri_cdc_nombre','cs_fri_cdc_rut','cs_fri_eqr_nombre','cs_fri_eqr_rut','cs_ofi_tp_nombre','cs_ofi_tp_rut','cs_ofi_elec_nombre','cs_ofi_elec_rut','cs_ofi_post_nombre','cs_ofi_post_rut','cs_bat_nombre','cs_bat_rut','cs_com_nombre','cs_com_rut'],
    sections: [

      // ── IDENTIFICACIÓN ───────────────────────────────────────────────────
      {
        id: 'ident', title: 'IDENTIFICACIÓN',
        questions: [
          { id: 'cs_instalacion', type: 'select', label: 'Instalación donde se realizará la Caminata', required: true, placeholder: 'Selecciona la instalación', options: ['Oficina Central','Sucursal Coquimbo','Oficina Vespucio','Sucursal Arica','Sucursal Iquique','Sucursal Calama','Sucursal Antofagasta','Sucursal Copiapó','Sucursal San Felipe','Sucursal Hijuelas','Sucursal Viña del Mar','Sucursal San Antonio','Sucursal Miraflores','Sucursal Huechuraba','Sucursal Lo Espejo','Sucursal Rancagua','Sucursal Curicó','Sucursal Talca','Sucursal Chillán','Sucursal Los Ángeles','Sucursal Concepción','Sucursal Valdivia','Sucursal Temuco','Sucursal Osorno','Sucursal Puerto Montt','Sucursal Castro','Sucursal Coyhaique','Sucursal Punta Arenas'] },
          { id: 'cs_area', type: 'select', label: '¿En qué área realizará la Caminata de Seguridad?', required: true, options: ['Frigorífico','Sala de Máquinas','Sala de Baterías','Áreas Comunes','Oficinas Administrativas'] },
        ],
      },

      // ── TEMÁTICA — FRIGORÍFICO ────────────────────────────────────────────
      {
        id: 'fri_tema', title: 'TEMÁTICA — FRIGORÍFICO',
        visibleWhen: (a) => a.cs_area === 'Frigorífico',
        questions: [
          { id: 'cs_fri_tema', type: 'select', label: 'Temática que se verificará en Frigorífico', required: true, options: ['Almacenaje en Altura','Elementos de Protección Personal (EPP)','Manejo Manual de Carga','Tránsito Interior Frigorífico','Carga y Descarga de Camiones Rampla','Operación de Equipos Rodantes'] },
        ],
      },

      // ── TEMÁTICA — OFICINAS ───────────────────────────────────────────────
      {
        id: 'ofi_tema', title: 'TEMÁTICA — OFICINAS',
        visibleWhen: (a) => a.cs_area === 'Oficinas Administrativas',
        questions: [
          { id: 'cs_ofi_tema', type: 'select', label: 'Temática que se verificará en oficinas', required: true, options: ['Tránsito de Personas','Utilización de Equipos o Instalaciones Eléctricas','Postura de Trabajo Adecuada y Reporte de Riesgo en Puesto de Trabajo'] },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // FRIGORÍFICO — ALMACENAJE EN ALTURA
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'fri_alm_cond', title: 'CONDUCTA — ALMACENAJE EN ALTURA',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Almacenaje en Altura',
        questions: [
          { id: 'cs_fri_alm_p1', type: 'radio', required: true, label: 'REGLA N°4 (OP): Almacena productos en altura cumpliendo con las medidas de seguridad establecidas', subtitle: 'Observe que los operadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Almacena pallets con productos en altura que se encuentren sin film de sujeción.','No informa de inmediato daños en la estructura del Rack.','Almacena en Altura productos que se encuentren con su pallet roto.','No da aviso inmediato a su jefatura cuando observa un pallet roto en altura.','Se posiciona bajo carga que se encuentra almacenada en altura mientras equipo rodante (Apilador o Grúa) opera en posiciones contiguas o bajo carga con riesgo de caídas.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_alm_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Almacenaje en Altura', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_fri_alm_p1 === 'CON_OBSERVACIONES', options: [{ value: 'sin_film', label: 'Almacena pallets con productos en altura, que se encuentran sin film de sujeción', severity: 'NORMAL' },{ value: 'no_informa_rack', label: 'No informa daño provocado a la estructura de rack', severity: 'NORMAL' },{ value: 'pallets_rotos', label: 'Almacena en altura pallets rotos con productos', severity: 'GRAVE' },{ value: 'pallets_rotos_apilados', label: 'Presencia de pallets rotos apilados en altura (No deben existir Pallets rotos en altura)', severity: 'NORMAL' },{ value: 'no_cumple_poev', label: 'No cumple con indicaciones de POEV y LUP asociados', severity: 'NORMAL' }] },
          { id: 'cs_fri_alm_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_fri_alm_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_fri_alm_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_fri_alm_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_fri_alm_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_fri_alm_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_fri_alm_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_fri_alm_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'fri_alm_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_fri_alm_p1 === 'SIN_OBSERVACIONES' || a.cs_fri_alm_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_fri_alm_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_fri_alm_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'fri_alm_insp', title: 'CONDICIONES — ALMACENAJE EN ALTURA',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Almacenaje en Altura',
        questions: [
          { id: 'cs_fri_alm_p2', type: 'radio', required: true, label: 'Verificación de condiciones en el ALMACENAJE EN ALTURA', subtitle: 'Inspeccione que los equipos cumplan con los siguientes estándares y marque el resultado de su inspección:', conductasList: ['Todos los pallets almacenados en altura están en buen estado (sin pallets rotos; si existen rotos, deben contar con doble pallet).','Todos los productos almacenados en altura cuentan con film de sujeción.','La estructura de los racks se encuentra en buen estado: sin deformaciones, sin piezas sueltas, con todos sus pernos de sujeción.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_alm_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_alm_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_alm_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_alm_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_fri_alm_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_alm_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_alm_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_alm_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_alm_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_fri_alm_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // FRIGORÍFICO — EPP
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'fri_epp_cond', title: 'CONDUCTA — ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Elementos de Protección Personal (EPP)',
        questions: [
          { id: 'cs_fri_epp_p1', type: 'radio', required: true, label: 'REGLA N°1 (OP): Revisa y utiliza correctamente todos los elementos de protección personal (EPP)', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Utilizan todos los EPP asignados a su trabajo y los autorizados por la sucursal.','Utilizan sus EPP de forma correcta (bien posicionados).','Informan cuando sus EPP se encuentran en mal estado.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_epp_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — EPP', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_fri_epp_p1 === 'CON_OBSERVACIONES', options: [{ value: 'no_utiliza_epp', label: 'No utiliza EPP', severity: 'GRAVE' },{ value: 'epp_incorrecto', label: 'Utiliza su EPP de forma incorrecta', severity: 'NORMAL' },{ value: 'no_informa_deterioro', label: 'No informa cuando EPP está en malas condiciones o cuando no lo posee para trabajar', severity: 'NORMAL' },{ value: 'epp_no_autorizado', label: 'Utiliza EPP que no corresponde o no está autorizado', severity: 'NORMAL' }] },
          { id: 'cs_fri_epp_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_fri_epp_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_fri_epp_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_fri_epp_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_fri_epp_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_fri_epp_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_fri_epp_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_fri_epp_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'fri_epp_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_fri_epp_p1 === 'SIN_OBSERVACIONES' || a.cs_fri_epp_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_fri_epp_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_fri_epp_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'fri_epp_insp', title: 'CONDICIONES — EPP',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Elementos de Protección Personal (EPP)',
        questions: [
          { id: 'cs_fri_epp_p2', type: 'radio', required: true, label: 'Verificación de condiciones en el USO DE ELEMENTOS DE PROTECCIÓN PERSONAL (EPP)', subtitle: 'Inspeccione los EPP cumplan con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Los EPP se encuentran disponibles y en buen estado.','Los EPP fueron entregados según programa de entrega.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_epp_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_epp_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_epp_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_epp_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_fri_epp_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_epp_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_epp_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_epp_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_epp_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_fri_epp_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // FRIGORÍFICO — MANEJO MANUAL DE CARGA
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'fri_mmc_cond', title: 'CONDUCTA — MANEJO MANUAL DE CARGA',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Manejo Manual de Carga',
        questions: [
          { id: 'cs_fri_mmc_p1', type: 'radio', required: true, label: 'REGLA N°6 (OP): Aplica técnicas seguras de manejo manual carga y utiliza ayudas mecánicas', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Realiza técnica correcta de manejo manual de carga en productos, objetos, cajas y/o herramientas.','Utiliza ayuda mecánica (transpaleta manual o eléctrica) para el transporte de carga.','Levanta caja con productos desde los extremos (NO desde los zunchos).','Deposita productos, objetos o herramientas utilizando la fuerza de sus piernas, sin flexionar tu espalda.','No lanza cajas con producto al pallet o pallet al suelo.','Transporta Pallets arrastrándolo por el suelo, no sobre sus hombros.','Transporta solo un producto de forma manual.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_mmc_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Manejo Manual de Carga', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_fri_mmc_p1 === 'CON_OBSERVACIONES', options: [{ value: 'tecnica_incorrecta', label: 'No aplica técnica correcta de manejo manual de carga en productos, objetos, cajas y/o herramientas', severity: 'NORMAL' },{ value: 'sin_ayuda_mecanica', label: 'No utiliza ayuda mecánica para la manipulación de carga', severity: 'NORMAL' },{ value: 'toma_por_zunchos', label: 'Toma caja con productos desde los zunchos', severity: 'NORMAL' },{ value: 'deposita_inadecuado', label: 'Deposita productos, objetos o herramientas de forma inadecuada', severity: 'NORMAL' },{ value: 'lanza_caja_pallet', label: 'Lanza caja con producto al pallet o lanza pallet al suelo', severity: 'GRAVE' },{ value: 'transporta_hombros', label: 'Transporta pallets sobre los hombros y no arrastrando', severity: 'GRAVE' },{ value: 'transporta_mas_uno', label: 'Transporta más de un producto de forma manual', severity: 'NORMAL' }] },
          { id: 'cs_fri_mmc_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_fri_mmc_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_fri_mmc_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_fri_mmc_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_fri_mmc_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_fri_mmc_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_fri_mmc_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_fri_mmc_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'fri_mmc_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_fri_mmc_p1 === 'SIN_OBSERVACIONES' || a.cs_fri_mmc_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_fri_mmc_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_fri_mmc_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'fri_mmc_insp', title: 'CONDICIONES — MANEJO MANUAL DE CARGA',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Manejo Manual de Carga',
        questions: [
          { id: 'cs_fri_mmc_p2', type: 'radio', required: true, label: 'Verificación de condiciones en el MANEJO MANUAL DE CARGA', subtitle: 'Inspeccione que la carga cumpla con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Las transpaletas manuales y eléctricas se encuentran operativas y en buen estado.','Se mantienen los espacios despejados y suficientes para poder realizar una correcta técnica de manejo manual de carga.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_mmc_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_mmc_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_mmc_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_mmc_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_fri_mmc_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_mmc_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_mmc_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_mmc_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_mmc_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_fri_mmc_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // FRIGORÍFICO — TRÁNSITO INTERIOR FRIGORÍFICO
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'fri_tran_cond', title: 'CONDUCTA — TRÁNSITO INTERIOR FRIGORÍFICO',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Tránsito Interior Frigorífico',
        questions: [
          { id: 'cs_fri_tran_p1', type: 'radio', required: true, label: 'REGLA N°2 (OP): Transita alerta a las condiciones del entorno y por zonas habilitadas', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['No corren ni caminan apresurados por el área.','Transitan por los lugares demarcados y autorizados.','Utilizan pasamanos al subir o bajar escaleras o peldaños.','Transita por superficies con presencia de hielo o líquido.','Transita o trabaja bajo carga que se encuentra almacenada en altura.','No mantiene distancia con operación de equipos rodantes.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_tran_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Tránsito Interior Frigorífico', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_fri_tran_p1 === 'CON_OBSERVACIONES', options: [{ value: 'zona_no_habilitada', label: 'Transita por zona no habilitada y/o demarcada', severity: 'NORMAL' },{ value: 'transita_corriendo', label: 'Transita corriendo o apresurado por el área', severity: 'NORMAL' },{ value: 'hielo_liquido', label: 'Transita por superficies con presencia de hielo o líquido', severity: 'NORMAL' },{ value: 'bajo_carga_altura', label: 'Transita o trabaja bajo carga que se encuentra almacenada en altura (Aplica cuando no es posible asegurar la estabilidad del pallet, Ej: si han sufrido evento de caída de productos)', severity: 'GRAVE' },{ value: 'sin_distancia_equipos', label: 'No mantiene distancia con operación de equipos rodantes', severity: 'NORMAL' },{ value: 'sobre_pallets_piso', label: 'Transita o trabaja encima de pallets que se encuentran en el piso', severity: 'NORMAL' }] },
          { id: 'cs_fri_tran_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_fri_tran_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_fri_tran_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_fri_tran_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_fri_tran_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_fri_tran_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_fri_tran_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_fri_tran_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'fri_tran_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_fri_tran_p1 === 'SIN_OBSERVACIONES' || a.cs_fri_tran_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_fri_tran_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_fri_tran_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'fri_tran_insp', title: 'CONDICIONES — TRÁNSITO INTERIOR FRIGORÍFICO',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Tránsito Interior Frigorífico',
        questions: [
          { id: 'cs_fri_tran_p2', type: 'radio', required: true, label: 'Verificación de condiciones en el TRÁNSITO INTERIOR FRIGORÍFICO', subtitle: 'Inspeccione que el área de trabajo cumpla con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Los pasillos y vías de tránsito se encuentran despejadas y limpias (Sin presencia de hielo o líquido, restos de pallets, film u otros elementos).','Los pisos se encuentran en buen estado.','Las escaleras o escalones están señalizados.','Las vías de tránsito se encuentran bien iluminadas.','Las puertas de acceso a cámaras funcionan correctamente.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_tran_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_tran_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_tran_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_tran_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_fri_tran_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_tran_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_tran_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_tran_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_tran_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_fri_tran_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // FRIGORÍFICO — CARGA Y DESCARGA DE CAMIONES RAMPLA
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'fri_cdc_cond', title: 'CONDUCTA — CARGA Y DESCARGA DE CAMIONES RAMPLA',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Carga y Descarga de Camiones Rampla',
        questions: [
          { id: 'cs_fri_cdc_p1', type: 'radio', required: true, label: 'REGLA N°5 (OP): Realizar carga y descarga de camiones cumpliendo con medidas de seguridad establecidas', subtitle: 'Observe que los operadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['No ingresa a descargar o cargar, mientras otro equipo se encuentra al interior de camión realizando operaciones.','No abre cortina de Andén previo a la finalización del posicionamiento de camión.','Informar desperfectos o daños en cortina o plataforma de andén.','Verifica el correcto acople Camión/Andén, antes de comenzar la operación.','Prioriza la utilización de equipo rodante eléctrico sobre el manual.','Cuando utiliza transpaleta manual para la descarga de camión Rampla, solicita apoyo de un compañero.','Cuando realiza la descarga de un camión, controla la velocidad, espacio y ruta de desplazamiento con anticipación.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_cdc_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Carga y Descarga de Camiones Rampla', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_fri_cdc_p1 === 'CON_OBSERVACIONES', options: [{ value: 'ingresa_con_otro', label: 'Ingresa a descargar o cargar, mientras otro equipo se encuentra al interior de camión realizando operaciones', severity: 'GRAVE' },{ value: 'abre_cortina_antes', label: 'Abre cortina de andén previo a la finalización del posicionamiento de camión', severity: 'NORMAL' },{ value: 'no_informa_dano', label: 'No informa desperfectos o daños en cortina o plataforma de andén', severity: 'NORMAL' },{ value: 'no_verifica_acople', label: 'No verifica el correcto acople camión/andén, antes de comenzar la operación', severity: 'NORMAL' },{ value: 'no_prioriza_electrico', label: 'No prioriza la utilización de equipo rodante eléctrico sobre el manual', severity: 'NORMAL' },{ value: 'descarga_manual_sin_ayuda', label: 'Realiza descarga de productos de camión rampla utilizando transpaleta manual, sin la ayuda de otro colaborador', severity: 'NORMAL' },{ value: 'descarga_sin_control', label: 'Realizar descarga de camión sin controlar la velocidad, espacio y ruta de desplazamiento.', severity: 'NORMAL' }] },
          { id: 'cs_fri_cdc_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_fri_cdc_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_fri_cdc_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_fri_cdc_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_fri_cdc_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_fri_cdc_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_fri_cdc_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_fri_cdc_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'fri_cdc_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_fri_cdc_p1 === 'SIN_OBSERVACIONES' || a.cs_fri_cdc_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_fri_cdc_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_fri_cdc_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'fri_cdc_insp', title: 'CONDICIONES — CARGA Y DESCARGA DE CAMIONES RAMPLA',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Carga y Descarga de Camiones Rampla',
        questions: [
          { id: 'cs_fri_cdc_p2', type: 'radio', required: true, label: 'Verificación de condiciones en la CARGA-DESCARGA DE CAMIÓN RAMPLA', subtitle: 'Inspeccione que los equipos cumplan con los siguientes estándares y marque el resultado de su inspección:', conductasList: ['Las puertas de andén se encuentran en buen estado (Sistema retráctil), fácil apertura y cierre con sistema de agarre.','Las puertas de camión se encuentran en buen estado.','La transpaleta eléctrica (Casos donde aplica) se encuentra disponible para realizar la tarea.','La plataforma de conexión entre el andén y camión se encuentra en buen estado.','Los pallets con productos, ingresan con facilidad por el andén.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_cdc_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_cdc_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_cdc_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_cdc_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_fri_cdc_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_cdc_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_cdc_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_cdc_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_cdc_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_fri_cdc_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // FRIGORÍFICO — OPERACIÓN DE EQUIPOS RODANTES
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'fri_eqr_cond', title: 'CONDUCTA — OPERACIÓN DE EQUIPOS RODANTES',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Operación de Equipos Rodantes',
        questions: [
          { id: 'cs_fri_eqr_p1', type: 'radio', required: true, label: 'REGLA N°3 (OP): Opera máquina o equipo cumpliendo con medidas seguridad establecidas', subtitle: 'Observe que los operadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Realizan la Lista de verificación del equipo rodante (Solicitar lista).','Están concentrados y atentos a las condiciones.','Miran en la dirección de la marcha y siempre con visibilidad.','Reducen la velocidad y utilizan bocina en las esquinas, puertas o cerca de personas.','Respetan señalización de tránsito y utilizan espejos panorámicos.','Utilizan cinturón de seguridad (Grúas horquilla).'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_eqr_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Operación de Equipos Rodantes', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_fri_eqr_p1 === 'CON_OBSERVACIONES', options: [{ value: 'no_revisa_preuso', label: 'No revisa equipo, antes de utilizar o no informa fallas (Lista de pre uso equipos rodantes)', severity: 'NORMAL' },{ value: 'opera_sin_autorizacion', label: 'Opera sin estar calificado y autorizado', severity: 'GRAVE' },{ value: 'opera_sin_atencion', label: 'Opera equipo sin prestar atención al trabajo o entorno', severity: 'NORMAL' },{ value: 'no_cumple_instructivo', label: 'No cumple instructivo seguro de equipo rodante', severity: 'NORMAL' },{ value: 'golpea_estructuras', label: 'Golpea pallet contra otra estructura al momento de transportar o almacenar productos', severity: 'NORMAL' },{ value: 'no_cumple_bateria', label: 'No cumple instructivo seguro de cambio de batería', severity: 'NORMAL' },{ value: 'no_avisa_intersecciones', label: 'No advierte su presencia en intersecciones, ingreso o salidas de cámara', severity: 'NORMAL' },{ value: 'sin_gorro_naranja', label: 'No utiliza distintivo asignado a operadores calificados de equipo rodante (Gorro Naranja)', severity: 'NORMAL' }] },
          { id: 'cs_fri_eqr_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_fri_eqr_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_fri_eqr_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_fri_eqr_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_fri_eqr_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_fri_eqr_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_fri_eqr_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_fri_eqr_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'fri_eqr_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_fri_eqr_p1 === 'SIN_OBSERVACIONES' || a.cs_fri_eqr_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_fri_eqr_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_fri_eqr_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'fri_eqr_insp', title: 'CONDICIONES — EQUIPOS RODANTES',
        visibleWhen: (a) => a.cs_area === 'Frigorífico' && a.cs_fri_tema === 'Operación de Equipos Rodantes',
        questions: [
          { id: 'cs_fri_eqr_p2', type: 'radio', required: true, label: 'Verificación de condiciones en los EQUIPOS RODANTES', subtitle: 'Inspeccione que los equipos cumplan con los siguientes estándares y marque el resultado de su inspección:', conductasList: ['Funcionan correctamente.','Tienen las paradas de emergencia, frenos y bocina en buen estado.','Tienen las ruedas y gomas antideslizante en buen estado.','Tienen las luces (Grúas horquilla) y cableado eléctrico en buenas condiciones.','No se observan filtraciones de aceite en sistema Hidráulico.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_fri_eqr_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_eqr_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_eqr_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_eqr_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_fri_eqr_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_eqr_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_eqr_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_eqr_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_fri_eqr_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_fri_eqr_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // OFICINAS ADMINISTRATIVAS — TRÁNSITO DE PERSONAS
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'ofi_tp_cond', title: 'CONDUCTA — TRÁNSITO DE PERSONAS',
        visibleWhen: (a) => a.cs_area === 'Oficinas Administrativas' && a.cs_ofi_tema === 'Tránsito de Personas',
        questions: [
          { id: 'cs_ofi_tp_p1', type: 'radio', required: true, label: 'REGLA N°1 (ADM): Transitar siempre atento a las condiciones del entorno y por zonas habilitadas', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Transitar SIEMPRE por zona habilitada y/o demarcada.','Transita SIEMPRE calmadamente y sin correr por el área.','NUNCA transites por superficies con presencia de agua.','Baja escaleras SIEMPRE utilizando el pasa manos.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_ofi_tp_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Tránsito de Personas', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_ofi_tp_p1 === 'CON_OBSERVACIONES', options: [{ value: 'zona_no_habilitada', label: 'Transita por zona no habilitada y/o demarcada.', severity: 'NORMAL' },{ value: 'transita_corriendo', label: 'Transita corriendo o apresurado por el área.', severity: 'GRAVE' },{ value: 'agua_superficie', label: 'Transita por superficies con presencia de agua.', severity: 'NORMAL' },{ value: 'sin_pasamanos', label: 'Baja o sube escaleras no utilizando el pasa manos.', severity: 'NORMAL' },{ value: 'zonas_no_habilitadas_comunes', label: 'Baja y sube a áreas comunes por zonas no habilitadas', severity: 'NORMAL' }] },
          { id: 'cs_ofi_tp_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_ofi_tp_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_ofi_tp_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_ofi_tp_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_ofi_tp_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_ofi_tp_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_ofi_tp_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_ofi_tp_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'ofi_tp_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_ofi_tp_p1 === 'SIN_OBSERVACIONES' || a.cs_ofi_tp_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_ofi_tp_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_ofi_tp_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'ofi_tp_insp', title: 'CONDICIONES — TRÁNSITO DE PERSONAS',
        visibleWhen: (a) => a.cs_area === 'Oficinas Administrativas' && a.cs_ofi_tema === 'Tránsito de Personas',
        questions: [
          { id: 'cs_ofi_tp_p2', type: 'radio', required: true, label: 'Verificación de condiciones en el TRÁNSITO DE PERSONAS', subtitle: 'Inspeccione que el área de trabajo cumpla con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Los pasillos y vías de tránsito se encuentran despejadas y limpias, sin presencia de agua.','Las estructuras, objetos, materiales o pisos se encuentran en buen estado.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_ofi_tp_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_tp_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_tp_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_tp_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_ofi_tp_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_tp_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_tp_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_tp_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_tp_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_ofi_tp_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // OFICINAS — EQUIPOS O INSTALACIONES ELÉCTRICAS
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'ofi_elec_cond', title: 'CONDUCTA — EQUIPOS O INSTALACIONES ELÉCTRICAS',
        visibleWhen: (a) => a.cs_area === 'Oficinas Administrativas' && a.cs_ofi_tema === 'Utilización de Equipos o Instalaciones Eléctricas',
        questions: [
          { id: 'cs_ofi_elec_p1', type: 'radio', required: true, label: 'REGLA N°2-3 (ADM): Utilizar siempre equipos eléctricos que se encuentren en buen estado y nunca intervenir instalaciones eléctricas', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['NUNCA sobre cargar circuitos eléctricos (Ladrones) u otros elementos generando el sobre consumo.','NUNCA Utilizar equipos eléctricos que se encuentran en mal estado (Cables rotos, equipos no certificados).','NUNCA intervenir instalaciones eléctricas.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_ofi_elec_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Equipos o Instalaciones Eléctricas', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_ofi_elec_p1 === 'CON_OBSERVACIONES', options: [{ value: 'sobrecarga_circuitos', label: 'Sobre carga circuitos eléctricos (Ladrones) u otros elementos generando el sobre consumo.', severity: 'GRAVE' },{ value: 'equipos_mal_estado', label: 'Utiliza equipos eléctricos que se encuentran en mal estado (Cables rotos, equipos no certificados)', severity: 'GRAVE' },{ value: 'interviene_instalaciones', label: 'Interviene instalaciones eléctricas.', severity: 'GRAVE' }] },
          { id: 'cs_ofi_elec_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_ofi_elec_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_ofi_elec_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_ofi_elec_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_ofi_elec_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_ofi_elec_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_ofi_elec_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_ofi_elec_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'ofi_elec_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_ofi_elec_p1 === 'SIN_OBSERVACIONES' || a.cs_ofi_elec_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_ofi_elec_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_ofi_elec_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'ofi_elec_insp', title: 'CONDICIONES — EQUIPOS O INSTALACIONES ELÉCTRICAS',
        visibleWhen: (a) => a.cs_area === 'Oficinas Administrativas' && a.cs_ofi_tema === 'Utilización de Equipos o Instalaciones Eléctricas',
        questions: [
          { id: 'cs_ofi_elec_p2', type: 'radio', required: true, label: 'Verificación de condiciones DE EQUIPOS O INSTALACIONES ELÉCTRICAS', subtitle: 'Inspeccione que el área de trabajo cumpla con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Las instalaciones eléctricas se encuentran en buen estado (cables canalizados y sin daños, enchufes empotrados correctamente).'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_ofi_elec_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_elec_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_elec_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_elec_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_ofi_elec_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_elec_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_elec_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_elec_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_elec_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_ofi_elec_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // OFICINAS — POSTURA DE TRABAJO
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'ofi_post_cond', title: 'CONDUCTA — POSTURA DE TRABAJO ADECUADA',
        visibleWhen: (a) => a.cs_area === 'Oficinas Administrativas' && a.cs_ofi_tema === 'Postura de Trabajo Adecuada y Reporte de Riesgo en Puesto de Trabajo',
        questions: [
          { id: 'cs_ofi_post_p1', type: 'radio', required: true, label: 'REGLA N°4-5 (ADM): Reportar siempre que se observen condiciones inseguras en el puesto de trabajo y Mantener una postura de trabajo adecuada (Espalda derecha, codos y brazos apoyados)', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Regular SIEMPRE tu asiento al iniciar tu jornada de trabajo (ALTURA, APOYA ANTEBRAZOS).','Ordenar su puesto de trabajo antes de comenzar su jornada.','Posicionar el borde superior de su pantalla a la altura de sus ojos.','Reporta condiciones de riesgo en su puesto de trabajo.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_ofi_post_desvio', type: 'checkbox', required: true, label: 'Conductas observadas — Postura de Trabajo', subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.cs_ofi_post_p1 === 'CON_OBSERVACIONES', options: [{ value: 'no_reporta_riesgo', label: 'No reporta condiciones de riesgo en su puesto de trabajo o instalaciones.', severity: 'NORMAL' },{ value: 'no_regula_asiento', label: 'No regula su asiento al iniciar su jornada de trabajo (ALTURA, APOYA ANTEBRAZOS)', severity: 'NORMAL' },{ value: 'pantalla_incorrecta', label: 'No posiciona el borde superior de su pantalla a la altura de sus ojos.', severity: 'NORMAL' },{ value: 'no_ordena_puesto', label: 'No ordena su puesto de trabajo antes de comenzar su jornada.', severity: 'NORMAL' }] },
          { id: 'cs_ofi_post_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_ofi_post_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_ofi_post_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_ofi_post_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_ofi_post_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_ofi_post_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_ofi_post_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_ofi_post_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'ofi_post_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_ofi_post_p1 === 'SIN_OBSERVACIONES' || a.cs_ofi_post_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_ofi_post_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_ofi_post_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'ofi_post_insp', title: 'CONDICIONES — POSTURA DE TRABAJO ADECUADA',
        visibleWhen: (a) => a.cs_area === 'Oficinas Administrativas' && a.cs_ofi_tema === 'Postura de Trabajo Adecuada y Reporte de Riesgo en Puesto de Trabajo',
        questions: [
          { id: 'cs_ofi_post_p2', type: 'radio', required: true, label: 'Verificación de condiciones en la POSTURA DE TRABAJO ADECUADA', subtitle: 'Inspeccione que el área de trabajo cumpla con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Las instalaciones cumplen con el mobiliario adecuado para que los trabajadores puedan tener una postura adecuada: Silla regulable en altura y apoya brazos, Pantalla regulable en altura (de ser necesario), Espacio suficiente para todos los artículos que utiliza.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_ofi_post_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_post_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_post_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_post_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_ofi_post_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_post_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_post_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_post_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_ofi_post_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_ofi_post_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // SALA DE MÁQUINAS — Solo condiciones
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'maq_insp', title: 'CONDICIONES — SALAS DE MÁQUINAS',
        visibleWhen: (a) => a.cs_area === 'Sala de Máquinas',
        questions: [
          { id: 'cs_maq_p2', type: 'radio', required: true, label: 'Verificación de condiciones en SALAS DE MÁQUINAS', subtitle: 'Inspeccione que la sala cumpla con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Está cerrado con candado u otro sistema.','Está señalizado como área restringida.','Están los tableros cerrados.','Están los tableros señalizados con peligro de electricidad.','Están los cables canalizados y en buen estado.','Está libre de objetos que no deben estar (basura, trapos, papeles, objetos, material POP, archivos, cajas, entre otros).','Existe casilla con EPP correspondientes (Guantes dieléctricos, Lentes de seguridad, Fonos o tapones auditivos, Casco de seguridad).','Existe bitácora de ingreso, con recomendaciones de seguridad.','Existen hojas de datos de seguridad y procedimiento en caso de fuga.','Existe extintor operativo y señalizado en el área.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_maq_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_maq_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_maq_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_maq_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_maq_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_maq_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_maq_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_maq_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_maq_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_maq_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // SALA DE BATERÍAS — Conducta + Condiciones
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'bat_cond', title: 'CONDUCTA — SALA CARGA DE BATERÍAS',
        visibleWhen: (a) => a.cs_area === 'Sala de Baterías',
        questions: [
          { id: 'cs_bat_p1', type: 'radio', required: true, label: 'Verificación de conductas en SALA CARGA DE BATERÍAS', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Operador de equipo rodante cumple con Instructivo de Seguridad para cambio de batería.','Operador utiliza todos sus EPP al momento de realizar el cambio de batería.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_bat_desvio', type: 'checkbox', required: true, label: 'Conductas observadas en SALA CARGA DE BATERÍAS', subtitle: 'Marque una o más conductas observadas.', visibleWhen: (a) => a.cs_bat_p1 === 'CON_OBSERVACIONES', options: [{ value: 'no_cumple_instructivo', label: 'Operador de equipo rodante no cumple con Instructivo de Seguridad para cambio de batería', severity: 'NORMAL' },{ value: 'no_utiliza_epp', label: 'Operador no utiliza todos sus EPP al momento de realizar el cambio de batería.', severity: 'NORMAL' }] },
          { id: 'cs_bat_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_bat_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_bat_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_bat_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_bat_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_bat_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_bat_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_bat_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'bat_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_bat_p1 === 'SIN_OBSERVACIONES' || a.cs_bat_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_bat_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_bat_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'bat_insp', title: 'CONDICIONES — SALA CARGA DE BATERÍAS',
        visibleWhen: (a) => a.cs_area === 'Sala de Baterías',
        questions: [
          { id: 'cs_bat_p2', type: 'radio', required: true, label: 'Verificación de condiciones en SALA CARGA DE BATERÍAS', subtitle: 'Inspeccione que la sala cumpla con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Está cerrado con candado u otro sistema.','Está señalizado como área restringida.','Existen señaléticas con alusión a peligros de electricidad y corrosivo.','Existe EPP para cambios de baterías y señalética que obligue su uso (Guantes de protección mecánica (SECOS), lentes de seguridad).','Están todas las conexiones eléctricas canalizadas y en buen estado.','Está libre de objetos que no deben estar (Basura, trapos, material POP, archivos, cajas, entre otros).','Existe instructivo de carga de batería, en buen estado y en español.','Existen ganchos para colgar las conexiones de los cargadores.','Los carros y rodillos para el cambio de batería están en buen estado.','Cuenta con sistema de contención en caso de derrame.','Existe extintor operativo y señalizado en el área.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_bat_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_bat_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_bat_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_bat_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_bat_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_bat_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_bat_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_bat_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_bat_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_bat_p2 === 'CON_OBSERVACIONES' },
        ],
      },

      // ══════════════════════════════════════════════════════════════════════
      // ÁREAS COMUNES — Conducta + Condiciones
      // ══════════════════════════════════════════════════════════════════════
      {
        id: 'com_cond', title: 'CONDUCTA — ÁREAS COMUNES',
        visibleWhen: (a) => a.cs_area === 'Áreas Comunes',
        questions: [
          { id: 'cs_com_p1', type: 'radio', required: true, label: 'Verificación de conductas en ÁREAS COMUNES', subtitle: 'Observe que los trabajadores cumplan con las siguientes conductas y marque el resultado de su observación:', conductasList: ['Conducción dentro del límite de velocidad dentro de las instalaciones (10km/h).','Transita por áreas demarcadas y señalizadas.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_com_desvio', type: 'checkbox', required: true, label: 'Conductas observadas en ÁREAS COMUNES', subtitle: 'Marque una o más conductas observadas.', visibleWhen: (a) => a.cs_com_p1 === 'CON_OBSERVACIONES', options: [{ value: 'exceso_velocidad', label: 'Conducción sobre el límite de velocidad dentro de las instalaciones (10 km/h).', severity: 'NORMAL' },{ value: 'no_transita_demarcada', label: 'No transita por áreas demarcadas y señalizadas.', severity: 'NORMAL' }] },
          { id: 'cs_com_carta', type: 'radio', required: true, label: '¿La conducta insegura observada amerita una Carta de Amonestación escrita?', visibleWhen: (a) => a.cs_com_p1 === 'CON_OBSERVACIONES', options: [{ value: 'NO', label: 'NO' },{ value: 'SI', label: 'SI' }] },
          { id: 'cs_com_obs', type: 'text', required: true, label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación correctiva entregada', visibleWhen: (a) => a.cs_com_p1 === 'CON_OBSERVACIONES' },          { id: 'cs_com_retro_pos_com', type: 'yesno', required: true, disableNA: true, label: '¿Se comunicó el resultado de la retroalimentación positiva al colaborador?', visibleWhen: (a) => a.cs_com_p1 === 'SIN_OBSERVACIONES' },
          { id: 'cs_com_retro_pos_desc', type: 'text', required: true, label: 'Describa la retroalimentación POSITIVA realizada al colaborador:', placeholder: 'Escriba aquí la retroalimentación positiva entregada', visibleWhen: (a) => a.cs_com_retro_pos_com === 'si' },
        ],
      },
      {
        id: 'com_cierre',
        title: 'CIERRE DE OBSERVACIÓN DE CONDUCTA',
        visibleWhen: (a) => a.cs_com_p1 === 'SIN_OBSERVACIONES' || a.cs_com_p1 === 'CON_OBSERVACIONES',
        questions: [
          { id: 'cs_com_cierre_nombre', type: 'text', required: true, label: 'Nombre y Apellido del Colaborador Observado:', placeholder: 'Escriba el nombre completo del colaborador', inputType: 'single-line' },
          { id: 'cs_com_cierre_rut', type: 'rut', required: true, label: 'RUT del colaborador observado', placeholder: 'Ej: 12.345.678-9' },
        ],
      },
      {
        id: 'com_insp', title: 'CONDICIONES — ÁREAS COMUNES',
        visibleWhen: (a) => a.cs_area === 'Áreas Comunes',
        questions: [
          { id: 'cs_com_p2', type: 'radio', required: true, label: 'Verificación de condiciones en ÁREAS COMUNES', subtitle: 'Inspeccione que las áreas cumplan con los siguientes estándares y marque el resultado de su observación:', conductasList: ['Las Zonas de seguridad se encuentran demarcadas, señaladas y son de conocimiento de todo el personal.','Se encuentran señalizado el límite máximo de velocidad (10km/h).','Se encuentran demarcadas y visibles las vías de tránsito peatonal.','Se encuentran señalizadas y visibles las vías de evacuación.','Las zonas de tránsito peatonal se encuentran en buen estado (Sin desniveles o imperfecciones).','Los camarines del personal, se encuentran limpios y con pisos antideslizantes.','Todas las escaleras o desniveles poseen pasa manos o barandas.','La zona de almacenamiento de pallets se encuentra ordenada y con la altura de apilamiento que corresponde.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'cs_com_cond_lugar', type: 'text', required: true, label: 'Lugar específico donde detectó la condición insegura', placeholder: 'Ej: Pasillo norte, andén 2, zona de carga...', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_com_cond_desc', type: 'text', required: true, label: 'Describa la condición insegura detectada', placeholder: 'Descripción detallada de lo observado', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_com_cond_foto', type: 'photo', required: true, label: '📷 FOTOGRAFÍA DE LA CONDICIÓN INSEGURA', subtitle: 'Evite fotografiar directamente el rostro de personal Agrosuper', maxPhotos: 1, visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_com_cond_incidentes', type: 'checkbox', required: true, label: 'Incidentes que podría ocasionar la condición insegura detectada', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES', options: [{ value: 'atrapamiento', label: 'Atrapamientos' },{ value: 'atricion', label: 'Atriciones' },{ value: 'atropello', label: 'Atropellos' },{ value: 'caida_altura', label: 'Caídas a diferente nivel (Desde Altura sobre 1,8 metros)' },{ value: 'caida_piso', label: 'Caídas al mismo nivel (Nivel de Piso)' },{ value: 'choque', label: 'Choques' },{ value: 'contacto_fuego', label: 'Contactos con fuego u objetos calientes' },{ value: 'contacto_cortante', label: 'Contactos con objetos cortantes y/o punzantes' },{ value: 'contacto_quimico', label: 'Contactos con sustancias químicas' },{ value: 'contacto_electrico', label: 'Contactos eléctricos' },{ value: 'dolencia', label: 'Dolencias' },{ value: 'golpe', label: 'Golpes' },{ value: 'proyeccion', label: 'Proyección de partículas solidas y/o líquidas' },{ value: 'sobretension', label: 'Sobre Tensión Física (Torsión de tobillo)' }] },
          { id: 'cs_com_cond_medida', type: 'text', required: true, label: 'Medida de control a implementar', placeholder: 'Describa la acción correctiva que se debe ejecutar', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_com_cond_area_resp', type: 'text', required: true, label: 'Área responsable de ejecutar la medida de control', placeholder: 'Ej: Mantención, Operaciones, SSO...', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_com_cond_nombre_resp', type: 'text', required: true, label: 'Nombre del responsable de gestionar la medida de control', placeholder: 'Nombre completo', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_com_cond_correo_resp', type: 'text', required: true, label: 'Correo electrónico (Agrosuper) del responsable', placeholder: 'nombre@agrosuper.com', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
          { id: 'cs_com_cond_fecha', type: 'text', inputType: 'date', required: true, label: 'Fecha de compromiso de ejecución de la medida de control', visibleWhen: (a) => a.cs_com_p2 === 'CON_OBSERVACIONES' },
        ],
      },

    ],
  },

  // ── 3. INSPECCIÓN SIMPLE ─────────────────────────────────────────────────
  'inspeccion-simple': {
    id: 'inspeccion-simple',
    title: 'Inspección Simple',
    description: 'Revisión de equipos y espacios',
    sections: [
      {
        id: 's1',
        title: 'Elemento Inspeccionado',
        questions: [
          { id: 'is_1', type: 'select', label: 'Tipo de elemento', required: true, options: ['Equipo mecánico', 'Equipo eléctrico', 'Vehículo / Grúa', 'Instalación civil', 'Área de trabajo', 'Herramienta manual'] },
          { id: 'is_2', type: 'text',   label: 'Identificación del elemento inspeccionado', required: true, placeholder: 'Ej: Grúa horquilla N°3, Tablero eléctrico bodega A…' },
        ],
      },
      {
        id: 's2',
        title: 'Estado y Condiciones',
        questions: [
          { id: 'is_3', type: 'yesno', label: 'El elemento se encuentra en buen estado general', required: true },
          { id: 'is_4', type: 'yesno', label: 'Cuenta con los sistemas de seguridad operativos', required: true },
          { id: 'is_5', type: 'yesno', label: 'Requiere mantenimiento o reparación', required: true },
          { id: 'is_6', type: 'yesno', label: 'Existe riesgo inmediato que impide su uso', required: true },
        ],
      },
      {
        id: 's3',
        title: 'Evaluación y Acciones',
        questions: [
          { id: 'is_7', type: 'rating', label: 'Calificación del estado del elemento', required: true },
          { id: 'is_8', type: 'text',   label: 'Descripción del estado y acción correctiva requerida', required: false, placeholder: 'Detalla el estado encontrado y las acciones a tomar…' },
          { id: 'is_photo', type: 'photo', label: 'Evidencia fotográfica de condiciones detectadas', required: false, maxPhotos: 3 },
        ],
      },
    ],
  },

  // ── 4. DIFUSIONES SSO ────────────────────────────────────────────────────
  'difusiones-sso': {
    id: 'difusiones-sso',
    title: 'Difusiones SSO',
    description: 'Registro de charlas y capacitaciones',
    sections: [
      {
        id: 's1',
        title: 'Información de la Actividad',
        questions: [
          { id: 'ds_1', type: 'text',   label: 'Tema de la difusión', required: true, placeholder: 'Ej: Uso correcto de EPP, Manejo defensivo…' },
          { id: 'ds_2', type: 'select', label: 'Tipo de actividad', required: true, options: ['Charla de 5 minutos', 'Capacitación', 'Inducción', 'Simulacro', 'Taller práctico'] },
          { id: 'ds_3', type: 'text',   label: 'Número de participantes', required: true, placeholder: 'Ej: 12', inputType: 'number' },
        ],
      },
      {
        id: 's2',
        title: 'Desarrollo de la Actividad',
        questions: [
          { id: 'ds_4', type: 'yesno', label: 'Se utilizó material audiovisual o impreso de apoyo', required: true },
          { id: 'ds_5', type: 'yesno', label: 'Se realizó evaluación de comprensión al finalizar', required: true },
          { id: 'ds_6', type: 'yesno', label: 'Los participantes mostraron interés y participación activa', required: true },
          { id: 'ds_7', type: 'yesno', label: 'Se firmó registro de asistencia', required: true },
        ],
      },
      {
        id: 's3',
        title: 'Evaluación',
        questions: [
          { id: 'ds_8', type: 'rating', label: 'Calificación general de la actividad', required: true },
          { id: 'ds_9', type: 'text',   label: 'Observaciones y compromisos de los participantes', required: false, placeholder: 'Anota compromisos, preguntas relevantes u observaciones…' },
        ],
      },
    ],
  },

  // ── 5. OBSERVACIÓN CONDUCTUAL ────────────────────────────────────────────
  'observacion-conductual': {
    id: 'observacion-conductual',
    title: 'Observación Conductual',
    description: 'Registro de comportamientos seguros e inseguros',
    sections: [
      {
        id: 's1',
        title: 'Contexto de la Observación',
        questions: [
          { id: 'oc_1', type: 'select', label: 'Tipo de conducta observada', required: true, options: ['Segura', 'Insegura', 'Mixta (segura e insegura)'] },
          { id: 'oc_2', type: 'select', label: 'Actividad observada', required: true, options: ['Conducción / Manejo', 'Carga y descarga', 'Atención al cliente', 'Uso de equipos', 'Desplazamiento a pie'] },
        ],
      },
      {
        id: 's2',
        title: 'Conductas Evaluadas',
        questions: [
          { id: 'oc_3', type: 'yesno', label: 'El trabajador usa cinturón de seguridad al conducir', required: false },
          { id: 'oc_4', type: 'yesno', label: 'El trabajador respeta las normas de tránsito', required: false },
          { id: 'oc_5', type: 'yesno', label: 'El trabajador utiliza el EPP correspondiente a su tarea', required: true },
          { id: 'oc_6', type: 'yesno', label: 'El trabajador mantiene distancia de seguridad adecuada', required: false },
          { id: 'oc_7', type: 'yesno', label: 'El trabajador opera equipos de forma segura', required: false },
        ],
      },
      {
        id: 's3',
        title: 'Retroalimentación',
        questions: [
          { id: 'oc_8',  type: 'yesno',  label: 'Se realizó retroalimentación inmediata al trabajador', required: true },
          { id: 'oc_9',  type: 'yesno',  label: 'El trabajador aceptó y valoró la retroalimentación', required: false },
          { id: 'oc_10', type: 'rating', label: 'Calificación general de la conducta observada', required: true },
          { id: 'oc_11', type: 'text',   label: 'Descripción de la conducta y compromisos adquiridos', required: false, placeholder: 'Describe la situación y los compromisos del trabajador…' },
        ],
      },
    ],
  },

  // ── 6. INSPECCIÓN PLANIFICADA ────────────────────────────────────────────
  'inspeccion-planificada': {
    id: 'inspeccion-planificada',
    title: 'Inspección Planificada',
    description: 'Inspección programada de condiciones y riesgos',
    sections: [
      {
        id: 's1',
        title: 'Vehículo',
        questions: [
          { id: 'ip_1', type: 'select', label: 'Tipo de vehículo', required: true, options: ['Auto', 'Camioneta', 'Furgón', 'Camión liviano', 'Camión pesado'] },
          { id: 'ip_2', type: 'yesno', label: 'El vehículo tiene revisión técnica vigente', required: true },
          { id: 'ip_3', type: 'yesno', label: 'El seguro obligatorio (SOAP) está vigente', required: true },
          { id: 'ip_4', type: 'rating', label: 'Estado general del vehículo (carrocería, neumáticos, vidrios)', required: true },
        ],
      },
      {
        id: 's2',
        title: 'Equipamiento de Seguridad',
        questions: [
          { id: 'ip_5', type: 'yesno', label: 'El vehículo cuenta con extintor vigente y accesible', required: true },
          { id: 'ip_6', type: 'yesno', label: 'El botiquín está completo y con fecha vigente', required: true },
          { id: 'ip_7', type: 'yesno', label: 'Los triángulos de emergencia están presentes', required: true },
          { id: 'ip_8', type: 'yesno', label: 'El chaleco reflectante está disponible en el vehículo', required: true },
        ],
      },
      {
        id: 's3',
        title: 'Condiciones del Conductor',
        questions: [
          { id: 'ip_9',  type: 'yesno', label: 'El conductor porta licencia de conducir vigente', required: true },
          { id: 'ip_10', type: 'yesno', label: 'El conductor se encuentra en condiciones físicas y mentales aptas', required: true },
          { id: 'ip_11', type: 'yesno', label: 'El conductor conoce la ruta y el procedimiento de emergencia', required: true },
        ],
      },
      {
        id: 's4',
        title: 'Observaciones y Plan de Acción',
        questions: [
          { id: 'ip_12', type: 'text', label: 'Observaciones, incumplimientos detectados y plan de acción', required: false, placeholder: 'Indica los hallazgos y compromisos de corrección con fecha…' },
        ],
      },
    ],
  },

  // ── 7. PAUTA DE VERIFICACIÓN REGLAS DE ORO ───────────────────────────────
  'pauta-verificacion-reglas-oro': {
    id: 'pauta-verificacion-reglas-oro',
    title: 'Reglas de Oro',
    description: 'Verificación cumplimiento Reglas de Oro',
    metadata: { template: 'reglas-oro' },
    // Q16 eliminado permanentemente — también se filtra del override aunque el sync de nube lo traiga de vuelta
    permanentlyRemovedQuestions: ['Q16'],
    // 'cierre' fue dividida en 3 secciones (retro_positiva, retro_correctiva, cierre_final).
    // El override puede tener la sección antigua 'cierre' (guardada antes del cambio) — se ignora.
    supersededSections: ['cierre'],
    sections: [

      // ── S1: DATOS GENERALES ───────────────────────────────────────────────
      {
        id: 'dg', title: 'DATOS GENERALES',
        questions: [
          { id: 'Q1',  type: 'select', label: 'Instalación donde se realizará la Verificación de Reglas Oro', required: true, placeholder: 'Selecciona la instalación', options: ['Arica','Iquique','Calama','Antofagasta','Copiapó','Coquimbo','Hijuelas','San Antonio','Viña del Mar','Miraflores','Huechuraba','Lo Espejo','Rancagua','Curicó','Talca','Chillán','Los Ángeles','Concepción','Temuco','Valdivia','Osorno','Puerto Montt','Castro','Coyhaique','Punta Arenas','San Felipe','Oficina Central','Oficina Vespucio'] },
        ],
      },

      // ── S2: CONFIGURACIÓN ─────────────────────────────────────────────────
      {
        id: 'cfg', title: 'CONFIGURACIÓN',
        questions: [
          { id: 'Q18', type: 'select', label: 'Área en la que verificará el cumplimiento de las Reglas de Oro', required: true, options: ['Área Administrativa Sucursal','Área Operaciones Sucursal'] },
          { id: 'Q19', type: 'select', label: 'Turno observado', required: true, visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal', options: ['Mañana','Tarde','Noche'] },
          { id: 'Q20', type: 'select', label: 'Regla de Oro que Verificará — OPERACIONES', required: true,
            placeholder: 'Selecciona la Regla de Oro',
            visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal',
            options: ['N°1 Elementos de Protección Personal (OP)','N°2 Transito Interior Frigorífico (OP)','N°3 Operación de Equipo Rodante (OP)','N°4 Almacenamiento en Altura (OP)','N°5 Carga y Descarga de Camiones (OP)','N°6 Manejo Manual de Cargas (OP)','N°7 Trabajo Responsable, sin hacer Bromas o Acciones Inseguras (OP)','N°8 Mantener un correcto Orden y Aseo en las Instalaciones (OP)','N°9 No interactuar ni intervenir con equipos en movimiento ni automatizados (OP)','N°10 Informar de forma inmediata la ocurrencia de un incidente o accidente (OP)'] },
          { id: 'Q21', type: 'select', label: 'Regla de Oro que Verificará — ADMINISTRACIÓN', required: true,
            placeholder: 'Selecciona la Regla de Oro',
            visibleWhen: (a) => a.Q18 === 'Área Administrativa Sucursal',
            options: ['N°1 Transitar siempre atento a las condiciones del entorno y por zonas habilitadas (ADM)','N°2 Utiliza siempre equipos eléctricos que se encuentren en buen estado (ADM)','N°3 Nunca intervenir instalaciones eléctricas (ADM)','N°4 Reportar siempre que se observen condiciones inseguras en el puesto de trabajo (ADM)','N°5 Mantener una postura de trabajo adecuada (ADM)'] },
        ],
      },

      // ── S3-S9: REGLAS OPERACIONES ─────────────────────────────────────────
      {
        id: 'op1', title: 'VERIFICACIÓN — REGLA N°1 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°1 Elementos de Protección Personal (OP)',
        questions: [
          { id: 'Q22', type: 'radio', required: true, label: 'REGLA N°1: Revisa y utiliza correctamente todos los elementos de protección personal (EPP)', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado utiliza todos sus EPP.','El colaborador observado utiliza sus EPP de forma correcta.','El colaborador observado informa cuando su EPP están en malas condiciones o cuando no cuenta con él.','El colaborador observado no utiliza EPP que no corresponde o que no esté autorizado.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q23', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°1', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q22 === 'CON_OBSERVACIONES', options: [{ value: 'no_utiliza_epp', label: 'No utiliza EPP', severity: 'GRAVE' },{ value: 'epp_incorrecto', label: 'Utiliza su EPP de forma incorrecta', severity: 'NORMAL' },{ value: 'no_informa_deterioro', label: 'No informa cuando EPP está en malas condiciones o cuando no lo posee para trabajar', severity: 'NORMAL' },{ value: 'epp_no_autorizado', label: 'Utiliza EPP que no corresponde o no está autorizado', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'op2', title: 'VERIFICACIÓN — REGLA N°2 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°2 Transito Interior Frigorífico (OP)',
        questions: [
          { id: 'Q24', type: 'radio', required: true, label: 'REGLA N°2: Transita alerta a las condiciones del entorno y por zonas habilitadas', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado transita siempre por zonas habilitadas y/o demarcadas.','El colaborador observado nunca transita corriendo o apresurado por el área de trabajo.','El colaborador observado nunca transita por superficies con presencia de hielo o líquido.','El colaborador observado nunca transita o trabaja bajo carga que se encuentra almacenada en altura.','El colaborador observado nunca transita o trabaja sobre pallet de producto a nivel de piso.','El colaborador observado no mantiene distancia con la operación de equipos rodantes.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q25', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°2', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q24 === 'CON_OBSERVACIONES', options: [{ value: 'zona_no_habilitada', label: 'Transita por zona no habilitada y/o demarcada', severity: 'NORMAL' },{ value: 'transita_corriendo', label: 'Transita corriendo o apresurado por el área', severity: 'NORMAL' },{ value: 'hielo_liquido', label: 'Transita por superficies con presencia de hielo o líquido', severity: 'NORMAL' },{ value: 'bajo_carga_altura', label: 'Transita o trabaja bajo carga almacenada en altura', severity: 'GRAVE' },{ value: 'sobre_pallet_piso', label: 'Transita o trabaja sobre pallet de producto a nivel de piso', severity: 'NORMAL' },{ value: 'sin_distancia_equipos', label: 'No mantiene distancia con operación de equipos rodantes', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'op3', title: 'VERIFICACIÓN — REGLA N°3 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°3 Operación de Equipo Rodante (OP)',
        questions: [
          { id: 'Q26', type: 'radio', required: true, label: 'REGLA N°3: Opera máquina o equipo cumpliendo con medidas de seguridad establecidas', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado revisa su equipo antes de utilizarlo (lista de verificación) e informa fallas.','El colaborador observado se encuentra calificado y autorizado para la operación del equipo.','El colaborador observado opera el equipo prestando atención en la tarea y en el entorno.','El colaborador observado cumple con lo indicado en el instructivo seguro de equipo rodante.','El colaborador observado no golpea los pallets contra estructuras al transportar o almacenar.','El colaborador observado cumple con lo indicado en el instructivo seguro para cambio de batería.','El colaborador observado advierte su presencia en intersecciones, ingresos y salidas de cámara.','El colaborador observado utiliza su distintivo asignado (Gorro Naranja).'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q27', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°3', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q26 === 'CON_OBSERVACIONES', options: [{ value: 'no_revisa_preuso', label: 'No revisa equipo antes de utilizar o no informa fallas (pre-uso)', severity: 'NORMAL' },{ value: 'opera_sin_autorizacion', label: 'Opera sin estar calificado y autorizado', severity: 'GRAVE' },{ value: 'opera_sin_atencion', label: 'Opera equipo sin prestar atención al trabajo o entorno', severity: 'NORMAL' },{ value: 'no_cumple_instructivo', label: 'No cumple instructivo seguro de equipo rodante', severity: 'NORMAL' },{ value: 'golpea_estructuras', label: 'Golpea pallet contra otra estructura al transportar o almacenar', severity: 'NORMAL' },{ value: 'no_cumple_bateria', label: 'No cumple instructivo seguro de cambio de batería', severity: 'NORMAL' },{ value: 'no_avisa_intersecciones', label: 'No advierte su presencia en intersecciones, ingreso o salidas de cámara', severity: 'NORMAL' },{ value: 'sin_gorro_naranja', label: 'No utiliza distintivo asignado a operadores calificados (Gorro Naranja)', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'op4', title: 'VERIFICACIÓN — REGLA N°4 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°4 Almacenamiento en Altura (OP)',
        questions: [
          { id: 'Q28', type: 'radio', required: true, label: 'REGLA N°4: Almacena productos en altura cumpliendo con medidas de seguridad establecidas', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado conduce el equipo rodante evitando transportar carga en altura durante la maniobra.','El colaborador observado almacena pallet de producto en altura con film de sujeción.','El colaborador observado informa sobre daños en la estructura de los racks.','El colaborador observado almacena en altura pallets en buen estado (evitando pallets rotos).','El colaborador observado informa sobre presencia de pallets rotos en altura.','El colaborador observado cumple con indicaciones de los POEV y LUP asociados.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q29', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°4', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q28 === 'CON_OBSERVACIONES', options: [{ value: 'conduce_carga_altura', label: 'Conduce el equipo rodante transportando carga en altura', severity: 'GRAVE' },{ value: 'sin_film_sujecion', label: 'Almacena pallets en altura sin film de sujeción', severity: 'GRAVE' },{ value: 'no_informa_dano_rack', label: 'No informa daño provocado a la estructura de rack', severity: 'NORMAL' },{ value: 'almacena_pallets_rotos', label: 'Almacena en altura pallets rotos con productos', severity: 'GRAVE' },{ value: 'pallets_rotos_altura', label: 'Presencia de pallets rotos apilados en altura', severity: 'NORMAL' },{ value: 'no_cumple_poev_lup', label: 'No cumple con indicaciones de POEV y LUP asociados', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'op5', title: 'VERIFICACIÓN — REGLA N°5 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°5 Carga y Descarga de Camiones (OP)',
        questions: [
          { id: 'Q30', type: 'radio', required: true, label: 'REGLA N°5: Realizar carga y descarga de camiones cumpliendo con medidas de seguridad establecidas', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado evita ingresar a descargar o cargar mientras otro colaborador está al interior del camión.','El colaborador observado abre la cortina de andén después de finalizada la maniobra de posicionamiento.','El colaborador observado informa desperfectos en cortina y/o plataforma de andén.','El colaborador observado verifica el correcto acople del camión/andén antes de comenzar.','El colaborador observado prioriza transpaleta eléctrica para descargar camión rampla.','El colaborador observado, sin equipo eléctrico, es apoyado por otro colaborador en la descarga.','El colaborador observado realiza descarga controlando velocidad, espacio y ruta de desplazamiento.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q31', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°5', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q30 === 'CON_OBSERVACIONES', options: [{ value: 'ingresa_con_otro_camion', label: 'Ingresa a descargar mientras otro equipo opera al interior del camión', severity: 'GRAVE' },{ value: 'abre_cortina_antes', label: 'Abre cortina de andén previo a la finalización del posicionamiento del camión', severity: 'NORMAL' },{ value: 'no_informa_dano_anden', label: 'No informa desperfectos o daños en cortina o plataforma de andén', severity: 'NORMAL' },{ value: 'no_verifica_acople', label: 'No verifica el correcto acople camión/andén antes de comenzar', severity: 'NORMAL' },{ value: 'no_prioriza_electrico', label: 'No prioriza la utilización de equipo rodante eléctrico sobre el manual', severity: 'NORMAL' },{ value: 'descarga_manual_sin_ayuda', label: 'Realiza descarga de camión rampla con transpaleta manual sin apoyo', severity: 'NORMAL' },{ value: 'descarga_sin_control', label: 'Realiza descarga sin controlar velocidad, espacio y ruta de desplazamiento', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'op6', title: 'VERIFICACIÓN — REGLA N°6 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°6 Manejo Manual de Cargas (OP)',
        questions: [
          { id: 'Q32', type: 'radio', required: true, label: 'REGLA N°6: Aplica técnicas seguras de manejo manual de carga y utiliza ayudas mecánicas', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado aplica técnicas correctas para el manejo manual de cargas, objetos y cajas.','El colaborador observado utiliza ayudas mecánicas para la manipulación de cargas.','El colaborador observado evita tomar cajas de producto desde los zunchos.','El colaborador observado deposita productos y herramientas de forma adecuada.','El colaborador observado evita lanzar cajas o pallets al suelo.','El colaborador observado evita arrastrar pallets o transportarlos sobre los hombros.','El colaborador observado no transporta más de un producto de forma manual.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q33', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°6', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q32 === 'CON_OBSERVACIONES', options: [{ value: 'tecnica_incorrecta', label: 'No aplica técnica correcta de manejo manual de carga', severity: 'NORMAL' },{ value: 'sin_ayuda_mecanica', label: 'No utiliza ayuda mecánica para la manipulación de carga', severity: 'NORMAL' },{ value: 'toma_por_zunchos', label: 'Toma caja con productos desde los zunchos', severity: 'NORMAL' },{ value: 'deposita_inadecuado', label: 'Deposita productos, objetos o herramientas de forma inadecuada', severity: 'NORMAL' },{ value: 'lanza_caja_pallet', label: 'Lanza caja con producto al pallet o lanza pallet al suelo', severity: 'GRAVE' },{ value: 'transporta_hombros', label: 'Transporta pallets sobre los hombros', severity: 'GRAVE' },{ value: 'transporta_mas_uno', label: 'Transporta más de un producto de forma manual', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'op7', title: 'VERIFICACIÓN — REGLA N°7 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°7 Trabajo Responsable, sin hacer Bromas o Acciones Inseguras (OP)',
        questions: [
          { id: 'Q34', type: 'radio', required: true, label: 'REGLA N°7: Trabaja de manera responsable, sin hacer bromas o acciones inseguras', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado no realiza bromas con o hacia sus compañeros de trabajo.','El colaborador observado utiliza sus equipos de trabajo de forma adecuada.','El colaborador observado no lanza cajas, herramientas u objetos a los compañeros.','El colaborador observado posiciona los pallets de forma adecuada.','El colaborador observado no utiliza pallets en mal estado.','El colaborador observado no obstruye pasillos, extintores, salidas o sistemas de emergencia.','El colaborador observado no retira manualmente cajas apiladas en altura en los racks.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q35', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°7', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q34 === 'CON_OBSERVACIONES', options: [{ value: 'realiza_bromas', label: 'Realiza broma al compañero o con el compañero', severity: 'GRAVE' },{ value: 'equipos_inadecuados', label: 'Utiliza equipos de trabajo de forma inadecuada', severity: 'NORMAL' },{ value: 'lanza_objetos_companero', label: 'Lanza producto, caja, objeto o herramienta al compañero', severity: 'GRAVE' },{ value: 'pallet_inadecuado', label: 'Posiciona pallet de forma inadecuada', severity: 'NORMAL' },{ value: 'pallet_mal_estado', label: 'Utiliza pallet en mal estado', severity: 'GRAVE' },{ value: 'obstruye_pasillo', label: 'Obstruye pasillo, extintor, salidas o sistemas de emergencia', severity: 'NORMAL' },{ value: 'retira_cajas_altura', label: 'Retira manualmente cajas apiladas en altura en racks', severity: 'GRAVE' }] },
        ],
      },

      // ── S10-S12: REGLAS OPERACIONES 8-10 ─────────────────────────────────
      {
        id: 'op8', title: 'VERIFICACIÓN — REGLA N°8 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°8 Mantener un correcto Orden y Aseo en las Instalaciones (OP)',
        questions: [
          { id: 'Q54', type: 'radio', required: true, label: 'REGLA N°8: Mantiene un correcto Orden y Aseo en las Instalaciones', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado recoge zunchos que se encuentran en el piso al interior del frigorífico.','El colaborador observado recoge film que se encuentre en el piso del frigorífico.','El colaborador observado recoge restos de pallets que se encuentren en la instalación.','El colaborador observado informa presencia de hielo o líquidos en el piso del frigorífico.','El colaborador observado posiciona equipos y/o herramientas en lugares asignados.','El colaborador observado posiciona pallets respetando el layout definido, sin obstruir pasillos de tránsito.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q55', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°8', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q54 === 'CON_OBSERVACIONES', options: [{ value: 'no_recoge_zunchos', label: 'No recoge zunchos que se encuentran en el piso al interior del frigorífico', severity: 'NORMAL' },{ value: 'no_recoge_film', label: 'No recoge film que se encuentre en el piso del frigorífico', severity: 'NORMAL' },{ value: 'no_recoge_restos_pallets', label: 'No recoge restos de pallets que se encuentren en la instalación', severity: 'NORMAL' },{ value: 'no_informa_hielo_liquido', label: 'No informa presencia de hielo o líquidos en el piso del frigorífico', severity: 'NORMAL' },{ value: 'equipo_fuera_lugar', label: 'No posiciona equipos y/o herramientas en lugares asignados', severity: 'NORMAL' },{ value: 'pallet_obstruye_pasillo', label: 'Posiciona pallet obstruyendo pasillos de tránsito, no respetando layout definido', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'op9', title: 'VERIFICACIÓN — REGLA N°9 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°9 No interactuar ni intervenir con equipos en movimiento ni automatizados (OP)',
        questions: [
          { id: 'Q56', type: 'radio', required: true, label: 'REGLA N°9: No interactúa ni interviene con equipos en movimiento ni automatizados', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado no interviene tocando partes móviles de máquinas o equipos.','El colaborador observado no interviene en equipos automatizados sin asegurar su detención previa.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q57', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°9', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q56 === 'CON_OBSERVACIONES', options: [{ value: 'toca_partes_moviles', label: 'Interviene tocando partes móviles de máquinas o equipos', severity: 'GRAVE' },{ value: 'interviene_equipo_automatizado', label: 'Interviene equipo automatizado sin asegurar su detención', severity: 'GRAVE' }] },
        ],
      },
      {
        id: 'op10', title: 'VERIFICACIÓN — REGLA N°10 OP',
        visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal' && a.Q20 === 'N°10 Informar de forma inmediata la ocurrencia de un incidente o accidente (OP)',
        questions: [
          { id: 'Q58', type: 'radio', required: true, label: 'REGLA N°10: Informa de forma inmediata la ocurrencia de un incidente o accidente, sin importar su gravedad', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado informa de un incidente o accidente ocurrido a su jefatura de forma inmediata.','La jefatura que toma conocimiento del accidente informa de forma inmediata a líderes de sucursal.','Los líderes de sucursal informan de accidente ocurrido de forma inmediata al equipo de Salud y Seguridad.','El colaborador que sufre accidente es derivado a centro de salud (Organismo Administrador o centro en convenio).'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q59', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°10', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q58 === 'CON_OBSERVACIONES', options: [{ value: 'no_informa_jefatura', label: 'No informa de un incidente o accidente ocurrido a su jefatura', severity: 'GRAVE' },{ value: 'jefatura_no_informa_lideres', label: 'Jefatura que toma conocimiento del accidente no informa de forma inmediata a líderes de sucursal', severity: 'GRAVE' },{ value: 'lideres_no_informan_sso', label: 'Líderes de sucursal no informan de accidente ocurrido de forma inmediata a equipo de Salud y Seguridad', severity: 'GRAVE' },{ value: 'sin_derivacion_centro_salud', label: 'Colaborador que sufre accidente no es derivado a centro de salud (Organismo Administrador o centro en convenio)', severity: 'GRAVE' }] },
        ],
      },

      // ── S13-S17: REGLAS ADMINISTRACIÓN ───────────────────────────────────
      {
        id: 'adm1', title: 'VERIFICACIÓN — REGLA N°1 ADM',
        visibleWhen: (a) => a.Q18 === 'Área Administrativa Sucursal' && a.Q21 === 'N°1 Transitar siempre atento a las condiciones del entorno y por zonas habilitadas (ADM)',
        questions: [
          { id: 'Q36', type: 'radio', required: true, label: 'REGLA N°1: Transitar siempre atento a las condiciones del entorno y por zonas habilitadas', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado transita siempre por zonas habilitadas y/o demarcadas.','El colaborador observado no transita corriendo o apresurado por el área.','El colaborador observado no transita por superficies con presencia de agua.','El colaborador observado utiliza el pasamanos al descender o ascender escaleras.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q37', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°1 ADM', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q36 === 'CON_OBSERVACIONES', options: [{ value: 'zona_no_habilitada', label: 'Transita por zona no habilitada o sin demarcar', severity: 'NORMAL' },{ value: 'transita_corriendo', label: 'Transita corriendo o apresurado por el área', severity: 'NORMAL' },{ value: 'superficie_agua', label: 'Transita por superficies con presencia de agua', severity: 'NORMAL' },{ value: 'sin_pasamanos', label: 'No utiliza pasamanos al ascender o descender escaleras', severity: 'GRAVE' }] },
        ],
      },
      {
        id: 'adm2', title: 'VERIFICACIÓN — REGLA N°2 ADM',
        visibleWhen: (a) => a.Q18 === 'Área Administrativa Sucursal' && a.Q21 === 'N°2 Utiliza siempre equipos eléctricos que se encuentren en buen estado (ADM)',
        questions: [
          { id: 'Q38', type: 'radio', required: true, label: 'REGLA N°2: Utiliza siempre equipos eléctricos que se encuentren en buen estado', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado verifica el estado del equipo eléctrico antes de utilizarlo.','El colaborador observado no utiliza equipos eléctricos en mal estado o dañados.','El colaborador observado reporta inmediatamente equipos eléctricos en mal estado.','El colaborador observado no improvisa reparaciones en equipos eléctricos.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q39', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°2 ADM', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q38 === 'CON_OBSERVACIONES', options: [{ value: 'equipo_mal_estado', label: 'Utiliza equipo eléctrico en mal estado o dañado', severity: 'GRAVE' },{ value: 'no_verifica_estado', label: 'No verifica el estado del equipo antes de usarlo', severity: 'NORMAL' },{ value: 'no_reporta_falla', label: 'No reporta equipo eléctrico en mal estado', severity: 'NORMAL' },{ value: 'improvisa_reparacion', label: 'Improvisa reparaciones en equipos eléctricos', severity: 'GRAVE' }] },
        ],
      },
      {
        id: 'adm3', title: 'VERIFICACIÓN — REGLA N°3 ADM',
        visibleWhen: (a) => a.Q18 === 'Área Administrativa Sucursal' && a.Q21 === 'N°3 Nunca intervenir instalaciones eléctricas (ADM)',
        questions: [
          { id: 'Q40', type: 'radio', required: true, label: 'REGLA N°3: Nunca intervenir instalaciones eléctricas', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado no interviene ni manipula instalaciones eléctricas.','El colaborador observado no abre tableros o canaletas eléctricas sin autorización.','El colaborador observado reporta inmediatamente cualquier anomalía eléctrica.','El colaborador observado mantiene distancia segura de instalaciones eléctricas expuestas.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q41', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°3 ADM', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q40 === 'CON_OBSERVACIONES', options: [{ value: 'interviene_instalacion', label: 'Interviene o manipula instalaciones eléctricas', severity: 'GRAVE' },{ value: 'abre_tablero', label: 'Abre tablero o canaleta eléctrica sin autorización', severity: 'GRAVE' },{ value: 'no_reporta_anomalia', label: 'No reporta anomalía eléctrica detectada', severity: 'NORMAL' },{ value: 'sin_distancia', label: 'No mantiene distancia segura de instalaciones eléctricas', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'adm4', title: 'VERIFICACIÓN — REGLA N°4 ADM',
        visibleWhen: (a) => a.Q18 === 'Área Administrativa Sucursal' && a.Q21 === 'N°4 Reportar siempre que se observen condiciones inseguras en el puesto de trabajo (ADM)',
        questions: [
          { id: 'Q42', type: 'radio', required: true, label: 'REGLA N°4: Reportar siempre que se observen condiciones inseguras en el puesto de trabajo', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado reporta condiciones inseguras a su jefatura inmediatamente.','El colaborador observado utiliza los canales formales de reporte disponibles.','El colaborador observado no normaliza condiciones inseguras en su entorno.','El colaborador observado corrige condiciones inseguras menores dentro de su alcance.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q43', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°4 ADM', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q42 === 'CON_OBSERVACIONES', options: [{ value: 'no_reporta_condicion', label: 'No reporta condición insegura observada a su jefatura', severity: 'GRAVE' },{ value: 'no_usa_canal_formal', label: 'No utiliza canal formal de reporte', severity: 'NORMAL' },{ value: 'normaliza_riesgo', label: 'Normaliza o ignora condición insegura detectada', severity: 'NORMAL' }] },
        ],
      },
      {
        id: 'adm5', title: 'VERIFICACIÓN — REGLA N°5 ADM',
        visibleWhen: (a) => a.Q18 === 'Área Administrativa Sucursal' && a.Q21 === 'N°5 Mantener una postura de trabajo adecuada (ADM)',
        questions: [
          { id: 'Q44', type: 'radio', required: true, label: 'REGLA N°5: Mantener una postura de trabajo adecuada', subtitle: 'Observe las conductas y marque el resultado:', conductasList: ['El colaborador observado mantiene una postura ergonómica al trabajar sentado.','El colaborador observado ajusta la silla y monitor a su medida antes de trabajar.','El colaborador observado realiza pausas activas durante la jornada.','El colaborador observado no mantiene posturas forzadas de forma prolongada.'], options: [{ value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive' },{ value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative' }] },
          { id: 'Q45', type: 'checkbox', required: true, label: 'Conductas observadas — REGLA N°5 ADM', subtitle: 'Marque una o más conductas. Las desviaciones en rojo son GRAVES.', visibleWhen: (a) => a.Q44 === 'CON_OBSERVACIONES', options: [{ value: 'postura_inadecuada', label: 'Mantiene postura inadecuada de forma prolongada', severity: 'NORMAL' },{ value: 'sin_ajuste_estacion', label: 'No ajusta estación de trabajo (silla, monitor) a su medida', severity: 'NORMAL' },{ value: 'sin_pausas_activas', label: 'No realiza pausas activas durante la jornada', severity: 'NORMAL' },{ value: 'postura_forzada', label: 'Mantiene postura forzada de forma repetida o prolongada', severity: 'GRAVE' }] },
        ],
      },

      // ── S15: RETROALIMENTACIÓN POSITIVA ──────────────────────────────────
      // Visible cuando se marcó SIN OBSERVACIONES en cualquier regla.
      // visibleWhen usa Object.values(a) para cubrir op1–op10 automáticamente.
      {
        id: 'retro_positiva', title: 'RETROALIMENTACIÓN POSITIVA',
        visibleWhen: (a) => Object.values(a).some(v => v === 'SIN_OBSERVACIONES'),
        questions: [
          { id: 'Q46', type: 'yesno', required: true, disableNA: true,
            label: '¿Se comunicó el resultado de la retroalimentación positiva (sin desviaciones) al colaborador?',
          },
          { id: 'Q51', type: 'text', required: true,
            label: 'Describa la retroalimentación POSITIVA realizada al colaborador:',
            placeholder: 'Escriba aquí la retroalimentación positiva entregada',
          },
        ],
      },

      // ── S16: RETROALIMENTACIÓN CORRECTIVA ────────────────────────────────
      // Visible cuando se marcó CON OBSERVACIONES en cualquier regla.
      {
        id: 'retro_correctiva', title: 'RETROALIMENTACIÓN CORRECTIVA',
        visibleWhen: (a) => Object.values(a).some(v => v === 'CON_OBSERVACIONES'),
        questions: [
          { id: 'Q48', type: 'yesno', required: true,
            label: '¿La acción insegura observada amerita una "CARTA DE AMONESTACIÓN" escrita?',
            disableNA: true,
          },
          { id: 'Q53', type: 'text', required: true,
            label: 'Describa la retroalimentación CORRECTIVA realizada al colaborador:',
            placeholder: 'Escriba aquí la retroalimentación correctiva entregada',
          },
        ],
      },

      // ── S17: CIERRE ───────────────────────────────────────────────────────
      // Siempre visible cuando se completó cualquier regla (SIN o CON).
      {
        id: 'cierre_final', title: 'CIERRE',
        visibleWhen: (a) => Object.values(a).some(v => v === 'SIN_OBSERVACIONES' || v === 'CON_OBSERVACIONES'),
        questions: [
          { id: 'Q49', type: 'text', required: true,
            label: 'Nombre y Apellido del Colaborador Observado:',
            placeholder: 'Escriba el nombre completo del colaborador',
          },
          { id: 'Q50', type: 'rut', required: true,
            label: 'RUT del colaborador observado',
            placeholder: 'Ej: 12.345.678-9',
          },
        ],
      },


    ], // fin sections
  },
  // ── 8. PERMISO DE TRABAJO — CONTRATISTAS ─────────────────────────────────
  'permiso-trabajo-contratista': {
    id: 'permiso-trabajo-contratista',
    title: 'Permiso de Trabajo — Contratistas',
    description: 'Verificación de condiciones para inicio de faenas en instalaciones',
    sections: [

      // ── S1: DATOS DE LA EMPRESA Y FAENA ──────────────────────────────────
      {
        id: 'ptc_s1',
        title: 'Datos de la Empresa y Faena',
        questions: [
          { id: 'ptc_01', type: 'text', label: 'Nombre de la empresa contratista', required: true },
          { id: 'ptc_02', type: 'text', label: 'RUT de la empresa contratista', required: true },
          { id: 'ptc_03', type: 'text', label: 'Nombre del supervisor de la empresa contratista', required: true },
          { id: 'ptc_04', type: 'text', label: 'Teléfono de contacto del supervisor', required: true },
          { id: 'ptc_05', type: 'text', label: 'Ubicación específica de la faena (sala, área, piso)', required: true, placeholder: 'Ej: Sala de máquinas, andén 3' },
          { id: 'ptc_06', type: 'text', label: 'Descripción del trabajo a realizar', required: true },
          { id: 'ptc_07', type: 'text', label: 'Fecha de inicio', required: true, inputType: 'date' },
          { id: 'ptc_08', type: 'text', label: 'Fecha de término estimada', required: true, inputType: 'date' },
          { id: 'ptc_09', type: 'text', label: 'Número de trabajadores involucrados', required: true, inputType: 'number' },
          { id: 'ptc_10', type: 'people-picker', label: 'Responsable Agrosuper que supervisa la faena', required: true, options: '__DYNAMIC_AZURE_AD__' },
        ],
      },

      // ── S2: CLASIFICACIÓN Y PELIGROS ─────────────────────────────────────
      {
        id: 'ptc_s2',
        title: 'Clasificación y Peligros',
        questions: [
          { id: 'ptc_11', type: 'select', label: 'Tipo de trabajo a realizar', required: true, options: ['Trabajo General', 'Trabajo en Altura', 'Trabajo en Caliente', 'Trabajo Eléctrico', 'Espacio Confinado', 'Múltiples tipos'] },
          { id: 'ptc_12', type: 'checkbox', label: 'Peligros identificados (seleccione todos los que aplican)', required: false, options: [
            { value: 'caida_nivel',          label: 'Caída a distinto nivel' },
            { value: 'contacto_electrico',   label: 'Contacto eléctrico' },
            { value: 'incendio_explosion',   label: 'Incendio / explosión' },
            { value: 'atmosfera_peligrosa',  label: 'Atmósfera peligrosa' },
            { value: 'atrapamiento',         label: 'Atrapamiento' },
            { value: 'golpes',               label: 'Golpes / aplastamiento' },
            { value: 'quimicos',             label: 'Exposición a químicos' },
            { value: 'ruido',                label: 'Ruido excesivo' },
            { value: 'temperatura',          label: 'Temperaturas extremas' },
            { value: 'otros',                label: 'Otros' },
          ] },
          { id: 'ptc_13', type: 'select', label: 'Nivel de riesgo global estimado', required: true, options: ['Alto', 'Medio', 'Bajo'] },
          { id: 'ptc_14', type: 'yesno', label: '¿Existe procedimiento escrito o IPERC para este trabajo?', required: true },
          { id: 'ptc_15', type: 'text', label: 'Observaciones sobre el procedimiento o evaluación de riesgo', required: false },
        ],
      },

      // ── S3: COMPETENCIAS E INDUCCIÓN ──────────────────────────────────────
      {
        id: 'ptc_s3',
        title: 'Competencias e Inducción',
        questions: [
          { id: 'ptc_16', type: 'yesno', label: '¿Los trabajadores cuentan con capacitación específica para este trabajo?', required: true },
          { id: 'ptc_17', type: 'yesno', label: '¿Las certificaciones de los trabajadores están vigentes?', required: true },
          { id: 'ptc_18', type: 'text', label: 'Detalle certificaciones y fechas de vencimiento', required: false, placeholder: 'Ej: Trabajo en altura vigente hasta 12/2025' },
          { id: 'ptc_19', type: 'yesno', label: '¿Se realizó inducción de seguridad en la instalación?', required: true },
          { id: 'ptc_20', type: 'photo', label: 'Evidencia de inducción o certificaciones (opcional)', required: false, maxPhotos: 3 },
        ],
      },

      // ── S4: EPP REQUERIDO ─────────────────────────────────────────────────
      {
        id: 'ptc_s4',
        title: 'EPP Requerido',
        questions: [
          { id: 'ptc_21', type: 'checkbox', label: 'EPP que se utilizará en la faena', required: false, options: [
            { value: 'casco',               label: 'Casco de seguridad' },
            { value: 'lentes',              label: 'Lentes protectores' },
            { value: 'auditiva',            label: 'Protección auditiva' },
            { value: 'mascarilla',          label: 'Mascarilla / respirador' },
            { value: 'guantes',             label: 'Guantes de trabajo' },
            { value: 'botas',               label: 'Botas de seguridad con punta acero' },
            { value: 'chaleco',             label: 'Chaleco reflectante' },
            { value: 'arnes',               label: 'Arnés de cuerpo completo' },
            { value: 'ropa_fuego',          label: 'Ropa resistente al fuego' },
            { value: 'guantes_dielectricos', label: 'Guantes dieléctricos' },
            { value: 'calzado_dielectrico', label: 'Calzado dieléctrico' },
            { value: 'proteccion_facial',   label: 'Protección facial' },
          ] },
          { id: 'ptc_22', type: 'yesno', label: '¿Todo el EPP está disponible, inspeccionado y en buen estado?', required: true },
          { id: 'ptc_23', type: 'yesno', label: '¿El personal ha sido instruido en el uso correcto del EPP?', required: true },
        ],
      },

      // ── S5A: TRABAJO EN ALTURA ────────────────────────────────────────────
      {
        id: 'ptc_s5a',
        title: 'Trabajo en Altura',
        visibleWhen: (a) => ['Trabajo en Altura', 'Múltiples tipos'].includes(a.ptc_11),
        questions: [
          { id: 'ptc_a01', type: 'text', label: 'Altura máxima de trabajo (metros)', required: true, inputType: 'number' },
          { id: 'ptc_a02', type: 'select', label: 'Método de acceso', required: false, options: ['Escalera portátil', 'Escalera fija', 'Andamiaje', 'Plataforma elevadora', 'Línea de vida vertical', 'Otro'] },
          { id: 'ptc_a03', type: 'select', label: 'Sistema de protección contra caídas', required: false, options: ['Arnés + eslinga doble', 'Arnés + SRL (retráctil)', 'Arnés + anclaje puntual', 'Baranda perimetral', 'Red de seguridad'] },
          { id: 'ptc_a04', type: 'yesno', label: '¿Los puntos de anclaje han sido inspeccionados y son aptos?', required: true },
          { id: 'ptc_a05', type: 'yesno', label: '¿El arnés y eslingas han sido inspeccionados (sin daño visible)?', required: true },
          { id: 'ptc_a06', type: 'yesno', label: '¿Existe zona de exclusión delimitada y señalizada bajo el área de trabajo?', required: true },
          { id: 'ptc_a07', type: 'yesno', label: '¿Las condiciones climáticas son aceptables para trabajar en altura?', required: true },
          { id: 'ptc_a08', type: 'yesno', label: '¿Existe plan de rescate documentado para este trabajo?', required: true },
          { id: 'ptc_a09', type: 'yesno', label: '¿El personal está capacitado en el procedimiento de rescate?', required: true },
        ],
      },

      // ── S5B: TRABAJO EN CALIENTE ──────────────────────────────────────────
      {
        id: 'ptc_s5b',
        title: 'Trabajo en Caliente',
        visibleWhen: (a) => ['Trabajo en Caliente', 'Múltiples tipos'].includes(a.ptc_11),
        questions: [
          { id: 'ptc_b01', type: 'select', label: 'Tipo de trabajo en caliente', required: false, options: ['Soldadura eléctrica', 'Soldadura autógena / oxicorte', 'Corte con plasma', 'Esmerilado', 'Torchado / calentamiento', 'Otro'] },
          { id: 'ptc_b02', type: 'yesno', label: '¿Se han removido o protegido combustibles en radio de 11 metros?', required: true },
          { id: 'ptc_b03', type: 'yesno', label: '¿Las aberturas en paredes, pisos y techos han sido selladas?', required: true },
          { id: 'ptc_b04', type: 'yesno', label: '¿Los sistemas de rociadores (sprinklers) del área están operativos?', required: true },
          { id: 'ptc_b05', type: 'yesno', label: '¿Hay extintores disponibles y accesibles en el área de trabajo?', required: true },
          { id: 'ptc_b06', type: 'yesno', label: '¿Se ha designado un vigía contra incendio para este trabajo?', required: true },
          { id: 'ptc_b07', type: 'text', label: 'Nombre del vigía contra incendio designado', required: false },
          { id: 'ptc_b08', type: 'yesno', label: '¿El vigía permanecerá al menos 30 minutos después del término del trabajo?', required: true },
          { id: 'ptc_b09', type: 'yesno', label: '¿El equipo de soldadura / corte está en buen estado?', required: true },
          { id: 'ptc_b10', type: 'photo', label: 'Fotografía del área antes de iniciar', required: false, maxPhotos: 2 },
        ],
      },

      // ── S5C: TRABAJO ELÉCTRICO ────────────────────────────────────────────
      {
        id: 'ptc_s5c',
        title: 'Trabajo Eléctrico',
        visibleWhen: (a) => ['Trabajo Eléctrico', 'Múltiples tipos'].includes(a.ptc_11),
        questions: [
          { id: 'ptc_c01', type: 'text', label: 'Voltaje del sistema eléctrico a intervenir (V)', required: true, inputType: 'number' },
          { id: 'ptc_c02', type: 'text', label: 'Identificación del tablero / circuito / equipo', required: true },
          { id: 'ptc_c03', type: 'yesno', label: '¿El trabajo se realizará con el equipo sin energía (LOTO aplicado)?', required: true },
          { id: 'ptc_c04', type: 'yesno', label: '¿Se realizó prueba de ausencia de tensión antes de iniciar?', required: true },
          { id: 'ptc_c05', type: 'text', label: 'Nombre de la persona responsable del bloqueo / LOTO', required: true },
          { id: 'ptc_c06', type: 'yesno', label: '¿El electricista posee certificación vigente de competencia?', required: true },
          { id: 'ptc_c07', type: 'yesno', label: '¿Los guantes dieléctricos corresponden al voltaje del sistema y están inspeccionados?', required: true },
          { id: 'ptc_c08', type: 'yesno', label: '¿Se estableció zona de exclusión y señalización de peligro eléctrico?', required: true },
          { id: 'ptc_c09', type: 'yesno', label: '¿Se utilizarán herramientas con aislamiento certificado?', required: true },
        ],
      },

      // ── S5D: ESPACIO CONFINADO ────────────────────────────────────────────
      {
        id: 'ptc_s5d',
        title: 'Espacio Confinado',
        visibleWhen: (a) => ['Espacio Confinado', 'Múltiples tipos'].includes(a.ptc_11),
        questions: [
          { id: 'ptc_d01', type: 'select', label: 'Tipo de espacio confinado', required: false, options: ['Tanque', 'Cisterna', 'Silo', 'Pozo / sumidero', 'Conducto / tubería', 'Bóveda / cámara subterránea', 'Otro'] },
          { id: 'ptc_d02', type: 'text', label: 'Sustancia anteriormente contenida en el espacio', required: true },
          { id: 'ptc_d03', type: 'yesno', label: '¿Se realizaron mediciones de atmósfera antes de la entrada?', required: true },
          { id: 'ptc_d04', type: 'text', label: 'Resultado medición oxígeno (%) — rango aceptable: 19.5%–23.5%', required: false, inputType: 'number', placeholder: 'Ej: 20.9' },
          { id: 'ptc_d05', type: 'text', label: 'Resultado medición gases explosivos (% LEL) — máximo aceptable: < 10%', required: false, inputType: 'number', placeholder: 'Ej: 0' },
          { id: 'ptc_d06', type: 'yesno', label: '¿Las mediciones atmosféricas están dentro de rangos seguros?', required: true },
          { id: 'ptc_d07', type: 'yesno', label: '¿Se estableció ventilación (natural o forzada) antes de la entrada?', required: true },
          { id: 'ptc_d08', type: 'yesno', label: '¿Hay un vigilante / guardián designado que NO ingresará al espacio?', required: true },
          { id: 'ptc_d09', type: 'text', label: 'Nombre del vigilante / guardián designado', required: false },
          { id: 'ptc_d10', type: 'yesno', label: '¿Hay equipo de rescate disponible (arnés, trípode, comunicaciones)?', required: true },
          { id: 'ptc_d11', type: 'yesno', label: '¿Hay personal capacitado en rescate presente en el sitio?', required: true },
          { id: 'ptc_d12', type: 'yesno', label: '¿El monitoreo de atmósfera será continuo durante el trabajo?', required: true },
        ],
      },

      // ── S6: CONTROL Y COORDINACIÓN ────────────────────────────────────────
      {
        id: 'ptc_s6',
        title: 'Control y Coordinación',
        questions: [
          { id: 'ptc_31', type: 'text', label: 'Principales medidas de control implementadas', required: true, placeholder: 'Describe las medidas de seguridad activas para esta faena…' },
          { id: 'ptc_32', type: 'yesno', label: '¿Se realizó charla de inicio (toolbox talk) con todo el personal?', required: true },
          { id: 'ptc_33', type: 'yesno', label: '¿El área fue delimitada y señalizada para el trabajo?', required: true },
          { id: 'ptc_34', type: 'yesno', label: '¿Se verificó que la faena no afecta otras operaciones activas en el sector?', required: true },
          { id: 'ptc_35', type: 'yesno', label: '¿Los trabajadores conocen el plan de emergencia y punto de reunión?', required: true },
          { id: 'ptc_36', type: 'text', label: 'Observaciones o condiciones especiales', required: false },
          { id: 'ptc_37', type: 'photo', label: 'Fotografía del área preparada para iniciar', required: false, maxPhotos: 3 },
        ],
      },

      // ── S7: AUTORIZACIÓN ──────────────────────────────────────────────────
      {
        id: 'ptc_s7',
        title: 'Autorización',
        questions: [
          { id: 'ptc_41', type: 'people-picker', label: 'Supervisor Agrosuper que autoriza el inicio', required: true, options: '__DYNAMIC_AZURE_AD__' },
          { id: 'ptc_42', type: 'yesno', label: 'El supervisor declara haber verificado in situ las condiciones indicadas en este formulario', required: true },
          { id: 'ptc_43', type: 'yesno', label: '¿La faena queda autorizada para iniciar?', required: true },
          { id: 'ptc_44', type: 'text', label: 'Hora de inicio autorizada', required: true, placeholder: 'Ej: 09:30' },
          { id: 'ptc_45', type: 'text', label: 'Hora máxima de término del permiso (renovar si se extiende)', required: true, placeholder: 'Ej: 17:00' },
          { id: 'ptc_46', type: 'text', label: 'Observaciones del autorizante', required: false },
        ],
      },

    ], // fin sections
  },

  // ── 9. CIERRE DE TRABAJO — CONTRATISTAS ──────────────────────────────────
  'cierre-trabajo-contratista': {
    id: 'cierre-trabajo-contratista',
    title: 'Cierre de Trabajo — Contratistas',
    description: 'Verificación de condiciones al término de la faena',
    sections: [

      // ── S1: REFERENCIA AL PERMISO ─────────────────────────────────────────
      {
        id: 'ctc_s1',
        title: 'Referencia al Permiso de Trabajo',
        questions: [
          { id: 'ctc_01', type: 'text', label: 'Nombre de la empresa contratista', required: true },
          { id: 'ctc_02', type: 'text', label: 'Ubicación de la faena (sala, área, piso)', required: true },
          { id: 'ctc_03', type: 'select', label: 'Tipo de trabajo realizado', required: true, options: ['Trabajo General', 'Trabajo en Altura', 'Trabajo en Caliente', 'Trabajo Eléctrico', 'Espacio Confinado', 'Múltiples tipos'] },
          { id: 'ctc_04', type: 'people-picker', label: 'Responsable Agrosuper que cierra la faena', required: true, options: '__DYNAMIC_AZURE_AD__' },
        ],
      },

      // ── S2: VERIFICACIÓN DE CIERRE ────────────────────────────────────────
      {
        id: 'ctc_s2',
        title: 'Verificación de Cierre',
        questions: [
          { id: 'ctc_11', type: 'yesno', label: '¿El trabajo fue completado en su totalidad?', required: true },
          { id: 'ctc_12', type: 'yesno', label: '¿El área fue restaurada a condiciones normales?', required: true },
          { id: 'ctc_13', type: 'yesno', label: '¿Se retiraron todos los aislamientos, bloqueos y etiquetas?', required: true },
          { id: 'ctc_14', type: 'yesno', label: '¿Se recogió todo el equipamiento y herramientas utilizadas?', required: true },
          { id: 'ctc_15', type: 'yesno', label: '¿El personal contratista abandonó la instalación?', required: true },
          { id: 'ctc_16', type: 'yesno', label: '¿Se verificó el área en terreno antes de dar cierre?', required: true },
        ],
      },

      // ── S3: INCIDENTES Y OBSERVACIONES ───────────────────────────────────
      {
        id: 'ctc_s3',
        title: 'Incidentes y Observaciones',
        questions: [
          { id: 'ctc_21', type: 'yesno', label: '¿Ocurrió algún incidente o accidente durante la faena?', required: true },
          { id: 'ctc_22', type: 'text', label: 'Descripción del incidente (si aplica)', required: false, placeholder: 'Describe el incidente, personas involucradas y acciones tomadas…' },
          { id: 'ctc_23', type: 'photo', label: 'Fotografía del área al término del trabajo', required: false, maxPhotos: 3 },
          { id: 'ctc_24', type: 'text', label: 'Observaciones de cierre', required: false },
        ],
      },

    ], // fin sections
  },

}

// Helper: calcula total de preguntas requeridas de un formulario
export function getRequiredCount(formId) {
  const form = formDefinitions[formId]
  if (!form) return 0
  return form.sections.flatMap(s => s.questions).filter(q => q.required).length
}

// Helper: todas las preguntas de un formulario en lista plana
export function getAllQuestions(formId) {
  const form = formDefinitions[formId]
  if (!form) return []
  return form.sections.flatMap(s => s.questions)
}
