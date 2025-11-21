# Earth Vibe - Sistema Social de Reciclaje Inteligente

## Equipo: The Vibe Team

Este proyecto ha sido posible gracias al trabajo colaborativo de:

| Integrante | Rol Principal | GitHub |
| :--- | :--- | :--- |
| **Villogas Gaspar, Alessandro** | *Líder técnico y desarrollador full-stack* | [@AlessandroVG](https://github.com/AlessandroVG) |
| **Cerron Villar, Maricielo Sarai** | *Líder de gestión, investigación y experiencia del usuario* | [@MaricieloCV](https://github.com/MaricieloCV) |
Fecha: 21/11/25
---

## Problema 
La contaminación por plásticos de un solo uso es un problema crítico en el campus universitario. A pesar de que la comunidad estudiantil conoce la importancia del reciclaje, existe una "brecha de intención-acción": la falta de incentivos atractivos y la inconveniencia de los sistemas actuales provocan bajas tasas de reciclaje y contaminación cruzada en los contenedores. Afectando a la comunidad universitaria, personal de limpieza y el medio ambiente local.Esto no solo afecta la comodidad, sino también la percepción de bienestar y seguridad ambiental dentro de la universidad. Por ello es importante resolver este problema ya que mejora la imagen institucional, reduce la huella ecológica y promueve hábitos sostenibles mediante tecnología.

---

## Solución Propuesta
Nuestra solución es Earth Vibe, un sistema socio-tecnológico que   combina   hardware,   software   y   comunidad   para transformar  el  reciclaje  en  una  experiencia  motivadora.  El dispositivo físico, llamado Vibe Pod, escanea el código de barras de cada botella, valida que sea PET y genera un QR con puntos según lo reciclado; mientras que la app Earth Vibe permite al estudiante  escanear  ese  QR  y  recibir  puntos,  subir  en  un ranking,  completar  misiones  y  compartir  logros  en  una  red social ambiental interna. Esto genera hábitos positivos basados en  gamificación  y  reconocimiento  social.  A  diferencia  de  un tacho tradicional, Earth Vibe valida el material desde el origen, evita la contaminación cruzada, entrega recompensas reales, crea  una  comunidad  activa  y  genera  datos  útiles  para  la universidad, lo que lo convierte en una solución mucho más efectiva que lo existente.

---

## Tecnologías Utilizadas
El proyecto utiliza un stack moderno y escalable:

*   **Backend:** Node.js con Express v5 (TypeScript). Arquitectura híbrida con MongoDB (Cloud) y SQLite (Local).
*   **Frontend Web:** React v19 + Vite. Estilizado con CSS Modules y animaciones GSAP.
*   **Móvil:** Flutter (Dart) para Android e iOS.
*   **Integraciones:** OpenFoodFacts API (Validación de productos), Firebase (Notificaciones), Socket.IO (Tiempo real).
*   **Hardware (IoT):** Integración conceptual con Raspberry Pi y lectores de código de barras.
*   **Cloud:** Google Cloud (Cloud Run para servicios), Secret Manager, Artifact Registry / Container Registry, Cloud Build
  
---

## Cómo Ejecutar el Proyecto
* **Requisitos**
Para utilizar Earth Vibe, necesitas:
Dispositivo:
Un Smartphone (Android/iOS) para la App Móvil.
O una Computadora/Tablet con navegador web moderno (Chrome, Firefox, Edge) para la versión Web.
Conexión: Acceso a Internet estable (Wi-Fi o Datos Móviles).
Cámara: Funcional para el escaneo de códigos de barras de productos.
* **Instalación**
  Ingresa a la plataforma: Abre la aplicación móvil o navega a la dirección web proporcionada.
Crea tu cuenta:
Selecciona "Registrarse".
Ingresa tus datos básicos (Nombre, Correo, Contraseña).
Confirma tu cuenta si es necesario.
Inicia Sesión: Usa tus credenciales para acceder al panel principal.
* **Configuración**
  La configuración del sistema es un paso fundamental para garantizar que la comunicación entre módulos funcione correctamente. En el backend, es necesario crear y configurar un archivo .env donde se definan las variables sensibles del proyecto, tales como MONGO_URI para la base de datos, JWT_SECRET para la autenticación, la URL base que provee Cloud Run y el puerto de ejecución. Para ambientes en producción, estas variables deben almacenarse de manera segura en Google Secret Manager, de modo que puedan enlazarse posteriormente al servicio en Cloud Run. En la aplicación móvil y el frontend web se debe actualizar la variable API_BASE_URL para que apunte correctamente al dominio generado por Cloud Run, asegurando que las solicitudes se dirijan al backend en producción. Si se prueba con un prototipo IoT (Vibe Pod), debe configurarse el ESP32 con el SSID y contraseña de la red del campus y registrar el deviceKey asignado por el backend.
* **Comandos para ejecutar**
  Los comandos de ejecución para cada módulo permiten poner en marcha el sistema de forma sencilla. El backend se inicia con npm run dev en modo desarrollo o con npm start en producción, mientras que el frontend web se levanta con npm run dev. La aplicación móvil se ejecuta mediante flutter run. En producción, el backend se despliega directamente en Cloud Run mediante gcloud run deploy, usando una imagen generada por Cloud Build y almacenada en Artifact Registry. Con todos los servicios en funcionamiento, el prototipo queda totalmente operativo, permitiendo la interacción completa entre el Vibe Pod, la aplicación móvil y el backend en la nube.

## Capturas de Pantalla
*(Espacio reservado para capturas de pantalla del prototipo funcionando)*

1.  **Landing Page:**
    ![Landing Page](resources/landing_preview.png)

2.  **App Móvil - Home:**
    ![App Home](resources/app_home.png)

3.  **Vibe Pod - Interfaz:**
    ![Vibe Pod](resources/vibepod_ui.png)
