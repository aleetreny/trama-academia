---
name: TRAMA
description: Información académica legible, comparable y con fuentes visibles.
colors:
  blue: "#355ce2"
  ink: "#182a36"
  background: "#f6f8f8"
  card: "#fafbf9"
  paper: "#e9eef0"
  accent: "#dde5fc"
  muted-text: "#566772"
  border: "#ced8dd"
typography:
  display:
    fontFamily: "Gloock, Georgia, serif"
    fontWeight: 400
  body:
    fontFamily: "Manrope, sans-serif"
    fontSize: "16px"
    lineHeight: 1.6
  utility:
    fontFamily: "IBM Plex Mono, monospace"
rounded:
  control: "4px"
  radius: ".375rem"
---

# Sistema visual de TRAMA

## Overview

TRAMA orienta a personas que viven en España y consideran un doctorado en datos, IA, estadística, informática o matemáticas aplicadas. La interfaz parte de decisiones —probar la investigación, preparar el perfil, comprobar acceso, elegir grupo y sostener la tesis— y conecta esas decisiones con fuentes y oportunidades. El catálogo europeo de todas las etapas sigue disponible.

La identidad usa Manrope y Gloock, azul para acciones y fondos claros que recuerdan al papel. Titulares editoriales, listas de pasos y herramientas de consulta conviven en el mismo sistema. Fuentes, fechas, incertidumbre y alcance forman parte de la información principal; una recomendación de navegación no debe parecer una decisión de elegibilidad.

Esta descripción se ha contrastado con la implementación local del 21 de septiembre de 2026. Las referencias son [globals.css](app/globals.css), [home.css](app/home.css), [doctoral-path.css](components/doctoral-path.css), [guide.css](app/doctorado-en-espana/guide.css), [explorer.css](components/explorer.css) y [selection.css](components/selection.css). Se conserva la identidad existente. El [informe del cambio](docs/spain-refocus-2026-09-21.md) recoge su estado de validación y publicación.

## Colors

El azul `--blue` / `--primary` identifica acciones, enlaces y selección. Su hover principal es `#2448ca`; `--accent` aporta el fondo suave de los estados activos. La tinta `--ink` sirve al texto principal y `--muted-foreground` a explicaciones y metadatos.

`--background` es el fondo de página; `--card`, el de las superficies; `--paper` / `--secondary`, el de bloques de apoyo. Los controles de búsqueda usan blanco. `--border` separa áreas sin añadir ruido. El amarillo `--yellow: #e3b957` es un acento puntual de portada; `--destructive: #aa334b` está reservado para semántica de error. Los estados deben conservar una etiqueta textual, además del color.

## Typography

- **Gloock, 400:** titulares y secciones editoriales. Las cabeceras generales usan 52 px; el explorador compacto, 32 px y 28 px en móvil; selección, 42 px y 32 px en móvil. La portada tiene una escala propia, hasta 87 px; la guía usa secciones de 32 px y 29 px en móvil.
- **Manrope:** cuerpo, formularios, títulos de fichas y acciones. Base de 16 px con interlínea 1,6; controles y metadatos entre 12 y 14 px. Los selectores del explorador pasan a 16 px en móvil.
- **IBM Plex Mono:** etiquetas editoriales, numeración y metadatos puntuales. No sustituye a Manrope en instrucciones o formularios extensos.

Las fuentes se sirven localmente. Conservar los tamaños según la función de cada pantalla: una herramienta de búsqueda puede tener una cabecera más compacta que una guía.

## Layout

El contenedor `.wrap` tiene un máximo de 1.380 px y márgenes internos de 52 px, reducidos a 30 px bajo 1.100 px y a 22 px bajo 760 px. El espacio se organiza mediante separadores, bloques de texto y rejillas; no existe una única escala de espaciado aplicada a todos los componentes.

La portada presenta una entrada principal a Mi camino, cuatro situaciones de partida y accesos a guía, financiación y catálogo. El cuaderno resume preguntas para decidir, sin presentar una carrera académica como secuencia obligatoria.

