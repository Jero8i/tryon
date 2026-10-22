# Integración de demostración

La página principal (`index.html`, `src/store.ts`) simula una tienda con tres productos. Cada tarjeta permite elegir un cristal y abrir el probador en un modal. No implementa compra ni modifica la tienda real.

El probador independiente vive en `tryon.html`. El modal lo carga en un iframe con `allow="camera"`:

```html
<iframe
  title="Probador virtual de Verdant"
  src="https://jero8i.github.io/tryon/tryon.html?frame=verdant&lens=clear&embed=1&parentOrigin=https%3A%2F%2Fmitienda.com"
  allow="camera"
  style="width:100%;height:80vh;border:0"
></iframe>
```

Reemplazar `parentOrigin` por el origen HTTPS real de la tienda (sin ruta). La página de ejemplo usa el origen del catálogo automáticamente. El `frame` es un ID del catálogo alojado en el probador (administrable en `admin.html` cuando se active el almacenamiento online); no se aceptan URLs de imágenes o medidas arbitrarias desde la tienda.

| Parámetro | Valores |
| --- | --- |
| `frame` | `verdant`, `nika-brown`, `bless-carey-black` |
| `lens` | `clear`, `blue`, `smoke`, `brown`, `green`, `none` |
| `embed` | `1` oculta cabecera y selector de monturas para mostrar el producto elegido |
| `parentOrigin` | Origen de la tienda, usado para validar mensajes de cierre |

Un ID de modelo desconocido o retirado muestra que no está disponible; un ID de cristal desconocido usa el primer preset válido. La persona puede cambiar el cristal dentro del probador. La cámara solo se solicita después de pulsar Activar cámara.

## Cierre y permisos

El botón Cerrar, Escape y clic fuera del diálogo cierran el modal. El catálogo envía `tryon:stop` al origen exacto del iframe y elimina el iframe para liberar la cámara y el detector. Si Escape ocurre dentro del probador, este envía `tryon:close` a `parentOrigin`; el catálogo valida origen y ventana emisora. El foco vuelve al botón del producto.

Para integrarlo en otra tienda, copiar el patrón de `src/store.ts`: crear el iframe al abrir y eliminarlo al cerrar. No basta con ocultarlo mediante CSS.

Ambos sitios deben usar HTTPS. `allow="camera"` no puede superar una restricción del encabezado Permissions-Policy de la tienda; si este existe, debe permitir el origen `https://jero8i.github.io`. Documentación: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe#allow

## Publicación y verificación

Subir el proyecto actualizado completo, incluidos `tryon.html`, `src/store.ts`, `src/store.css`, `src/integration.ts` y `vite.config.ts`. El workflow existente genera las dos páginas dentro de `dist`. Mantener Pages configurado con GitHub Actions.

Verificación manual pendiente: abrir cada modelo y cristal, activar cámara, cerrar desde botón/Escape/fondo, confirmar que se apaga el indicador de cámara, reabrir otro modelo, comprobar desplazamiento en móvil y captura de imagen. Probar la integración entre dominios cuando se conozca la plataforma y URL de la tienda real.
