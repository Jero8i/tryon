> Documento histórico: esta herramienta fue retirada del admin. El flujo actual consiste en cargar los PNG preparados con el prompt y retocarlos con zoom y borrador manual.

# Preparación de la frontal sin patillas

La corrección de Bless en la conversación se hizo con imagegen. **Quitar blanco**, en el panel, únicamente cambia transparencia según el color: no reconoce patillas. Se agregó **Preparar frontal con IA · quitar patillas**, que llama a una Edge Function de Supabase para efectuar la limpieza completa.

## Flujo de la encargada

1. Cargar la foto frontal normal, aunque las patillas sobresalgan arriba y se vean dentro de los cristales.
2. Ingresar al panel con una cuenta autorizada y pulsar **Preparar frontal con IA**.
3. El servicio recibe la foto original y pide conservar solamente los aros, el puente y los extremos de bisagra frontales. Elimina patillas detrás, encima y dentro de los cristales, fondo y sombras.
4. Comparar original y propuesta. **Descartar** no altera la frontal actual. **Usar esta frontal** la aplica al editor; la original sigue guardada y puede restaurarse.
5. Volver a marcar el apoyo del puente, comprobar color y geometría y probar con cámara. Guardar/publicar siguen siendo acciones separadas.

Es una edición generativa, no un recorte de fidelidad de píxel garantizada. La IA puede cambiar detalles o colores; se requiere revisión. No hay publicación automática ni reintentos automáticos de llamadas de pago.

## Activación técnica, una vez

No se desplegó la función ni se configuró ninguna clave externa en esta tarea.

En Supabase → Edge Functions → Secrets, crear:

| Nombre | Valor |
| --- | --- |
| `OPENAI_API_KEY` | Clave de una cuenta de API con acceso al modelo de imágenes |
| `FRONT_PREP_ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173,https://jero8i.github.io` |

Agregar el origen real si el admin usa otro dominio o puerto. Los valores son orígenes sin ruta ni barra final. `https://jero8i.github.io/tryon/` NO es un origen: usar `https://jero8i.github.io`.

La clave OpenAI queda únicamente en los secretos de la función. **No usar un nombre `VITE_`, no subirla a GitHub y no ponerla en el JavaScript del navegador.** El navegador utiliza la sesión de la encargada. La función valida esa sesión mediante Supabase Auth y verifica que el UUID exista en `catalog_editors` antes de llamar al servicio de imágenes.

Desde esta carpeta, con Supabase CLI instalado y sesión iniciada:

```sh
supabase login
supabase functions deploy prepare-front --project-ref TU_PROJECT_REF
```

El despliegue debe incluir `supabase/functions/prepare-front/index.ts` y `handler.ts`. El archivo `supabase/config.toml` desactiva la validación JWT del gateway para esta función, porque la función hace su propia validación a través de Auth y comprueba membresía. No quitar esas comprobaciones del handler. `SUPABASE_URL` y `SUPABASE_ANON_KEY` se leen del entorno automático de Supabase.

El servicio usa `POST /v1/images/edits`, modelo `gpt-image-2.5-sunburst`, calidad alta y salida PNG transparente. Es una API de pago por uso; verificar acceso y límites en la cuenta antes de activarla. La ejecución local del panel sigue invocando la función desplegada y usa esa misma cuenta de API.

No hace falta volver a ejecutar `catalog.sql`; se reutiliza `catalog_editors`. GitHub Actions publica el frontend, pero **no despliega la Edge Function**: esta se despliega por separado.

## Límites y verificación

- Entrada PNG/JPEG/WebP de hasta 6 MB. El resto del panel mantiene su límite de 10 MB.
- Se envía solamente la fotografía frontal, no video de la cámara.
- Tiempo de espera del proveedor: 120 segundos. Si vence, la original queda intacta; el proveedor podría haber procesado la solicitud y no se reintenta automáticamente.
- La respuesta se muestra como propuesta. La preparación no guarda ni publica un modelo por sí sola.
- Pruebas automatizadas con respuestas simuladas cubren autorización, origen, membresía, formato de salida, error del proveedor y ausencia de reintentos. No se consumió la API desde el código de la función.
- Pendiente: despliegue y prueba real en Supabase, comprobación de la propuesta en navegador y fidelidad de cada producto.

Fuentes: [edición de imágenes de OpenAI](https://developers.openai.com/api/reference/resources/images/methods/edit), [secretos de Supabase](https://supabase.com/docs/guides/functions/secrets), [despliegue de funciones](https://supabase.com/docs/guides/functions/deploy).

## Alternativa local recomendada para controlar el recorte

El admin incluye Recorte guiado · quitar patillas, sin API ni envío a OpenAI. Se marcan el contorno exterior y las dos aberturas. Conserva RGB y elimina las zonas no deseadas mediante una máscara. Ver `RECORTE-GUIADO.md`.
