# Manual de Instalación y Ejecución - Earth Vibe

Este documento detalla los pasos técnicos para levantar el entorno de desarrollo del proyecto Earth Vibe.

## 1. Requisitos del Sistema
*   **Sistema Operativo:** Windows 10/11, macOS o Linux.
*   **Node.js:** Versión 18 o superior.
*   **Flutter SDK:** Última versión estable.
*   **Editor de Código:** VS Code (recomendado).

## 2. Estructura del Proyecto
El proyecto está organizado en la carpeta `src/` con los siguientes submódulos:
*   `backend/`: Servidor API y lógica de negocio.
*   `frontend/`: Landing page y panel web.
*   `mobile/`: Aplicación móvil en Flutter.

## 3. Instalación y Ejecución por Módulo

### A. Backend (Node.js)
El backend gestiona la validación de usuarios y transacciones.

1.  Navegar a la carpeta:
    ```bash
    cd src/backend
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Configurar variables de entorno:
    *   Crear un archivo `.env` basado en el ejemplo (si existe) o configurar puerto y base de datos.
4.  Ejecutar el servidor:
    ```bash
    npm start
    # O para desarrollo:
    npm run dev
    ```
    *El servidor correrá generalmente en `http://localhost:3000`.*

### B. Frontend Web (React + Vite)
Sitio web informativo del proyecto.

1.  Navegar a la carpeta:
    ```bash
    cd src/frontend
    ```
2.  Instalar dependencias:
    ```bash
    npm install
    ```
3.  Ejecutar en modo desarrollo:
    ```bash
    npm run dev
    ```
    *Acceder a través de la URL mostrada en consola (ej. `http://localhost:5173`).*

### C. Aplicación Móvil (Flutter)
App para usuarios finales.

1.  Navegar a la carpeta:
    ```bash
    cd mobile
    ```
2.  Obtener dependencias de Dart:
    ```bash
    flutter pub get
    ```
3.  Verificar dispositivos conectados:
    ```bash
    flutter devices
    ```
4.  Ejecutar la app:
    ```bash
    flutter run
    ```
    *Selecciona el dispositivo (Emulador o Físico) si se te solicita.*

## 4. Solución de Problemas Comunes
*   **Error de puertos:** Asegúrate de que los puertos 3000 (Backend) y 5173 (Frontend) estén libres.
*   **Flutter Doctor:** Si la app móvil no compila, ejecuta `flutter doctor` para verificar que tu entorno de desarrollo Android/iOS esté correcto.
