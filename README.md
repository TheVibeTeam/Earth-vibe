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


## Capturas de Pantalla
*(Espacio reservado para capturas de pantalla del prototipo funcionando)*

1.  **Landing Page:**
    ![Landing Page](resources/landing_preview.png)

2.  **App Móvil - Home:**
    ![App Home](resources/app_home.png)

3.  **Vibe Pod - Interfaz:**
    ![Vibe Pod](resources/vibepod_ui.png)
