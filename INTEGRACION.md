# Integración en la tienda

La raíz y admin.html son el panel privado: requieren cuenta autorizada antes de cargar los modelos. Los clientes acceden a tryon.html?frame=ID desde el botón de un producto, sin login. El probador carga solo ese modelo publicado, sin catálogo navegable.

Después de ingresar, cada tarjeta habilitada ofrece Probar modelo y Código para la tienda. Copiá el bloque y cargá el script una sola vez en la plantilla de la tienda. Ver [código de integración](INTEGRACION-BOTON.md).

Parámetros: frame (ID obligatorio), lens (preset visual), embed=1 (modal) y parentOrigin (origen de la tienda). El script tryon-embed.js agrega los dos últimos automáticamente. El iframe permite cámara y se elimina al cerrar; los mensajes validan origen y ventana emisora.

Los borradores se prueban desde el editor con sesión autorizada y almacenamiento del mismo navegador. Habilitar en la tienda publica la versión revisada; guardar un borrador no reemplaza la publicación.

La autenticación restringe el panel, y Supabase aplica permisos a borradores y escrituras. Los modelos publicados y las fotos de producto permanecen accesibles para el probador sin login.

Pendiente validar en navegador: login, restauración y cierre de sesión, edición, publicación y cámara dentro del modal de la tienda real.
