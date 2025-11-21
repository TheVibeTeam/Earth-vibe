import os
import time
import requests
import tkinter as tk
from tkinter import Label, Frame
from PIL import Image, ImageTk
import qrcode
from dotenv import load_dotenv

# Cargar configuración
load_dotenv()

API_URL = os.getenv('API_URL', 'http://localhost:3000/earthvibe')
POD_ID = os.getenv('POD_ID', 'POD_RPI5_01')

class VibePodKiosk:
    def __init__(self, root):
        self.root = root
        self.root.title("Earth Vibe Pod")
        
        # Configuración de Pantalla Completa (Kiosk Mode)
        self.root.attributes('-fullscreen', True)
        self.root.bind("<F11>", lambda event: self.root.attributes("-fullscreen", not self.root.attributes("-fullscreen")))
        self.root.bind("<Escape>", lambda event: self.root.destroy())
        
        # Buffer para el lector de código de barras
        self.barcode_buffer = ""
        self.root.bind("<Key>", self.on_key_press)

        # Estilos
        self.bg_color = "#1a1a1a"
        self.text_color = "#ffffff"
        self.accent_color = "#4CAF50"
        self.error_color = "#f44336"
        
        self.root.configure(bg=self.bg_color)
        
        # Contenedor Principal
        self.main_frame = Frame(self.root, bg=self.bg_color)
        self.main_frame.pack(expand=True, fill='both', padx=50, pady=50)
        
        # Elementos de UI
        self.logo_label = Label(self.main_frame, text="EARTH VIBE ♻️", font=("Arial", 48, "bold"), fg=self.accent_color, bg=self.bg_color)
        self.logo_label.pack(pady=(0, 20))
        
        self.status_label = Label(self.main_frame, text="Escanea tu botella para reciclar", font=("Arial", 24), fg=self.text_color, bg=self.bg_color)
        self.status_label.pack(pady=20)
        
        self.info_label = Label(self.main_frame, text="", font=("Arial", 18), fg="#cccccc", bg=self.bg_color)
        self.info_label.pack(pady=10)

        # Área para el QR
        self.qr_label = Label(self.main_frame, bg=self.bg_color)
        self.qr_label.pack(pady=30)

    def on_key_press(self, event):
        # Los lectores de código de barras actúan como teclados y terminan con 'Return'
        if event.keysym == 'Return':
            if self.barcode_buffer:
                self.process_barcode(self.barcode_buffer)
                self.barcode_buffer = ""
        else:
            # Filtrar caracteres válidos (letras y números)
            if event.char and event.char.isprintable():
                self.barcode_buffer += event.char

    def process_barcode(self, barcode):
        print(f"🔍 Código escaneado: {barcode}")
        self.update_status("Verificando producto...", self.accent_color)
        self.qr_label.config(image='') # Limpiar QR anterior
        self.info_label.config(text="")
        self.root.update()

        try:
            # Llamada a la API
            payload = {"barcode": barcode, "podId": POD_ID}
            response = requests.post(f"{API_URL}/recycle/validate", json=payload, timeout=5)
            
            if response.status_code == 200:
                data = response.json()
                product_name = data.get('productName', 'Producto Reciclable')
                points = data.get('points', 0)
                token = data.get('transactionToken')
                
                self.show_success(product_name, points, token)
            else:
                self.show_error("Producto no reconocido o no válido.")
                
        except requests.exceptions.ConnectionError:
            self.show_error("Error de conexión con el servidor.")
        except Exception as e:
            print(f"Error: {e}")
            self.show_error("Ocurrió un error inesperado.")

    def show_success(self, product, points, token):
        self.update_status(f"✅ ¡{product} aceptado!", self.accent_color)
        self.info_label.config(text=f"Ganarás +{points} Eco-Points")
        
        # Generar y mostrar QR
        if token:
            self.generate_qr(token)
            
        # Resetear pantalla después de 15 segundos
        self.root.after(15000, self.reset_ui)

    def show_error(self, message):
        self.update_status(f"❌ {message}", self.error_color)
        self.root.after(4000, self.reset_ui)

    def generate_qr(self, data):
        qr = qrcode.QRCode(version=1, box_size=10, border=2)
        qr.add_data(data)
        qr.make(fit=True)
        
        img = qr.make_image(fill_color="black", back_color="white")
        
        # Redimensionar para la pantalla
        img = img.resize((300, 300), Image.Resampling.LANCZOS)
        
        # Convertir a formato compatible con Tkinter
        self.tk_image = ImageTk.PhotoImage(img)
        self.qr_label.config(image=self.tk_image)

    def update_status(self, text, color):
        self.status_label.config(text=text, fg=color)

    def reset_ui(self):
        self.status_label.config(text="Escanea tu botella para reciclar", fg=self.text_color)
        self.info_label.config(text="")
        self.qr_label.config(image='')
        self.barcode_buffer = ""

if __name__ == "__main__":
    root = tk.Tk()
    # Ocultar cursor del mouse para modo kiosco real
    root.config(cursor="none") 
    app = VibePodKiosk(root)
    root.mainloop()
