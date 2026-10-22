# Frontal negra de prueba · sin patillas

Archivo: `prueba-negro-frontal-sin-patillas.png`. Editado con imagegen integrada desde la imagen adjunta en la conversación. Se quitaron las patillas sobre la montura y dentro de los cristales, el fondo y la sombra. Es un ejemplo de prueba; no se agregó al catálogo con un nombre, ID o medidas inventados.

Se puede cargar el PNG en la frontal del modelo que se está probando en el admin. La fotografía original de ese borrador no se sustituyó automáticamente en IndexedDB ni en Supabase.

## Prompt utilizado

Edit ONLY the user's frontal black eyeglasses product photograph, for a virtual try-on overlay. Keep ONLY the complete FRONT rim and bridge. Remove ALL rear temples: both gray diagonals extending ABOVE the top rim and both gray temple tips extending DOWN INSIDE the lens openings. Remove white backdrop and floor shadow completely. Both lens openings fully alpha-transparent. Preserve exact narrow oval/rectangular front shape, original muted black acetate, highlights, dimensions, original proportions, hinge ends and bridge. Do not thicken the rim, add reflections, redesign, saturate, reconstruct a different product or change front geometry. Genuine transparent RGBA PNG with fine antialiased edges, no white halo, no text or checkerboard. Full front not clipped, level and centered, preserve source canvas aspect and original placement to support overlay alignment. Highest available quality.

## Probar localmente sin API

1. Ejecutar `npm run dev` y abrir `/admin.html`.
2. Abrir el borrador del modelo negro, sin cambiar su ID ni sus medidas.
3. En Foto frontal, cargar `public/frames/prueba-negro-frontal-sin-patillas.png`.
4. Marcar nuevamente el apoyo del puente, guardar el borrador y pulsar Probar con cámara.

No es necesario activar Preparar frontal con IA para esta prueba: el PNG ya fue preparado en la conversación. Cargar un archivo frontal nuevo pasa a ser la nueva foto original del borrador; exportar antes una copia si se desea conservar la fotografía anterior junto con todos sus datos.
