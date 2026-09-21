export type SpainDoctoralGuideSource = {
  id: string;
  title: string;
  publisher: string;
  url: string;
  checkedAt: string;
  sourceDate?: string;
  scope: string;
};

type SpainDoctoralGuideEvidence = {
  sourceIds?: string[];
  /** Advice and examples created by TRAMA, not an institutional requirement. */
  editorial?: boolean;
};

export type SpainDoctoralGuideBlock = SpainDoctoralGuideEvidence & (
  | { kind: 'paragraph'; text: string }
  | { kind: 'list'; title?: string; ordered?: boolean; items: string[] }
  | { kind: 'callout'; tone: 'note' | 'decision'; title: string; text: string }
  | { kind: 'table'; title?: string; columns: string[]; rows: string[][] }
  | { kind: 'template'; title: string; text: string }
  | { kind: 'checklist'; title?: string; items: string[] }
);

export type SpainDoctoralGuideSection = {
  id: string;
  title: string;
  summary: string;
  blocks: SpainDoctoralGuideBlock[];
};

export type SpainDoctoralGuide = {
  title: string;
  description: string;
  reviewedAt: string;
  scope: string;
  sections: SpainDoctoralGuideSection[];
  sources: SpainDoctoralGuideSource[];
};

export const spainDoctoralGuide: SpainDoctoralGuide = {
  title: 'Tu camino al doctorado desde España',
  description: 'De la primera experiencia investigadora a una candidatura con grupo, admisión y financiación: datos, inteligencia artificial, estadística, informática y matemáticas aplicadas.',
  reviewedAt: '2026-09-21',
  scope: 'Para personas que viven en España, con cualquier nacionalidad y con estudios españoles o extranjeros. El acceso descrito es al doctorado español; una candidatura en otro país exige revisar sus reglas. Las recomendaciones y ejemplos de TRAMA se distinguen de los requisitos oficiales. La escuela de doctorado decide sobre el expediente individual.',
  sections: [
    {
      id: 'decidir',
      title: '1. Decide qué quieres investigar y qué necesitas resolver',
      summary: 'Separa cuatro decisiones: preparación, acceso, equipo y financiación. Se pueden trabajar en paralelo.',
      blocks: [
        { kind: 'paragraph', text: 'Un doctorado busca producir investigación original. Antes de elegir una etiqueta como IA, concreta una pregunta que quieras entender: cómo estimar efectos con datos observacionales, cómo evaluar modelos fuera de distribución, cómo resolver un problema de optimización o cómo construir sistemas fiables. El resultado no se conoce de antemano; la tesis exige aprender a formular, contrastar y revisar explicaciones.', sourceIds: ['rd99'], editorial: true },
        { kind: 'table', columns: ['Decisión', 'Qué compruebas', 'Qué no demuestra'], rows: [
          ['Acceso académico', 'Que tus títulos cumplen una vía legal de entrada.', 'Que un programa vaya a seleccionarte.'],
          ['Admisión', 'Que la comisión acepta tu candidatura y sus condiciones.', 'Que exista un salario o una ayuda concedida.'],
          ['Supervisión', 'Que hay una persona y un equipo adecuados y disponibles.', 'Que un correo favorable sustituya a la admisión formal.'],
          ['Financiación', 'Quién contrata o paga, qué cubre y durante cuánto tiempo.', 'Que la matrícula o la autorización de trabajo estén resueltas.'],
        ], editorial: true },
        { kind: 'list', title: 'Elige tu siguiente paso', items: [
          'Si todavía dudas de si disfrutas investigando, busca un TFG/TFM supervisado, una colaboración acotada o una estancia con una pregunta concreta.',
          'Si ya has investigado y cumples el acceso, compara grupos y procesos de selección; no añadas otro máster solo por acumular títulos.',
          'Si necesitas ingresos desde el inicio, prioriza contratos anunciados y registra qué financiación está concedida, solicitada o sin identificar.',
          'Si consideras Europa, compara ofertas concretas con la misma matriz: supervisor, proyecto, contrato, coste de vida y requisitos del país. Vivir en España no determina tu elegibilidad fuera de ella.',
        ], editorial: true },
      ],
    },
    {
      id: 'acceso',
      title: '2. Comprueba tu vía de acceso',
      summary: 'El artículo 6 del RD 99/2011 ofrece varias vías. Los créditos por sí solos no bastan.',
      blocks: [
        { kind: 'paragraph', text: 'La vía general exige Grado oficial español o equivalente y Máster universitario o equivalente, con al menos 300 ECTS entre ambos. Existe otra vía con títulos oficiales españoles o equivalentes que sumen al menos 300 ECTS y acrediten nivel MECES 3. También se contemplan otro doctorado y determinados supuestos de formación sanitaria especializada.', sourceIds: ['rd99'] },
        { kind: 'table', title: 'Cómo interpretar situaciones frecuentes', columns: ['Tu situación', 'Comprobación necesaria'], rows: [
          ['Grado español de 240 ECTS + máster universitario de 60 ECTS', 'Es el ejemplo habitual de la vía general. Comprueba títulos terminados y requisitos del programa.'],
          ['Doble grado con más de 300 ECTS', 'La suma no acredita por sí sola nivel MECES 3. Pide confirmación documental de tu vía de acceso.'],
          ['Licenciatura, ingeniería u otra titulación anterior', 'Consulta su correspondencia de nivel y la documentación que pide la escuela; no presupongas que necesitas otro máster.'],
          ['Máster todavía en curso', 'Pregunta si aceptan preinscripción o admisión condicionada, y cuándo debes acreditar el título. No todas las convocatorias tienen el mismo momento de comprobación.'],
          ['Título extranjero', 'Aplica la vía específica del sistema de origen, explicada en la sección de títulos extranjeros; no traslades automáticamente una suma española de ECTS.'],
        ], sourceIds: ['rd99', 'uam-access', 'upf-tic'], editorial: true },
        { kind: 'callout', tone: 'note', title: 'Acceso y admisión tienen requisitos distintos', text: 'La comisión puede añadir criterios de selección, aval de dirección y complementos formativos. No existe en esta norma una nota de admisión única para toda España ni una exigencia universal de publicaciones previas. Solicita los criterios del programa concreto y las condiciones de sus complementos.', sourceIds: ['rd99', 'uc3m-cs'] },
        { kind: 'template', title: 'Consulta útil a la escuela de doctorado', text: 'Tengo [título, universidad, país, año y créditos o duración]. Adjunto [títulos y expediente]. Quiero solicitar [programa]. ¿Qué vía de acceso corresponde a mi expediente, qué documento acredita el nivel y qué debo tener finalizado al solicitar y al matricularme? Si procede, ¿qué complementos formativos se exigirían y cuál sería su coste?', editorial: true },
      ],
    },
    {
      id: 'master',
      title: '3. Elige un máster que resuelva acceso y preparación',
      summary: 'Comprueba primero la oficialidad; después, el trabajo de investigación que realmente podrás hacer.',
      blocks: [
        { kind: 'paragraph', text: 'Para un título español, consulta en el RUCT la denominación exacta, universidad, nivel y estado del título. Que una universidad sea oficial no convierte todos sus cursos en títulos oficiales. La formación permanente o título propio no sustituye al Máster universitario en la vía ordinaria de acceso al doctorado.', sourceIds: ['ruct', 'uam-propio'] },
        { kind: 'callout', tone: 'note', title: 'Oficialidad y orientación investigadora responden a preguntas diferentes', text: 'Un máster puede cumplir la función académica de acceso y ofrecer poca experiencia investigadora en tu tema. También puede enseñar habilidades útiles sin resolver ese acceso. Verifica ambas cosas por separado; no decidas únicamente por las palabras research, inteligencia artificial o prestigio del título.', editorial: true },
        { kind: 'checklist', title: 'Antes de reservar plaza', items: [
          'Identifica las líneas, docentes y grupos que pueden supervisar tu TFM. Pide ejemplos recientes de trabajos, sin asumir que todos estén publicados.',
          'Comprueba si el TFM permite formular una pregunta, estudiar literatura, justificar métodos y discutir límites; distingue esa posibilidad de unas prácticas o un producto profesional.',
          'Pregunta cuándo se asigna supervisor, si hay plazas limitadas por línea y si puedes desarrollar el trabajo con un centro externo.',
          'Revisa las bases que necesitas: probabilidad e inferencia, álgebra y optimización, algoritmos y programación, según el problema que quieras investigar.',
          'Calcula matrícula, dedicación, presencialidad y gastos. Una beca parcial de matrícula no cubre por sí sola vivir durante el curso.',
          'Consulta a la escuela doctoral cómo valora ese itinerario; una recomendación comercial del máster no es una resolución de admisión.',
        ], editorial: true },
        { kind: 'paragraph', text: 'Un buen TFM puede convertirse en una muestra de escritura, un repositorio reproducible y una referencia académica. No necesitas prometer que terminará en artículo: la calidad del razonamiento, el trabajo documentado y la relación con el supervisor también permiten evaluar tu preparación.', editorial: true },
      ],
    },
    {
      id: 'extranjero',
      title: '4. Si tus títulos o tu situación administrativa son extranjeros',
      summary: 'El país del título, la nacionalidad y la autorización de residencia son datos diferentes.',
      blocks: [
        { kind: 'table', columns: ['Sistema del título', 'Vía recogida en la norma española'], rows: [
          ['EEES, fuera de España', 'Título de nivel 7 del Marco Europeo de Cualificaciones que permita acceder al doctorado en el país expedidor, sin homologación previa.'],
          ['Fuera del EEES', 'La universidad comprueba equivalencia formativa con un máster universitario español y que el título permite el doctorado en origen, sin exigir homologación como condición general de esta vía.'],
        ], sourceIds: ['rd99'] },
        { kind: 'paragraph', text: 'La aceptación para entrar al doctorado no homologa el título ni lo reconoce automáticamente para otros fines. La UAM, por ejemplo, pide acreditar que la titulación permite acceder al doctorado en origen y establece reglas de legalización y traducción. Los idiomas aceptados y los documentos varían: pide la lista exacta al centro receptor.', sourceIds: ['uam-access'] },
        { kind: 'list', title: 'Prepara tres expedientes separados', items: [
          'Académico: títulos, expediente con calificaciones y carga de estudios, certificado de acceso al doctorado en origen y, cuando proceda, legalización, apostilla o traducción.',
          'Financiación: documentos que exige cada ayuda, fecha de terminación, nota, ayudas previas y criterios territoriales o personales. No deduzcas elegibilidad de tener un NIE o domicilio en España.',
          'Contratación y residencia: documento que permite tu actividad concreta, fecha de caducidad y trámite necesario antes de incorporarte. Coordínalo con recursos humanos y la oficina internacional del centro.',
        ], editorial: true },
        { kind: 'paragraph', text: 'La declaración ministerial de equivalencia de nota media sirve para procedimientos competitivos que valoran expedientes extranjeros. Es un trámite distinto de la homologación o de la comprobación de acceso doctoral; confirma si la convocatoria lo exige y cómo debe presentarse.', sourceIds: ['notas'] },
        { kind: 'callout', tone: 'note', title: 'La admisión no resuelve por sí sola el permiso para trabajar', text: 'El Ministerio de Inclusión describe autorizaciones de residencia y trabajo para investigación para nacionales de terceros países, con modalidades y requisitos específicos. La situación aplicable depende de tus documentos y del centro. Pide una comprobación individual antes de fijar la incorporación; no confundas residencia, estancia por estudios y autorización para la actividad contratada.', sourceIds: ['migraciones'] },
      ],
    },
    {
      id: 'grupo',
      title: '5. Elige una pregunta, un grupo y una supervisión',
      summary: 'La calidad de la experiencia cotidiana importa tanto como el nombre de la institución.',
      blocks: [
        { kind: 'paragraph', text: 'La dirección guía la investigación; la tutoría, vinculada al programa, conecta con su comisión académica. Pueden coincidir en una persona. La UAM requiere identificar un investigador que avale la solicitud; UPF TIC considera muy favorable una carta de apoyo, pero la presenta como opcional al solicitar. El procedimiento depende del programa.', sourceIds: ['uam-access', 'upf-tic'] },
        { kind: 'list', title: 'Haz una selección pequeña y argumentada', ordered: true, items: [
          'Parte de dos o tres preguntas que te interesen y localiza trabajos recientes. Lee método, resultados y limitaciones, no solo el resumen o la posición de la universidad.',
          'Identifica quién realiza ese trabajo hoy y si pertenece al programa que te interesa. Un centro puede emplearte y otro expedir el título: aclara esa relación.',
          'Busca continuidad: tesis dirigidas, proyectos, código o datos, colaboración y formación. Un indicador por disciplina ayuda a orientarte; no mide disponibilidad ni calidad de supervisión individual.',
          'Habla con posibles supervisores y, cuando sea posible, con doctorandos actuales o recientes. Contrasta cómo trabajan y qué sucede cuando un experimento no funciona.',
        ], editorial: true },
        { kind: 'checklist', title: 'Preguntas para una conversación con el grupo', items: [
          '¿Quién supervisaría el trabajo de forma cotidiana y con qué frecuencia habría reuniones?',
          '¿El proyecto está financiado, en evaluación o por preparar? ¿Qué parte de la tesis puedo definir?',
          '¿Tendré datos, permisos, cómputo y formación para empezar? ¿Quién paga almacenamiento, viajes y publicaciones?',
          '¿Qué esperan durante los primeros seis meses? ¿Cómo se evalúa el progreso y se cambia una hipótesis inviable?',
          '¿Cómo acuerdan autoría, uso de código y datos, presencialidad, colaboración docente y resolución de desacuerdos?',
          '¿Qué resultados recientes de tesis y trayectorias de egresados puedo revisar sin confundirlos con una garantía laboral?',
        ], editorial: true },
        { kind: 'callout', tone: 'decision', title: 'Señales que merecen una aclaración antes de comprometerte', text: 'Una financiación indefinida, una carga de trabajo sin límites o una promesa de publicaciones garantizadas necesitan respuestas concretas. Pide condiciones por escrito y distingue lo aprobado de lo que todavía depende de otra convocatoria.', editorial: true },
      ],
    },
    {
      id: 'experiencia',
      title: '6. Construye experiencia antes de matricularte',
      summary: 'La mejor prueba de interés es un trabajo acotado que puedas explicar y revisar.',
      blocks: [
        { kind: 'table', columns: ['Vía', 'Qué puede aportarte', 'Qué debes acordar'], rows: [
          ['TFG o TFM', 'Una pregunta, un método, escritura y una primera referencia académica.', 'Supervisión, alcance, calendario y acceso a recursos.'],
          ['Contrato o colaboración de apoyo a investigación', 'Experiencia con datos, software, experimentos o trabajo en equipo.', 'Tareas, remuneración, duración y cuánto trabajo será realmente investigador.'],
          ['Estancia o iniciación', 'Probar una línea y conocer un grupo durante un periodo delimitado.', 'Plan, tutor, financiación, seguro y resultado esperado.'],
          ['Escuela de verano', 'Formación y contacto con investigadores.', 'Nivel, selección, costes y becas; asistir no equivale a realizar un proyecto supervisado.'],
        ], editorial: true },
        { kind: 'paragraph', text: 'JAE Intro ofrece una vía real de iniciación: el IIIA-CSIC publicó en 2026 planes de investigación en IA dentro de este programa. Esa edición tenía criterios de estudios y expediente y cerró su solicitud en abril. Es un ejemplo para reconocer el tipo de oportunidad, no una plaza que aquí se anuncie como abierta.', sourceIds: ['jae-iiia'] },
        { kind: 'callout', tone: 'note', title: 'RA es una descripción del puesto, no una garantía de doctorado', text: 'Research assistant puede significar apoyo científico, técnico o de datos. Comprueba la modalidad contractual y el plan real. El EPIF distingue el contrato predoctoral de otras actividades o contrataciones no vinculadas a estudios doctorales; un puesto de apoyo no convierte automáticamente su trabajo en tesis.', sourceIds: ['epif'] },
        { kind: 'list', title: 'Muestra de trabajo que puedes preparar', items: [
          'Reproduce un resultado con datos accesibles y documenta entorno, decisiones, métricas y discrepancias.',
          'Introduce una comparación razonada: otra hipótesis, un baseline o un análisis de sensibilidad. Explica qué aprendiste cuando el resultado cambió.',
          'Entrega un informe breve y código legible, respetando licencias y confidencialidad. Identifica qué hiciste tú en un trabajo colectivo.',
          'Pide evaluación sobre método y comunicación. No necesitas convertir cada ejercicio en una supuesta publicación ni prolongar una colaboración indefinida sin condiciones claras.',
        ], editorial: true },
      ],
    },
    {
      id: 'financiacion',
      title: '7. Busca financiación con el proyecto y el centro',
      summary: 'Una convocatoria, una plaza financiada y una ayuda concedida son estados distintos.',
      blocks: [
        { kind: 'paragraph', text: 'FPU financia formación investigadora y docente mediante contrato predoctoral. Cada edición determina nota mínima, fechas de estudios y documentación. La convocatoria FPU 2025, tramitada en 2026, admitía determinadas situaciones de doctorado o máster y cerró el 27 de febrero de 2026. No uses ese plazo como calendario permanente ni como prueba de apertura actual.', sourceIds: ['fpu', 'fpu2025'] },
        { kind: 'paragraph', text: 'En los contratos vinculados a proyectos PID2025, frecuentemente llamados FPI, selecciona la entidad beneficiaria y la convocatoria del puesto debe difundirse en EURAXESS. La candidatura individual sigue el proceso del centro; el plazo de solicitud del proyecto a la AEI no es un plazo único para todas las personas candidatas. Las bases valoran trayectoria y adecuación al proyecto.', sourceIds: ['pid2025'] },
        { kind: 'table', title: 'Vías que conviene comparar', columns: ['Vía', 'Dónde actuar', 'Qué contrastar'], rows: [
          ['FPU', 'Convocatoria estatal y equipo/director con quien preparar la candidatura.', 'Elegibilidad de la edición, expediente, documentos y condiciones de incorporación.'],
          ['Predoctoral asociado a proyecto', 'Convocatoria oficial del centro y proyecto receptor.', 'Tema, criterios, presupuesto concedido y requisitos al contratar.'],
          ['Ayudas autonómicas, propias o de fundaciones', 'Entidad convocante y universidad receptora.', 'Vinculación territorial o institucional, nacionalidad/residencia cuando se exija e incompatibilidades.'],
          ['Doctorado industrial', 'Empresa u otra entidad y programa universitario.', 'Proyecto que dará lugar a la tesis, supervisión académica y condiciones de difusión y propiedad.'],
          ['Contratos europeos o de centros', 'Oferta concreta y procedimiento del empleador.', 'Movilidad, titulación, experiencia, duración y condiciones efectivas.'],
        ], editorial: true },
        { kind: 'paragraph', text: 'La convocatoria estatal de Doctorados Industriales 2025 financia actuaciones de cuatro años en entidades para proyectos de investigación industrial o desarrollo experimental que incorporen una tesis. No basta con trabajar en una empresa tecnológica: la tesis, su admisión y la convocatoria deben estar articuladas.', sourceIds: ['din2025'] },
        { kind: 'checklist', title: 'Lee la oferta económica completa', items: [
          'Salario bruto anual, número de pagas y convenio; no confundir la subvención total al empleador con tu salario.',
          'Duración financiada y fecha inicial; meses previos de contrato predoctoral y consecuencias sobre la duración restante.',
          'Tasas doctorales, estancias, congresos, equipo y posibles costes no cubiertos.',
          'Dedicación, docencia, incompatibilidades, residencia/trabajo y calendario de firma e incorporación.',
          'Qué documento acredita la concesión. Una solicitud pendiente no es financiación confirmada.',
        ], editorial: true },
      ],
    },
    {
      id: 'candidatura',
      title: '8. Prepara una candidatura concreta y comprobable',
      summary: 'Adapta el material a la línea y a la convocatoria. Los ejemplos siguientes son orientaciones propias.',
      blocks: [
        { kind: 'paragraph', text: 'Los programas no valoran todo igual. Ciencia y Tecnología Informática de UC3M publica criterios de encaje de perfil, expediente/CV y motivación/referencias. UPF TIC pide CV, motivación y una tesis de máster, artículos o propuesta, además de B2 de inglés; sus cartas de recomendación son opcionales. Estos son ejemplos institucionales, no requisitos universales.', sourceIds: ['uc3m-cs', 'upf-tic'] },
        { kind: 'list', title: 'Carpeta de candidatura', items: [
          'CV académico: formación y notas con escala, TFG/TFM y supervisor, experiencia investigadora, contribuciones propias, técnicas utilizadas e idiomas. Respeta el formato y extensión de la convocatoria.',
          'Muestra de trabajo: informe, repositorio o publicación, con una explicación breve de la pregunta, tu contribución, resultados y límites. Separa artículos publicados, aceptados, preprints y manuscritos en preparación.',
          'Motivación: por qué esa pregunta, por qué ese grupo y qué experiencia concreta te prepara. Relaciona uno o dos trabajos reales del equipo con tu interés.',
          'Referencias: pide permiso con tiempo a personas que conozcan tu trabajo. Facilita CV, convocatoria, plazo y un resumen de lo que hiciste; confirma si la carta se envía directamente y si es confidencial.',
          'Expediente administrativo: títulos, calificaciones, identidad y acreditaciones solicitadas. Reserva tiempo para certificados, traducciones y registros electrónicos.',
        ], editorial: true },
        { kind: 'template', title: 'Ejemplo propio de primer correo', text: 'Asunto: Posible candidatura doctoral sobre [tema] — [periodo]\n\nHola, [nombre]:\nSoy [formación actual] y estoy valorando un doctorado sobre [pregunta concreta]. En mi [TFM/proyecto] trabajé en [contribución propia verificable]. Me interesa su trabajo [referencia real] por [conexión concreta].\n\nQuerría saber si prevén incorporar doctorandos en esa línea y mediante qué proceso de admisión y financiación. Adjunto mi CV y [muestra breve o enlace pertinente]. Mi disponibilidad es [fecha] y tengo pendiente [condición académica, si procede].\n\nGracias por su tiempo,\n[nombre]', editorial: true },
        { kind: 'list', title: 'Propuesta inicial, si te la piden', items: [
          'Problema y vacío: qué no explica la literatura y por qué importa.',
          'Pregunta o hipótesis y alcance viable; no una lista de todas las tecnologías que te interesan.',
          'Método, datos o demostraciones, comparaciones y criterio de evaluación.',
          'Recursos necesarios, riesgos y alternativa si falla el enfoque inicial.',
          'Encaje con el equipo y primeras etapas. Ajusta extensión y detalle a las instrucciones: no hay un número universal de páginas.',
        ], editorial: true },
        { kind: 'callout', tone: 'note', title: 'Ejemplo propio de concreción', text: 'En lugar de «quiero aplicar IA a la salud», podrías plantear «quiero estudiar cómo cambia la calibración de un clasificador al variar la prevalencia entre centros». A continuación necesitas justificar datos accesibles, comparación, límites y supervisión. Es un ejemplo de formulación, no una propuesta validada ni una promesa de acceso a datos sanitarios.', editorial: true },
      ],
    },
    {
      id: 'calendario',
      title: '9. Coordina tres calendarios',
      summary: 'Preparación, admisión y contrato pueden tener fechas diferentes. Cuenta hacia atrás desde cada cierre real.',
      blocks: [
        { kind: 'table', title: 'Plan orientativo, adaptable a tu situación', columns: ['Momento', 'Resultado que buscas'], rows: [
          ['Exploración', 'Confirmar vía de acceso, elegir preguntas y localizar grupos; detectar documentos lentos.'],
          ['Antes de solicitar', 'Conversaciones de encaje, muestra de trabajo y referencias; identificar procesos de financiación concretos.'],
          ['Al abrir la convocatoria', 'Releer bases de esa edición, completar documentos y adaptar candidatura.'],
          ['Tras enviar', 'Guardar justificante, vigilar notificaciones y subsanaciones, preparar entrevista y alternativas.'],
          ['Antes de aceptar', 'Obtener condiciones escritas y coordinar título terminado, matrícula, firma y permiso aplicable.'],
          ['Primeros meses', 'Acordar supervisión, plan viable, formación y fechas de seguimiento.'],
        ], editorial: true },
        { kind: 'paragraph', text: 'Haz una fila por proceso: programa, centro, supervisor, estado de financiación, apertura, cierre con zona horaria, fecha límite del título, referencias, entrevista, incorporación y fuente oficial. Añade una columna de próxima acción. La propuesta de un grupo y la solicitud formal deben figurar por separado.', editorial: true },
        { kind: 'callout', tone: 'decision', title: 'Si todavía no has terminado el máster', text: 'Pregunta cuándo debe constar el TFM defendido y el título o resguardo disponible. UPF TIC, por ejemplo, admite en la preinscripción documentación provisional y una declaración de finalización antes del inicio; esa posibilidad no se debe extrapolar a otra universidad, contrato o convocatoria.', sourceIds: ['upf-tic'] },
        { kind: 'paragraph', text: 'Puedes preparar candidaturas en paralelo sin presentar una ayuda pendiente como concedida. Antes de aceptar compromisos incompatibles, revisa las bases y comunica tu decisión mediante el procedimiento correspondiente. No abandones una alternativa útil solo por una conversación informal favorable.', editorial: true },
      ],
    },
    {
      id: 'escenarios',
      title: '10. Sitúa tu caso y el siguiente paso',
      summary: 'Los escenarios orientan decisiones; no sustituyen la evaluación del expediente ni predicen admisión.',
      blocks: [
        { kind: 'table', columns: ['Situación', 'Siguiente acción razonable', 'Error que evitar'], rows: [
          ['Acabo el grado y me interesa investigar', 'Busca un TFG supervisado y compara másteres oficiales por líneas de TFM y grupos.', 'Elegir un máster solo por el nombre o creer que la suma de cursos propios resuelve el acceso.'],
          ['Estoy en un máster oficial y ya tengo tema', 'Habla con grupos, termina una muestra de investigación y coordina admisión con contratos.', 'Esperar a defender el TFM para descubrir plazos y certificados.'],
          ['Tengo un máster profesional oficial', 'Comprueba acceso y evalúa lagunas concretas de investigación; negocia proyecto o formación útil.', 'Presuponer que necesitas obligatoriamente un segundo máster.'],
          ['Tengo un título propio o formación permanente', 'Pide evaluar tus otros títulos y determina si falta una vía académica válida.', 'Presentar el título propio como equivalente automático a un Máster universitario.'],
          ['Mis títulos son extranjeros y vivo en España', 'Solicita comprobación de acceso, documentos de origen y requisitos administrativos por separado.', 'Confundir vivir en España con tener título español o ciudadanía española.'],
          ['Trabajo y quiero cambiar a investigación', 'Prueba un problema acotado, comprueba acceso y compara dedicación parcial o transición a contrato.', 'Suponer que un predoctoral permite mantener otro empleo completo.'],
          ['No cumplo la nota de una ayuda', 'Comprueba si afecta a esa convocatoria; revisa otros procesos y evidencia que puedas aportar.', 'Convertir el umbral de una beca en una prohibición universal para doctorarte.'],
          ['Me admiten, pero no tengo financiación', 'Pide fechas, costes y alternativas concretas; decide con un presupuesto sostenible.', 'Matricularte esperando que el salario aparezca automáticamente después.'],
        ], editorial: true },
        { kind: 'paragraph', text: 'Si vienes de otra disciplina, explica qué puedes aportar y qué necesitas aprender. Una experiencia profesional con datos puede ser valiosa, pero conviene traducirla a preguntas, métodos y contribuciones evaluables. Algunas carencias se cubren con formación específica; otras afectan al encaje del proyecto y requieren una decisión del programa.', editorial: true },
      ],
    },
    {
      id: 'condiciones',
      title: '11. Entiende qué aceptas y qué pasa después',
      summary: 'El reloj académico y el de la financiación no siempre empiezan ni terminan a la vez.',
      blocks: [
        { kind: 'paragraph', text: 'El marco general actual prevé hasta cuatro años a tiempo completo o siete a tiempo parcial desde la matrícula al depósito, con autorización para la dedicación parcial y posibilidades reguladas de prórroga e interrupción. Existen plazos específicos por discapacidad. Confirma el régimen aplicable a tu cohorte y tu fecha individual; una ampliación académica no prolonga automáticamente el contrato.', sourceIds: ['rd99', 'uam-permanencia'] },
        { kind: 'paragraph', text: 'El contrato predoctoral es laboral y tiene finalidad investigadora y formativa. El EPIF regula su formalización, retribución y condiciones; las bases y el convenio pueden fijar condiciones más favorables. La colaboración docente tiene límites: no convierte al doctorando en sustituto de una carga docente ordinaria. Una beca de iniciación o exención de tasas tiene otra naturaleza.', sourceIds: ['epif'] },
        { kind: 'paragraph', text: 'Durante el primer año debe prepararse el plan de investigación y formación personal, y existe evaluación anual del progreso. La matrícula de tutela se renueva. La universidad debe contar con mecanismos de supervisión y resolución de conflictos: identifica dónde están antes de necesitarlos.', sourceIds: ['rd99'] },
        { kind: 'checklist', title: 'Antes de firmar o matricularte', items: [
          'Tengo por escrito quién dirigirá y tutorizará la tesis, dónde trabajaré y qué programa expedirá el título.',
          'Conozco salario o ayuda, duración, dedicación, costes de matrícula, recursos y lo que queda sin cubrir.',
          'He aclarado publicaciones, datos, autoría, propiedad intelectual y posibles restricciones de confidencialidad, especialmente en empresa.',
          'Sé cómo se evalúa el progreso y cómo solicitar cambios, bajas, apoyos o resolución de un conflicto.',
          'He preguntado por permisos, conciliación y ajustes que pueda necesitar, sin asumir que el trámite académico y el laboral sean el mismo.',
        ], editorial: true },
        { kind: 'callout', tone: 'note', title: 'El doctorado abre opciones, no garantiza una plaza académica', text: 'Valora qué capacidades quieres desarrollar y qué alternativas te interesan: investigación pública, universidad, I+D empresarial o trabajo especializado. Consulta trayectorias concretas del grupo y del programa; no conviertas un caso destacado ni un indicador institucional en una probabilidad personal de empleo.', editorial: true },
      ],
    },
    {
      id: 'checklist',
      title: '12. Tu lista de preparación',
      summary: 'Úsala para detectar el siguiente paso pendiente; no es una puntuación de elegibilidad.',
      blocks: [
        { kind: 'checklist', title: 'Base académica', items: [
          'He identificado la vía de acceso que corresponde a mis títulos y la he consultado si hay dudas.',
          'He comprobado la oficialidad del título español o la documentación exigida para mi título extranjero.',
          'Sé qué criterios adicionales, idioma y posibles complementos exige el programa.',
        ], editorial: true },
        { kind: 'checklist', title: 'Investigación y candidatura', items: [
          'Puedo explicar una pregunta que me interesa, un trabajo propio y sus limitaciones.',
          'Tengo grupos elegidos por razones concretas y he comprobado disponibilidad de supervisión.',
          'He preparado CV, muestra de trabajo y motivación sin exagerar publicaciones ni contribuciones.',
          'He hablado con mis posibles referentes y anotado sus plazos y procedimientos.',
        ], editorial: true },
        { kind: 'checklist', title: 'Viabilidad e incorporación', items: [
          'Distingo admisión, financiación solicitada, financiación concedida y contrato formalizado.',
          'Conozco los costes no cubiertos y la duración realmente financiada.',
          'He revisado condiciones de nacionalidad, residencia, movilidad o trabajo cuando son relevantes.',
          'Tengo calendario, justificantes y próximas acciones para cada solicitud.',
          'Antes de aceptar, he aclarado supervisión, recursos, dedicación y condiciones por escrito.',
        ], editorial: true },
        { kind: 'paragraph', text: 'No necesitas completar toda la lista para empezar a hablar con grupos. Sí necesitas saber qué falta, quién puede resolverlo y en qué fecha. Si la duda es sobre acceso, escribe a la escuela de doctorado; si es sobre el trabajo, al grupo; si es sobre contrato o permisos, a recursos humanos o a la oficina internacional.', editorial: true },
      ],
    },
  ],
  sources: [
    { id: 'rd99', title: 'RD 99/2011: enseñanzas oficiales de doctorado', publisher: 'Boletín Oficial del Estado', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2011-2541', checkedAt: '2026-09-21', sourceDate: 'Texto consolidado: última actualización publicada el 18/07/2023', scope: 'Marco estatal: artículos 3, 6, 7, 11 y 12. Diferencia acceso, admisión, supervisión y duración; el texto consolidado informa sobre las modificaciones y remite a las publicaciones oficiales.' },
    { id: 'uam-access', title: 'Acceso y admisión a doctorado', publisher: 'Escuela de Doctorado de la Universidad Autónoma de Madrid', url: 'https://www.uam.es/uam/posgrado/escuela-doctorado-uam/acceso-admision', checkedAt: '2026-09-21', scope: 'Aplicación institucional en UAM: aval de dirección, tutoría, documentos y títulos extranjeros. Sus trámites no se presentan como universales.' },
    { id: 'ruct', title: 'Registro de Universidades, Centros y Títulos', publisher: 'Ministerio de Ciencia, Innovación y Universidades', url: 'https://www.ciencia.gob.es/Universidades/RUCT.html', checkedAt: '2026-09-21', scope: 'Qué registra el RUCT y acceso a su consulta. La oficialidad debe comprobarse para el título concreto, no solo para la institución.' },
    { id: 'uam-propio', title: 'Preguntas frecuentes: máster universitario y formación permanente', publisher: 'Universidad Autónoma de Madrid', url: 'https://uam.es/CentroFormacionContinua/Preguntas-frecuentes/1446755822362.htm?language=es_ES&nodepath=Preguntas+frecuentes', checkedAt: '2026-09-21', scope: 'Distinción entre formación permanente/título propio y máster oficial, incluido su efecto sobre el acceso doctoral.' },
    { id: 'notas', title: 'Equivalencia de nota media de estudios extranjeros', publisher: 'Ministerio de Ciencia, Innovación y Universidades', url: 'https://www.ciencia.gob.es/Universidades/NotaMedia', checkedAt: '2026-09-21', scope: 'Finalidad de la declaración de equivalencia para procesos competitivos; no equivale a reconocimiento general del título.' },
    { id: 'migraciones', title: 'Hoja 68: residencia y trabajo para investigación', publisher: 'Ministerio de Inclusión, Seguridad Social y Migraciones', url: 'https://www.inclusion.gob.es/web/migraciones/w/68.-autorizacion-de-residencia-temporal-y-trabajo-para-investigacion', checkedAt: '2026-09-21', sourceDate: 'Agosto de 2026', scope: 'Información oficial orientativa para nacionales de terceros países; modalidades de autorización para investigación. La situación personal requiere comprobación individual.' },
    { id: 'upf-tic', title: 'Doctorado en Tecnologías de la Información y las Comunicaciones', publisher: 'Universitat Pompeu Fabra', url: 'https://www.upf.edu/es/web/doctorats/tecnologies-de-la-informacio-i-les-comunicacions', checkedAt: '2026-09-21', scope: 'Ejemplo concreto de documentación, nivel de inglés, cartas opcionales y preinscripción con máster en curso. No generalizar sus requisitos a otros programas.' },
    { id: 'uc3m-cs', title: 'Doctorado en Ciencia y Tecnología Informática', publisher: 'Universidad Carlos III de Madrid', url: 'https://www.uc3m.es/doctorado/ciencia-tecnologia-informatica', checkedAt: '2026-09-21', scope: 'Ejemplo de perfil de ingreso, posibles complementos y criterios de selección en informática.' },
    { id: 'jae-iiia', title: 'JAE Intro 2026: planes de iniciación a investigación en IA', publisher: 'Institut d’Investigació en Intel·ligència Artificial, CSIC', url: 'https://www.iiia.csic.es/en-us/news-events/page/?news_id=398', checkedAt: '2026-09-21', sourceDate: '12/03/2026; cierre de la edición: 11/04/2026', scope: 'Ejemplo de iniciación anterior al doctorado en un centro de IA. La edición citada está cerrada; no se extrapolan sus requisitos ni importes a futuras convocatorias.' },
    { id: 'fpu', title: 'Formación del Profesorado Universitario: información general', publisher: 'Ministerio de Ciencia, Innovación y Universidades', url: 'https://www.ciencia.gob.es/Universidades/FPU.html', checkedAt: '2026-09-21', scope: 'Finalidad investigadora y docente, contratación y requisitos que se concretan en cada edición.' },
    { id: 'fpu2025', title: 'Convocatoria FPU 2025 y modificaciones', publisher: 'Ministerio de Ciencia, Innovación y Universidades', url: 'https://www.ciencia.gob.es/Convocatorias/2026/FPU2025.html', checkedAt: '2026-09-21', sourceDate: 'Publicada en enero de 2026; modificaciones de febrero de 2026', scope: 'Situaciones académicas admitidas y plazo final de la edición 2025. La guía no reutiliza ese calendario para una convocatoria siguiente.' },
    { id: 'pid2025', title: 'Bases PID2025: actuaciones de formación predoctoral', publisher: 'Agencia Estatal de Investigación', url: 'https://www.aei.gob.es/sites/default/files/convocatory_info/assistants/2025-11/Resolucion%20convocatoria_ProyectosGeneraci%C3%B3nConocimiento_PID2025_.pdf', checkedAt: '2026-09-21', sourceDate: 'Convocatoria 2025', scope: 'Selección por la entidad, difusión en EURAXESS y criterios de trayectoria/encaje. Lectura de las páginas 26–31 y 33 del PDF oficial conservado y comprobado el 21/09/2026; las solicitudes web posteriores devolvieron 502.' },
    { id: 'din2025', title: 'Doctorados Industriales 2025', publisher: 'Agencia Estatal de Investigación', url: 'https://www.aei.gob.es/convocatorias/buscador-convocatorias/ayudas-contratos-formacion-doctores-doctoras-empresas-otras-11', checkedAt: '2026-09-21', sourceDate: 'Convocatoria 2025, solicitudes en enero–febrero de 2026', scope: 'Descripción oficial de actuaciones de cuatro años para entidades y tesis asociadas a investigación industrial o desarrollo experimental. No acredita una vacante individual.' },
    { id: 'epif', title: 'RD 103/2019: Estatuto del personal investigador predoctoral en formación', publisher: 'Boletín Oficial del Estado', url: 'https://www.boe.es/buscar/act.php?id=BOE-A-2019-3700', checkedAt: '2026-09-21', sourceDate: 'Texto consolidado: última actualización publicada el 11/12/2024', scope: 'Naturaleza laboral, ámbito de aplicación, objeto y condiciones del contrato predoctoral. Distinguirlo de becas o puestos de apoyo de otra modalidad.' },
    { id: 'uam-permanencia', title: 'Asuntos académico-administrativos del doctorado', publisher: 'Escuela de Doctorado de la Universidad Autónoma de Madrid', url: 'https://www.uam.es/uam/posgrado/escuela-doctorado-uam/asuntos-academico-administrativos', checkedAt: '2026-09-21', scope: 'Ejemplo institucional de dedicación, prórrogas, bajas y permanencia. Confirmar siempre régimen y fecha individual en la universidad receptora.' },
  ],
};
