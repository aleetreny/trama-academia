# Operación y publicación de TRAMA

Guía para mantener el catálogo, ejecutar los recolectores y publicar una edición reproducible. Para el alcance del producto, consultar el [README](../README.md).

## Preparar el entorno

Node 22.19 o posterior. Desde la raíz del repositorio, ejecutar `npm ci` y `npm run dev`; el puerto predeterminado es 5173. La web puede funcionar sin credenciales usando la instantánea versionada. `npm run build` genera el Worker de Sites y los activos en `dist/`; `npm start` sirve esa compilación local con Wrangler.

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
npm run typecheck
npm run build
```

La web pública no necesita iniciar sesión. La base se conecta por HTTPS con `@neondatabase/serverless`. Para usar Neon en desarrollo, copiar `.env.example` a `.dev.vars` y completar `DATABASE_URL` con una credencial de **solo lectura**. Este archivo está ignorado por Git. Los scripts de sincronización y migración leen `DATABASE_URL` del entorno del proceso; no cargan `.dev.vars` automáticamente. Utilizar un rol de escritura específico para sincronizar y un rol de administración solo para migrar. No introducir credenciales en variables `NEXT_PUBLIC_*`, comandos que queden en el historial, registros o archivos versionados.

## Actualización semanal

[Actualizar catálogo](https://github.com/aleetreny/trama-academia/actions/workflows/refresh.yml) se ejecuta los lunes a las **04:23 UTC**, además de admitir ejecución manual. El horario de GitHub Actions puede retrasarse.

1. Descubrir y verificar vacantes con `npm run harvest`.
2. Comprobar programas con `npm run harvest:programmes`.
3. Revisar anuncios conocidos que no aparecieron de nuevo con `npm run harvest:verify`.
4. Continuar la cola institucional con `npm run harvest:institutions`, alternando países y limitando el trabajo por institución.
5. Validar geografía, etapas, identidad, fechas y evidencia con `npm run harvest:audit`.
6. Publicar mediante `npm run db:sync` y `npm run db:sync:institutions`, y guardar las instantáneas y la cola en Git.

El secreto de repositorio `DATABASE_URL` es una credencial específica del recolector con SELECT, INSERT y UPDATE; no permite DELETE ni cambios de esquema. El sitio usa un rol distinto de solo lectura. Las migraciones de `db/migrations` se aplican por separado con una credencial de administración, primero en una rama de validación.

Las páginas de resultados vuelven a consultar el catálogo cada cinco minutos y tienen un botón de actualización. El API permite una caché de hasta 60 segundos y `stale-while-revalidate` durante 120 segundos adicionales. Esto actualiza los datos ya recolectados; **no lanza un nuevo rastreo de internet**.

El registro institucional consulta Neon con filtros y páginas de 25 entidades. La actualización semanal continúa el descubrimiento de fuentes; las incorporaciones de programas siguen necesitando evidencia y revisión editorial. No recalcula automáticamente los indicadores bibliométricos ni declara terminada una institución por haber leído su página inicial.

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

Son dos operaciones distintas. La sincronización con Neon actualiza las consultas del sitio; una nueva versión de Sites actualiza el código y su instantánea de respaldo.

### Datos

1. Terminar el recolector antes de reconstruir el registro institucional. No ejecutar dos escritores sobre la misma cola.
2. Revisar el informe de adquisición y ejecutar `npm run harvest:audit`. Los candidatos de `npm run harvest:candidates` son una cola editorial; ese comando no importa oportunidades.
3. Con la credencial del recolector disponible en el entorno, ejecutar `npm run db:sync` y `npm run db:sync:institutions`. Comparar las fichas publicadas con la instantánea local y comprobar los dos modos de lectura cuando corresponda.
4. Confirmar en Git los datos, semillas y fuentes que pertenezcan a la edición. Conservar los registros y fichas anteriores salvo correcciones documentadas; una lectura parcial no autoriza a borrarlos.

La sincronización escribe por lotes: puede quedar a medias si falla. Repetirla con la misma instantánea es seguro; hay que comprobar el resultado antes de considerar publicada una edición. `db:sync` conserva las filas omitidas y solo excluye las identificadas en `data/exclusions.json`.

### Esquema

Las migraciones SQL versionadas están en `db/migrations/`. `npm run db:migrate` las aplica con `DATABASE_URL`; probar primero en una rama de validación de Neon. La rutina semanal no ejecuta migraciones ni necesita permisos de administración. La migración `0002_observation_url_hash` conserva las URLs completas de las observaciones y sustituye su clave de índice por una huella de longitud fija, para admitir enlaces largos. El índice no es único; las consultas de identidad deben contrastar también la URL completa. `npm run db:generate` genera propuestas de migración que deben revisarse antes de aplicarlas.

### Código y respaldo de Sites

El proyecto está registrado en `.openai/hosting.json`. Publicar una edición sigue este orden:

1. Verificar la edición con `npm test`, `npm run typecheck`, `npm run build` y las pruebas de PDF si cambia su lector. Confirmar el código y los datos exactos en Git y comprobar CI.
2. Preparar un checkout de publicación cuyo árbol Git sea idéntico al commit canónico de `main`. El repositorio de Sites conserva una cadena propia de commits para no arrastrar objetos históricos que superen su límite; cada commit identifica el origen canónico y usa como padre la última publicación confirmada. Comprobar el SHA publicado y la igualdad de árboles: una rama local llamada `sites-source` puede estar atrasada.
3. Enviar el commit al repositorio de fuentes del proyecto mediante las herramientas de Sites. Después del envío, obtener el SHA con `git rev-parse --verify HEAD` en ese mismo checkout y usarlo al guardar la versión. No reescribir el historial de `main`.
4. Compilar desde el checkout exacto. El paquete contiene exclusivamente `.openai/hosting.json` y `dist/`. Se excluyen credenciales, entornos, cachés, fuentes descargadas, enlaces simbólicos y rutas que salgan del paquete.
5. Guardar y desplegar la versión con las herramientas de Sites. Esperar el estado terminal de la publicación y comprobar la URL pública: navegación, filtros, comparación, actualización, una ficha con evidencia y los recuentos de la edición. Conservar SHA, versión, despliegue y comprobaciones en el registro de publicación.

Si no está disponible el empaquetador de Sites, el repositorio incluye esta alternativa. Ejecutarla **desde el checkout ya compilado**:

```sh
COPYFILE_DISABLE=1 node scripts/package-site.mjs /tmp/trama-site.tar.gz
```

En macOS, `COPYFILE_DISABLE=1` evita los metadatos AppleDouble. Inspeccionar también los miembros reales del archivo comprimido y verificar el Worker antes de subirlo. Nunca reutilizar `dist/` de otro commit. Un cambio de documentación en GitHub no necesita por sí solo un despliegue del sitio.

Para comprobar el índice de observaciones en una base configurada, ejecutar `node scripts/db/check-observation-url-index.mjs` con `DATABASE_URL` disponible. La prueba copia la estructura y los índices a una tabla temporal, comprueba dos URLs largas y su igualdad exacta, y elimina la tabla al terminar la transacción. No modifica filas persistentes.

## Lectura pública y rendimiento

| Ruta | Contenido |
| --- | --- |
| `/api/catalogue` | Catálogo completo, fuentes, ejecución y modo `live` o `snapshot`. |
| `/api/explorer` | Fichas compactas de oportunidades para los listados. |
| `/api/explorer?funding=1` | Fichas compactas de financiación. |
| `/instituciones` | Consulta institucional paginada de 25 entidades, con filtros. |
| `/fuentes` | Alcance, recuentos, incidencias y fuentes del catálogo. |

Los listados reciben solo sus registros y los campos necesarios para tarjetas, filtros y comparación. La evidencia completa se conserva en las fichas y en `/api/catalogue`. El catálogo compacto se serializa una sola vez para evitar exceder el presupuesto de CPU del Worker. Al cambiar estos flujos, comprobar también el comportamiento en el navegador público: la compilación correcta por sí sola no acredita el tiempo de respuesta.

## Diagnóstico

| Situación | Comprobación y respuesta |
| --- | --- |
| El sitio muestra `snapshot` | Revisar la disponibilidad y los permisos de lectura de Neon. La copia compilada puede ser anterior a la última actualización semanal. |
| Una fuente devuelve 403, 429, error de TLS o contenido vacío | Conservar la ficha anterior y el diagnóstico. Respetar el bloqueo y `Retry-After`; no marcar la oportunidad como cerrada por ese error. |
| Falla una frase de `evidenceChecks` | Leer de nuevo el documento y revisar las condiciones. No eliminar el control para hacer pasar la comprobación. |
| Falla la lectura de un PDF | Comprobar `TRAMA_PYTHON`, dependencias, formato y límites. No sustituirlo por información inferida del título. |
| El barrido se interrumpe | Consultar `.cache/harvest-progress.json`, `.cache/audit.json` y la cola persistida. El rastreo institucional continúa desde lo guardado. |
| Se agota la cuota bibliométrica | Esperar el reinicio indicado por el proveedor. Solo incorporar disciplinas con agregados completos; no publicar un tier a partir de una descarga parcial. |

Las ejecuciones semanales conservan diagnósticos como artefactos de GitHub Actions durante 14 días. Los datos brutos y los documentos de trabajo están ignorados por Git; no deben incorporarse a una publicación.
