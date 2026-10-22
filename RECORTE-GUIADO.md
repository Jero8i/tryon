> Documento histórico: esta herramienta fue retirada del admin. El flujo actual consiste en cargar los PNG preparados con el prompt y retocarlos con zoom y borrador manual.

# Quitar patillas con recorte guiado, sin API

En `admin.html`, cargar la foto frontal y pulsar **Recorte guiado · quitar patillas**. Funciona localmente, sin cuenta de OpenAI y sin enviar la fotografía a un servicio de IA.

1. **Frente exterior:** marcar puntos consecutivos por el borde exterior de los aros y el puente, dejando las patillas que sobresalen fuera del contorno. Incluir la curva inferior del puente nasal; no cerrar con un rectángulo alrededor del producto. El polígono se cierra automáticamente del último punto al primero.
2. Pulsar **Siguiente** o elegir **Cristal izquierdo**. Marcar el borde interior de ese aro. Las patillas que se ven a través del cristal deben quedar dentro de esta región para ser eliminadas.
3. Repetir en **Cristal derecho**, tomando izquierda/derecha tal como aparecen en la foto.
4. Revisar y pulsar **Aplicar recorte**. Todo lo que esté fuera del frente y dentro de los cristales queda transparente. Solo se conservan los aros y el puente.
5. Marcar el apoyo del puente, guardar el borrador y probar con cámara.

Usar zoom 150%, 200% o 300% para seguir el borde. Agregar más puntos en curvas; con pocos puntos quedan segmentos rectos. Desplazarse por la foto ampliada con las barras de desplazamiento. Arrastrar un punto para corregirlo; **Quitar último punto** y **Rehacer este contorno** permiten rectificar sin empezar todo de nuevo. Se puede volver a cualquier paso mediante sus botones.

**Cancelar** descarta las marcas sin cambiar la foto. **Deshacer** restaura la imagen anterior después de aplicar (hasta cuatro operaciones). La foto original también sigue guardada en el borrador y puede restaurarse. Los puntos son guías de edición y no se pintan en el PNG. Para guardar o probar es necesario aplicar o cancelar el recorte en curso.

La máscara tiene bordes suavizados y solo modifica el canal alfa; no cambia los valores RGB de la imagen. La fidelidad del borde depende de las marcas: seguir el límite del material evita dejar fondo blanco o cortar el aro. No se reconstruye material oculto por una patilla ni se corrige una fotografía tomada en perspectiva.

Los polígonos cruzados, puntos repetidos y aberturas que se superponen o tocan el borde exterior se rechazan. Las aberturas deben estar completamente dentro del frente, preservando los aros y el puente. Los contornos se usan para crear el PNG al aplicar; todavía no se guardan como polígonos editables al reabrir el borrador.

Verificado mediante pruebas de geometría, máscara y conservación de RGB, y compilación del panel. Pendiente comprobación interactiva en navegador de zoom, arrastre, tacto y resultado sobre fotografías reales.
