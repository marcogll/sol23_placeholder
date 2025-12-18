# Landing Page y Monitor de Servicios "Soul:23"

Este repositorio contiene el código para una landing page de "próximamente" junto con un sistema de monitoreo de servicios integrado. La aplicación está construida con Node.js y Express, y es capaz de servir contenido estático y exponer una API con varios endpoints funcionales.

## Características Principales

*   **Landing Page Responsiva**: Una página de "próximamente" con un contador regresivo, construida con Bootstrap 4.
*   **API de Frases**: Un endpoint que entrega una frase aleatoria en cada solicitud.
*   **Monitor de Salud de Servicios**: Un endpoint avanzado que ejecuta un script de Python para verificar el estado de múltiples sitios y servicios web, categorizados en internos, de empresa y externos.
*   **Servidor Flexible**: Configurado para servir archivos estáticos, HTML dinámico y endpoints JSON.
*   **Contenerización**: Listo para desplegarse con Docker.

## Estructura del Proyecto

```
/
├─── data/
│    ├─── quotes.json
│    └─── sites.json
├─── htmls/
│    └─── telegram.html
├─── scripts/
│    └─── health_checker.py
├─── css/
├─── js/
├─── img/
├─── .gitignore
├─── docker-compose.yml
├─── Dockerfile
├─── index.html
├─── package.json
├─── server.js
└─── README.md
```

## Instalación y Ejecución Local

Para ejecutar el proyecto en un entorno de desarrollo local, sigue estos pasos:

1.  **Clona el repositorio**:
    ```bash
    git clone <url-del-repositorio>
    cd soul23_placeholder
    ```

2.  **Instala las dependencias**:
    Asegúrate de tener Node.js (v18 o superior) y npm instalados.
    ```bash
    npm install
    ```

3.  **Inicia el servidor**:
    ```bash
    npm start
    ```
    El servidor se iniciará en `http://localhost:3001` por defecto.

## Documentación Detallada de Componentes

### `server.js`

Es el núcleo de la aplicación. Configura un servidor Express que gestiona todas las rutas y la lógica principal.

#### Endpoints de la API

*   **`GET /day-quote`**
    *   **Descripción**: Devuelve una frase motivacional aleatoria.
    *   **Lógica**: Lee el arreglo de frases de `data/quotes.json`, selecciona una al azar y la sirve.
    *   **Respuesta de Ejemplo**:
        ```json
        {
          "phrase": "El universo trabaja mientras tú sigues avanzando."
        }
        ```

*   **`GET /healthchecker`**
    *   **Descripción**: Ejecuta un monitor de salud escrito en Node.js (`scripts/health_checker.js`) y devuelve un reporte detallado del estado de los servicios definidos en `data/sites.json`.
    *   **Lógica**: Importa el módulo de chequeo desde `server.js`, corre todas las verificaciones (HTTP simples, endpoints dedicados y statuspage.io) y retorna el JSON resultante, ideal para tableros o webhooks.
    *   **Respuesta de Ejemplo (truncada)**:
        ```json
        {
          "timestamp": "2025-12-18T01:34:53.516Z",
          "internos": {
            "vps_soul23_status": "🟢 OK (VPS Reachable)",
            "coolify_status": 200
          },
          "empresa": {
            "vanity_web_status": 200
          },
          "externos": {
            "openai_status": "🟡 Advertencia (Partial System Outage)"
          },
          "execution_time_seconds": 17.83
        }
        ```

*   **`GET /telegram`**
    *   **Descripción**: Sirve una página HTML (`htmls/telegram.html`) diseñada para gestionar redirecciones a la aplicación de Telegram, adaptándose a la plataforma del usuario.

*   **`GET /health`**
    *   **Descripción**: Un endpoint de salud básico que realiza una prueba de ping a una IP predefinida para una verificación rápida de conectividad.

*   **`GET /time-server`**
    *   **Descripción**: Proporciona la fecha y hora del servidor en múltiples formatos (ISO, Unix, legible).

### Directorio `data/`

Este directorio centraliza todos los datos que la aplicación necesita para funcionar.

*   **`quotes.json`**: Un archivo JSON que contiene un único arreglo de strings llamado `phrases`. Cada string es una frase que puede ser servida por el endpoint `/day-quote`.
*   **`sites.json`**: El archivo de configuración para el monitor de salud. Contiene tres objetos principales: `internos`, `sitios_empresa` y `externos`. Cada objeto es un diccionario donde la clave es el nombre del servicio y el valor es su URL.

### Directorio `scripts/`

Contiene la lógica de negocio más compleja en forma de scripts.

*   **`health_checker.js`**:
    *   **Lenguaje**: Node.js (requiere Node 18+ con `fetch` nativo).
    *   **Dependencias**: ninguna adicional (usa APIs nativas).
    *   **Lógica**:
        1.  Carga la lista de sitios desde `../data/sites.json`.
        2.  Itera sobre cada servicio y realiza diferentes tipos de verificaciones:
            *   **Verificación simple**: Para la mayoría de los sitios, comprueba si la URL devuelve un código de estado HTTP 200.
            *   **Endpoints de Salud Específicos**: Para servicios como `vps_soul23` y `formbricks`, realiza peticiones a sus endpoints `/health` y analiza la respuesta JSON para un estado más detallado.
            *   **APIs de StatusPage**: Para servicios como OpenAI y Cloudflare, consulta su API de `statuspage.io` para obtener el estado oficial del servicio.
        3.  Consolida todos los resultados en un único objeto JSON.
        4.  Si la variable de entorno `WEBHOOK_URLS` está definida (con una o más URLs separadas por comas), envía el resultado JSON a cada webhook.
        5.  Imprime el resultado JSON en la salida estándar para que `server.js` pueda capturarlo.

### Archivos de Contenerización

*   **`Dockerfile`**: Contiene las instrucciones para construir una imagen de Docker de la aplicación. Utiliza una imagen base de Node.js, copia los archivos del proyecto, instala las dependencias de `npm` y define el comando para iniciar el servidor.
*   **`docker-compose.yml`**: Facilita la ejecución de la aplicación en un entorno local de Docker, gestionando la construcción de la imagen y la configuración de red.
