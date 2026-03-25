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
    description: 'Recorrido de inspección en terreno',
    sections: [
      {
        id: 's1',
        title: 'Identificación del Recorrido',
        questions: [
          { id: 'cs_1', type: 'select', label: 'Área recorrida', required: true, options: ['Bodega', 'Andén de despacho', 'Área de carga', 'Oficinas', 'Estacionamiento', 'Patio de maniobras'] },
          { id: 'cs_2', type: 'select', label: 'Turno', required: true, options: ['Mañana', 'Tarde', 'Noche'] },
        ],
      },
      {
        id: 's2',
        title: 'Condiciones Observadas',
        questions: [
          { id: 'cs_3', type: 'yesno', label: 'Se observaron condiciones inseguras en el área', required: true },
          { id: 'cs_4', type: 'yesno', label: 'Se observaron actos inseguros por parte de trabajadores', required: true },
          { id: 'cs_5', type: 'yesno', label: 'Los trabajadores utilizan correctamente el EPP', required: true },
          { id: 'cs_6', type: 'yesno', label: 'Se observa cumplimiento de los procedimientos de trabajo', required: true },
        ],
      },
      {
        id: 's3',
        title: 'Hallazgos y Acciones',
        questions: [
          { id: 'cs_7', type: 'text',   label: 'Descripción de hallazgos observados', required: true, placeholder: 'Describe las condiciones o actos observados…' },
          { id: 'cs_8', type: 'yesno',  label: 'Se tomaron acciones inmediatas en terreno', required: true },
          { id: 'cs_9', type: 'text',   label: 'Acciones tomadas o compromisos establecidos', required: false, placeholder: 'Describe las acciones inmediatas o correctivas acordadas…' },
        ],
      },
      {
        id: 's4',
        title: 'Evaluación General',
        questions: [
          { id: 'cs_10', type: 'rating', label: 'Calificación general de las condiciones observadas', required: true },
          { id: 'cs_11', type: 'text',   label: 'Observaciones adicionales', required: false, placeholder: 'Información complementaria del recorrido…' },
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

  // ── 7. PAUTA DE VERIFICACIÓN REGLAS DE ORO (wizard mode) ─────────────────
  'pauta-verificacion-reglas-oro': {
    mode: 'wizard',
    id: 'pauta-verificacion-reglas-oro',
    title: 'Reglas de Oro',
    description: 'Verificación cumplimiento Reglas de Oro',
    entryQuestion: 'Q1',
    estimatedTotal: 24,
    questions: {

      // ── Bloque 1: Datos generales (Q1–Q21) ───────────────────────────────

      Q1: {
        id: 'Q1', section: 'DATOS GENERALES', order: 1,
        label: 'Instalación donde se realizará la Verificación de Reglas Oro',
        type: 'select', required: true, displayType: 'dropdown',
        placeholder: 'Selecciona la instalación',
        options: [
          'Arica','Iquique','Calama','Antofagasta','Copiapó','Coquimbo',
          'Hijuelas','San Antonio','Viña del Mar','Miraflores','Huechuraba',
          'Lo Espejo','Rancagua','Curicó','Talca','Chillán','Los Ángeles',
          'Concepción','Temuco','Valdivia','Osorno','Puerto Montt',
          'Castro','Coyhaique','Punta Arenas','San Felipe',
          'Oficina Central','Oficina Vespucio',
        ],
        nextQuestion: 'Q2',
      },

      Q2: {
        id: 'Q2', section: 'DATOS GENERALES', order: 2,
        label: 'Cargo',
        type: 'select', required: true, displayType: 'dropdown',
        placeholder: 'Selecciona el cargo',
        options: [
          'Gerente','Subgerente','Jefe de Zona','Jefe de Operaciones',
          'Jefe Administrativo','Jefe de Frigorífico','Jefe de Despacho',
          'Ayudante de Despacho','Comité Paritario','SSO',
          'Coordinador SIG Sucursales','Experto ACHS','Colaborador Sucursal',
        ],
        nextQuestion: 'Q3',
      },

      Q3: {
        id: 'Q3', section: 'DATOS GENERALES', order: 3,
        label: 'Nombre GERENTE',
        labelParts: { prefix: 'Nombre ', highlight: 'GERENTE' },
        type: 'select', required: true,
        options: '__DYNAMIC_AZURE_AD__',
        nextQuestion: 'Q4',
      },

      Q4: {
        id: 'Q4', section: 'DATOS GENERALES', order: 4,
        label: 'Nombre SUBGERENTE',
        labelParts: { prefix: 'Nombre ', highlight: 'SUBGERENTE' },
        type: 'select', required: true,
        options: '__DYNAMIC_AZURE_AD__',
        nextQuestion: 'Q5',
      },

      Q5: {
        id: 'Q5', section: 'DATOS GENERALES', order: 5,
        label: 'Nombre del JEFE DE ZONA',
        labelParts: { prefix: 'Nombre del ', highlight: 'JEFE DE ZONA' },
        type: 'select', required: true,
        options: '__DYNAMIC_AZURE_AD__',
        nextQuestion: 'Q6',
      },

      Q6: {
        id: 'Q6', section: 'DATOS GENERALES', order: 6,
        label: 'Nombre del JEFE DE OPERACIONES',
        labelParts: { prefix: 'Nombre del ', highlight: 'JEFE DE OPERACIONES' },
        type: 'select', required: true,
        options: '__DYNAMIC_AZURE_AD__',
        nextQuestion: 'Q7',
      },

      Q7: {
        id: 'Q7', section: 'DATOS GENERALES', order: 7,
        label: 'Nombre del JEFE ADMINISTRATIVO',
        labelParts: { prefix: 'Nombre del ', highlight: 'JEFE ADMINISTRATIVO' },
        type: 'select', required: true,
        options: '__DYNAMIC_AZURE_AD__',
        nextQuestion: 'Q8',
      },

      Q8: {
        id: 'Q8', section: 'DATOS GENERALES', order: 8,
        label: 'Nombre del JEFE DE FRIGORÍFICO',
        labelParts: { prefix: 'Nombre del ', highlight: 'JEFE DE FRIGORÍFICO' },
        type: 'select', required: true,
        options: '__DYNAMIC_AZURE_AD__',
        nextQuestion: 'Q9',
      },

      Q9: {
        id: 'Q9', section: 'DATOS GENERALES', order: 9,
        label: 'Equipo del colaborador observado',
        labelParts: { prefix: 'Seleccione ', highlight: 'Equipo', suffix: ' del observado:' },
        type: 'select', required: true,
        options: ['Foodservice','Venta Digital','Norte','Centro','Santiago','Sur','Servicio al Cliente'],
        nextQuestion: 'Q10',
      },

      Q10: {
        id: 'Q10', section: 'DATOS GENERALES', order: 10,
        label: 'Nombre JEFE O AYUDANTE DE DESPACHO',
        labelParts: { prefix: 'Nombre ', highlight: 'JEFE O AYUDANTE DE DESPACHO' },
        type: 'text', inputType: 'single-line', required: true,
        placeholder: 'Escriba el nombre completo',
        nextQuestion: 'Q11',
      },

      Q11: {
        id: 'Q11', section: 'DATOS GENERALES', order: 11,
        label: 'Cargo del observador de la Pauta de Verificación',
        type: 'text', inputType: 'single-line', required: true,
        placeholder: 'Escriba el cargo',
        nextQuestion: 'Q12',
      },

      Q12: {
        id: 'Q12', section: 'DATOS GENERALES', order: 12,
        label: 'Nombre del Observador de la Pauta de Verificación',
        type: 'text', inputType: 'single-line', required: true,
        placeholder: 'Escriba el nombre completo',
        nextQuestion: 'Q13',
      },

      Q13: {
        id: 'Q13', section: 'DATOS GENERALES', order: 13,
        label: 'Nombre OBSERVADOR COMITÉ PARITARIO',
        labelParts: { prefix: 'Nombre ', highlight: 'OBSERVADOR COMITÉ PARITARIO' },
        type: 'text', inputType: 'single-line', required: true,
        placeholder: 'Escriba el nombre completo',
        nextQuestion: 'Q14',
      },

      Q14: {
        id: 'Q14', section: 'DATOS GENERALES', order: 14,
        label: 'Nombre OBSERVADOR EQUIPO SSO',
        labelParts: { prefix: 'Nombre ', highlight: 'OBSERVADOR EQUIPO SSO' },
        type: 'select', required: true,
        options: '__DYNAMIC_AZURE_AD__',
        nextQuestion: 'Q15',
      },

      Q15: {
        id: 'Q15', section: 'DATOS GENERALES', order: 15,
        label: 'Nombre OBSERVADOR ACHS',
        labelParts: { prefix: 'Nombre ', highlight: 'OBSERVADOR ACHS' },
        type: 'text', inputType: 'single-line', required: true,
        placeholder: 'Escriba el nombre completo',
        nextQuestion: 'Q16',
      },

      Q16: {
        id: 'Q16', section: 'DATOS GENERALES', order: 16,
        label: 'Nombre COORDINADOR SIGAS / JEFE DE CALIDAD',
        labelParts: { prefix: 'Nombre ', highlight: 'COORDINADOR SIGAS / JEFE DE CALIDAD' },
        type: 'text', inputType: 'single-line', required: true,
        placeholder: 'Escriba el nombre completo',
        nextQuestion: 'Q17',
      },

      Q17: {
        id: 'Q17', section: 'DATOS GENERALES', order: 17,
        label: 'Nombre COLABORADOR SUCURSAL',
        labelParts: { prefix: 'Nombre ', highlight: 'COLABORADOR SUCURSAL' },
        type: 'text', inputType: 'single-line', required: true,
        placeholder: 'Escriba el nombre completo',
        nextQuestion: 'Q18',
      },

      Q18: {
        id: 'Q18', section: 'CONFIGURACIÓN', order: 18,
        label: 'Área en la que verificará el cumplimiento de las Reglas de Oro',
        type: 'select', required: true,
        options: ['Área Administrativa Sucursal', 'Área Operaciones Sucursal'],
        nextQuestion: 'Q19',
      },

      Q19: {
        id: 'Q19', section: 'CONFIGURACIÓN', order: 19,
        label: 'Turno observado',
        type: 'select', required: true,
        options: ['Mañana', 'Tarde', 'Noche'],
        nextQuestion: '__AREA_ROUTING__',
      },

      Q20: {
        id: 'Q20', section: 'CONFIGURACIÓN', order: 20,
        label: 'Regla de Oro que Verificará',
        type: 'select', required: true, displayType: 'dropdown',
        profile: 'OP', placeholder: 'Selecciona la Regla de Oro',
        options: [
          'N°1 Elementos de Protección Personal (OP)',
          'N°2 Transito Interior Frigorífico (OP)',
          'N°3 Operación de Equipo Rodante (OP)',
          'N°4 Almacenamiento en Altura (OP)',
          'N°5 Carga y Descarga de Camiones (OP)',
          'N°6 Manejo Manual de Cargas (OP)',
          'N°7 Trabajo Responsable, sin hacer Bromas o Acciones Inseguras (OP)',
        ],
        optionRouting: {
          'N°1 Elementos de Protección Personal (OP)':                           'Q22',
          'N°2 Transito Interior Frigorífico (OP)':                              'Q24',
          'N°3 Operación de Equipo Rodante (OP)':                                'Q26',
          'N°4 Almacenamiento en Altura (OP)':                                   'Q28',
          'N°5 Carga y Descarga de Camiones (OP)':                               'Q30',
          'N°6 Manejo Manual de Cargas (OP)':                                    'Q32',
          'N°7 Trabajo Responsable, sin hacer Bromas o Acciones Inseguras (OP)': 'Q34',
        },
      },

      Q21: {
        id: 'Q21', section: 'CONFIGURACIÓN', order: 21,
        label: 'Regla de Oro que Verificará',
        type: 'select', required: true, displayType: 'dropdown',
        profile: 'ADM', placeholder: 'Selecciona la Regla de Oro',
        options: [
          'N°1 Transitar siempre atento a las condiciones del entorno y por zonas habilitadas (ADM)',
          'N°2 Utiliza siempre equipos eléctricos que se encuentren en buen estado (ADM)',
          'N°3 Nunca intervenir instalaciones eléctricas (ADM)',
          'N°4 Reportar siempre que se observen condiciones inseguras en el puesto de trabajo (ADM)',
          'N°5 Mantener una postura de trabajo adecuada (ADM)',
        ],
        optionRouting: {
          'N°1 Transitar siempre atento a las condiciones del entorno y por zonas habilitadas (ADM)': 'Q36',
          'N°2 Utiliza siempre equipos eléctricos que se encuentren en buen estado (ADM)':            'Q38',
          'N°3 Nunca intervenir instalaciones eléctricas (ADM)':                                      'Q40',
          'N°4 Reportar siempre que se observen condiciones inseguras en el puesto de trabajo (ADM)': 'Q42',
          'N°5 Mantener una postura de trabajo adecuada (ADM)':                                       'Q44',
        },
      },

      // ── Bloque 2: Reglas OP (Q22–Q35) ──────────────────────────────────

      Q22: {
        id: 'Q22', section: 'VERIFICACIÓN — REGLA N°1 OP', order: 22,
        label: 'REGLA N°1: Revisa y utiliza correctamente todos los elementos de protección personal (EPP)',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'OP', ruleNumber: 1, branching: true,
        conductasList: [
          'El colaborador observado utiliza todos sus EPP.',
          'El colaborador observado utiliza sus EPP de forma correcta.',
          'El colaborador observado informa cuando su EPP están en malas condiciones o cuando no cuenta con él.',
          'El colaborador observado no utiliza EPP que no corresponde o que no esté autorizado.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q23' },
        ],
      },

      Q23: {
        id: 'Q23', section: 'VERIFICACIÓN — REGLA N°1 OP', order: 23,
        label: 'Conductas observadas — REGLA N°1',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'OP', ruleNumber: 1,
        options: [
          { value: 'no_utiliza_epp',      label: 'No utiliza EPP',                                                                    severity: 'GRAVE'  },
          { value: 'epp_incorrecto',      label: 'Utiliza su EPP de forma incorrecta',                                                severity: 'NORMAL' },
          { value: 'no_informa_deterioro',label: 'No informa cuando EPP está en malas condiciones o cuando no lo posee para trabajar', severity: 'NORMAL' },
          { value: 'epp_no_autorizado',   label: 'Utiliza EPP que no corresponde o no está autorizado',                               severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q24: {
        id: 'Q24', section: 'VERIFICACIÓN — REGLA N°2 OP', order: 24,
        label: 'REGLA N°2: Transita alerta a las condiciones del entorno y por zonas habilitadas',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'OP', ruleNumber: 2, branching: true,
        conductasList: [
          'El colaborador observado transita siempre por zonas habilitadas y/o demarcadas.',
          'El colaborador observado nunca transita corriendo o apresurado por el área de trabajo.',
          'El colaborador observado nunca transita por superficies con presencia de hielo o líquido.',
          'El colaborador observado nunca transita o trabaja bajo carga que se encuentra almacenada en altura.',
          'El colaborador observado nunca transita o trabaja sobre pallet de producto a nivel de piso.',
          'El colaborador observado no mantiene distancia con la operación de equipos rodantes.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q25' },
        ],
      },

      Q25: {
        id: 'Q25', section: 'VERIFICACIÓN — REGLA N°2 OP', order: 25,
        label: 'Conductas observadas — REGLA N°2',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'OP', ruleNumber: 2,
        options: [
          { value: 'zona_no_habilitada',    label: 'Transita por zona no habilitada y/o demarcada',                   severity: 'NORMAL' },
          { value: 'transita_corriendo',    label: 'Transita corriendo o apresurado por el área',                     severity: 'NORMAL' },
          { value: 'hielo_liquido',         label: 'Transita por superficies con presencia de hielo o líquido',       severity: 'NORMAL' },
          { value: 'bajo_carga_altura',     label: 'Transita o trabaja bajo carga almacenada en altura',              severity: 'GRAVE'  },
          { value: 'sobre_pallet_piso',     label: 'Transita o trabaja sobre pallet de producto a nivel de piso',     severity: 'NORMAL' },
          { value: 'sin_distancia_equipos', label: 'No mantiene distancia con operación de equipos rodantes',         severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q26: {
        id: 'Q26', section: 'VERIFICACIÓN — REGLA N°3 OP', order: 26,
        label: 'REGLA N°3: Opera máquina o equipo cumpliendo con medidas de seguridad establecidas',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'OP', ruleNumber: 3, branching: true,
        conductasList: [
          'El colaborador observado revisa su equipo antes de utilizarlo (lista de verificación) e informa fallas.',
          'El colaborador observado se encuentra calificado y autorizado para la operación del equipo.',
          'El colaborador observado opera el equipo prestando atención en la tarea y en el entorno.',
          'El colaborador observado cumple con lo indicado en el instructivo seguro de equipo rodante.',
          'El colaborador observado no golpea los pallets contra estructuras al transportar o almacenar.',
          'El colaborador observado cumple con lo indicado en el instructivo seguro para cambio de batería.',
          'El colaborador observado advierte su presencia en intersecciones, ingresos y salidas de cámara.',
          'El colaborador observado utiliza su distintivo asignado (Gorro Naranja).',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q27' },
        ],
      },

      Q27: {
        id: 'Q27', section: 'VERIFICACIÓN — REGLA N°3 OP', order: 27,
        label: 'Conductas observadas — REGLA N°3',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'OP', ruleNumber: 3,
        options: [
          { value: 'no_revisa_preuso',        label: 'No revisa equipo antes de utilizar o no informa fallas (pre-uso)',         severity: 'NORMAL' },
          { value: 'opera_sin_autorizacion',  label: 'Opera sin estar calificado y autorizado',                                  severity: 'GRAVE'  },
          { value: 'opera_sin_atencion',      label: 'Opera equipo sin prestar atención al trabajo o entorno',                   severity: 'NORMAL' },
          { value: 'no_cumple_instructivo',   label: 'No cumple instructivo seguro de equipo rodante',                           severity: 'NORMAL' },
          { value: 'golpea_estructuras',      label: 'Golpea pallet contra otra estructura al transportar o almacenar',         severity: 'NORMAL' },
          { value: 'no_cumple_bateria',       label: 'No cumple instructivo seguro de cambio de batería',                        severity: 'NORMAL' },
          { value: 'no_avisa_intersecciones', label: 'No advierte su presencia en intersecciones, ingreso o salidas de cámara', severity: 'NORMAL' },
          { value: 'sin_gorro_naranja',       label: 'No utiliza distintivo asignado a operadores calificados (Gorro Naranja)', severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q28: {
        id: 'Q28', section: 'VERIFICACIÓN — REGLA N°4 OP', order: 28,
        label: 'REGLA N°4: Almacena productos en altura cumpliendo con medidas de seguridad establecidas',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'OP', ruleNumber: 4, branching: true,
        conductasList: [
          'El colaborador observado conduce el equipo rodante evitando transportar carga en altura durante la maniobra.',
          'El colaborador observado almacena pallet de producto en altura con film de sujeción.',
          'El colaborador observado informa sobre daños en la estructura de los racks.',
          'El colaborador observado almacena en altura pallets en buen estado (evitando pallets rotos).',
          'El colaborador observado informa sobre presencia de pallets rotos en altura.',
          'El colaborador observado cumple con indicaciones de los POEV y LUP asociados.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q29' },
        ],
      },

      Q29: {
        id: 'Q29', section: 'VERIFICACIÓN — REGLA N°4 OP', order: 29,
        label: 'Conductas observadas — REGLA N°4',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'OP', ruleNumber: 4,
        options: [
          { value: 'conduce_carga_altura',   label: 'Conduce el equipo rodante transportando carga en altura',               severity: 'GRAVE'  },
          { value: 'sin_film_sujecion',      label: 'Almacena pallets en altura sin film de sujeción',                       severity: 'GRAVE'  },
          { value: 'no_informa_dano_rack',   label: 'No informa daño provocado a la estructura de rack',                     severity: 'NORMAL' },
          { value: 'almacena_pallets_rotos', label: 'Almacena en altura pallets rotos con productos',                        severity: 'GRAVE'  },
          { value: 'pallets_rotos_altura',   label: 'Presencia de pallets rotos apilados en altura',                         severity: 'NORMAL' },
          { value: 'no_cumple_poev_lup',     label: 'No cumple con indicaciones de POEV y LUP asociados',                   severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q30: {
        id: 'Q30', section: 'VERIFICACIÓN — REGLA N°5 OP', order: 30,
        label: 'REGLA N°5: Realizar carga y descarga de camiones cumpliendo con medidas de seguridad establecidas',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'OP', ruleNumber: 5, branching: true,
        conductasList: [
          'El colaborador observado evita ingresar a descargar o cargar mientras otro colaborador está al interior del camión.',
          'El colaborador observado abre la cortina de andén después de finalizada la maniobra de posicionamiento.',
          'El colaborador observado informa desperfectos en cortina y/o plataforma de andén.',
          'El colaborador observado verifica el correcto acople del camión/andén antes de comenzar.',
          'El colaborador observado prioriza transpaleta eléctrica para descargar camión rampla.',
          'El colaborador observado, sin equipo eléctrico, es apoyado por otro colaborador en la descarga.',
          'El colaborador observado realiza descarga controlando velocidad, espacio y ruta de desplazamiento.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q31' },
        ],
      },

      Q31: {
        id: 'Q31', section: 'VERIFICACIÓN — REGLA N°5 OP', order: 31,
        label: 'Conductas observadas — REGLA N°5',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'OP', ruleNumber: 5,
        options: [
          { value: 'ingresa_con_otro_camion',   label: 'Ingresa a descargar mientras otro equipo opera al interior del camión',          severity: 'GRAVE'  },
          { value: 'abre_cortina_antes',        label: 'Abre cortina de andén previo a la finalización del posicionamiento del camión',  severity: 'NORMAL' },
          { value: 'no_informa_dano_anden',     label: 'No informa desperfectos o daños en cortina o plataforma de andén',              severity: 'NORMAL' },
          { value: 'no_verifica_acople',        label: 'No verifica el correcto acople camión/andén antes de comenzar',                 severity: 'NORMAL' },
          { value: 'no_prioriza_electrico',     label: 'No prioriza la utilización de equipo rodante eléctrico sobre el manual',        severity: 'NORMAL' },
          { value: 'descarga_manual_sin_ayuda', label: 'Realiza descarga de camión rampla con transpaleta manual sin apoyo',            severity: 'NORMAL' },
          { value: 'descarga_sin_control',      label: 'Realiza descarga sin controlar velocidad, espacio y ruta de desplazamiento',    severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q32: {
        id: 'Q32', section: 'VERIFICACIÓN — REGLA N°6 OP', order: 32,
        label: 'REGLA N°6: Aplica técnicas seguras de manejo manual de carga y utiliza ayudas mecánicas',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'OP', ruleNumber: 6, branching: true,
        conductasList: [
          'El colaborador observado aplica técnicas correctas para el manejo manual de cargas, objetos y cajas.',
          'El colaborador observado utiliza ayudas mecánicas para la manipulación de cargas.',
          'El colaborador observado evita tomar cajas de producto desde los zunchos.',
          'El colaborador observado deposita productos y herramientas de forma adecuada.',
          'El colaborador observado evita lanzar cajas o pallets al suelo.',
          'El colaborador observado evita arrastrar pallets o transportarlos sobre los hombros.',
          'El colaborador observado no transporta más de un producto de forma manual.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q33' },
        ],
      },

      Q33: {
        id: 'Q33', section: 'VERIFICACIÓN — REGLA N°6 OP', order: 33,
        label: 'Conductas observadas — REGLA N°6',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'OP', ruleNumber: 6,
        options: [
          { value: 'tecnica_incorrecta',  label: 'No aplica técnica correcta de manejo manual de carga',          severity: 'NORMAL' },
          { value: 'sin_ayuda_mecanica',  label: 'No utiliza ayuda mecánica para la manipulación de carga',       severity: 'NORMAL' },
          { value: 'toma_por_zunchos',    label: 'Toma caja con productos desde los zunchos',                     severity: 'NORMAL' },
          { value: 'deposita_inadecuado', label: 'Deposita productos, objetos o herramientas de forma inadecuada',severity: 'NORMAL' },
          { value: 'lanza_caja_pallet',   label: 'Lanza caja con producto al pallet o lanza pallet al suelo',     severity: 'GRAVE'  },
          { value: 'transporta_hombros',  label: 'Transporta pallets sobre los hombros',                          severity: 'GRAVE'  },
          { value: 'transporta_mas_uno',  label: 'Transporta más de un producto de forma manual',                 severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q34: {
        id: 'Q34', section: 'VERIFICACIÓN — REGLA N°7 OP', order: 34,
        label: 'REGLA N°7: Trabaja de manera responsable, sin hacer bromas o acciones inseguras',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'OP', ruleNumber: 7, branching: true,
        conductasList: [
          'El colaborador observado no realiza bromas con o hacia sus compañeros de trabajo.',
          'El colaborador observado utiliza sus equipos de trabajo de forma adecuada.',
          'El colaborador observado no lanza cajas, herramientas u objetos a los compañeros.',
          'El colaborador observado posiciona los pallets de forma adecuada.',
          'El colaborador observado no utiliza pallets en mal estado.',
          'El colaborador observado no obstruye pasillos, extintores, salidas o sistemas de emergencia.',
          'El colaborador observado no retira manualmente cajas apiladas en altura en los racks.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q35' },
        ],
      },

      Q35: {
        id: 'Q35', section: 'VERIFICACIÓN — REGLA N°7 OP', order: 35,
        label: 'Conductas observadas — REGLA N°7',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'OP', ruleNumber: 7,
        options: [
          { value: 'realiza_bromas',          label: 'Realiza broma al compañero o con el compañero',                          severity: 'GRAVE'  },
          { value: 'equipos_inadecuados',     label: 'Utiliza equipos de trabajo de forma inadecuada',                         severity: 'NORMAL' },
          { value: 'lanza_objetos_companero', label: 'Lanza producto, caja, objeto o herramienta al compañero',                severity: 'GRAVE'  },
          { value: 'pallet_inadecuado',       label: 'Posiciona pallet de forma inadecuada',                                   severity: 'NORMAL' },
          { value: 'pallet_mal_estado',       label: 'Utiliza pallet en mal estado',                                           severity: 'GRAVE'  },
          { value: 'obstruye_pasillo',        label: 'Obstruye pasillo, extintor, salidas o sistemas de emergencia',           severity: 'NORMAL' },
          { value: 'retira_cajas_altura',     label: 'Retira manualmente cajas apiladas en altura en racks',                   severity: 'GRAVE'  },
        ],
        nextQuestion: 'Q47',
      },

      // ── Bloque 3: Reglas ADM (Q36–Q45) ─────────────────────────────────

      Q36: {
        id: 'Q36', section: 'VERIFICACIÓN — REGLA N°1 ADM', order: 36,
        label: 'REGLA N°1: Transitar siempre atento a las condiciones del entorno y por zonas habilitadas',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'ADM', ruleNumber: 1, branching: true,
        conductasList: [
          'El colaborador observado transita siempre por zonas habilitadas y/o demarcadas.',
          'El colaborador observado no transita corriendo o apresurado por el área.',
          'El colaborador observado no transita por superficies con presencia de agua.',
          'El colaborador observado utiliza el pasamanos al descender o ascender escaleras.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q37' },
        ],
      },

      Q37: {
        id: 'Q37', section: 'VERIFICACIÓN — REGLA N°1 ADM', order: 37,
        label: 'Conductas observadas — REGLA N°1 ADM',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'ADM', ruleNumber: 1,
        options: [
          { value: 'zona_no_habilitada', label: 'Transita por zona no habilitada o sin demarcar',          severity: 'NORMAL' },
          { value: 'transita_corriendo', label: 'Transita corriendo o apresurado por el área',             severity: 'NORMAL' },
          { value: 'superficie_agua',    label: 'Transita por superficies con presencia de agua',          severity: 'NORMAL' },
          { value: 'sin_pasamanos',      label: 'No utiliza pasamanos al ascender o descender escaleras',  severity: 'GRAVE'  },
        ],
        nextQuestion: 'Q47',
      },

      Q38: {
        id: 'Q38', section: 'VERIFICACIÓN — REGLA N°2 ADM', order: 38,
        label: 'REGLA N°2: Utiliza siempre equipos eléctricos que se encuentren en buen estado',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'ADM', ruleNumber: 2, branching: true,
        conductasList: [
          'El colaborador observado verifica el estado del equipo eléctrico antes de utilizarlo.',
          'El colaborador observado no utiliza equipos eléctricos en mal estado o dañados.',
          'El colaborador observado reporta inmediatamente equipos eléctricos en mal estado.',
          'El colaborador observado no improvisa reparaciones en equipos eléctricos.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q39' },
        ],
      },

      Q39: {
        id: 'Q39', section: 'VERIFICACIÓN — REGLA N°2 ADM', order: 39,
        label: 'Conductas observadas — REGLA N°2 ADM',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'ADM', ruleNumber: 2,
        options: [
          { value: 'equipo_mal_estado',    label: 'Utiliza equipo eléctrico en mal estado o dañado',    severity: 'GRAVE'  },
          { value: 'no_verifica_estado',   label: 'No verifica el estado del equipo antes de usarlo',   severity: 'NORMAL' },
          { value: 'no_reporta_falla',     label: 'No reporta equipo eléctrico en mal estado',          severity: 'NORMAL' },
          { value: 'improvisa_reparacion', label: 'Improvisa reparaciones en equipos eléctricos',       severity: 'GRAVE'  },
        ],
        nextQuestion: 'Q47',
      },

      Q40: {
        id: 'Q40', section: 'VERIFICACIÓN — REGLA N°3 ADM', order: 40,
        label: 'REGLA N°3: Nunca intervenir instalaciones eléctricas',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'ADM', ruleNumber: 3, branching: true,
        conductasList: [
          'El colaborador observado no interviene ni manipula instalaciones eléctricas.',
          'El colaborador observado no abre tableros o canaletas eléctricas sin autorización.',
          'El colaborador observado reporta inmediatamente cualquier anomalía eléctrica.',
          'El colaborador observado mantiene distancia segura de instalaciones eléctricas expuestas.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q41' },
        ],
      },

      Q41: {
        id: 'Q41', section: 'VERIFICACIÓN — REGLA N°3 ADM', order: 41,
        label: 'Conductas observadas — REGLA N°3 ADM',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'ADM', ruleNumber: 3,
        options: [
          { value: 'interviene_instalacion', label: 'Interviene o manipula instalaciones eléctricas',           severity: 'GRAVE'  },
          { value: 'abre_tablero',           label: 'Abre tablero o canaleta eléctrica sin autorización',       severity: 'GRAVE'  },
          { value: 'no_reporta_anomalia',    label: 'No reporta anomalía eléctrica detectada',                  severity: 'NORMAL' },
          { value: 'sin_distancia',          label: 'No mantiene distancia segura de instalaciones eléctricas', severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q42: {
        id: 'Q42', section: 'VERIFICACIÓN — REGLA N°4 ADM', order: 42,
        label: 'REGLA N°4: Reportar siempre que se observen condiciones inseguras en el puesto de trabajo',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'ADM', ruleNumber: 4, branching: true,
        conductasList: [
          'El colaborador observado reporta condiciones inseguras a su jefatura inmediatamente.',
          'El colaborador observado utiliza los canales formales de reporte disponibles.',
          'El colaborador observado no normaliza condiciones inseguras en su entorno.',
          'El colaborador observado corrige condiciones inseguras menores dentro de su alcance.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q43' },
        ],
      },

      Q43: {
        id: 'Q43', section: 'VERIFICACIÓN — REGLA N°4 ADM', order: 43,
        label: 'Conductas observadas — REGLA N°4 ADM',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'ADM', ruleNumber: 4,
        options: [
          { value: 'no_reporta_condicion', label: 'No reporta condición insegura observada a su jefatura', severity: 'GRAVE'  },
          { value: 'no_usa_canal_formal',  label: 'No utiliza canal formal de reporte',                    severity: 'NORMAL' },
          { value: 'normaliza_riesgo',     label: 'Normaliza o ignora condición insegura detectada',       severity: 'NORMAL' },
        ],
        nextQuestion: 'Q47',
      },

      Q44: {
        id: 'Q44', section: 'VERIFICACIÓN — REGLA N°5 ADM', order: 44,
        label: 'REGLA N°5: Mantener una postura de trabajo adecuada',
        subtitle: 'Observe las conductas y marque el resultado:',
        type: 'radio', required: true, profile: 'ADM', ruleNumber: 5, branching: true,
        conductasList: [
          'El colaborador observado mantiene una postura ergonómica al trabajar sentado.',
          'El colaborador observado ajusta la silla y monitor a su medida antes de trabajar.',
          'El colaborador observado realiza pausas activas durante la jornada.',
          'El colaborador observado no mantiene posturas forzadas de forma prolongada.',
        ],
        options: [
          { value: 'SIN_OBSERVACIONES', label: 'SIN OBSERVACIONES', style: 'positive', nextQuestion: 'Q46' },
          { value: 'CON_OBSERVACIONES', label: 'CON OBSERVACIONES', style: 'negative', nextQuestion: 'Q45' },
        ],
      },

      Q45: {
        id: 'Q45', section: 'VERIFICACIÓN — REGLA N°5 ADM', order: 45,
        label: 'Conductas observadas — REGLA N°5 ADM',
        subtitle: 'Marque una o más conductas observadas. Las desviaciones en rojo son GRAVES.',
        type: 'checkbox', required: true, profile: 'ADM', ruleNumber: 5,
        options: [
          { value: 'postura_inadecuada',  label: 'Mantiene postura inadecuada de forma prolongada',                        severity: 'NORMAL' },
          { value: 'sin_ajuste_estacion', label: 'No ajusta estación de trabajo (silla, monitor) a su medida',             severity: 'NORMAL' },
          { value: 'sin_pausas_activas',  label: 'No realiza pausas activas durante la jornada',                           severity: 'NORMAL' },
          { value: 'postura_forzada',     label: 'Mantiene postura forzada de forma repetida o prolongada',                severity: 'GRAVE'  },
        ],
        nextQuestion: 'Q47',
      },

      // ── Bloque 4: Cierre (Q46–Q47) ──────────────────────────────────────

      Q46: {
        id: 'Q46', section: 'CIERRE', order: 46,
        label: '¿Se comunicó el resultado de la observación (sin desviaciones) al colaborador?',
        type: 'yesno', required: true,
        nextQuestion: 'END',
      },

      Q47: {
        id: 'Q47', section: 'CIERRE', order: 47,
        label: 'Describa las acciones correctivas acordadas con el colaborador',
        type: 'text', required: true,
        placeholder: 'Detalle los compromisos, plazos y responsables de las acciones correctivas…',
        nextQuestion: 'END',
      },
    },
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
