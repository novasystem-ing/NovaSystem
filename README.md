# NovaSystem Ingeniería — Sitio + Tienda

Sitio web con tienda de software para Smart TV, organizada **por marca**
(Challenger, Hyundai, Kalley, y las que agregues). Cada modelo se publica
como una **página HTML real y propia**, generada automáticamente, para que
Google pueda indexar cada producto por separado.

## Estructura de carpetas

```
├── api/                     Funciones serverless (Vercel) — Mercado Pago
│   ├── crear-preferencia.js   crea la preferencia de pago
│   └── webhook.js             recibe la confirmación de pago (completar)
├── assets/
│   ├── css/styles.css         estilos de todo el sitio
│   ├── images/                 tu logo y otras imágenes estáticas
│   ├── js/main.js             menú, formulario, animación del hero
│   └── js/checkout.js         botón de pago + WhatsApp en cada producto
├── data/
│   ├── config.json            nombre, teléfono, dominio, horario, etc.
│   └── productos.json         TU CATÁLOGO — aquí agregas/editas modelos
├── scripts/
│   └── build.js               genera todo el HTML a partir de data/*.json
├── index.html                 GENERADO — no editar a mano
├── tienda/                    GENERADO — no editar a mano (se borra y
│                               recrea completo en cada build)
├── sitemap.xml                GENERADO
├── robots.txt                 GENERADO
└── payment.html                página de "pago exitoso" (estática, sí editable)
```

URLs que genera, por ejemplo: `/tienda/challenger/`,
`/tienda/challenger/uhd-55kg85-bt-google-t2/`.

## Cómo agregar un modelo nuevo, paso a paso

**1. Abre `data/productos.json`.**

**2. Copia un bloque existente y pégalo antes del último `}` del archivo**
(recuerda poner una coma después del bloque anterior). Cambia los valores:

```json
"NOMBRE EXACTO DEL MODELO": {
  "brand": "SAMSUNG",
  "modelo": "NOMBRE EXACTO DEL MODELO",
  "categoria": "Android TV",
  "software": "archivo_de_software.pkg",
  "main": "",
  "estado": "Disponible",
  "precio": "75.000 COP",
  "valor": 75000,
  "pdf": ""
}
```

- **`brand`**: la marca real del televisor (Samsung, LG, Challenger,
  Hyundai, Kalley...). Decide en qué sección de la tienda aparece. Si es
  una marca nueva no hay que configurar nada más, aparece sola.
- **`modelo`**: debe ser igual a la clave (el texto entre comillas antes de
  los dos puntos). Es el título del producto.
- **`categoria`**: el sistema del televisor (por ejemplo "Google TV" o
  "Android TV"). Se muestra como una etiqueta pequeña junto al nombre,
  útil cuando una marca vende modelos con distintos sistemas.
- La URL del producto se genera sola a partir del modelo, no hace falta
  inventar un slug ni preocuparte por tildes o espacios.
- `pdf` es opcional (ruta a un manual, si lo tienes).

**3. Guarda el archivo y corre:**

```bash
npm install     (solo la primera vez)
npm run build
```

Verás en la consola la lista de páginas generadas, incluida la del modelo
nuevo. Si el JSON queda mal escrito (una coma de más o de menos), el
comando muestra un error señalando el problema, no genera nada roto.

**4. Sube los cambios a GitHub:**

```bash
git add .
git commit -m "Agregar modelo NOMBRE DEL MODELO"
git push
```

Vercel detecta el push automáticamente y publica la nueva versión en uno o
dos minutos.

Eso es todo. Para agregar un producto no se toca HTML, CSS ni la lógica de
pago, solo `data/productos.json` + `npm run build` + subir.

## Agotar un modelo o cambiar su precio

Edita el mismo bloque en `data/productos.json`: cambia `"estado":
"Disponible"` a `"estado": "Agotado"`, o cambia `precio` y `valor`. Corre
`npm run build` de nuevo. El botón de pago se oculta solo cuando el estado
es "Agotado".

## Cambiar nombre del negocio, teléfono, correo o dominio

Edita `data/config.json` y corre `npm run build`. Todo el sitio (header,
footer, botones de WhatsApp, datos estructurados) se actualiza solo.

## Pagos con Mercado Pago

`api/crear-preferencia.js` es una función serverless que Vercel ejecuta
automáticamente. Configura estas variables de entorno en tu proyecto de
Vercel (Project Settings, Environment Variables):

| Variable          | Valor                                      |
|-------------------|---------------------------------------------|
| MP_ACCESS_TOKEN   | Access Token de tu cuenta de Mercado Pago    |
| SITE_URL          | https://novasystemingenieria.com             |

`api/webhook.js` recibe la confirmación de pago pero por ahora solo la
registra en los logs, tiene comentarios explicando qué falta completar
(verificar el pago contra la API de Mercado Pago y notificar al cliente).

## Desplegar (GitHub + Vercel + dominio en Hostinger)

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel, "Add New Project" e importa ese repositorio. Vercel detecta
   `/api` automáticamente y sirve el resto como archivos estáticos, no hay
   que configurar nada más.
3. En Vercel agrega las variables de entorno MP_ACCESS_TOKEN y SITE_URL.
4. En Vercel ve a Project Settings, Domains, y agrega
   novasystemingenieria.com. Vercel te da un registro DNS para configurar.
5. En Hostinger, en la sección DNS de tu dominio, agrega ese registro tal
   como Vercel lo indica. En unas horas el dominio sirve el sitio desde
   Vercel.
6. Cada `git push` vuelve a desplegar automáticamente.

## Antes de publicar

- Confirma en Vercel que novasystemingenieria.com quedó verificado
  (Project Settings, Domains, sin advertencias).
- Configura MP_ACCESS_TOKEN y SITE_URL en Vercel.
- Revisa `data/config.json`: teléfono, correo y dirección reales.
- Corre `npm run build` una vez más antes de subir a producción.
- Envía tu sitemap.xml (novasystemingenieria.com/sitemap.xml) en Google
  Search Console.

## Nota sobre el logo

Tu logo (`assets/images/NOVA_LG.png`) tiene fondo blanco sólido, no
transparente. Por eso se usa en el header (fondo claro) y en el footer
(fondo oscuro) se mantiene el ícono de respaldo en SVG, para no mostrar un
recuadro blanco. Si en algún momento tienes una versión con fondo
transparente, se puede usar también en el footer.
