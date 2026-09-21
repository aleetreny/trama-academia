# Presentar TRAMA

[Web pública](https://trama-academia.aleetreny.chatgpt.site) · [Repositorio](https://github.com/aleetreny/trama-academia)

TRAMA reúne oportunidades académicas europeas en ciencia de datos, aprendizaje automático, estadística, informática y matemáticas aplicadas. Permite recorrer las etapas de una carrera investigadora y comparar las condiciones publicadas por las instituciones.

## Recorrido de cinco minutos

1. **Portada:** elegir una etapa del recorrido académico. Los contadores describen el catálogo y distinguen los programas de las vacantes.
2. **Explorar:** buscar una institución o un tema, aplicar los filtros y seleccionar dos o tres fichas para comparar. En móvil, la tabla se desplaza lateralmente.
3. **Una ficha:** revisar requisitos, investigación, costes y financiación; comprobar el estado y abrir la fuente institucional. Un programa existente puede tener cerrada su última admisión.
4. **Financiación:** distinguir una beca convocada de un programa recurrente, una exención condicionada o un contrato. Los importes conservan su moneda y periodo.
5. **El doctorado en Europa:** comparar los sistemas de varios países antes de entrar en convocatorias concretas.
6. **Instituciones y fuentes:** mostrar los tiers por disciplina, sus indicadores y las fuentes. Una muestra insuficiente aparece sin tier. El registro de fuentes admite búsqueda y paginación. La cobertura pendiente y las incidencias permanecen visibles.

## Cifras de la edición del 21 de septiembre de 2026

| Medida | Recuento | Qué representa |
| --- | ---: | --- |
| Registros | 3.373 | Programas, anuncios y familias de financiación; no todos están abiertos. |
| Fuentes | 2.946 | Fuentes del catálogo, con estado y fecha de revisión. |
| Instituciones inventariadas | 6.360 | Entidades localizadas; no equivale a cobertura completa. |
| Con fuentes localizadas | 3.185 | Instituciones con alguna ruta de adquisición identificada. |
| Con alguna fuente comprobada | 3.160 | Comprobación de al menos una fuente, no de toda su oferta. |

Los tiers tienen muestras suficientes para 850 instituciones en informática, 548 en IA, 142 en estadística y 89 en matemáticas aplicadas. Las cohortes se solapan y no deben sumarse. Se muestran las ventanas temporales, los denominadores y los umbrales del método.

## Qué afirmar y qué falta

La aplicación permite consultar, filtrar, comparar y revisar la procedencia de las oportunidades incluidas. El recolector semanal está configurado en GitHub Actions; Neon sirve los datos y existe una instantánea de respaldo. El botón de actualización consulta el catálogo recolectado, sin rastrear internet de nuevo.

**La cobertura europea es parcial.** No debe presentarse como un censo exhaustivo ni como una verificación continua de todas las convocatorias. Hay fuentes con incidencias, candidatos pendientes y posibles duplicados entre portales. Las tres fichas heredadas de máster cuya investigación no está suficientemente acreditada conservan su estado sin verificar. Los tiers miden indicadores de investigación de una disciplina; no garantizan la calidad de un programa, supervisor ni oferta de financiación.

La revisión de presentación incluye navegación y filtros, comparación, estados sin resultados, lectura en escritorio y móvil, comprobaciones del catálogo y controles de código. Los resultados de la ejecución automática correspondiente están en [GitHub Actions](https://github.com/aleetreny/trama-academia/actions/workflows/ci.yml). La operación y recuperación se explican en la [guía de operación](operations.md).
