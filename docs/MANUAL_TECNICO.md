# Manual Técnico - Earth Vibe

## 1. Arquitectura del Sistema
Earth Vibe implementa una arquitectura moderna basada en microservicios y componentes modulares, diseñada para escalabilidad y mantenimiento eficiente.

### Diagrama de Arquitectura
*   **Frontend (Cliente Web):** SPA construida con React y Vite.
*   **Mobile (Cliente Móvil):** Aplicación multiplataforma (Android/iOS) desarrollada en Flutter.
*   **Backend (API Server):** Servidor Node.js con Express, sirviendo como núcleo lógico.
*   **Base de Datos:** Enfoque híbrido utilizando MongoDB (datos estructurados/usuarios) y SQLite (caché local/configuración ligera).
*   **Servicios Externos:** Integración con OpenFoodFacts API para validación de productos y Firebase para notificaciones push.

## 2. Tecnologías

### Backend (`src/backend`)
*   **Lenguaje:** TypeScript / Node.js
*   **Framework Web:** Express v5
*   **Base de Datos:**
    *   `mongoose`: ODM para MongoDB.
    *   `better-sqlite3`: Driver rápido para SQLite.
*   **Comunicación:**
    *   `socket.io`: Comunicación en tiempo real (notificaciones, actualizaciones de estado).
    *   `graphql`: Consultas flexibles de datos.
    *   `protobufjs`: Definición de esquemas de datos eficientes (gRPC ready).
*   **Seguridad:** `helmet`, `cors`, `bcryptjs`, `jsonwebtoken` (JWT).
*   **Utilidades:** `axios` (peticiones HTTP), `firebase-admin` (Push Notifications).

### Frontend (`src/frontend`)
*   **Framework:** React v19
*   **Build Tool:** Vite
*   **Estilos:** CSS Modules, `gsap` y `framer-motion` para animaciones avanzadas.
*   **Comunicación:** `socket.io-client`, `axios`.
*   **Routing:** `react-router-dom`.

### Mobile (`mobile`)
*   **Framework:** Flutter (Dart).
*   **Características:** Escaneo de QR/Códigos de barras, integración con servicios nativos.

## 3.Dependencias 
   El sistema Earth Vibe requiere las siguientes dependencias para su ejecución y compilación:
* **Node.js v18+**: Entorno de ejecución para el backend.
* **Express v5 (TypeScript):** Framework principal para las rutas de la API.
* **MongoDB Atlas:** Base de datos no relacional utilizada en producción.
* **Firebase Authentication y Cloud Messaging:** Para el inicio de sesión y notificaciones.
* **Socket.IO v4:** Comunicación en tiempo real entre backend y frontend.
* **Flutter SDK 3.19+:** Requerido para compilar y ejecutar la aplicación móvil.
* **React 19 + Vite:** Framework y herramienta para el dashboard web.
* **GSAP:** Librería de animaciones del frontend.
* **Google Cloud Run:** Servicio donde se despliega el backend en producción.
* **OpenFoodFacts API:** Servicio externo para validación de productos reciclados.
* **ESP32 + lector 1D/2D:** Dependencias de hardware del Vibe Pod.

## 3. Flujo Interno de Datos

1.  **Interacción del Usuario:** El usuario realiza una acción (ej. escanear producto) en el Frontend o Mobile.
2.  **Petición API:** Se envía una solicitud HTTP (REST) o evento Socket al Backend.
    *   *Ruta Ejemplo:* `POST /openfoodfacts/label` para verificar un producto.
3.  **Procesamiento (Backend):**
    *   El middleware `auth.ts` verifica el token JWT.
    *   El controlador consulta la API de OpenFoodFacts o la base de datos local.
    *   Se actualizan los modelos (`User`, `Product`, `Challenge`).
4.  **Persistencia:** Los datos se guardan en MongoDB (nube) o SQLite (local).
5.  **Respuesta:** El servidor responde al cliente con el resultado (JSON) y emite eventos Socket si es necesario (ej. notificar logro desbloqueado).

## 4. Estructura de APIs y Componentes

### Rutas Principales (`src/backend/src/Routes`)
*   `/admin`: Endpoints para gestión administrativa.
*   `/earthvibe`: Lógica core del negocio (retos, puntos).
*   `/nazishop`: Gestión de la tienda de recompensas y canjes.
*   `/openfoodfacts`: Proxy/Integración para búsqueda de información nutricional y de reciclaje.
*   `/utils`: Utilidades generales (subida de archivos, health checks).

### Modelos de Datos (`src/backend/src/Models`)
*   **User:** Información de perfil, credenciales y saldo de puntos.
*   **Product:** Catálogo de productos reciclables y su valor en puntos.
*   **Challenge:** Retos disponibles para los usuarios.
*   **Reward:** Premios disponibles en la tienda.
*   **Notification:** Historial de alertas enviadas.

### Componentes Clave
*   **Socket Server (`src/backend/src/Socket`):** Maneja conexiones en tiempo real para `notifications`, `ping`, y `posts`.
*   **Hybrid Config (`src/backend/src/Config`):** Gestores de conexión para MongoDB y SQLite.

9.  **Update:** Backend suma puntos al usuario y marca transacción como completada.
10. **Feedback:** App muestra confirmación de puntos ganados.
