# trama.

**El recorrido hacia la investigación, con fuentes a la vista.**

[Abrir TRAMA](https://trama-academia.aleetreny.chatgpt.site) · [Explorar oportunidades](https://trama-academia.aleetreny.chatgpt.site/explorar) · [Financiación](https://trama-academia.aleetreny.chatgpt.site/financiacion) · [Cobertura y fuentes](https://trama-academia.aleetreny.chatgpt.site/fuentes)

[![Verificar aplicación](https://github.com/aleetreny/trama-academia/actions/workflows/ci.yml/badge.svg)](https://github.com/aleetreny/trama-academia/actions/workflows/ci.yml)

TRAMA es un atlas de oportunidades académicas en Europa para **ciencia de datos, machine learning, estadística, informática y matemáticas aplicadas**. Reúne programas, plazas y financiación, organizados por la etapa del recorrido académico.

## Qué puedes encontrar

| Etapa | Contenido |
| --- | --- |
| Primeras experiencias | Ayudantías, prácticas y programas que aportan experiencia de investigación. |
| Máster | Títulos con tesis o componente de investigación documentado. |
| Doctorado | Programas y plazas, requisitos de acceso, duración y condiciones publicadas. |
| Después del doctorado | Posdoctorados y puestos de investigación o carrera académica. |
| Financiación | Becas, ayudas y programas de apoyo, con requisitos y convocatorias diferenciados. |

Puedes filtrar y comparar hasta tres oportunidades, consultar sus fuentes originales y leer las diferencias entre sistemas doctorales. El [registro institucional](https://trama-academia.aleetreny.chatgpt.site/instituciones) muestra las fuentes localizadas, el avance de revisión y los tiers de investigación por disciplina.

## Alcance y confianza

**La cobertura sigue en ampliación.** Los recuentos y las incidencias de cada barrido están en [Fuentes](https://trama-academia.aleetreny.chatgpt.site/fuentes). Una institución localizada o un enlace pendiente no cuentan como una oportunidad verificada. Un programa existente tampoco implica una convocatoria abierta.

- **Fuentes identificables.** Cada ficha enlaza la institución o el anuncio y conserva la fecha de comprobación. Las nuevas incorporaciones contrastan las condiciones con páginas y PDF oficiales; los cambios que afectan a su evidencia se retienen para revisión.
- **Condiciones explícitas.** Plazos, duración, idiomas, requisitos y financiación se publican cuando hay evidencia. Los campos desconocidos siguen como desconocidos. Una ayuda condicionada no se presenta como financiación garantizada.
- **Tiers por disciplina.** Se basan en actividad e impacto de investigación, con indicadores, ventanas, umbrales y fuentes visibles. La edición del 21 de septiembre de 2026 incluye 850 instituciones con muestra suficiente en informática, 548 en IA, 142 en estadística y 89 en matemáticas aplicadas. Las cohortes se solapan; la ausencia de datos no recibe un tier bajo. [Consultar el método](docs/institution-discovery.md#indicadores-de-fortaleza-por-disciplina).
- **Actualización semanal.** El recolector se ejecuta los lunes a las 04:23 UTC y admite ejecución manual. La web vuelve a consultar los datos cada cinco minutos. Ese refresco no supone una nueva comprobación de todo internet.
- **Continuidad de los datos.** La web consulta PostgreSQL en Neon y dispone de una instantánea de respaldo versionada. Los errores de acceso conservan la última ficha válida y quedan registrados.

El ámbito principal es Europa, incluidos países pequeños y territorios. Armenia, Azerbaiyán y Georgia figuran como ampliación académica explícita del [Espacio Europeo de Educación Superior](https://ehea.info/about-ehea/ehea-membership-and-criteria/). Los programas de países transcontinentales necesitan evidencia de su campus europeo; esa comprobación no concede automáticamente un tier a toda la institución.

La extracción respeta `robots.txt`, límites de acceso y bloqueos. Algunos sitios requieren nuevos adaptadores o revisión manual; todavía puede haber duplicados entre fuentes o idiomas. El catálogo ayuda a localizar opciones y documenta su evidencia; la convocatoria original determina las condiciones aplicables.

## Ejecutar en local

Se necesita **Node 22.19 o posterior**. La web puede utilizar la instantánea incluida sin configurar una base de datos.

```sh
git clone https://github.com/aleetreny/trama-academia.git
cd trama-academia
npm ci
npm run dev
```

Abrir la dirección que imprime el servidor; por defecto, `http://localhost:5173`. Para consultar Neon, copiar `.env.example` a `.dev.vars` y configurar una credencial de solo lectura. No versionar credenciales.

```sh
npm test
npm run typecheck
npm run build
```

Los recolectores de PDF requieren además Python 3.10 o posterior y las dependencias fijadas en `scripts/harvest/requirements.txt`. La configuración de Python, credenciales, sincronización y publicación está en la [guía de operación](docs/operations.md).

## Cómo está organizado

La aplicación utiliza React y Vinext sobre un Worker de Sites. Los recolectores de Node verifican fuentes públicas; Python extrae el texto de los PDF. Neon sirve los datos y Git conserva las instantáneas publicadas.

| Ruta | Función |
| --- | --- |
| `app/`, `components/`, `lib/` | Páginas, interacción, consulta y presentación del catálogo. |
| `data/catalogue.json` | Instantánea pública de oportunidades y fuentes. |
| `data/programmes.seed.json`, `data/sources.json` | Programas revisados, evidencia y configuración de adaptadores. |
| `data/institutions.curated.json`, `data/institutions.json` | Fuentes institucionales revisadas y registro público con indicadores. |
| `data/institution-crawl.json.gz` | Cola reanudable de descubrimiento; su resumen legible está en `data/institution-crawl.summary.json`. |
| `scripts/harvest/` | Adquisición, extracción, controles de evidencia y auditoría. |
| `db/`, `scripts/db/` | Esquema, migraciones y sincronización con Neon. |

## Documentación

- [Operación y publicación](docs/operations.md): entorno, actualización semanal, estados, credenciales, diagnóstico y despliegue.
- [Inventario institucional y tiers](docs/institution-discovery.md): universo geográfico, identidad ROR, cola de rastreo y método bibliométrico.
- [Adaptadores de fuentes](docs/source-adapters.md): funcionamiento y límites comprobados de los conectores.
- [Revisión de financiación nórdica](docs/nordic-funding-review-2026-09-20.md): 52 programas incorporados el 20 de septiembre de 2026, ediciones agrupadas y discrepancias documentadas.
- [Revisión de programas de Padua](docs/padua-review-2026-09-21.md): 17 incorporaciones, dos títulos ya presentes y un candidato pendiente, con límites de evidencia explícitos.
- [Revisión de Austria](docs/austria-review-2026-09-21.md): 38 másteres y 6 programas de financiación, rutas agrupadas, créditos de tesis contrastados y cobertura pendiente por institución.
- [Revisión de doctorados de Polonia](docs/poland-doctoral-review-2026-09-21.md): seis rutas doctorales y dos ayudas, con requisitos, estipendios y rondas cerradas diferenciados.

Para ampliar la cobertura, una fuente debe declarar su alcance, conservar la procedencia y superar la revisión de identidad, disciplina, geografía y condiciones. Los candidatos se preparan con `npm run harvest:candidates`; su puntuación ordena el trabajo y no los incorpora al catálogo.

Los datos y textos de las convocatorias pertenecen a sus fuentes. TRAMA publica metadatos y extractos breves con enlaces al original. No almacena ni publica candidaturas o información de solicitantes.
