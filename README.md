# trama.

[Abrir TRAMA](https://trama-academia.aleetreny.chatgpt.site) · [Consultar cobertura](https://trama-academia.aleetreny.chatgpt.site/fuentes) · [Explorar instituciones](https://trama-academia.aleetreny.chatgpt.site/instituciones)

Un atlas de oportunidades académicas en Europa para ciencia de datos, machine learning, estadística, informática y matemáticas aplicadas.

El ámbito principal es Europa; Armenia, Azerbaiyán y Georgia se identifican como ampliación académica del [Espacio Europeo de Educación Superior](https://ehea.info/about-ehea/ehea-membership-and-criteria/). Se incluyen países pequeños y territorios.

TRAMA organiza el recorrido en primeras experiencias, máster, doctorado, investigación posdoctoral y carrera académica. Incluye financiación, comparación de hasta tres oportunidades, condiciones del doctorado por país y un registro público de cobertura.

## Qué contiene

- Vacantes de EURAXESS, Inria, AcademicTransfer, jobs.ac.uk, ETH Zurich, KTH, Aalto, Uppsala, Helsinki y Jobbnorge, con filtrado de disciplina y destino europeo. En Jobbnorge se contrasta el listado público con los PDF oficiales para comprobar proyectos, requisitos y condiciones.
- Programas académicos y de financiación comprobados en las páginas de sus instituciones. Un máster necesita evidencia de tesis o componente de investigación.
- Las fichas detalladas enlazan los documentos de admisión, financiación y plan académico, incluidos PDF oficiales. Las nuevas incorporaciones verifican también frases que sustentan sus condiciones: si cambian, conservan la última ficha y la marcan para revisión.
- Fuente, última comprobación, plazo, requisitos, tipo de contrato, duración y financiación cuando están publicados. Los campos desconocidos se mantienen como desconocidos.
- Una instantánea pública en `data/catalogue.json` y una base PostgreSQL en Neon. La web utiliza Neon y conserva una copia de respaldo si la consulta falla.
- Un inventario institucional con identidad ROR, fuentes oficiales y una cola de rastreo que conserva pendientes, documentos y bloqueos. Los candidatos del inventario no cuentan como oportunidades.
- Tiers bibliométricos por disciplina con cifras, umbrales, ventanas temporales y consultas de origen visibles. La primera edición completa corresponde a informática; IA, estadística y matemáticas aplicadas siguen pendientes. La ausencia de datos no recibe un tier bajo.

**La cobertura es parcial y medible. No es un inventario exhaustivo de Europa, ni una comprobación continua de todas las webs.** AcademicTransfer todavía descubre anuncios por títulos con disciplina reconocible; EURAXESS puede bloquear páginas adicionales. Los detalles de cada barrido se muestran en `/fuentes`.

## Desarrollo

Node 22.13 o posterior. Instalar con `npm ci`, ejecutar `npm run dev` y abrir la dirección local impresa. La aplicación usa React, Vinext, componentes shadcn, CSS propio y un Worker de Sites.

El recolector de PDF necesita además Python 3.10 o posterior y `pypdf`. La web no usa Python. Para rastrear en local:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/harvest/requirements.txt
TRAMA_PYTHON=.venv/bin/python npm run harvest
```

GitHub Actions prepara Python 3.12 y la misma versión fijada de `pypdf`. `TRAMA_PYTHON` permite seleccionar un entorno existente sin modificar la instalación global.

```sh
npm test
npm run typecheck
npm run build
```

La web pública no necesita iniciar sesión. La base se conecta por HTTPS con `@neondatabase/serverless`. En desarrollo, `.dev.vars` contiene una credencial de **solo lectura**. No introducir credenciales en variables `NEXT_PUBLIC_*`.

## Actualización semanal

[Actualizar catálogo](https://github.com/aleetreny/trama-academia/actions/workflows/refresh.yml) se ejecuta los lunes a las **04:23 UTC**, además de admitir ejecución manual. El horario de GitHub Actions puede retrasarse.

1. Descubrir y verificar vacantes con `npm run harvest`.
2. Comprobar programas con `npm run harvest:programmes`.
3. Revisar anuncios conocidos que no aparecieron de nuevo con `npm run harvest:verify`.
4. Continuar la cola institucional con `npm run harvest:institutions`, alternando países y limitando el trabajo por institución.
5. Validar geografía, etapas, identidad, fechas y evidencia con `npm run harvest:audit`.
6. Publicar mediante `npm run db:sync` y `npm run db:sync:institutions`, y guardar las instantáneas y la cola en Git.

El secreto de repositorio `DATABASE_URL` es una credencial específica del recolector con SELECT, INSERT y UPDATE; no permite DELETE ni cambios de esquema. El sitio usa un rol distinto de solo lectura. Las migraciones de `db/migrations` se aplican por separado con una credencial de administración, primero en una rama de validación.

Las páginas de resultados vuelven a consultar el catálogo cada cinco minutos y tienen un botón de actualización. El API permite una caché de hasta 60 segundos. Esto actualiza los datos ya recolectados; **no lanza un nuevo rastreo de internet**.

El registro institucional consulta Neon con filtros y páginas de 25 entidades. La actualización semanal continúa el descubrimiento de fuentes; las incorporaciones de programas siguen necesitando evidencia y revisión editorial. No recalcula automáticamente los indicadores bibliométricos ni declara terminada una institución por haber leído su página inicial.

## Reglas de vigencia y extracción

- `open`: fecha futura y comprobación válida en los últimos 14 días.
- `listed`: vacante institucional con solicitud habilitada, sin fecha publicada.
- `rolling`: la fuente declara explícitamente admisión continua.
- `programme`: existe el programa; no implica convocatoria abierta.
- `unverified`: vigencia o revisión por confirmar.
- `closed`: plazo vencido o cierre explícito. Una ausencia en un listado no basta.

El recolector respeta `robots.txt`, los tiempos de espera, `Retry-After`, ETag y Last-Modified. No sortea bloqueos de acceso. Las páginas recuperadas y sus huellas quedan en una caché local ignorada; se persisten observaciones técnicas en Neon. Los fallos no borran la última ficha válida. Las correcciones editoriales explícitas se documentan en `data/exclusions.json`.

Una plaza con varias vacantes cuenta como un anuncio. La deduplicación actual usa URL canónica y conserva los parámetros que identifican ofertas. No se fusionan automáticamente anuncios parecidos entre portales: aún puede haber duplicados entre fuentes o idiomas. Los importes conservan moneda y periodo; no se calcula un salario neto ni se compara una beca anual con un salario mensual sin contexto.

Las líneas interdisciplinares se incluyen cuando la descripción documenta investigación en métodos del ámbito indicado. Una mención incidental de software, una base de datos o conocimientos estadísticos auxiliares no basta. La clasificación se basa en reglas auditables y puede necesitar revisión; no sustituye la lectura de la convocatoria. Los conectores nórdicos recorren también los anuncios con títulos genéricos y comprueban el contenido antes de clasificarlos.

Las fechas con horas discordantes se conservan con precisión de día y una nota para consultar la convocatoria. Un contrato doctoral inicial de un año renovable no se presenta como cuatro años garantizados. Las observaciones de ejecuciones sucesivas conservan su identificador de origen.

Los PDF se descargan con la misma política de acceso que las páginas. Se validan formato, identidad y fecha; la lectura tiene límites de tamaño, páginas y tiempo. Una descarga fallida no reemplaza requisitos o financiación ya comprobados ni convierte un fallo del exportador en un cierre de la plaza. Los intervalos salariales se conservan como intervalos y no se reducen a su extremo inferior. Se distingue la duración del empleo de los años exigidos de formación.

Los programas pueden aportar varias páginas y documentos mediante `evidencePages`, y controles de condiciones mediante `evidenceChecks`. Se guarda la huella y fecha de cada documento; la fecha de verificación de la ficha es la más antigua de sus fuentes necesarias. Los controles de frases detectan cambios, pero no sustituyen la revisión editorial de todos los requisitos. Las fichas anteriores aún no cuentan todas con estos controles. Las respuestas HTTP se limitan a 10 MB durante la descarga, también cuando el servidor comunica un tamaño incorrecto.

Para revisar solo programas sin reutilizar el identificador de una ejecución anterior: `npm run harvest:programmes -- --standalone`. Este modo crea una ejecución trazable independiente; la actualización semanal incorpora la revisión al barrido completo.

El comportamiento y las limitaciones de los nuevos conectores se documentan en [docs/source-adapters.md](docs/source-adapters.md).

El universo de búsqueda, la cola reanudable y el método de tiers se documentan en [docs/institution-discovery.md](docs/institution-discovery.md).

## Ampliar la cobertura

- `data/sources.json`: fuentes, adaptadores, alcance y puntos de entrada.
- `data/programmes.seed.json`: programas y evidencia institucional.
- `data/institutions.curated.json`: fuentes institucionales localizadas y asociaciones revisadas con ROR.
- `data/institutions.json`: inventario público, indicadores y avance por institución.
- `data/institution-crawl.json`: cola persistente, procedencia de enlaces y últimas ejecuciones.
- `scripts/harvest/`: adquisición, parsers, reglas, auditoría y revisión.
- `data/country-guides.ts`: comparaciones con referencias oficiales y fecha.

Una fuente nueva debe declarar la geografía, recorrer su paginación, mantener evidencia de origen, excluir contenido ajeno al campo, detectar cambios de estructura y añadir una prueba que cubra un fallo real. El estado “pendiente” no debe convertirse en “revisada” hasta ejecutar y comprobar su adaptador.

## Publicación

El proyecto está registrado en Sites mediante `.openai/hosting.json`. El Worker compilado y sus activos se generan en `dist/`. Antes de publicar, el código exacto se confirma en Git, se envía al repositorio de origen de Sites y se guarda una versión con ese SHA. El archivo desplegable contiene solo el resultado compilado y el manifiesto de alojamiento, nunca archivos de entorno ni páginas brutas del rastreador.

Los datos y textos de convocatorias pertenecen a sus fuentes. TRAMA publica metadatos y extractos breves con enlaces al anuncio original; no almacena ni publica candidaturas o información de solicitantes.
