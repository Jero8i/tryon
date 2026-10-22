# Botón para la tienda

Después del login, en cada tarjeta habilitada del panel abrí **Código para la tienda** y pulsá **Copiar código**. El enlace ya incluye el ID publicado de ese modelo.

```html
<a href="https://jero8i.github.io/tryon/tryon.html?frame=ID-DEL-MODELO&amp;lens=clear" data-tryon>Probalo online</a>
<script defer src="https://jero8i.github.io/tryon/tryon-embed.js"></script>
```

Pegá el enlace en la ficha del producto y cargá el script una sola vez en la plantilla de la tienda. Si pegás el bloque completo en varias fichas, el script evita instalarse dos veces en la misma página. El editor de la tienda debe permitir HTML y JavaScript; si elimina scripts, agregá el script desde el código de la plantilla.

La acción Probar modelo del panel privado usa este mismo script. En desarrollo abre el probador local; el código copiado apunta a GitHub Pages. Publicá estos cambios antes de usarlo en la tienda: el archivo `tryon-embed.js` debe estar disponible online.

El modal solicita acceso a la cámara mediante `allow="camera"`. Al cerrarlo elimina el iframe para detener la cámara. Si JavaScript no se carga, el enlace permite abrir el probador como página.

El probador muestra el estado de carga del catálogo, detector facial, permiso de cámara y ajuste de montura. El indicador de ajuste desaparece cuando se dibuja el lente sobre el rostro.
