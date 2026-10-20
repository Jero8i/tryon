# Verdant · PNG transparentes

## Corrección de color frontal

El catálogo usa ahora `verdant-front-color-v2.png`. Se conserva `verdant-front.png` como primera versión para comparación. Comparación visual con `verdantFront.jpeg`: la primera edición intensificó amarillos y cian/verde, y aumentó contraste. La versión v2 reduce esos efectos y aproxima los tonos oliva/gris del original. No es una coincidencia colorimétrica garantizada: sigue siendo una edición con IA. La imagen lateral todavía corresponde a la primera edición.

Herramienta: imagegen integrada. Prompt de corrección:

COLOR CORRECTION ONLY. Image 1 is the edit target: existing transparent frontal glasses PNG. Image 2 is the authoritative ORIGINAL photographed product COLOR REFERENCE. The target has become too saturated, too cyan/teal and bright yellow, too contrasty and artificially shiny. Match the muted natural olive gray-green, subdued brown/amber tortoiseshell and softer highlights/contrast of image 2 precisely. Do not make emerald/teal/neon green or golden yellow. Preserve target image 1 geometry, exact silhouette, framing, relative bridge position, empty transparent lens openings with no temples inside, rivets and alpha transparency. Keep entire frame and existing canvas proportions/padding identical for virtual try-on alignment. Do not add temples, background, shadow or text. Deliver highest-quality RGBA PNG genuine transparent background. Restore photographic color fidelity rather than beautifying the product.

Preparados con la herramienta integrada imagegen a partir de `verdantFront.jpeg` y `VerdantSide.jpeg`. Son ediciones con IA: verificar la fidelidad con las fotos originales antes de usarlas como fotografía comercial definitiva.

- `verdant-front.png`: 1541 × 1021, RGBA. Vista para el probador; aberturas transparentes y patillas posteriores eliminadas.
- `verdant-side.png`: 1540 × 1021, RGBA. Vista de producto en perspectiva con patillas conservadas.

Medidas proporcionadas por el usuario: ancho total 148 mm, alto total del frente 52 mm y patillas 140 mm. El ajuste del probador es aproximado; con DP conocida utiliza una referencia física frontal. `anchorY` indica la altura relativa del punto de apoyo dentro del PNG, incluidos sus márgenes transparentes.

## Prompts utilizados (herramienta integrada)

Frontal:

Edit target: attached original Verdant FRONT product photograph. Produce a maximum-quality high-resolution lossless PNG with genuine alpha transparency, tightly cropped to glasses with only 2% transparent margin. Preserve the EXACT photographed frontal frame geometry, proportions, tortoiseshell green/olive translucent acetate texture, colors, reflections and tiny metal rivets; no redesign or stylization. Remove the white background and floor shadows completely, with precise antialiased edges free of white halos. The lens openings must be fully transparent. For this virtual try-on overlay remove the folded-back temples visible INSIDE the two lens openings, preserving the entire front rim and bridge faithfully. No text, no checkerboard baked into pixels, no backdrop. Keep the original frontal orientation and level alignment, the full frame must not be clipped.

Lateral:

Edit target: Verdant three-quarter SIDE product photograph supplied. Create highest-quality high-resolution transparent PNG product cutout with true alpha. Preserve EXACT photographed frame silhouette, original perspective, full temples, green olive tortoiseshell acetate pattern, tiny rivets, highlights and material, no redesign. Remove all white backdrop, floor shadows and specks; clean fine antialiased edges with no white fringe. Make empty lens openings transparent while preserving temples seen through the openings. Tight product crop with about 2% transparent padding. Whole glasses including temple ends visible. No text or artificial checkerboard.
