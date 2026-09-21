# GitHub Pages, búsqueda y prestigio investigador

Sitio canónico: **https://aleetreny.github.io/trama-academia/**. La exportación estática de Next.js genera HTML para cada oportunidad, incluida su evidencia. GitHub Actions publica exclusivamente `out/`; la navegación no requiere un Worker, Neon ni servicios de ChatGPT. La adquisición y su historial siguen separados del sitio público.

## Ordenar con indicadores comparables

El criterio de prestigio es **fortaleza investigadora de la institución por disciplina**, no reputación general. El usuario elige informática, IA, estadística o matemáticas aplicadas. La ordenación predeterminada usa el índice existente de actividad e impacto; también puede ordenar por proporción de trabajos en el 10 % más citado, volumen, cierre, comprobación, institución o título.

Los tiers y el índice se mantienen exactamente como en la edición bibliométrica. La metodología, ventanas 2020–2024 y 2020–2022, denominadores, umbrales de muestra y referencias están en [Instituciones](https://aleetreny.github.io/trama-academia/instituciones/#metodo-tiers) y [su documentación](institution-discovery.md). La ausencia de datos queda al final al ordenar por indicadores, sin sustituirse por cero; los ceros medidos se conservan. Un tier institucional no acredita un programa o supervisor concreto.

La unión con el catálogo exige nombre o alias único y país; como alternativa, un dominio oficial único del mismo país. Las identidades ambiguas y las agrupaciones explícitas de varias instituciones no heredan el tier de un participante. Las tarjetas permiten desplegar los indicadores y abrir ROR, OpenAlex y el método. La cobertura varía por disciplina y aparece junto al buscador. No se inventan métricas para las instituciones sin muestra suficiente.

## Filtros que se pueden compartir

Etapa, país, área del programa, disciplina de los indicadores, tier —incluido T1 + T2—, tipo, vigencia, financiación, idioma mencionado y plazo. La consulta admite varias palabras y normaliza las tildes. La URL conserva los filtros, el orden y la página; restablecerlos devuelve la configuración inicial. Idioma mencionado no garantiza que toda la docencia se imparta en ese idioma; una beca o exención condicionada no implica cobertura garantizada.

## Carga y actualización

- El HTML inicial no contiene el catálogo completo. Los índices de oportunidades y financiación se descargan por separado y tienen nombres con huella de contenido.
- Solo se descargan las condiciones completas de los 12 resultados visibles, en paralelo; se conservan para comparar hasta tres fichas. La interfaz de comparación se carga al abrirla.
- El directorio institucional y el registro de fuentes tienen sus propios índices. Las fuentes de cada institución se descargan al desplegar su sección.
- Las tipografías WOFF2 están alojadas en el mismo sitio, con sus licencias OFL. No hay una solicitud inicial a Google Fonts.
- El buscador consulta el manifiesto cada cinco minutos y permite actualizarlo manualmente. La vigencia se recalcula en el navegador; los plazos no esperan a una nueva adquisición para aparecer vencidos.
- El flujo semanal invoca explícitamente CI y publicación después de guardar los datos. Los commits del bot no dependen de activar otro flujo por `push`.

`npm run build` compara las 3.373 fichas JSON completas con la instantánea, comprueba sus páginas HTML, los enlaces y activos bajo `/trama-academia/`, y aplica presupuestos de tamaño a los índices y páginas iniciales. Los tamaños de HTML y el commit exacto aparecen en `build-info.json`.

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
