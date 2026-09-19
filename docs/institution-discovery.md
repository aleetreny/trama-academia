# Inventario institucional y tiers de investigación

El objetivo es recorrer las fuentes de cada institución en toda Europa. Se mantienen tres niveles distintos: entidad candidata, página localizada y oportunidad comprobada. Los recuentos no son intercambiables. Una universidad puede tener centenares de enlaces y ningún programa admitido todavía en el catálogo.

## Universo e identidad

La edición inicial usa las organizaciones educativas activas de [ROR, versión 2.12 de 25 de agosto de 2026](https://doi.org/10.5281/zenodo.22099990), bajo CC0. El archivo original se comprueba contra el MD5 publicado `ce8807691455d4ada3216c31408e9e1a`. Los países y territorios se enumeran explícitamente en `institution-universe.mjs`; el registro no depende de una búsqueda por popularidad.

Chipre forma parte del ámbito académico europeo de este proyecto. Rusia, Turquía y Kazajistán se conservan como candidatos con revisión geográfica del campus pendiente y no reciben un tier europeo automáticamente. ROR no es un registro exhaustivo de instituciones que otorgan títulos, ni demuestra que una entidad imparta nuestras materias. Tampoco se supone que todas las universidades de un país transcontinental estén en Europa.

Las fuentes revisadas manualmente añaden universidades, facultades, centros y financiadores. La asociación con ROR exige un nombre exacto normalizado o un dominio oficial único dentro del país. Los casos ambiguos quedan sin asociación; una corrección editorial puede declarar un ROR concreto, que se valida contra el registro activo y el país. Las unidades no se fusionan automáticamente con su universidad matriz. Por eso las cifras de entidades no deben llamarse cifras de universidades únicas.

Los datos brutos se conservan en `work/`, ignorado por Git. Para reconstruir a partir de los archivos de la edición descargada:

```sh
node scripts/harvest/institution-universe.mjs work/ror/records.json work/ror/release.json work/ror/universe.json
node scripts/harvest/institution-registry.mjs
```

No ejecutar una reconstrucción mientras esté escribiendo el rastreador. La reconstrucción conserva las fuentes y el avance de la edición anterior, y solo aplica indicadores completos disponibles en `work/openalex/`.

## Recorrido y límites comprobables

`institution-crawl.json` guarda una tarea por institución y URL canónica. Se parte de webs oficiales de ROR y de las fuentes localizadas mediante revisión. Cada enlace nuevo conserva la página desde la que se observó; no se inventan rutas institucionales. Los parámetros que identifican contenido se conservan y se eliminan los de seguimiento.

El recorrido alterna países e instituciones. Dentro de cada país se atiende primero a las instituciones sin intentos anteriores y después a las que llevan más tiempo sin visitar; dentro de cada institución se priorizan disciplina y tipo de fuente. Esto evita que un catálogo con muchos enlaces nuevos impida visitar otras universidades. El valor predeterminado es 900 intentos, seis trabajadores, 40 minutos y un máximo de 20 páginas por institución y ejecución. Se respetan `robots.txt`, los límites por servidor y los bloqueos; no se intenta eludirlos. Un barrido posterior continúa los pendientes.

```sh
npm run harvest:institutions
npm run harvest:institutions -- --limit=1200 --minutes=20 --concurrency=6
```

Estados de la cola:

| Estado | Significado |
| --- | --- |
| `pending` | Enlace observado, todavía sin lectura válida. |
| `read` | Página recuperada con contenido suficiente, fecha y huella. No implica revisión exhaustiva de todos sus programas. |
| `access-pending` | Error, bloqueo, estructura vacía o acceso pendiente; conserva la evidencia anterior. |
| `document` | PDF localizado que necesita lectura y revisión específica. |
| `external-review` | Destino fuera de los dominios oficiales admitidos para esa institución. |
| `depth-review` | Enlace que supera la profundidad automática de tres niveles. |

Las páginas académicas se vuelven a comprobar después de siete días; las páginas iniciales, después de 30. Los fallos se reintentan después de siete días. Hay un máximo de 100 enlaces relevantes por página y se marca explícitamente cuando se ha truncado. Los catálogos paginados, APIs, formularios y sitios con JavaScript necesitan adaptadores o revisión adicional. El algoritmo no deduce que un inventario esté completo porque se agote una página o una ejecución.

La cola se guarda cada 25 intentos y al terminar. Conserva las últimas 20 ejecuciones. Ningún enlace se convierte automáticamente en una oportunidad: una nueva semilla debe pasar la comprobación institucional, de disciplina, de componente investigador cuando corresponde y de condiciones publicadas. Las modalidades, vías temáticas y grados conjuntos requieren revisar duplicados.

El lector reconoce paneles desplegables con controles reales y fragmentos completos de React asociados explícitamente a sus marcadores de posición. Descarta fragmentos ocultos sin asociación o con límites rotos y no ejecuta scripts descargados. Si una aplicación publica el contenido mediante un registro oficial, la semilla puede declarar `primaryEvidenceUrl` junto a `evidencePages`: se comprueba esa fuente y se conserva la URL humana como enlace del programa. Los controles de identidad, edición y aprobación del registro siguen siendo obligatorios en las semillas revisadas; un currículo de un programa retirado no demuestra que esté aprobado.

## Indicadores de fortaleza por disciplina

La fuente es [OpenAlex](https://openalex.org/), bajo CC0, asociada por el ROR exacto. Se guarda cada consulta, página del cursor, fecha y respuesta en caché. Se recorre la paginación completa de cada agregado; no se usan solo los primeros resultados. Las afiliaciones de coautores fuera del universo no se convierten en instituciones europeas.

Las consultas usan el tema principal: informática, campo 17; IA y aprendizaje automático, subcampos 1702 y 1707; estadística y probabilidad, 2613 y 1804; matemáticas aplicadas, 2604. Son aproximaciones bibliométricas explícitas, no clasificaciones de los programas académicos. IA incluye visión y reconocimiento de patrones; ciencia de datos se reparte entre varios campos.

Se incluyen `article`, `conference-paper`, `data-paper` y `software-paper`, y se excluyen trabajos retractados. Los grupos de artículos y de los otros tres tipos son disjuntos y se suman. No se añaden preprints como publicaciones adicionales. Una publicación cuenta una vez por institución participante; no se suman automáticamente las filiales a la matriz.

| Indicador | Ventana y regla |
| --- | --- |
| Actividad | Número de publicaciones de 2020–2024. |
| Impacto | Proporción de trabajos de 2020–2022 situados en el 10 % más citado por OpenAlex, normalizados por tipo, año y subdisciplina. |
| Cobertura de impacto | Trabajos con percentil disponible divididos por todos los trabajos de la ventana de impacto. |

Para calcular un tier se exigen 50 publicaciones de actividad, 50 trabajos con impacto calculable y al menos un 80 % de cobertura de impacto. El componente de impacto usa el límite inferior de Wilson al 95 % de la proporción más citada, para no premiar resultados extremos de muestras pequeñas. La puntuación promedia al 50 % los percentiles de actividad e impacto dentro de la cohorte europea elegible. Se vuelve a ordenar esa puntuación: T1 es el 10 % superior, T2 el siguiente 15 %, T3 el siguiente 25 % y T4 el resto. Los empates reciben el mismo percentil medio; una cohorte de menos de 20 entidades no recibe tiers.

Las identidades sin correspondencia, muestras insuficientes, baja cobertura y campus con geografía pendiente quedan sin tier. No se interpreta una ausencia como mala investigación. Los tiers no miden supervisión, admisión, salarios, costes ni calidad docente. Véanse el [método de citas](https://help.openalex.org/data/works/citations/) y los [tipos de publicación](https://help.openalex.org/data/work-types/).

```sh
node scripts/harvest/research-metrics.mjs
node scripts/harvest/institution-registry.mjs
```

La descarga se detiene antes de agotar la cuota gratuita de OpenAlex y tiene un límite de 600 peticiones de red por ejecución. Las respuestas se reutilizan durante siete días; el marcador de cuota evita nuevos intentos durante el mismo día UTC cuando quedan menos de 20 créditos. Repetir el comando continúa desde la caché. Solo se publican disciplinas con los cuatro agregados completos. En la primera edición está completa informática; las otras tres disciplinas siguen pendientes, no extrapoladas desde informática. La actualización semanal de fuentes no recalcula estos indicadores.

## Publicación y comprobaciones

El catálogo y el registro institucional tienen tablas separadas en Neon. La página `/instituciones` consulta 25 filas con los filtros solicitados y usa la instantánea local si falla la base. El rol del sitio solo tiene lectura. El recolector puede insertar y actualizar, pero no borrar filas ni cambiar el esquema. Las migraciones se prueban primero en una rama de validación.

La actualización semanal guarda `catalogue.json`, `institutions.json` e `institution-crawl.json` en Git y publica los datos en Neon. Las pruebas cubren geografía transcontinental, insuficiencia de muestra, empates, cobertura de citas, rotación de países, deduplicación de enlaces, reintentos, documentos y destinos externos, además de los controles de evidencia de programas. La cobertura pública muestra tanto avances como pendientes; no representa este sistema como exhaustivo ni instantáneo.
