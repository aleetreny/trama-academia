# Continuidad y trabajo pendiente

Estado de referencia: **21 de septiembre de 2026**. Comprobar Git y `build-info.json` público antes de interpretar estas cifras como actuales.

## Punto de partida

El proyecto está publicado en [GitHub Pages](https://aleetreny.github.io/trama-academia/), desde [este repositorio](https://github.com/aleetreny/trama-academia). La ampliación manual quedó cerrada por decisión del usuario; se mantiene el refresco semanal. No hay una tarea de adquisición ilimitada activa.

La última versión funcional verificada al preparar este documento es `3e47398e362705bd7298779da28f6ef30d01c0aa`: 3.373 registros, 2.946 fuentes y 6.360 instituciones. Inventariar una institución no implica haber revisado todas sus oportunidades. El [CI de referencia](https://github.com/aleetreny/trama-academia/actions/runs/35580211630) pasó 179 pruebas Node, dos pruebas PDF, tipos, compilación y la comprobación de las 3.373 fichas exportadas. La prueba local de publicación está en `work/checkpoint-github-pages.json`.

## Qué debe leer el siguiente agente

1. `AGENTS.md` y este documento: alcance vigente, prioridades y precauciones de continuidad.
2. [README](../README.md), [operación](operations.md) y [GitHub Pages](github-pages.md): estructura, ejecución, refresco, filtros, rendimiento y despliegue.
3. [Descubrimiento institucional](institution-discovery.md), [adaptadores](source-adapters.md) y los informes de revisión por país en `docs/`: metodología, evidencia y límites.
4. Para presentar el producto, [guía de presentación](presentation.md). Para ampliar datos, empezar por la cola y los candidatos indicados abajo, contrastándolos con el catálogo actual.

## Backlog real, por prioridad

- **Mantenimiento y calidad:** revisar las incidencias de `data/catalogue.json`, el último resultado de auditoría y los adaptadores. Hay accesos bloqueados, contenido que cambia y posibles duplicados entre portales o idiomas. La edición de presentación conservaba tres másteres cuyo componente investigador no estaba verificado; no deben contarse como investigación documentada sin nueva evidencia. `.cache/audit.json` es una referencia local fechada, no una comprobación en vivo.
- **Más cobertura, cuando se solicite:** `data/institution-crawl.summary.json` describe una cola reanudable de 436.473 trabajos, con 111.147 lecturas y 171.694 pendientes en esa instantánea. `work/discovery/candidates-after-crawl-28.json` contiene 21.640 candidatos, 3.305 prioritarios y 41 retenidos. Son enlaces por revisar, no oportunidades nuevas confirmadas; pueden solaparse con el catálogo y con las últimas incorporaciones. Revisar por país e institución y deduplicar antes de integrar. La cobertura europea sigue incompleta.
- **Indicadores y prestigio:** conservar cohortes completas por disciplina, ventanas, umbrales, proveedor y fecha. El usuario eligió fortaleza investigadora por disciplina con fuentes visibles. No sustituirla por reputación genérica ni atribuir a un consorcio el tier de un socio. Verificar identidad institucional antes de asignar indicadores.
- **Sincronización histórica:** las últimas ampliaciones necesitaron recuperar únicamente observaciones faltantes después de agotar el tiempo de sincronización. Conviene hacer esa operación reanudable si se retoma la ingestión a escala. Los registros de recuperación están en `work/`; evitar repetir toda la historia sin necesidad.
- **Rendimiento al crecer:** preservar índices compactos, carga bajo demanda, paginación y presupuestos de exportación. Comprobar móvil, filtros compartidos por URL, comparación, fuentes y fichas directas cuando cambie la interfaz. Las mediciones anteriores son muestras, no garantías de rendimiento para todos los usuarios.

## Decisiones que no deben perderse

La web usa exportación estática de Next.js con base `/trama-academia/`; no consulta Neon para servir páginas. Neon conserva adquisición e historial. `scripts/web/build-data.mjs` genera los índices; los datos fuente viven en `data/`. El registro institucional y la cola están fragmentados: usar sus lectores y escritores, nunca sustituirlos por un fragmento parcial.

Los filtros distinguen programa de máster de prácticas accesibles a estudiantes de máster. Los estados desconocidos y las condiciones de financiación deben mantenerse explícitos. La corrección revisada de la plaza TUM alojada en el portal ETH está en `data/opportunity-corrections.json` y `scripts/harvest/reviewed-corrections.mjs`: conservarla y revisar cualquier cambio de evidencia antes de retirar su protección.

GitHub Actions comprueba y publica `main`. El refresco semanal ejecuta su propia llamada al flujo de publicación tras actualizar datos. No volver a publicar en Sites siguiendo instrucciones antiguas de `progress.md` o de archivos congelados.

## Contexto local y contexto de GitHub

La carpeta local completa está en `~/Documents/Codex/Trama Academia`. Incluye Git, dependencias, cachés, evidencia de investigación, archivos congelados y configuraciones privadas. La ruta anterior se conserva como enlace de compatibilidad; no es una segunda copia. El traslado mantuvo los 22 árboles de trabajo y sus commits; comprobación en `work/relocation-2026-09-21.json`.

GitHub contiene código, instantáneas públicas, cola reanudable, pruebas y documentación suficiente para construir la web y continuar su desarrollo. **Un clon no contiene toda la investigación privada local ni la conversación completa.** `work/`, `.cache/`, archivos de entorno y notas locales están excluidos deliberadamente. Para seguir desde este ordenador, vincular el proyecto a la carpeta completa; no copiar únicamente los archivos versionados.

Referencias locales útiles: `work/checkpoint-github-pages.json`, `work/pages-migration/`, `work/checkpoint-v35.json`, `work/discovery/candidates-after-crawl-28.json` y los directorios de revisión por país. Los archivos `sites-v*` y las notas `task_plan.md`, `findings.md`, `progress.md` conservan historia, no instrucciones actuales.

## Comprobación antes de entregar cambios

Para cambios funcionales: `npm test`, `npm run typecheck`, `npm run build` y las pruebas PDF cuando corresponda. El build comprueba integridad de fichas y presupuestos. `npm run dev` sirve el proyecto bajo `/trama-academia/`; `npm start` permite revisar la exportación en el puerto 4173. La web no necesita credenciales para construirse.

Tras publicar, comprobar CI, `build-info.json` y las rutas afectadas en la web pública. Para cambios exclusivamente documentales basta revisar referencias y diff; no hace falta recolectar fuentes ni modificar el catálogo.
