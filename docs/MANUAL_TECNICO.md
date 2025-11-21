# Manual Técnico - Earth Vibe

## 1. Arquitectura del Sistema
Earth Vibe utiliza una arquitectura cliente-servidor con componentes IoT integrados.

### Diagrama Conceptual
`[Vibe Pod (IoT)]` <--> `[Backend API]` <--> `[App Móvil]`

1.  **Vibe Pod:** Valida físicamente el residuo y solicita la generación de un token (QR) al backend.
2.  **Backend:** Genera tokens únicos, gestiona usuarios y almacena transacciones en la base de datos.
3.  **App Móvil:** Consume el token (QR) y actualiza el saldo del usuario a través de la API.

## 2. Stack Tecnológico

### Backend
*   **Runtime:** Node.js
*   **Framework:** Express (o similar según implementación).
*   **Base de Datos:** SQLite (para prototipo) / Firebase (escalabilidad).
*   **Autenticación:** JWT / Firebase Auth.

### Frontend (Web)
*   **Framework:** React
*   **Build Tool:** Vite
*   **Estilos:** CSS Modules / Tailwind CSS.
*   **Propósito:** Landing page informativa y dashboard de métricas públicas.

### Móvil
*   **Framework:** Flutter (Dart).
*   **Plataformas:** Android / iOS.
*   **Librerías Clave:**
    *   `qr_code_scanner`: Para leer los QRs del Vibe Pod.
    *   `http` / `dio`: Para comunicación con el Backend.
    *   `provider` / `flutter_bloc`: Gestión de estado.

### Hardware (Vibe Pod)
*   **Controlador:** Raspberry Pi 5.
*   **Periféricos:**
    *   Lector de código de barras (USB/Serial).
    *   Pantalla LCD (Interfaz de usuario local).
*   **Software:** Script en Python/Node.js para interfaz con hardware y comunicación API.

## 3. Flujo de Datos (Caso de Uso: Reciclaje)
1.  **Input:** Usuario escanea botella en Vibe Pod.
2.  **Proceso Local:** Vibe Pod verifica código de barras en BD local de productos válidos.
3.  **API Request:** Vibe Pod envía `POST /api/transaction/generate` al Backend.
4.  **API Response:** Backend devuelve un `transaction_id` encriptado.
5.  **Output:** Vibe Pod muestra QR con el `transaction_id`.
6.  **User Action:** Usuario escanea QR con App.
7.  **API Request:** App envía `POST /api/transaction/claim` con `transaction_id` y `user_id`.
8.  **Validation:** Backend verifica que el `transaction_id` no haya sido usado.
9.  **Update:** Backend suma puntos al usuario y marca transacción como completada.
10. **Feedback:** App muestra confirmación de puntos ganados.
