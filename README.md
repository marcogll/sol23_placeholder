# Soul:23 coming soon page

Una landing page responsive Built con Bootstrap 4 que muestra una cuenta regresiva y un formulario de notificaciones. Se accede a una versión viva en https://solu23.cloud.

**Author:** Marco Gallegos

## Instalación local

```bash
npm install
npm start
```

El servidor Express sirve todos los assets desde la raíz y expone `/healthchecker` con el script de salud como `text/plain`, listo para que operadores lo descarguen con `curl`.

## Deploy con Coolify / Traefik

1. Importa el repositorio como app Docker en Coolify.
2. Elige el `Dockerfile` del proyecto, expone el puerto `3000` (ya definido en el contenedor).
3. Coolify/Traefik se encargan del TLS; usa el dominio que asignas en la app.
4. Si necesitas alertas, define la variable de entorno `WEBHOOK_URLS` antes de levantar la app.

Una vez desplegado podrás invocar el verificador con:

```bash
curl https://tudominio.cloud/healthchecker
```

## Contador y formulario

El componente de tiempo lee el atributo `data-date` en `#countdown-timer`. Cámbialo por cualquier fecha válida:

```html
<div id="countdown-timer" data-date="January 17, 2025 03:24:00">
```

Si prefieres programarlo con JavaScript, reasigna la variable `countDownDate` dentro de `js/countdown.js` antes de que empiece el intervalo.
