# Mirada · Probador virtual

TypeScript + Vite + MediaPipe Face Landmarker + Canvas. Catálogo actual: Verdant, Nika Brown y Bless carey & black. Los ejemplos Alma, Oliva y Aire ya no se ofrecen. Los SVG históricos se conservan en disco.

## Ejecutar y verificar

Node.js 22.19 o posterior:

```sh
npm install
npm run dev
npm test
npm run build
```

El build queda en `dist/`. La cámara requiere HTTPS o localhost; una IP de red con HTTP no habilita la cámara en celulares.

## Escala automática

Se usan las medidas de cada producto en `src/catalog.ts`, sin controles manuales de tamaño/altura ni carga de monturas sin dimensiones. La DP se estima automáticamente al mirar de frente, con ojos abiertos y buena luz. Se necesitan 24 lecturas consecutivas estables; se rechazan iris demasiado pequeños, asimetría marcada y giros mayores a aproximadamente 10 grados. No se dibuja ni se permite capturar la montura hasta obtener la estimación. Se conserva durante giros y se reinicia al apagar la cámara o perder el rostro más de 800 ms.

La fórmula aproxima DP = separación de centros de iris en píxeles / diámetro de iris en píxeles × 11,7 mm, con una pequeña corrección por giro. Ese diámetro es una referencia poblacional, NO una medida del iris de la persona. Fuente: [MediaPipe Iris](https://github.com/google-ai-edge/mediapipe/blob/master/docs/solutions/iris.md). El intervalo 40–80 mm es un filtro de plausibilidad del MVP, no una garantía de exactitud ni cobertura de todas las personas. La estabilidad temporal no certifica precisión.

La interfaz indica siempre DP y escala estimadas. El método no sustituye una medición óptica ni permite prometer tamaño físico exacto. Puede fallar por iluminación, resolución, mirada, lentes de contacto, oclusión, variación anatómica y distorsión de cámara. Requiere contrastar el resultado con una DP medida antes de uso comercial.

Nika: 33 mm corresponde al alto del cristal. Al no tener alto total de montura, se conserva la proporción de su fotografía frontal. Verdant y Bless tienen alto total declarado. Los márgenes transparentes se excluyen del cálculo al dibujar.

## Patillas e imágenes

El frente es una textura plana que se comprime con el giro horizontal. Las patillas usan regiones cuadriláteras (`templeTexture.quad`) de la foto lateral, con suavizado de alta calidad. Se muestra el lado cercano y se recorta el tramo visible según puntos laterales de la cara; estos no son orejas detectadas. Se asume simetría. No hay malla 3D, espesor ni oclusión real por profundidad. Los PNG editados con IA pueden variar en color o detalles respecto del producto. Fuentes y prompts están en `public/frames/*-assets.md`.

## Integración

Selección directa: `/?frame=verdant`, `/?frame=nika-brown`, `/?frame=bless-carey-black`. Desde una tienda se puede enlazar a la URL HTTPS. Para iframe se requiere `allow="camera"` y una Permissions Policy del anfitrión que autorice ese origen. Integración específica pendiente de definir la plataforma.

## Privacidad

El video se procesa localmente y no se envía a servidores. Modelo/WASM y fuentes se descargan desde Google Storage, jsDelivr y Google Fonts. La cámara se solicita al pulsar el botón y se apaga al ocultar/cerrar la pestaña o pulsar Apagar. DP y muestras se conservan solo en memoria. Las capturas se descargan localmente por acción del usuario.

## Validación pendiente

Pruebas de cámara en Safari iPhone, Chrome Android y escritorio: calibración, ojos cerrados, luz insuficiente, pérdida/cambio de rostro, acercamiento, giros a ambos lados, bisagras, recorte de patillas, captura y cambio de modelo. Comparar DP estimada con medición conocida y dimensiones sobre una montura física. Las pruebas unitarias y compilación no sustituyen esta validación.

## Simulación de cristales

El selector permite transparente, reflejo azulado, solar gris, solar marrón, solar verde o sin efecto. Son presets visuales; no representan productos de cristal certificados, graduación, filtro médico ni protección UV.

`src/lenses.ts` obtiene una máscara desde las dos regiones transparentes encerradas por los aros del PNG frontal. Las semillas se ubican respecto del recorte de la montura. Si una región escapa al fondo, resulta demasiado pequeña o las dos aberturas no son independientes, se deshabilita el efecto para ese modelo. Las pruebas verifican los tres PNG actuales y que los píxeles opacos de la montura queden fuera de la máscara.

La capa de tinte y reflejo se calcula al elegir el modelo o el tipo de cristal y se reutiliza en los cuadros siguientes. Se dibuja debajo del frente con exactamente el mismo recorte, escala, rotación y compresión horizontal; también aparece en la captura descargada. No se modifican los PNG. No se simula refracción, distorsión por graduación, espesor ni iluminación del ambiente. El contorno depende de la transparencia del asset, no de una medición física del cristal. Pendiente validar suavidad de bordes, visibilidad de ojos y tintes con cámara en dispositivos reales.

## GitHub Pages

Subir el contenido de esta carpeta `virtual-tryon` a la raíz del repositorio, incluyendo `.github/workflows/pages.yml`, `package-lock.json`, `public`, `src` y `vite.config.ts`. No subir `node_modules` ni `dist` (excluidos por `.gitignore`). Si se conserva el proyecto como subcarpeta dentro de otro repositorio, hay que mover el workflow a la raíz de ese repositorio y adaptar sus directorios de trabajo y la ruta del artefacto.

1. En GitHub: Settings → Pages → Build and deployment → Source: GitHub Actions.
2. Subir los archivos a la rama `main` (o cambiar el nombre en `pages.yml`). Si el primer push ocurrió antes de configurar Pages, ejecutar manualmente el workflow desde Actions.
3. El workflow instala dependencias, ejecuta las pruebas, compila y despliega `dist`.
4. Abrir la URL que devuelve el despliegue, normalmente `https://USUARIO.github.io/REPOSITORIO/`, y permitir acceso a cámara.

Se configuraron `base: ./`, imágenes y enlaces relativos para conservar el prefijo del repositorio. Para probar un modelo: `https://USUARIO.github.io/REPOSITORIO/?frame=nika-brown`. Pages ofrece HTTPS; el acceso a cámara requiere además el permiso del usuario. Modelo facial, WASM y fuentes necesitan conexión a internet.

Referencia: https://vite.dev/guide/static-deploy.html#github-pages
