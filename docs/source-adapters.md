# Adquisición nórdica

Todas las peticiones usan la política común de robots, caché condicional, pausas y reintentos. La ausencia en un listado no demuestra que una plaza haya cerrado. El proceso de revisión de anuncios conocidos conserva la última evidencia y señala los fallos.

| Fuente | Descubrimiento | Evidencia de la ficha | Límite conocido |
| --- | --- | --- | --- |
| [KTH](https://www.kth.se/lediga-jobb/?l=en) | Todos los enlaces a anuncios del portal | Proyecto y requisitos separados; país, ciudad, contrato y plazo en campos del anuncio | Otras vías de contratación institucional pueden publicarse fuera del portal |
| [Aalto](https://www.aalto.fi/en/open-positions) | Todas las páginas enlazadas del listado | Texto del anuncio, fecha visible y lugar de trabajo en el enlace institucional a Workday | La hora del marcado puede discrepar del texto; no se da por confirmada |
| [Uppsala](https://www.uu.se/en/about-uu/join-us/jobs-and-vacancies.html) | Estado público del listado y parámetro `start`; se comprueba el total anunciado | Descripción y campos de contrato, dedicación, ciudad y fecha | Los títulos y requisitos en sueco pueden precisar revisión adicional |
| [Helsinki](https://jobs.helsinki.fi/go/Teaching-and-research-positions/8703802/) | Listados de investigación/docencia y de profesorado, con su paginación | Descripción y microdatos del lugar de trabajo y fecha | La hora de los microdatos no se equipara automáticamente al cierre del texto |
| [Jobbnorge](https://www.jobbnorge.no/search/en) | API pública enlazada por el buscador: `https://publicapi.jobbnorge.no/v3/jobs?language=2` | Título, institución, ubicación nacional, dedicación y plazo del feed | API antigua del texto completo inaccesible en la comprobación; fuente parcial y requisitos/salario pendientes |

Los conectores institucionales visitan los anuncios antes de filtrar por disciplina: un título genérico no impide descubrir un proyecto de ML o una plaza de verificación formal. Se excluyen empleos comerciales, destinos extraeuropeos y menciones meramente auxiliares de software o estadística.

Los anuncios de Jobbnorge conservan el identificador del portal en la evidencia. Solo se aceptan ubicaciones declaradas nacionales y empleadores o categorías académicas. La revisión de registros omitidos consulta el feed una vez por ejecución y no convierte su ausencia en un cierre.

La edición del 19 de septiembre revisó 47 anuncios de KTH, 24 de Aalto, 82 de Uppsala y 23 de Helsinki; el feed de Jobbnorge contenía 1.201 anuncios de todos los sectores. Son medidas de esos listados en esa fecha, no totales nacionales ni garantías de cobertura exhaustiva.

Para comprobar un subconjunto sin repetir todas las fuentes:

```sh
npm run harvest -- --source=kth,aalto,uppsala,helsinki,jobbnorge
npm run harvest:programmes
npm run harvest:audit
```

Ejecutar los procesos que escriben `data/catalogue.json` de forma secuencial. No publicar en Neon si la auditoría falla. Los fallos de acceso se muestran como revisiones parciales.
