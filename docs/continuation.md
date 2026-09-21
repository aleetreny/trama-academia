# Continuidad y trabajo pendiente

Estado de referencia: **21 de septiembre de 2026**. Comprobar Git y `build-info.json` público antes de interpretar estas cifras como actuales.

## Punto de partida

El proyecto está publicado en [GitHub Pages](https://aleetreny.github.io/trama-academia/), desde [este repositorio](https://github.com/aleetreny/trama-academia). El usuario cerró una primera ampliación manual y, después, la reabrió expresamente para completar esta revisión integral. El nuevo trabajo se delimitó a 591 decisiones de candidatos, un directorio recurrente, 31 guías de doctorado y la revisión funcional. Se mantiene el refresco semanal. El cierre de este lote no autoriza a reanudar el rastreo manual de todo el backlog.

La referencia pública verificada anterior a esta revisión es `3e47398e362705bd7298779da28f6ef30d01c0aa`: 3.373 registros, 2.946 fuentes y 6.360 instituciones. Inventariar una institución no implica haber revisado todas sus oportunidades. El [CI de referencia](https://github.com/aleetreny/trama-academia/actions/runs/35580211630) pasó 179 pruebas Node, dos pruebas PDF, tipos, compilación y la comprobación de las 3.373 fichas exportadas. La prueba local de publicación está en `work/checkpoint-github-pages.json`.

La instantánea local preparada tras la revisión contiene **3.637 registros, 3.201 fuentes, 3.186 semillas y 6.360 instituciones**. Son **264 altas** sobre la referencia anterior: 251 programas de máster verificados, cinco escuelas de verano y ocho vacantes de la actualización semanal revisadas antes de integrar. El directorio recurrente agrupa 19 fichas y las guías cubren 31 países. El [informe de revisión](review-2026-09-21.md) documenta los denominadores, correcciones y límites.

**Validación local completada; publicación en curso.** Pasan 219 pruebas Node, dos PDF, tipos y lint sin avisos. El build de 3.637 fichas comprueba 88.950 referencias internas y los presupuestos. La revisión de navegador confirma filtros, comparación, teclado, recuperación de errores, móvil y tableta. Las 13 correcciones de fichas existentes están verificadas. La [actualización semanal 35586680322](https://github.com/aleetreny/trama-academia/actions/runs/35586680322) terminó correctamente y se integró, conservando la cola y el registro; faltan la sincronización final y la publicación de esta edición; el [informe](review-2026-09-21.md#validación-y-publicación) registra el cierre.

## Qué debe leer el siguiente agente

1. `AGENTS.md` y este documento: alcance vigente, prioridades y precauciones de continuidad.
2. [README](../README.md), [operación](operations.md) y [GitHub Pages](github-pages.md): estructura, ejecución, refresco, filtros, rendimiento y despliegue.
3. [Descubrimiento institucional](institution-discovery.md), [adaptadores](source-adapters.md) y los informes de revisión por país en `docs/`: metodología, evidencia y límites.
4. [Revisión integral del 21 de septiembre](review-2026-09-21.md) y [guía de presentación](presentation.md): alcance cerrado, comprobaciones pendientes y límites del producto. Si se solicita otra ampliación, contrastar la cola y los candidatos con el catálogo actual antes de incorporar nada.

## Backlog real, por prioridad

- **Mantenimiento y calidad:** revisar las incidencias de `data/catalogue.json`, el último resultado de auditoría y los adaptadores. Hay accesos bloqueados, contenido que cambia y posibles duplicados entre portales o idiomas. La edición anterior conservaba tres másteres sin verificación suficiente. Las correcciones documentadas para Paris-Saclay DKAI, UC3M Statistics for Data Science y UPM Inteligencia Artificial ya superaron la verificación integrada; esas tres incidencias quedan resueltas. En DKAI, las prácticas de 30 ECTS en laboratorio o empresa no deben convertirse en una tesis original obligatoria. `.cache/audit.json` es una referencia local fechada, no una comprobación en vivo.
- **Lote cerrado y posibles revisiones posteriores:** las 591 decisiones se reparten entre 250 favorables, 105 candidatos ya cubiertos o agrupados, 99 sin una nueva opción actual en el ámbito y 137 retenidos. Los 137 retenidos necesitan revisión futura si se solicita; no entran automáticamente en el catálogo. Se hicieron 371 lecturas, hubo cuatro fallos de acceso y 216 candidatos se cribaron mediante fragmentos. Estos últimos no equivalen a páginas leídas íntegramente.
- **Más cobertura, cuando se solicite:** `data/institution-crawl.summary.json` describe una cola reanudable de 436.473 trabajos, con 111.147 lecturas y 171.694 pendientes en esa instantánea. `work/discovery/candidates-after-crawl-28.json` contiene 21.640 candidatos, 3.305 prioritarios y 41 retenidos. Son enlaces por revisar, no oportunidades nuevas confirmadas; pueden solaparse con el catálogo y con las últimas incorporaciones. Revisar por país e institución y deduplicar antes de integrar. La cobertura europea sigue incompleta.
- **Indicadores y prestigio:** conservar cohortes completas por disciplina, ventanas, umbrales, proveedor y fecha. El usuario eligió fortaleza investigadora por disciplina con fuentes visibles. No sustituirla por reputación genérica ni atribuir a un consorcio el tier de un socio. Verificar identidad institucional antes de asignar indicadores.
- **Sincronización histórica:** se han añadido inserción por lotes de observaciones faltantes, conservación del identificador de origen y escritura atómica del archivo local. Las comprobaciones parciales de programas guardan checkpoints y no acreditan un barrido completo. Verificar el estado final de sincronización de esta edición; una operación preparada o interrumpida no significa que todos los datos hayan llegado a Neon. Seguir la [guía de operación](operations.md) y evitar repetir toda la historia sin necesidad.
- **Rendimiento al crecer:** preservar índices compactos, carga bajo demanda, paginación y presupuestos de exportación. Comprobar móvil, filtros compartidos por URL, comparación, fuentes y fichas directas cuando cambie la interfaz. Las mediciones anteriores son muestras, no garantías de rendimiento para todos los usuarios.

## Decisiones que no deben perderse

La web usa exportación estática de Next.js con base `/trama-academia/`; no consulta Neon para servir páginas. Neon conserva adquisición e historial. `scripts/web/build-data.mjs` genera los índices; los datos fuente viven en `data/`. El registro institucional y la cola están fragmentados: usar sus lectores y escritores, nunca sustituirlos por un fragmento parcial.

Los filtros distinguen programa de máster de prácticas accesibles a estudiantes de máster y escuelas de verano. `recurrence` describe continuidad, categoría, edición y calendario; no concede apertura, título académico ni financiación de una edición futura. Las guías de `data/country-guides.json` conservan fuentes por criterio, su ámbito y su fecha propia, separados de la fecha de consulta. Los itinerarios con movilidad obligatoria fuera del ámbito europeo se excluyen. Las identidades conjuntas no heredan el tier de un único socio. Los estados desconocidos y las condiciones de financiación deben mantenerse explícitos. La corrección revisada de la plaza TUM alojada en el portal ETH está en `data/opportunity-corrections.json` y `scripts/harvest/reviewed-corrections.mjs`: conservarla y revisar cualquier cambio de evidencia antes de retirar su protección.

GitHub Actions comprueba y publica `main`. El refresco semanal ejecuta su propia llamada al flujo de publicación tras actualizar datos. No volver a publicar en Sites siguiendo instrucciones antiguas de `progress.md` o de archivos congelados.

## Contexto local y contexto de GitHub

La carpeta local completa está en `~/Documents/ChatGPT/Trama Academia`. Incluye Git, dependencias, cachés, evidencia de investigación, archivos congelados y configuraciones privadas. Las rutas anteriores bajo `Documents/Codex` se conservan como enlaces de compatibilidad; no son copias adicionales. El traslado mantuvo los 22 árboles de trabajo y sus commits; comprobación en `work/relocation-chatgpt-2026-09-21.json`.

GitHub contiene código, instantáneas públicas, cola reanudable, pruebas y documentación suficiente para construir la web y continuar su desarrollo. **Un clon no contiene toda la investigación privada local ni la conversación completa.** `work/`, `.cache/`, archivos de entorno y notas locales están excluidos deliberadamente. Para seguir desde este ordenador, vincular el proyecto a la carpeta completa; no copiar únicamente los archivos versionados.

Referencias locales útiles: `work/checkpoint-github-pages.json`, `work/pages-migration/`, `work/checkpoint-v35.json`, `work/discovery/candidates-after-crawl-28.json` y los directorios de revisión por país. Los archivos `sites-v*` y las notas `task_plan.md`, `findings.md`, `progress.md` conservan historia, no instrucciones actuales.

## Comprobación antes de entregar cambios

Para cambios funcionales: `npm test`, `npm run typecheck`, `npm run build` y las pruebas PDF cuando corresponda. El build comprueba integridad de fichas y presupuestos. `npm run dev` sirve el proyecto bajo `/trama-academia/`; `npm start` permite revisar la exportación en el puerto 4173. La web no necesita credenciales para construirse.

Antes de cerrar esta revisión, completar la sección de validación del [informe](review-2026-09-21.md#validación-y-publicación) con pruebas finales, build de 3.637 fichas, sincronización y SHA publicado. Las 13 correcciones existentes ya están integradas y verificadas. Tras publicar, comprobar CI, `build-info.json` y las rutas afectadas en la web pública. Para cambios exclusivamente documentales basta revisar referencias y diff; no hace falta recolectar fuentes ni modificar el catálogo.
