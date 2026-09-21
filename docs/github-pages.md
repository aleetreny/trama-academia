# GitHub Pages, búsqueda y prestigio investigador

Sitio canónico: **https://aleetreny.github.io/trama-academia/**. La exportación estática de Next.js genera HTML para cada oportunidad, incluida su evidencia. GitHub Actions publica exclusivamente `out/`; la navegación no requiere un Worker, Neon ni servicios de ChatGPT. La adquisición y su historial siguen separados del sitio público.

## Ordenar con indicadores comparables

El criterio de prestigio es **fortaleza investigadora de la institución por disciplina**, no reputación general. El usuario elige informática, IA, estadística o matemáticas aplicadas. La ordenación predeterminada usa el índice existente de actividad e impacto; también puede ordenar por proporción de trabajos en el 10 % más citado, volumen, cierre, comprobación, institución o título.

Los tiers y el índice se mantienen exactamente como en la edición bibliométrica. La metodología, ventanas 2020–2024 y 2020–2022, denominadores, umbrales de muestra y referencias están en [Instituciones](https://aleetreny.github.io/trama-academia/instituciones/#metodo-tiers) y [su documentación](institution-discovery.md). La ausencia de datos queda al final al ordenar por indicadores, sin sustituirse por cero; los ceros medidos se conservan. Un tier institucional no acredita un programa o supervisor concreto.

La unión con el catálogo exige nombre o alias único y país; como alternativa, un dominio oficial único del mismo país. Las identidades ambiguas y las agrupaciones explícitas de varias instituciones no heredan el tier de un participante. Las tarjetas permiten desplegar los indicadores y abrir ROR, OpenAlex y el método. La cobertura varía por disciplina y aparece junto al buscador. No se inventan métricas para las instituciones sin muestra suficiente.

## Filtros que se pueden compartir

Etapa, destino, país de la entidad financiadora, área del programa, disciplina de los indicadores, tier —incluido T1 + T2—, tipo, vigencia, financiación, idioma mencionado y plazo. La consulta admite varias palabras y normaliza las tildes. La URL conserva los filtros, el orden y la página; restablecerlos devuelve la configuración inicial. Idioma mencionado no garantiza que toda la docencia se imparta en ese idioma; una beca o exención condicionada no implica cobertura garantizada.

## Carga y actualización

El buscador de oportunidades presenta país, área, financiación y vigencia como condiciones principales; los indicadores y los filtros especializados se despliegan aparte. Los chips permiten quitar un criterio sin restablecer toda la búsqueda. En móvil el panel se pliega y «Ver resultados» devuelve el foco a la lista. IA/AI e inteligencia artificial son equivalencias léxicas limitadas al título y los campos; ML y aprendizaje automático forman otro grupo. Las palabras cortas requieren límites de palabra para evitar coincidencias como IA dentro de Italia.

- El HTML inicial no contiene el catálogo completo. Los índices de oportunidades y financiación se descargan por separado y tienen nombres con huella de contenido.
- Solo se descargan las condiciones completas de los 12 resultados visibles, en paralelo; se conservan para comparar hasta tres fichas. Si falla una descarga, las demás permanecen disponibles y se puede reintentar la ficha afectada. La interfaz de comparación se carga al abrirla.
- El directorio institucional y el registro de fuentes tienen sus propios índices. Las fuentes de cada institución se descargan al desplegar su sección.
- Las tipografías WOFF2 están alojadas en el mismo sitio, con sus licencias OFL. No hay una solicitud inicial a Google Fonts.
- La primera lectura del manifiesto revalida su caché HTTP; los índices con huella conservan su caché normal. El buscador vuelve a consultar el manifiesto cada cinco minutos y permite actualizarlo manualmente. La vigencia se recalcula en el navegador; los plazos no esperan a una nueva adquisición para aparecer vencidos.
- El flujo semanal invoca explícitamente CI y publicación después de guardar los datos. Los commits del bot no dependen de activar otro flujo por `push`.

`npm run build` compara todas las fichas JSON completas con la instantánea, comprueba sus páginas HTML, los enlaces internos, sus anclas y los activos bajo `/trama-academia/`, y aplica presupuestos de tamaño a los índices y páginas iniciales. Los tamaños de HTML y el commit exacto aparecen en `build-info.json`.

## Comprobación de la migración

Medidas de la misma edición del 21 de septiembre de 2026. Son tamaños de recursos, no una puntuación de Core Web Vitals ni una promesa para todas las redes:

| Recurso | Antes | GitHub Pages |
| --- | ---: | ---: |
| HTML inicial de `/explorar/` | 3.702.611 B | 16.610 B en la primera compilación comprobada |
| Índice de oportunidades | Incluido en el HTML | ~277 KB con gzip, separado y reutilizable |
| Fichas completas | Catálogo serializado en la página | 12 visibles bajo demanda; acceso directo al HTML de cada ficha |

La revisión funcional cubre filtros combinados, cambio de disciplina, identidad ambigua, ceros y datos insuficientes, plazo con precisión de día, enlaces compartidos, comparación, búsqueda de fuentes y lectura de indicadores en escritorio y móvil. Los filtros requieren JavaScript; las fichas y la guía tienen HTML completo. Con JavaScript desactivado, la etiqueta de vigencia corresponde a la construcción y debe contrastarse con la fecha visible.

Referencias de implementación: [exportación estática de Next.js](https://nextjs.org/docs/app/guides/static-exports) y [flujos de publicación oficiales de GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

## Corrección institucional detectada durante la revisión

El anuncio `11291c30724438736a8d`, alojado en el portal de ETH, corresponde a la **posición B en TUM, Múnich**, con cierre el **25 de agosto de 2026**. La [fuente oficial](https://jobs.ethz.ch/job/view/11996), releída el 21 de septiembre, distingue empleador, campus, contrato doctoral y plazo de la cabecera genérica del portal. Se conserva la ficha y su historial en Git; se corrigen identidad, país, etapa, condiciones y estado cerrado. No debe heredar automáticamente los indicadores de ETH ni figurar entre las vacantes vigentes.

`data/opportunity-corrections.json` guarda esta corrección revisada. El adaptador solo la aplica cuando coinciden identidad, URL y las condiciones contrastadas; si cambia esa evidencia, detiene la actualización de la ficha y conserva la versión anterior para revisión. Esta comprobación puntual no equivale a un nuevo barrido de todo el catálogo.

## Directorio recurrente y guías por país

`/programas/` reúne escuelas de verano, estancias y ayudas con continuidad documentada. Sus filtros de tipo, nivel de acceso, país y texto se conservan en la URL; la paginación muestra ocho fichas. La edición de referencia, la frecuencia y su calendario no implican que la siguiente convocatoria esté abierta. Las escuelas no cuentan como títulos de máster ni de doctorado.

`/guia/` compara dos países mediante ocho criterios y conserva la selección en `pais1` y `pais2`. Las 31 guías `/guia/<código>/` cubren UE27, Reino Unido, Suiza, Noruega e Islandia; cada criterio enlaza sus fuentes y distingue alcance nacional, regional o institucional. La fecha de consulta no sustituye a la fecha de actualización de la fuente. Las guías y fichas individuales tienen HTML completo.

La revisión integral de septiembre añade navegación activa, adaptación a tableta, foco de resultados al paginar, recuperación de errores y verificación de enlaces y anclas de todas las fichas. Los detalles y límites están en el [informe de revisión](review-2026-09-21.md).

## Selección del visitante y retorno a la búsqueda

`/seleccion/` guarda hasta 50 IDs, títulos e instituciones mediante `localStorage` (`trama:selection:v1`). No envía la lista a un servidor ni sincroniza dispositivos. Los cambios se reflejan entre pestañas del mismo origen; si falla el almacenamiento, se informa de que la lista solo persistirá durante esa visita. Un valor ilegible no se sobrescribe. No se guardan salarios, requisitos ni estados como copias permanentes: se resuelven desde los índices actuales de oportunidades y financiación, leídos desde un único manifiesto. Las fichas ausentes permanecen identificadas como no disponibles.

Guardar y comparar son acciones independientes. La selección pagina de 12 en 12 y permite comparar dos o tres fichas entre páginas. El CSV descarga las condiciones de la edición consultada, sus fechas y URLs; los textos que una hoja de cálculo podría interpretar como fórmulas se neutralizan. Si no se pueden leer las condiciones necesarias, la exportación muestra un error y permite volver a intentarlo.

Los enlaces a fichas incluyen un parámetro `desde` cuando proceden del buscador, financiación, recurrentes o selección. Su lector solo admite esas cuatro rutas internas, conserva consultas acotadas y rechaza destinos externos. Sin JavaScript o sin contexto válido, cada ficha conserva un enlace de vuelta seguro según su tipo. La selección depende de JavaScript y de los datos del navegador; borrarlos también borra la lista personal.

En financiación, los cuatro controles principales son destino, país de la entidad, etapa y vigencia. `pais` conserva destino y `financiador` añade origen explícitamente documentado; `unknown` selecciona entidad sin país registrado. El origen nunca se deduce del destino. Las cuatro modalidades INPhINIT/Junior Leader declaran ES y PT en `destinationCountries`, también en recurrentes. Comparación y CSV conservan ambos datos y el calendario narrativo de la edición, sin transformarlo en apertura. Ver la [revisión de becas](funding-review-2026-09-21.md).

## Camino doctoral desde España

La portada y `/mi-camino/` organizan el recorrido por situación, objetivo, movilidad y área. El plan local se almacena con una clave independiente de la selección y no envía perfiles a un servidor. La situación y el objetivo enviados desde una tarjeta de portada son valores enumerados; no aceptan rutas o texto libre. El contexto visible en otras secciones no cambia sus filtros.

`/doctorado-en-espana/` exporta una guía legible sin JavaScript con índice, fuentes por bloque, tablas y ejemplos editoriales. Sus anclas se validan junto a las rutas y las 31 guías internacionales. Ambos recorridos se incluyen en el sitemap y en el límite de HTML inicial. No serializar el catálogo entero en el plan: genera consultas sobre los índices existentes.
