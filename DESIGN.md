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

TRAMA combina titulares editoriales con herramientas de consulta sencillas. La identidad existente usa Manrope y Gloock, azul para acciones y fondos claros que recuerdan al papel. El catálogo prioriza leer, filtrar y comparar; las fuentes, fechas y límites forman parte de la información principal.

Esta es una descripción del sistema implementado el 21 de septiembre de 2026, para extenderlo de forma coherente. Sus referencias son [globals.css](app/globals.css), [explorer.css](components/explorer.css) y [selection.css](components/selection.css). No introduce una identidad nueva.

## Colors

El azul `--blue` / `--primary` identifica acciones, enlaces y selección. Su hover principal es `#2448ca`; `--accent` aporta el fondo suave de los estados activos. La tinta `--ink` sirve al texto principal y `--muted-foreground` a explicaciones y metadatos.

`--background` es el fondo de página; `--card`, el de las superficies; `--paper` / `--secondary`, el de bloques de apoyo. Los controles de búsqueda usan blanco. `--border` separa áreas sin añadir ruido. El amarillo `--yellow: #e3b957` es un acento puntual de portada; `--destructive: #aa334b` está reservado para semántica de error. Los estados deben conservar una etiqueta textual, además del color.

## Typography

- **Gloock, 400:** titulares y secciones editoriales. Las cabeceras generales usan 52 px; el explorador compacto, 32 px y 28 px en móvil; selección, 42 px y 32 px en móvil.
- **Manrope:** cuerpo, formularios, títulos de fichas y acciones. Base de 16 px con interlínea 1,6; controles y metadatos entre 12 y 14 px. Los selectores del explorador pasan a 16 px en móvil.
- **IBM Plex Mono:** etiquetas editoriales, numeración y metadatos puntuales. No sustituye a Manrope en instrucciones o formularios extensos.

Las fuentes se sirven localmente. Conservar los tamaños según la función de cada pantalla: una herramienta de búsqueda puede tener una cabecera más compacta que una guía.

## Layout

El contenedor `.wrap` tiene un máximo de 1.380 px y márgenes internos de 52 px, reducidos a 30 px bajo 1.100 px y a 22 px bajo 760 px. El espacio se organiza mediante separadores, bloques de texto y rejillas; no existe una única escala de espaciado aplicada a todos los componentes.

El explorador presenta búsqueda y accesos iniciales antes de cuatro filtros principales. Las rejillas de filtros pasan a dos columnas bajo 1.000 px y a una bajo 760 px. Los filtros adicionales se despliegan por grupos. En móvil, el panel se abre con un botón y permite regresar al bloque de resultados. La selección usa dos columnas y una en móvil; sus acciones se ajustan a varias líneas.

## Elevation & Depth

Las herramientas de consulta son planas: fondos suaves y bordes de 1 px establecen jerarquía. La portada conserva el cuaderno inclinado, su sombra desplazada y los pequeños movimientos de las tarjetas; son recursos de esa composición. No extender esas transformaciones a formularios, listados ni tablas. Respetar `prefers-reduced-motion`.

## Shapes

Predominan rectángulos de radio corto: 4 px en botones y selección; `--radius: .375rem` en búsqueda y filtros del explorador. Círculos y sellos aparecen en la portada y la numeración. Mantener contornos claros y evitar convertir todos los controles en cápsulas.

## Components

- **Acción principal:** azul, texto blanco, peso 700, radio de 4 px y altura mínima general de 50 px. Las acciones secundarias usan borde y fondo claro o transparente.
- **Búsqueda:** campo blanco de 54 px de alto, etiqueta accesible, icono auxiliar y botón explícito para borrar. No usar el placeholder como única etiqueta.
- **Filtros:** selectores nativos con etiqueta visible; grupos secundarios con `details` y `summary`. Los chips muestran cada filtro activo y permiten retirarlo individualmente.
- **Guardar:** botón de al menos 44 px, icono y texto; `aria-pressed` expresa el estado, con azul y fondo de acento al guardar. Los avisos de almacenamiento permanecen junto al control.
- **Fichas y comparación:** preservar identidad, condiciones, fuentes y estados desconocidos. Las tablas pueden desplazarse horizontalmente y deben seguir operables con teclado.
- **Foco:** anillo azul visible. La base usa 3 px; el explorador usa 2 px con separación de 3 px. En móvil, los controles principales de filtros y selección tienen al menos 44 px de alto.

## Do's and Don'ts

- Reutilizar fuentes, tokens y controles existentes; ampliar el mismo sistema.
- Mantener enlaces descriptivos, estados vacíos, recuperación de errores y foco perceptible.
- Dar prioridad a resultados y lectura en móvil; conservar acceso progresivo a los filtros avanzados.
- No ocultar incertidumbre ni expresar apertura o financiación solo mediante color.
- No sustituir la información por decoración, sombras generales o una nueva paleta.
