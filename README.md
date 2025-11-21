# Earth Vibe - Sistema Social de Reciclaje Inteligente

### Equipo del Proyecto
1.  **Villogas Gaspar, Alessandro**
2.  **Cerron Villar, Maricielo Sarai**

---

## Problema Encontrado
La contaminación por plásticos de un solo uso es un problema crítico en el campus universitario. A pesar de que la comunidad estudiantil conoce la importancia del reciclaje, existe una "brecha de intención-acción": la falta de incentivos atractivos y la inconveniencia de los sistemas actuales provocan bajas tasas de reciclaje y contaminación cruzada en los contenedores.

**Afectados:** Comunidad universitaria, personal de limpieza y el medio ambiente local.
**Importancia:** Resolver este problema mejora la imagen institucional, reduce la huella ecológica y promueve hábitos sostenibles mediante tecnología (Smart Campus).

---

## Solución Propuesta
**Earth Vibe** es un ecosistema socio-tecnológico que combina hardware IoT y una aplicación móvil gamificada para incentivar el reciclaje.

**Diferenciadores:**
*   **Vibe Pod (Hardware):** Quiosco inteligente que valida automáticamente las botellas mediante código de barras, evitando el fraude y la contaminación cruzada. Genera un código QR único por transacción.
*   **App Earth Vibe (Software):** Aplicación donde el usuario escanea el QR del quiosco para ganar puntos, subir de nivel en el ranking y canjear recompensas.
*   **Gamificación:** Transforma el acto de reciclar en una experiencia divertida y competitiva.

---

## Tecnologías Utilizadas
El proyecto utiliza un stack moderno y escalable:

*   **Backend:** Node.js con Express v5 (TypeScript). Arquitectura híbrida con MongoDB (Cloud) y SQLite (Local).
*   **Frontend Web:** React v19 + Vite. Estilizado con CSS Modules y animaciones GSAP.
*   **Móvil:** Flutter (Dart) para Android e iOS.
*   **Integraciones:** OpenFoodFacts API (Validación de productos), Firebase (Notificaciones), Socket.IO (Tiempo real).
*   **Hardware (IoT):** Integración conceptual con Raspberry Pi y lectores de código de barras.

---

## Documentación
Para una guía detallada, consulta los manuales en la carpeta `docs/`:

*   📘 **[Manual de Usuario](docs/MANUAL_USUARIO.md):** Guía paso a paso para usar la aplicación y reciclar.
*   🛠️ **[Manual Técnico](docs/MANUAL_TECNICO.md):** Arquitectura, flujo de datos y explicación de componentes para desarrolladores.
*   ⚙️ **[Manual de Instalación](docs/MANUAL_INSTALACION.md):** Instrucciones para desplegar el backend, frontend y app móvil.

---

## Cómo Ejecutar el Proyecto

### Instalación Rápida
El proyecto es modular. Para iniciar el servidor principal (Backend):

1.  **Clonar el repositorio:**
    ```bash
    git clone <url-del-repo>
    cd Earth-Vibe
    ```

2.  **Iniciar Backend:**
    ```bash
    cd src/backend
    npm install
    npm run dev
    ```

3.  **Iniciar Frontend:**
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

> **Nota:** Para detalles sobre la configuración de variables de entorno (`.env`) y la ejecución de la app móvil, revisa el **[Manual de Instalación](docs/MANUAL_INSTALACION.md)**.

2.  **Backend:**
    ```bash
    cd src/backend
    npm install
    npm start
    ```

3.  **Frontend (Web):**
    ```bash
    cd src/frontend
    npm install
    npm run dev
    ```

4.  **Móvil (App):**
    ```bash
    cd mobile
    flutter pub get
    flutter run
    ```

> Para instrucciones detalladas, consultar el [Manual de Instalación](docs/MANUAL_INSTALACION.md).

---

## Capturas de Pantalla
*(Espacio reservado para capturas de pantalla del prototipo funcionando)*

1.  **Landing Page:**
    ![Landing Page](resources/landing_preview.png)

2.  **App Móvil - Home:**
    ![App Home](resources/app_home.png)

3.  **Vibe Pod - Interfaz:**
    ![Vibe Pod](resources/vibepod_ui.png)
