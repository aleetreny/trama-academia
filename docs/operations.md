# Operación y publicación de TRAMA

Guía para mantener el catálogo, ejecutar los recolectores y publicar una edición reproducible. Para el alcance del producto, consultar el [README](../README.md).

## Preparar el entorno

Node 22.19 o posterior. Desde la raíz del repositorio, ejecutar `npm ci` y `npm run dev`; abrir `http://localhost:3000/trama-academia/`. La web funciona sin credenciales usando la instantánea versionada. `npm run build` genera índices de búsqueda, exporta las páginas a `out/` y verifica su integridad. `npm start` sirve esa compilación en `http://localhost:4173/trama-academia/`.

Los comandos de adquisición usan `--use-system-ca` para validar HTTPS con las autoridades de confianza del sistema además de las incluidas en Node. Esto permite leer fuentes como la Agencia Estatal de Investigación en los entornos donde su cadena se valida con ese almacén. Si se ejecuta directamente un script de adquisición, debe conservarse esa opción; los fallos de certificado siguen siendo errores de acceso.

El recolector de PDF necesita además Python 3.10 o posterior y `pypdf`. La web no usa Python. Para rastrear en local:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r scripts/harvest/requirements.txt
TRAMA_PYTHON=.venv/bin/python npm run harvest
```

GitHub Actions prepara Python 3.12 y la misma versión fijada de `pypdf`. `TRAMA_PYTHON` permite seleccionar un entorno existente sin modificar la instalación global.

```sh
npm test
npm run lint
npm run typecheck
npm run build
```

La web pública es estática, no necesita iniciar sesión ni conectarse a Neon. Los scripts de adquisición, sincronización y migración leen `DATABASE_URL` del entorno del proceso. Utilizar un rol de escritura específico para sincronizar y un rol de administración solo para migrar. No introducir credenciales en variables `NEXT_PUBLIC_*`, comandos que queden en el historial, registros o archivos versionados.

## Actualización semanal

[Actualizar catálogo](https://github.com/aleetreny/trama-academia/actions/workflows/refresh.yml) se ejecuta los lunes a las **04:23 UTC**, además de admitir ejecución manual. El horario de GitHub Actions puede retrasarse.

1. Descubrir y verificar vacantes con `npm run harvest`.
2. Comprobar programas con `npm run harvest:programmes`.
3. Revisar anuncios conocidos que no aparecieron de nuevo con `npm run harvest:verify`.
4. Continuar la cola institucional con `npm run harvest:institutions`, alternando países y limitando el trabajo por institución.
5. Validar geografía, etapas, identidad, fechas y evidencia con `npm run harvest:audit`.
6. Publicar mediante `npm run db:sync` y `npm run db:sync:institutions`, y guardar las instantáneas y la cola en Git.
7. Invocar el flujo reutilizable de CI con el SHA guardado: pruebas, tipos, exportación y despliegue en GitHub Pages. Este paso explícito también cubre los commits del bot que no disparan otro flujo de `push`.

El secreto de repositorio `DATABASE_URL` es una credencial específica del recolector con SELECT, INSERT y UPDATE; no permite DELETE ni cambios de esquema. La web no utiliza esta credencial. Las migraciones de `db/migrations` se aplican por separado con una credencial de administración, primero en una rama de validación.

El refresco dispone de 240 minutos. La comprobación de programas guarda un checkpoint al inicio, cada 25 resultados y cada 30 segundos, con un único escritor. Conserva las fichas aún no revisadas y diferencia `running`, revisión parcial y revisión terminada; una interrupción no acredita que se haya comprobado todo el catálogo. Los archivos del catálogo y de observaciones se reemplazan mediante archivo temporal y renombrado. Un historial ilegible o con identidades inválidas detiene la operación; nunca se interpreta como un historial vacío.

Antes de sincronizar Neon y antes de guardar Git, el flujo comprueba que `origin/main` sigue en el commit inicial. Si ha avanzado, conserva el diagnóstico y detiene los pasos restantes. No hace rebase automático ni fuerza el push. Git y Neon no forman una transacción conjunta: un cambio concurrente después de la primera comprobación puede dejar Neon sincronizado y la publicación Git detenida. Por ello, no publicar manualmente ni ejecutar otro sincronizador mientras esté activo el refresco; reconciliar la edición y repetir la sincronización si ocurre esa situación.

El artefacto `catalogue-diagnostics`, retenido durante 14 días, incluye la última instantánea del catálogo, observaciones técnicas, auditoría y cola institucional recuperables. No contiene credenciales ni cuerpos de páginas. Tras un fallo, revisar el estado y los recuentos del checkpoint, recuperar el artefacto y comprobar los elementos pendientes antes de reanudar. No presentar ese archivo parcial como una revisión completa.

El buscador vuelve a consultar el manifiesto publicado cada cinco minutos y tiene un botón de actualización. Los índices y fichas tienen nombres derivados de su contenido: la caché puede reutilizar ediciones idénticas sin confundir datos nuevos con antiguos. Esto actualiza los datos ya publicados; **no lanza un nuevo rastreo de internet**.

El inventario institucional se descarga como índice compacto; muestra 25 entidades por página y carga sus fuentes solo al desplegarlas. La actualización semanal continúa el descubrimiento de fuentes; las incorporaciones de programas siguen necesitando evidencia y revisión editorial. No recalcula automáticamente los indicadores bibliométricos ni declara terminada una institución por haber leído su página inicial.

## Reglas de vigencia y extracción

- `open`: fecha futura y comprobación válida en los últimos 14 días.
- `listed`: vacante institucional con solicitud habilitada o anuncio reciente con fecha de publicación comprobada, sin fecha de cierre. Requiere confirmar disponibilidad; no equivale a plazo abierto. Los anuncios revisados sin cierre deben tener como máximo 30 días y una fecha vinculada a su título y enlace exactos en el índice oficial. Como las demás vacantes, pasan a `unverified` tras 14 días sin comprobación válida.
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

Para comprobar un lote ya incorporado a las semillas o repetir fallos transitorios: `npm run harvest:programmes -- --only=work/seleccion.json --standalone`. El archivo contiene una lista de URLs o de objetos con `url`; solo selecciona identidades y nunca importa sus datos editoriales. Las URLs desconocidas y las listas vacías se rechazan. Se conservan las demás fichas y fuentes, y esta revisión parcial no actualiza la fecha de comprobación del conjunto completo.

El comportamiento y las limitaciones de los nuevos conectores se documentan en [Adaptadores de fuentes](source-adapters.md).

El universo de búsqueda, la cola reanudable y el método de tiers se documentan en [Inventario y tiers](institution-discovery.md).

## Publicar datos y aplicación

Son dos operaciones distintas. Neon conserva el historial de adquisición; una publicación de GitHub Pages actualiza la edición que consulta el público.

### Datos

1. Terminar el recolector antes de reconstruir el registro institucional. No ejecutar dos escritores sobre la misma cola.
2. Revisar el informe de adquisición y ejecutar `npm run harvest:audit`. Los candidatos de `npm run harvest:candidates` son una cola editorial; ese comando no importa oportunidades.
3. Con la credencial del recolector disponible en el entorno, ejecutar `npm run db:sync` y `npm run db:sync:institutions`. Comparar las filas sincronizadas con la instantánea local.
4. Confirmar en Git los datos, semillas y fuentes que pertenezcan a la edición. Conservar los registros y fichas anteriores salvo correcciones documentadas; una lectura parcial no autoriza a borrarlos.

La sincronización escribe por lotes: puede quedar a medias si falla. Repetirla con la misma instantánea es seguro; hay que comprobar el resultado antes de considerar publicada una edición. Las observaciones consultan sus identidades existentes en lotes de hasta 1.000 y solo insertan las faltantes en transacciones de hasta 100; la reanudación consulta de nuevo la base de datos, sin confiar en un checkpoint local. Se preservan SHA-256 de URL y fecha, identificador de ejecución original y filas históricas. El resultado distingue observaciones existentes, insertadas y conflictos concurrentes. `db:sync` conserva las filas omitidas y solo excluye las identificadas en `data/exclusions.json`.

### Esquema

Las migraciones SQL versionadas están en `db/migrations/`. `npm run db:migrate` las aplica con `DATABASE_URL`; probar primero en una rama de validación de Neon. La rutina semanal no ejecuta migraciones ni necesita permisos de administración. La migración `0002_observation_url_hash` conserva las URLs completas de las observaciones y sustituye su clave de índice por una huella de longitud fija, para admitir enlaces largos. El índice no es único; las consultas de identidad deben contrastar también la URL completa. `npm run db:generate` genera propuestas de migración que deben revisarse antes de aplicarlas.

### Código y edición de GitHub Pages

1. Revisar y confirmar código y datos en `main`. CI ejecuta las pruebas de Node y PDF, TypeScript, exportación estática y comprobación de todas las fichas.
2. El flujo `ci.yml` empaqueta exclusivamente `out/` y lo despliega mediante las acciones oficiales de GitHub Pages. El repositorio debe tener Pages configurado con origen **GitHub Actions**. No se publica desde Sites.
3. Comprobar el resultado de `deploy`, el commit de `build-info.json`, la navegación desde `/trama-academia/`, una ficha directa, filtros compartidos, comparación y fuentes en escritorio y móvil.
4. Para reconstruir la misma edición, ejecutar manualmente «Verificar aplicación». Para recuperar una edición anterior, revertir de forma explícita los commits necesarios y volver a verificar y desplegar; no reescribir el historial.

`NEXT_PUBLIC_BASE_PATH` permite cambiar el prefijo al compilar; el valor predeterminado es `/trama-academia`. Los enlaces internos, formularios, fuentes y archivos de datos respetan ese prefijo. Los archivos de configuración de Sites que permanecen en Git son históricos y no forman parte del despliegue activo.

Para comprobar el índice de observaciones en una base configurada, ejecutar `node scripts/db/check-observation-url-index.mjs` con `DATABASE_URL` disponible. La prueba copia la estructura y los índices a una tabla temporal, comprueba dos URLs largas y su igualdad exacta, y elimina la tabla al terminar la transacción. No modifica filas persistentes.

## Lectura pública y rendimiento

| Ruta | Contenido |
| --- | --- |
| `/data/manifest.json` | Fecha de edición y rutas de los índices con huella de contenido. |
| `/data/explorer.<hash>.json`, `/data/funding.<hash>.json` | Campos de búsqueda, condiciones clasificadas e indicadores institucionales. |
| `/data/records/<id>.<hash>.json` | Ficha completa sin pérdida de evidencia; se descarga para los resultados visibles. |
| `/oportunidad/<id>/` | HTML completo, accesible mediante enlace directo y sin ejecutar búsquedas. |
| `/mi-camino/` | Plan local por situación, objetivo, movilidad y área; casillas, reinicio y descarga. No decide elegibilidad ni modifica los filtros de otras páginas. |
| `/doctorado-en-espana/` | Guía de acceso, preparación, grupos, financiación y candidatura, con fuentes por bloque. |
| `/programas/` | Directorio recurrente con edición y calendario separados de vigencia. |
| `/seleccion/` | Lista del visitante guardada en su navegador; resuelve fichas actuales desde un mismo manifiesto y permite comparar y exportar CSV. |
| `/guia/`, `/guia/<código>/` | Comparación de dos países y 31 guías con fuentes por criterio. |
| `/instituciones/`, `/fuentes/` | Índices independientes con filtros y paginación. |
| `/api/catalogue`, `/api/explorer` | Copias estáticas de compatibilidad; no aceptan consultas al servidor. |
| `/build-info.json` | Commit, edición, número de fichas y tamaños del HTML comprobados al compilar. |

Los estados de las fichas se recalculan en el navegador conforme pasan los plazos. El HTML inicial conserva el estado de la fecha de construcción; con JavaScript desactivado se debe contrastar el plazo visible con la convocatoria. Los filtros requieren JavaScript. Los indicadores institucionales mantienen su propia fecha de edición y no se recalculan al ordenar. Más detalles en [GitHub Pages y filtros](github-pages.md).

## Diagnóstico

| Situación | Comprobación y respuesta |
| --- | --- |
| La web conserva una edición anterior | Consultar `build-info.json` y el último trabajo `deploy`; repetir el flujo de CI si la actualización terminó pero falló la publicación. Un fallo conserva el sitio publicado anteriormente. |
| Una fuente devuelve 403, 429, error de TLS o contenido vacío | Conservar la ficha anterior y el diagnóstico. Respetar el bloqueo y `Retry-After`; no marcar la oportunidad como cerrada por ese error. |
| Falla una frase de `evidenceChecks` | Leer de nuevo el documento y revisar las condiciones. No eliminar el control para hacer pasar la comprobación. |
| Falla la lectura de un PDF | Comprobar `TRAMA_PYTHON`, dependencias, formato y límites. No sustituirlo por información inferida del título. |
| El barrido se interrumpe | Consultar `.cache/harvest-progress.json`, `.cache/audit.json` y la cola persistida. El rastreo institucional continúa desde lo guardado. |
| Se agota la cuota bibliométrica | Esperar el reinicio indicado por el proveedor. Solo incorporar disciplinas con agregados completos; no publicar un tier a partir de una descarga parcial. |

Las ejecuciones semanales conservan diagnósticos como artefactos de GitHub Actions durante 14 días. Los datos brutos y los documentos de trabajo están ignorados por Git; no deben incorporarse a una publicación.

## Mantener programas recurrentes y guías

La propiedad opcional `recurrence` de las semillas describe categoría, periodicidad, calendario, edición de referencia, estado de esa edición y cautelas. Solo se añade con evidencia de continuidad; no anticipar fechas o financiación de una edición futura. El verificador conserva esta información en la ficha y el directorio la recibe como un resumen compacto. Las escuelas de verano se identifican como formación investigadora, no como titulaciones.

Las guías se editan en `data/country-guides.json`. Sus ocho criterios necesitan referencias mediante `factSources`; el título, URL, ámbito, consulta y actualización de cada fuente son datos separados. Una regla de una universidad no debe generalizarse al país. Tras cambiar datos o guías, ejecutar pruebas, tipos y build; comprobar también la selección por URL y la lectura en móvil. No editar los índices generados.

## Mantener el recorrido desde España

La guía reside en `data/spain-doctoral-guide.ts`: cada bloque factual atribuye sus fuentes y las pautas propias se marcan como editoriales. Conservar alcance institucional, edición y fecha de cada fuente; no universalizar requisitos de una beca como acceso doctoral. `scripts/web/spain-guide.test.mjs` comprueba referencias, estructura de tablas y enlaces del plan.

`lib/doctoral-path.ts` define las preferencias y pasos de `/mi-camino/`. La clave `trama:doctoral-path:v1` es independiente de `trama:selection:v1`. Lee el almacenamiento antes de cada cambio y fusiona solo los campos o casillas modificados; un valor ilegible no se sobrescribe. Los fallos de almacenamiento mantienen un plan temporal y aviso visible. Las preferencias no alteran silenciosamente búsquedas abiertas: generan enlaces cuyos filtros son visibles. Nacionalidad, residencia y elegibilidad nunca se deducen del plan.

Las entradas de portada pueden fijar `situacion` y `objetivo` mediante valores enumerados; se consumen al entrar en el plan. No se aceptan enlaces arbitrarios ni datos personales en esos parámetros. Al revisar, probar una entrada de cada situación, cambios de objetivo, recarga, casillas, descarga, reinicio, retorno a selección y los enlaces de la guía en escritorio y móvil.
