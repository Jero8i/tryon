# Panel de catálogo · La Fille aux Lunettes

Abrir `admin.html` desde el mismo servidor que el probador. En desarrollo: `npm run dev`, luego `/admin.html`. Cuando se suban los archivos actualizados a GitHub y termine el despliegue, será `https://jero8i.github.io/tryon/admin.html`. No se ha publicado automáticamente desde esta sesión.

## Trabajo de la encargada

1. Pulsar **Nuevo modelo**. Completar nombre e ID único, por ejemplo `bless-carey-black`. Ese ID se usa en el botón de la tienda y queda fijo después de guardar.
2. Cargar medidas reales en milímetros. Ancho total y patillas son obligatorios. El alto total es opcional; si solo se conoce alto del cristal, cargarlo en su campo separado.
3. Subir foto frontal y opcionalmente lateral, PNG/JPEG/WebP de hasta 10 MB y 16 megapíxeles. Sacar fotos niveladas, de un solo producto, con luz difusa y fondo blanco. Evitar textos y collages.
4. Preparar las fotos con el prompt acordado en el chat y cargar los PNG resultantes. En el admin, usar zoom 100%, 150%, 200% o 300% y Borrador manual para retoques. Deshacer revierte hasta cuatro operaciones. Quitar blanco sigue disponible, pero puede borrar brillos claros.
5. Marcar el apoyo del puente en la frontal. Para patillas, marcar cuatro puntos en la foto lateral en el orden indicado. Los números son guías y no se guardan dentro de las imágenes. Si no se marca una región, se muestra solo la montura frontal.
6. **Guardar borrador** y **Probar con cámara**. La vista previa usa una copia local y no es pública; el modal se destruye al cerrar para apagar la cámara.
7. Revisar colores, medidas, alineación, aberturas y marcar la confirmación. **Publicar online** exige una sesión autorizada y una frontal con las dos aberturas transparentes. No se debe borrar el aro o el puente. Esta validación no sustituye la revisión humana.
8. Copiar el enlace generado o usar `frame=ID` en el modal de la tienda. Ejemplo: `tryon.html?frame=bless-carey-black&lens=clear&embed=1&parentOrigin=https%3A%2F%2Flafilleauxlunettes.com.ar`.

Guardar cambios sobre un modelo publicado no cambia la versión que ven los clientes: el borrador y la publicación se guardan por separado. **Retirar de la tienda** oculta el modelo online. **Borrar copia local** solo elimina la copia de este navegador. Los archivos de fotos online no se borran automáticamente.

## Modo local y almacenamiento compartido

El panel funciona sin cuenta en **modo borradores locales** (IndexedDB). En ese modo permite preparar, exportar/importar y probar modelos, pero **no los publica para otras personas ni los comparte entre dispositivos**. Exportar copias JSON con las fotos para evitar perderlas si se limpian los datos del navegador. No es una autenticación privada de archivos locales; cualquier persona con acceso a ese perfil del navegador puede abrirlos.

Para que la encargada publique directamente y el botón de la tienda encuentre el modelo, hay que configurar el servicio compartido una sola vez. La integración de Supabase ya está preparada; no se creó ningún servicio ni usuario externo en esta tarea.

## Activación online, una sola vez por el responsable técnico

1. Crear un proyecto de Supabase y ejecutar **una vez** el archivo `supabase/catalog.sql` en su SQL Editor. Crea tablas, permisos por usuario y el bucket `tryon-assets`. Está pensado para un proyecto nuevo; repetir el script requiere manejar previamente las políticas existentes.
2. Crear la cuenta de la encargada en Authentication → Users. Usar email y contraseña; no hay registro público en el panel. Desactivar altas públicas en Auth si no se necesitan. La recuperación de contraseña se gestiona desde el administrador de Supabase por ahora.
3. Copiar el UUID del usuario y ejecutar en SQL Editor:

   ```sql
   insert into public.catalog_editors(user_id)
   values ('UUID-DE-LA-ENCARGADA');
   ```

   Crear una cuenta sin incluirla en esta tabla NO permite editar el catálogo.

4. Configurar en GitHub → Settings → Secrets and variables → Actions → **Variables**:

   - `VITE_SUPABASE_URL`: URL HTTPS del proyecto.
   - `VITE_SUPABASE_PUBLISHABLE_KEY`: clave pública/publishable del proyecto.

   El workflow ya las pasa al build. Estas variables son públicas por diseño. **Nunca usar una clave secret o service_role**, que evitaría los permisos de las tablas. En desarrollo copiar `.env.example` a `.env.local` y completar esos dos valores; los `.env` están excluidos de Git.

5. Subir los archivos completos y ejecutar el workflow de Pages. Abrir `admin.html` e ingresar con la cuenta autorizada. La configuración solo requiere un build inicial; después los modelos publicados se leen online sin recompilar.
6. El catálogo público se obtiene exclusivamente de Supabase y no incluye modelos de prueba estáticos. Cargar y publicar los modelos desde este panel. La vista previa de borradores sigue siendo privada.

## Permisos, fotos y funcionamiento

- Solo los UUID autorizados pueden guardar borradores, publicar o retirar modelos.
- El público puede consultar únicamente las filas publicadas. Los borradores están en una tabla privada independiente.
- Las fotografías se alojan en un bucket público de producto: quien conozca una URL puede verla, incluso si el modelo es borrador. No subir datos personales. Los objetos tienen nombres aleatorios y son inmutables; las versiones anteriores quedan almacenadas. Se puede revisar su limpieza desde el dashboard cuando ya no sean usadas.
- Los datos de sesión se guardan en sessionStorage; al salir se borra la sesión del panel. Las copias locales permanecen hasta eliminarlas o limpiar el navegador. No usar perfiles compartidos para material privado.
- La tienda y el probador cargan el catálogo compartido al abrirse. Un cambio publicado se refleja al volver a abrir o recargar el probador; no se actualiza una sesión ya abierta en tiempo real.
- Si falla la carga del catálogo online, se informa el error. No se sustituye silenciosamente por modelos viejos. Un ID retirado/inexistente no abre otra montura.
- Los recortes y patillas conservan las limitaciones del motor 2D; no se reconstruye un modelo 3D ni se inventa detalle fotográfico.

Fuentes técnicas: [claves públicas y permisos](https://supabase.com/docs/guides/getting-started/api-keys), [Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security).

## Verificación

Pruebas unitarias cubren IDs, medidas, URLs, escape de texto, copias importadas y que quitar blanco cambie solo alfa. También se ejecutan las pruebas existentes del probador. Compilación incluye `index.html`, `tryon.html` y `admin.html`.

**Pendiente validar manualmente** en navegador: carga y deshacer de fotos, marcas, guardado IndexedDB/reapertura, exportación/importación, vista previa con cámara, cierre y recarga. **Pendiente validar con Supabase real**: usuario autorizado vs. no autorizado, lectura pública solo de publicados, guardado de borrador sin modificar la publicación, publicación de ID nuevo y retiro. No hay proyecto externo configurado con el que ejecutar esas pruebas en esta sesión.

## Editor actual

Se retiraron del admin la preparación con IA y el recorte guiado. El zoom está disponible en ambas fotos junto al borrador manual, Deshacer y Quitar blanco. Se mantiene la restauración de la frontal original y el marcado de puente/patilla. No hace falta configurar una API de imágenes para cargar y retocar PNG preparados externamente.