Mi camino usa una columna de preferencias de 320 px y otra de pasos. Bajo 760 px se dispone en una columna; los cuatro selectores se organizan en dos columnas y pasan a una bajo 480 px. Cada paso conserva su acción, explicación y enlace a la guía. Las búsquedas sugeridas se muestran después del plan, con los filtros que aplican y su límite de elegibilidad.

La guía desde España combina índice lateral y lectura. El índice deja de ser fijo en móvil y mantiene acceso a las doce secciones y fuentes. Las tablas tienen desplazamiento propio; las plantillas conservan saltos de línea y ajustan el texto a la pantalla.

El explorador presenta búsqueda y accesos iniciales antes de cuatro filtros principales. Las rejillas de filtros pasan a dos columnas bajo 1.000 px y a una bajo 760 px. Los filtros adicionales se despliegan por grupos. En móvil, el panel se abre con un botón y permite regresar al bloque de resultados. La selección usa dos columnas y una en móvil; sus acciones se ajustan a varias líneas.

## Elevation & Depth

Las herramientas de consulta son planas: fondos suaves y bordes de 1 px establecen jerarquía. La portada conserva el cuaderno inclinado y su sombra desplazada; son recursos de esa composición. No extender esas transformaciones a formularios, listados ni tablas. Respetar `prefers-reduced-motion`.

## Shapes

Predominan rectángulos de radio corto: 4 px en botones y selección; `--radius: .375rem` en búsqueda y filtros del explorador. Círculos y sellos aparecen en la portada y la numeración. Mantener contornos claros y evitar convertir todos los controles en cápsulas.

## Components

- **Acción principal:** azul, texto blanco, peso 700, radio de 4 px y altura mínima general de 50 px. Las acciones secundarias usan borde y fondo claro o transparente.
- **Búsqueda:** campo blanco de 54 px de alto, etiqueta accesible, icono auxiliar y botón explícito para borrar. No usar el placeholder como única etiqueta.
- **Filtros:** selectores nativos con etiqueta visible; grupos secundarios con `details` y `summary`. Los chips muestran cada filtro activo y permiten retirarlo individualmente.
- **Guardar:** botón de al menos 44 px, icono y texto; `aria-pressed` expresa el estado, con azul y fondo de acento al guardar. Los avisos de almacenamiento permanecen junto al control.
- **Fichas y comparación:** preservar identidad, condiciones, fuentes y estados desconocidos. Las tablas pueden desplazarse horizontalmente y deben seguir operables con teclado. No presentar el país de destino o del financiador como nacionalidad requerida.
- **Mi camino:** selectores nativos con etiquetas visibles, casillas nativas y contador de pasos marcados. Los controles esperan a la lectura inicial del estado local. El contador acompaña la lista; no es una puntuación de preparación. La confirmación de reinicio permanece junto al botón y explica que Mi selección se conserva.
- **Contexto personal:** mostrar el punto de partida y un enlace para ajustarlo, sin ocultar filtros ni atribuir requisitos a la persona. Explicar qué preferencias se guardan localmente y los fallos de persistencia junto al formulario.
- **Guía:** índice por anclas, bloques de lectura, tablas, notas y plantillas. Los bloques propios se identifican como «Orientación de TRAMA»; las afirmaciones respaldadas enlazan fuentes con su ámbito y fechas. No convertir un ejemplo universitario en una norma general.
- **Foco:** anillo azul visible. La base usa 3 px; el explorador usa 2 px con separación de 3 px. En móvil, los controles principales de filtros y selección tienen al menos 44 px de alto.

## Do's and Don'ts

- Reutilizar fuentes, tokens y controles existentes; ampliar el mismo sistema.
- Mantener enlaces descriptivos, estados vacíos, recuperación de errores y foco perceptible.
- Dar prioridad a la siguiente decisión y a la lectura en móvil; conservar acceso progresivo a los filtros avanzados y al catálogo completo.
- Distinguir plan y selección: reiniciar preferencias no elimina fichas guardadas. La descarga del plan es texto; la exportación de oportunidades es CSV con fuentes.
- Expresar incertidumbre sobre movilidad sin forzar un destino, y explicar que los enlaces sugeridos no comprueban elegibilidad.
- No ocultar incertidumbre ni expresar apertura o financiación solo mediante color.
- No sustituir la información por decoración, sombras generales o una nueva paleta.
