# trama.

**El recorrido hacia la investigación, con fuentes a la vista.**

[Abrir TRAMA](https://aleetreny.github.io/trama-academia) · [Explorar oportunidades](https://aleetreny.github.io/trama-academia/explorar) · [Financiación](https://aleetreny.github.io/trama-academia/financiacion) · [Programas recurrentes](https://aleetreny.github.io/trama-academia/programas) · [Guías de doctorado](https://aleetreny.github.io/trama-academia/guia) · [Cobertura y fuentes](https://aleetreny.github.io/trama-academia/fuentes)

[![Verificar aplicación](https://github.com/aleetreny/trama-academia/actions/workflows/ci.yml/badge.svg)](https://github.com/aleetreny/trama-academia/actions/workflows/ci.yml)

TRAMA es un atlas de oportunidades académicas en Europa para **ciencia de datos, machine learning, estadística, informática y matemáticas aplicadas**. Reúne programas, plazas y financiación, organizados por la etapa del recorrido académico.

## Qué puedes encontrar

| Etapa | Contenido |
| --- | --- |
| Primeras experiencias | Ayudantías, prácticas y programas que aportan experiencia de investigación. |
| Máster | Programas con tesis, trabajo final o componente de investigación documentado; la ficha distingue las rutas optativas y las prácticas. |
| Doctorado | Programas y plazas, requisitos de acceso, duración y condiciones publicadas. |
| Después del doctorado | Posdoctorados y puestos de investigación o carrera académica. |
| Financiación | Becas, ayudas y programas de apoyo, con requisitos y convocatorias diferenciados. |
| Programas recurrentes | Escuelas de verano, estancias y ayudas con continuidad documentada, aunque la última convocatoria esté cerrada. |

Puedes combinar etapa, destino, país de la entidad financiadora, área, tier por disciplina, financiación, idioma, vigencia y plazo, ordenar por prestigio investigador, impacto, actividad o fecha, compartir los filtros mediante la URL y comparar hasta tres oportunidades, consultar sus fuentes originales y comparar dos sistemas doctorales con acceso a 31 guías por país. El directorio de programas recurrentes permite planificar próximas solicitudes sin confundir una edición documentada con una convocatoria abierta. El [registro institucional](https://aleetreny.github.io/trama-academia/instituciones) muestra las fuentes localizadas, el avance de revisión y los tiers de investigación por disciplina.

El buscador ofrece búsquedas de partida y filtros removibles; las condiciones de acceso aparecen antes que los indicadores especializados. Puedes **guardar hasta 50 opciones en [Mi selección](https://aleetreny.github.io/trama-academia/seleccion/)**, comparar dos o tres y exportar la lista con sus fuentes. Se guarda solo en ese navegador, sin cuenta. Al abrir una ficha desde el buscador o los programas recurrentes, el enlace de vuelta conserva tus filtros y página. La [mejora del recorrido](docs/usability-2026-09-21.md) documenta esta evolución y sus límites.

## Revisión integral · 21 de septiembre de 2026

La edición publicada el 21 de septiembre de 2026 reúne **3.684 registros**, **3.247 fuentes** y **3.232 semillas de programas**, junto con un inventario de **6.360 instituciones**. Los registros incluyen programas, anuncios y financiación; las semillas son entradas de adquisición revisadas, no un contador adicional de oportunidades. Inventariar una institución no acredita una revisión completa de su oferta.

La [ampliación de financiación española y europea](docs/funding-review-2026-09-21.md) añade 47 fichas, hasta 477 programas de financiación. [Entidades españolas](https://aleetreny.github.io/trama-academia/financiacion/?financiador=ES) permite encontrar ayudas para estudiar en España o en el extranjero. País de entidad y destino son filtros distintos; la cobertura no es exhaustiva. El directorio permanente reúne ahora **64 programas recurrentes**.

Tras el cierre anterior, el usuario reabrió expresamente la ampliación para un lote finito: **250 programas de máster y cinco escuelas de verano nuevos**, más un máster de ETH recuperado de las semillas pendientes (256 altas editoriales). Se integran además ocho vacantes de la actualización semanal, tras excluir tres falsos positivos. Las 591 decisiones editoriales incluyen también opciones ya cubiertas, descartes y casos retenidos. Aquella revisión dejó 19 programas recurrentes y la guía compara **31 países**, con fuentes por criterio. La revisión semanal permanece configurada; este cierre no inicia una adquisición manual ilimitada.

**Edición validada, sincronizada y publicada:** pasan 249 pruebas Node y dos pruebas PDF, tipos, lint y compilación. Se han comprobado el despliegue y las rutas públicas. El [informe de financiación](docs/funding-review-2026-09-21.md) y el [informe de revisión anterior](docs/review-2026-09-21.md#validación-y-publicación) conservan las evidencias y los límites de las comprobaciones. La [guía de presentación](docs/presentation.md) explica el recorrido y el alcance del producto.

## Alcance y confianza

**La cobertura europea es parcial.** El lote manual de esta revisión queda delimitado; una ampliación posterior requiere un nuevo encargo. Los recuentos y las incidencias de adquisición están en [Fuentes](https://aleetreny.github.io/trama-academia/fuentes). Una institución localizada o un enlace pendiente no cuentan como una oportunidad verificada. Un programa existente tampoco implica una convocatoria abierta.

- **Fuentes identificables.** Cada ficha enlaza la institución o el anuncio y conserva la fecha de comprobación. Las nuevas incorporaciones contrastan las condiciones con páginas y PDF oficiales; los cambios que afectan a su evidencia se retienen para revisión.
- **Condiciones explícitas.** Plazos, duración, idiomas, requisitos y financiación se publican cuando hay evidencia. Los campos desconocidos siguen como desconocidos. Una ayuda condicionada no se presenta como financiación garantizada.
- **Tiers por disciplina.** Se basan en actividad e impacto de investigación, con indicadores, ventanas, umbrales y fuentes visibles. La edición del 21 de septiembre de 2026 incluye 850 instituciones con muestra suficiente en informática, 548 en IA, 142 en estadística y 89 en matemáticas aplicadas. Las cohortes se solapan; la ausencia de datos no recibe un tier bajo. [Consultar el método](docs/institution-discovery.md#indicadores-de-fortaleza-por-disciplina).
- **Actualización semanal.** El recolector se ejecuta los lunes a las 04:23 UTC y admite ejecución manual. Al terminar correctamente, se construye y publica una nueva edición en GitHub Pages. El buscador consulta esa edición cada cinco minutos, sin volver a rastrear las fuentes.
- **Continuidad de los datos.** La web se genera desde las instantáneas versionadas y funciona sin base de datos en tiempo de consulta. Neon conserva la adquisición y el historial de observaciones. Los errores de acceso conservan la última ficha válida y quedan registrados.

El ámbito principal es Europa, incluidos países pequeños y territorios. Armenia, Azerbaiyán y Georgia figuran como ampliación académica explícita del [Espacio Europeo de Educación Superior](https://ehea.info/about-ehea/ehea-membership-and-criteria/). Los programas de países transcontinentales necesitan evidencia de su campus europeo; los itinerarios que exigen movilidad fuera del ámbito europeo se excluyen. La comprobación geográfica no concede automáticamente un tier a toda la institución.

La extracción respeta `robots.txt`, límites de acceso y bloqueos. Algunos sitios requieren nuevos adaptadores o revisión manual; todavía puede haber duplicados entre fuentes o idiomas. El catálogo ayuda a localizar opciones y documenta su evidencia; la convocatoria original determina las condiciones aplicables.

## Ejecutar en local

Se necesita **Node 22.19 o posterior**. La web puede utilizar la instantánea incluida sin configurar una base de datos.

```sh
git clone https://github.com/aleetreny/trama-academia.git
cd trama-academia
npm ci
npm run dev
```

Abrir la dirección que imprime el servidor; por defecto, `http://localhost:3000/trama-academia/`. No hacen falta credenciales para construir o consultar la web. Tras compilar, `npm start` sirve `out/` en `http://localhost:4173/trama-academia/`.

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

Los recolectores de PDF requieren además Python 3.10 o posterior y las dependencias fijadas en `scripts/harvest/requirements.txt`. La configuración de Python, credenciales, sincronización y publicación está en la [guía de operación](docs/operations.md).

## Cómo está organizado

La aplicación utiliza React y la exportación estática de Next.js, publicada en **GitHub Pages** mediante GitHub Actions. La exportación genera HTML propio para cada ficha y permite acceder a ella directamente. Los índices de búsqueda se descargan por separado, los detalles visibles se cargan en paralelo y la comparación solo se descarga cuando se abre. Las fuentes tipográficas se sirven localmente. Los recolectores de Node verifican fuentes públicas; Python extrae PDF y Neon conserva el historial de adquisición. No se necesitan servicios de ChatGPT para consultar o publicar esta versión.

| Ruta | Función |
| --- | --- |
| `app/`, `components/`, `lib/` | Páginas, interacción, consulta y presentación del catálogo. |
| `data/catalogue.json` | Instantánea pública de oportunidades y fuentes. |
| `data/programmes.seed.json`, `data/sources.json` | Programas revisados, recurrencia, evidencia y configuración de adaptadores. |
| `data/country-guides.json` | Comparación de 31 países, ocho criterios y referencias oficiales por criterio. |
| `data/institutions.curated.json`, `data/institutions.json` | Fuentes institucionales revisadas y registro público con indicadores. |
| `data/institution-crawl.json.gz` + `data/institution-crawl.parts/` | Cola reanudable de descubrimiento, dividida en partes con huellas SHA-256; conserva todo el historial y admite leer el formato anterior. Su resumen legible está en `data/institution-crawl.summary.json`. |
| `scripts/harvest/` | Adquisición, extracción, controles de evidencia y auditoría. |
| `scripts/web/` | Índices compactos, comprobación de integridad de la exportación y servidor estático local. |
| `db/`, `scripts/db/` | Esquema, migraciones y sincronización con Neon. |

El flujo de CI verifica las pruebas, los tipos, las fichas exportadas y los presupuestos de tamaño antes de desplegar. `build-info.json` en la web identifica el commit, la edición y la revisión de los índices. [Arquitectura y filtros de prestigio](docs/github-pages.md).

## Documentación

- [Continuidad y trabajo pendiente](docs/continuation.md): punto de entrada para otro agente, prioridades, decisiones vigentes y contexto local disponible.
- [Guía de presentación](docs/presentation.md): recorrido breve por el producto, cifras de esta edición y límites de cobertura.
- [Revisión integral](docs/review-2026-09-21.md): balance de 591 decisiones, 264 altas, programas recurrentes, guías y revisión funcional, con el estado de validación y publicación.
- [Cierre de Grecia](docs/greece-closing-review-2026-09-21.md): cinco másteres, tres familias de financiación y un anuncio docente; nueve fichas nuevas contrastadas con 26 documentos oficiales.
- [Operación y publicación](docs/operations.md): entorno, actualización semanal, estados, credenciales, diagnóstico y despliegue.
- [Inventario institucional y tiers](docs/institution-discovery.md): universo geográfico, identidad ROR, cola de rastreo y método bibliométrico.
- [Adaptadores de fuentes](docs/source-adapters.md): funcionamiento y límites comprobados de los conectores.
- [Revisión de financiación nórdica](docs/nordic-funding-review-2026-09-20.md): 52 programas incorporados el 20 de septiembre de 2026, ediciones agrupadas y discrepancias documentadas.
- [Revisión de programas de Padua](docs/padua-review-2026-09-21.md): 17 incorporaciones, dos títulos ya presentes y un candidato pendiente, con límites de evidencia explícitos.
- [Revisión de Austria](docs/austria-review-2026-09-21.md): 38 másteres y 6 programas de financiación, rutas agrupadas, créditos de tesis contrastados y cobertura pendiente por institución.
- [Revisión de doctorados de Polonia](docs/poland-doctoral-review-2026-09-21.md): seis rutas doctorales y dos ayudas, con requisitos, estipendios y rondas cerradas diferenciados.
- [Revisión de Letonia](docs/latvia-review-2026-09-21.md): ocho másteres, un doctorado y cuatro instrumentos de financiación, con rutas agrupadas y discrepancias de admisión y elegibilidad visibles.
- [Revisión de Malta](docs/malta-review-2026-09-21.md): quince másteres, cuatro doctorados y tres instrumentos de financiación; modalidades agrupadas, admisión de 2026 y condiciones de las ayudas verificadas.
- [Revisión de Chipre](docs/cyprus-review-2026-09-21.md): veinte másteres, seis doctorados, siete ayudas y tres convocatorias o prácticas; identidad institucional, movilidad, tesis y condiciones económicas contrastadas.
- [Revisión de Grecia](docs/greece-review-2026-09-21.md): 23 másteres, un doctorado y cinco ayudas; recorrido del catálogo nacional, tesis, idioma, matrícula y plazos, con pendientes explícitos.
- [Segunda ampliación de Grecia](docs/greece-followup-review-2026-09-21.md): cinco másteres, dos doctorados y cinco ayudas; versiones de reglamentos contrastadas y condiciones de financiación diferenciadas.

Para ampliar la cobertura, una fuente debe declarar su alcance, conservar la procedencia y superar la revisión de identidad, disciplina, geografía y condiciones. Los candidatos se preparan con `npm run harvest:candidates`; su puntuación ordena el trabajo y no los incorpora al catálogo.

Los datos y textos de las convocatorias pertenecen a sus fuentes. TRAMA publica metadatos y extractos breves con enlaces al original. No almacena ni publica candidaturas o información de solicitantes.
