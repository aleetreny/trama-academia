# Revisión de uso del 21 de septiembre de 2026

Esta ampliación facilita encontrar, guardar y contrastar oportunidades dentro de la identidad visual existente. El [sistema visual](../DESIGN.md) documenta las decisiones de estilo; este informe describe comportamiento y límites. No modifica los criterios de clasificación ni convierte la presencia en el catálogo en una convocatoria abierta.

## Buscar con menos pasos

Explorar y Financiación comparten una cabecera compacta, búsqueda visible y accesos de partida. En Explorar son «Máster con investigación», «Plazas doctorales», «Primeras experiencias» y «Postdoc»; Financiación ofrece accesos orientados a ayudas. Cada acceso aplica una combinación completa de filtros desde los valores iniciales: no acumula criterios ocultos de una búsqueda anterior.

País, área, financiación y vigencia aparecen primero. «Más filtros» reúne etapa, tipo cuando corresponde, idioma mencionado y plazo. «Indicadores de investigación» separa disciplina y tier de las condiciones del programa, con acceso al método. Los chips muestran los filtros activos, incluso los de grupos cerrados, y permiten retirarlos individualmente; «Limpiar filtros» restablece la búsqueda. Los filtros, el orden y la página se conservan en la URL.

En móvil, el botón «Filtros» abre el panel y anuncia cuántos criterios están activos. «Ver resultados», con el recuento cuando está disponible, cierra el panel y lleva el foco a los resultados. La búsqueda y los accesos iniciales siguen disponibles sin abrirlo.

La búsqueda reconoce equivalencias literales: **IA / AI / inteligencia artificial / artificial intelligence**, y, por separado, **ML / machine learning / aprendizaje automático**. Se comparan palabras completas, con normalización de tildes y mayúsculas. No se deduce que un programa genérico de ciencia de datos incluya IA o ML ni se confunden ambas familias de términos.

## Mi selección

Se pueden guardar hasta **50 fichas** desde resultados, programas recurrentes y fichas individuales. La colección se almacena en el navegador con solo identificador, título e institución, sin cuenta. No se envía la colección guardada a un servidor. La consulta de condiciones sí descarga los índices y las fichas públicas necesarias.

Las condiciones se leen de la edición actual del catálogo. Guardar una ficha no congela sus condiciones, no mantiene abierta una convocatoria y no reserva una plaza. La selección reúne oportunidades y financiación de una misma revisión del manifiesto. Si una ficha deja de estar disponible, conserva su título e institución y lo indica expresamente, sin inventar condiciones actuales.

La lista permite quitar fichas, paginar y comparar **dos o tres** opciones. La comparación requiere disponer de sus condiciones; un fallo de descarga ofrece reintento y conserva lo guardado. Si se pierde una opción durante la comparación y quedan menos de dos, esta se cierra.

«Exportar lista» descarga un CSV de la selección con las condiciones disponibles en la edición consultada, sus fechas y enlaces a la fuente y a TRAMA. Si falla la descarga de una ficha necesaria, se detiene la exportación y se permite reintentar. El CSV incluye marca UTF-8, escapa comillas y neutraliza inicios de celda que podrían interpretarse como fórmulas; las fichas ausentes se identifican como no disponibles.

La selección pertenece al navegador y al sitio: no se sincroniza entre dispositivos y se pierde al borrar sus datos. Las pestañas del mismo navegador pueden reflejar cambios de almacenamiento. Si este está bloqueado, lleno o no puede leerse con seguridad, la interfaz avisa; los cambios pueden quedar solo durante la visita. No se sobrescribe una colección ilegible tratándola como vacía.

## Volver al contexto

Los enlaces a fichas incluyen un parámetro `desde` para regresar a resultados, financiación, programas o selección. Explorar y Financiación conservan sus filtros, orden y página; Programas conserva búsqueda, filtros y página. La selección regresa a su lista guardada, sin prometer conservar la página ni las casillas de comparación.

La ruta de retorno admite únicamente `/explorar`, `/financiacion`, `/programas` y `/seleccion`, con soporte para la base `/trama-academia`. Rechaza destinos externos y rutas ajenas, elimina fragmentos y parámetros `desde` anidados, y limita la longitud de la consulta a 1.800 caracteres. Un valor inválido utiliza un destino interno de respaldo. La ficha renderiza un enlace estable sin depender del navegador durante la generación del HTML.

## Validación y publicación

La validación local reúne **243 pruebas Node correctas**, lint sin avisos, tipos y compilación estática correctos. La exportación comprueba las 3.637 fichas y 96.297 referencias internas. El catálogo conserva su revisión `83727c0483b507b9`; esta ampliación cambia la experiencia de uso sin modificar sus datos.

En navegador se han comprobado filtros y retorno desde una ficha, guardado y recarga, cambios entre dos pestañas, paginación de 13 fichas, comparación entre páginas, cierre con Escape y descarga real del CSV. Bloquear la descarga del manifiesto conserva la selección y permite recuperarla con «Reintentar». Las pruebas a 390 y 820 píxeles confirman ausencia de desbordamiento horizontal, y el botón móvil cierra filtros y enfoca resultados. Son pruebas de navegador con dimensiones simuladas, no ensayos en todos los dispositivos físicos. La evidencia local se conserva en `work/recorrido-y-seleccion/`, fuera de Git.

La validación local no acredita por sí sola CI ni publicación. Para cada entrega, aplicar la [guía de operación](operations.md) y la [verificación de GitHub Pages](github-pages.md).

| Comprobación | Evidencia que debe conservarse |
| --- | --- |
| Lógica y seguridad | `npm test`: equivalencias de búsqueda, filtros, selección, límite, datos inválidos, CSV, retornos y carga de índices de una misma revisión. |
| Integración | `npm run lint`, `npm run typecheck` y `npm run build`, incluida la verificación de fichas, enlaces, base de publicación y presupuestos. |
| Interacción | Escritorio y móvil: presets, chips, filtros progresivos, «Ver resultados», teclado, foco, guardar/quitar, recarga, varias pestañas, comparación y exportación. |
| Recuperación | Almacenamiento bloqueado o ilegible, ficha retirada, descarga fallida y reintento sin perder la selección. |
| Publicación | Contrastar el commit de [build-info.json público](https://aleetreny.github.io/trama-academia/build-info.json) con su ejecución correcta en [GitHub Actions](https://github.com/aleetreny/trama-academia/actions), y probar las rutas e interacciones afectadas en esa edición. |

Las condiciones del catálogo son una instantánea con fuentes y fecha de comprobación, no una consulta en vivo a cada institución. Antes de solicitar una plaza o ayuda, el usuario debe confirmar en la fuente oficial el plazo, los requisitos y la financiación aplicables.
