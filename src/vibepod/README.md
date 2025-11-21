# Vibe Pod Software (Raspberry Pi 5) 🤖

Este módulo es la interfaz gráfica (GUI) diseñada para ejecutarse en la pantalla táctil o monitor conectado a la Raspberry Pi 5 del quiosco de reciclaje.

## Características
*   **Modo Kiosco:** Interfaz de pantalla completa sin bordes ni cursor.
*   **Lectura HID:** Captura automática de la entrada del lector de código de barras USB.
*   **Generación de QR:** Crea códigos QR dinámicos en pantalla usando `Pillow` y `qrcode`.
*   **Feedback Visual:** Mensajes claros de éxito/error para el usuario.

## Requisitos de Hardware
*   Raspberry Pi 4 o 5.
*   Pantalla (HDMI o DSI).
*   Lector de código de barras USB.

## Instalación en Raspberry Pi OS

1.  Instalar dependencias del sistema (para Tkinter y Pillow):
    ```bash
    sudo apt-get update
    sudo apt-get install python3-tk python3-pil.imagetk
    ```

2.  Instalar librerías de Python:
    ```bash
    pip install -r requirements.txt
    ```

3.  Configurar variables de entorno:
    ```bash
    cp .env.example .env
    # Editar .env con la IP real de tu backend
    ```

## Ejecución
Para iniciar la interfaz gráfica:
```bash
python main.py
```

> **Tip:** Para salir del modo pantalla completa, presiona `ESC` o `F11`.

## Estructura
*   `main.py`: Aplicación GUI con Tkinter.
*   `requirements.txt`: Dependencias (requests, qrcode, pillow).
```