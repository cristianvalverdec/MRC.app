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

  // ── 7. PAUTA DE VERIFICACIÓN REGLAS DE ORO ───────────────────────────────
  'pauta-verificacion-reglas-oro': {
    id: 'pauta-verificacion-reglas-oro',
    title: 'Reglas de Oro',
    description: 'Verificación cumplimiento Reglas de Oro',
    sections: [

      // ── S1: DATOS GENERALES ───────────────────────────────────────────────
      {
        id: 'dg', title: 'DATOS GENERALES',
        questions: [
          { id: 'Q1', type: 'select', label: 'Instalación donde se realizará la Verificación de Reglas Oro', required: true, placeholder: 'Selecciona la instalación', options: ['Arica','Iquique','Calama','Antofagasta','Copiapó','Coquimbo','Hijuelas','San Antonio','Viña del Mar','Miraflores','Huechuraba','Lo Espejo','Rancagua','Curicó','Talca','Chillán','Los Ángeles','Concepción','Temuco','Valdivia','Osorno','Puerto Montt','Castro','Coyhaique','Punta Arenas','San Felipe','Oficina Central','Oficina Vespucio'] },
          { id: 'Q2', type: 'select', label: 'Cargo', required: true, placeholder: 'Selecciona el cargo', options: ['Gerente','Subgerente','Jefe de Zona','Jefe de Operaciones','Jefe Administrativo','Jefe de Frigorífico','Jefe de Despacho','Ayudante de Despacho','Comité Paritario','SSO','Coordinador SIG Sucursales','Experto ACHS','Colaborador Sucursal'] },
          { id: 'Q3',  type: 'text', label: 'Nombre GERENTE',                              required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q4',  type: 'text', label: 'Nombre SUBGERENTE',                           required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q5',  type: 'text', label: 'Nombre JEFE DE ZONA',                         required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q6',  type: 'text', label: 'Nombre JEFE DE OPERACIONES',                  required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q7',  type: 'text', label: 'Nombre JEFE ADMINISTRATIVO',                  required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q8',  type: 'text', label: 'Nombre JEFE DE FRIGORÍFICO',                  required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q9',  type: 'select', label: 'Equipo del colaborador observado', required: true, options: ['Foodservice','Venta Digital','Norte','Centro','Santiago','Sur','Servicio al Cliente'] },
          { id: 'Q10', type: 'text', label: 'Nombre JEFE O AYUDANTE DE DESPACHO',          required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q11', type: 'text', label: 'Cargo del Observador de la Pauta',            required: true, placeholder: 'Escriba el cargo' },
          { id: 'Q12', type: 'text', label: 'Nombre del Observador de la Pauta',           required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q13', type: 'text', label: 'Nombre OBSERVADOR COMITÉ PARITARIO',          required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q14', type: 'text', label: 'Nombre OBSERVADOR EQUIPO SSO',                required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q15', type: 'text', label: 'Nombre OBSERVADOR ACHS',                      required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q16', type: 'text', label: 'Nombre COORDINADOR SIGAS / JEFE DE CALIDAD',  required: true, placeholder: 'Escriba el nombre completo' },
          { id: 'Q17', type: 'text', label: 'Nombre COLABORADOR SUCURSAL',                 required: true, placeholder: 'Escriba el nombre completo' },
        ],
      },

      // ── S2: CONFIGURACIÓN ─────────────────────────────────────────────────
      {
        id: 'cfg', title: 'CONFIGURACIÓN',
        questions: [
          { id: 'Q18', type: 'select', label: 'Área en la que verificará el cumplimiento de las Reglas de Oro', required: true, options: ['Área Administrativa Sucursal','Área Operaciones Sucursal'] },
          { id: 'Q19', type: 'select', label: 'Turno observado', required: true, options: ['Mañana','Tarde','Noche'] },
          { id: 'Q20', type: 'select', label: 'Regla de Oro que Verificará — OPERACIONES', required: true,
            placeholder: 'Selecciona la Regla de Oro',
            visibleWhen: (a) => a.Q18 === 'Área Operaciones Sucursal',
            options: ['N°1 Elementos de Protección Personal (OP)','N°2 Transito Interior Frigorífico (OP)','N°3 Operación de Equipo Rodante (OP)','N°4 Almacenamiento en Altura (OP)','N°5 Carga y Descarga de Camiones (OP)','N°6 Manejo Manual de Cargas (OP)','N°7 Trabajo Responsable, sin hacer Bromas o Acciones Inseguras (OP)'] },
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

      // ── S10-S14: REGLAS ADMINISTRACIÓN ───────────────────────────────────
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

      // ── S15: CIERRE ───────────────────────────────────────────────────────
      {
        id: 'cierre', title: 'CIERRE',
        visibleWhen: (a) => {
          const rqs = ['Q22','Q24','Q26','Q28','Q30','Q32','Q34','Q36','Q38','Q40','Q42','Q44']
          return rqs.some(q => a[q] != null)
        },
        questions: [
          { id: 'Q46', type: 'yesno', required: true,
            label: '¿Se comunicó el resultado de la observación (sin desviaciones) al colaborador?',
            visibleWhen: (a) => {
              const rqs = ['Q22','Q24','Q26','Q28','Q30','Q32','Q34','Q36','Q38','Q40','Q42','Q44']
              return rqs.some(q => a[q] === 'SIN_OBSERVACIONES')
            },
          },
          { id: 'Q47', type: 'text', required: true,
            label: 'Describa las acciones correctivas acordadas con el colaborador',
            placeholder: 'Detalle los compromisos, plazos y responsables de las acciones correctivas…',
            visibleWhen: (a) => {
              const rqs = ['Q22','Q24','Q26','Q28','Q30','Q32','Q34','Q36','Q38','Q40','Q42','Q44']
              return rqs.some(q => a[q] === 'CON_OBSERVACIONES')
            },
          },
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
