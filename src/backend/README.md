# Backend API - Greenly Social Media

Backend personalizado para reemplazar Firebase en la aplicación Greenly.

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js >= 18.x
- npm >= 9.x
- TypeScript >= 5.x

### Instalación

```bash
# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Editar variables de entorno
nano .env
```

### Configuración (.env)

```env
# Server Configuration
WEBSERVER_PORT=3000
WEBSERVER_URL=http://localhost
WEBSERVER_PROTOCOL=http
WEBSERVER_NAME=Greenly API
WEBSERVER_VERSION=1.0.0
WEBSERVER_DESCRIPTION=Social Media Backend
WEBSERVER_AUTHOR=Tu Nombre
WEBSERVER_LICENSE=MIT
NODE_ENV=development

# JWT Secret (CAMBIAR EN PRODUCCIÓN)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters-long

# Database
DATABASE_PATH=./data/database.sqlite

# Storage
STORAGE_DIR=./storage

# Logging
LOG_LEVEL=info
```

### Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:3000`

### Construir para Producción

```bash
npm run build
npm start
```

## 📚 Documentación de API

### Base URL

```
http://localhost:3000/api/social
```

### Autenticación

Todas las rutas protegidas requieren un JWT token en el header:

```
Authorization: Bearer <token>
```

O en cookies:
```
Cookie: token=<token>
```

---

### 🔐 Autenticación (`/auth`)

#### Registro

```http
POST /api/social/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "displayName": "John Doe",
  "userName": "johndoe"
}
```

**Respuesta:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc123",
    "uid": "abc123",
    "email": "user@example.com",
    "displayName": "John Doe",
    "userName": "johndoe",
    "createdTime": "2025-10-17T00:00:00.000Z",
    "role": "user"
  }
}
```

#### Login

```http
POST /api/social/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

#### Logout

```http
POST /api/social/auth/logout
Authorization: Bearer <token>
```

#### Obtener Usuario Actual

```http
GET /api/social/auth/me
Authorization: Bearer <token>
```

#### Refrescar Token

```http
POST /api/social/auth/refresh
Authorization: Bearer <token>
```

#### Cambiar Contraseña

```http
POST /api/social/auth/change-password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword123"
}
```

#### Recuperar Contraseña

```http
POST /api/social/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

---

### 👤 Usuarios (`/users`)

#### Obtener Perfil de Usuario

```http
GET /api/social/users/:id
```

#### Buscar Usuarios

```http
GET /api/social/users?search=john&limit=20&offset=0
```

#### Actualizar Perfil

```http
PUT /api/social/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "displayName": "John Updated",
  "bio": "Mi nueva biografía",
  "photoUrl": "https://...",
  "phoneNumber": "+1234567890"
}
```

#### Eliminar Cuenta

```http
DELETE /api/social/users/account
Authorization: Bearer <token>
```

---

### 📝 Posts (`/posts`)

#### Obtener Posts (Feed)

```http
GET /api/social/posts?limit=20&offset=0
GET /api/social/posts?userId=abc123&limit=10  # Posts de un usuario específico
```

#### Obtener Post Específico

```http
GET /api/social/posts/:id
```

#### Crear Post

```http
POST /api/social/posts
Authorization: Bearer <token>
Content-Type: application/json

{
  "postTitle": "Mi primer post",
  "postDescription": "Descripción del contenido",
  "postPhoto": "url_de_imagen_opcional"
}
```

#### Actualizar Post

```http
PUT /api/social/posts/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "postTitle": "Título actualizado",
  "postDescription": "Nueva descripción"
}
```

#### Eliminar Post

```http
DELETE /api/social/posts/:id
Authorization: Bearer <token>
```

#### Like/Unlike Post

```http
POST /api/social/posts/:id/like
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "liked": true,
  "likesCount": 42
}
```

#### Obtener Comentarios

```http
GET /api/social/posts/:id/comments?limit=50&offset=0
```

#### Crear Comentario

```http
POST /api/social/posts/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "comment": "¡Excelente post!"
}
```

#### Eliminar Comentario

```http
DELETE /api/social/posts/:postId/comments/:commentId
Authorization: Bearer <token>
```

---

### 👥 Amigos/Seguidores (`/friends`)

#### Obtener Usuarios que Sigo

```http
GET /api/social/friends/following?limit=50&offset=0
Authorization: Bearer <token>
```

#### Obtener Mis Seguidores

```http
GET /api/social/friends/followers?limit=50&offset=0
Authorization: Bearer <token>
```

#### Seguir Usuario

```http
POST /api/social/friends/follow/:userId
Authorization: Bearer <token>
```

#### Dejar de Seguir

```http
DELETE /api/social/friends/unfollow/:userId
Authorization: Bearer <token>
```

#### Verificar Estado de Seguimiento

```http
GET /api/social/friends/status/:userId
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "isFollowing": true,
  "isFollower": false
}
```

#### Obtener Estadísticas

```http
GET /api/social/friends/stats
Authorization: Bearer <token>
```

**Respuesta:**
```json
{
  "success": true,
  "followingCount": 150,
  "followersCount": 200
}
```

---

### 📁 Almacenamiento (`/storage`)

#### Subir Archivo (Multipart)

```http
POST /api/social/storage/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [archivo binario]
```

**Respuesta:**
```json
{
  "success": true,
  "url": "/uploads/images/user_1234_filename.jpg",
  "filename": "user_1234_filename.jpg",
  "path": "/full/path/to/file"
}
```

#### Subir Archivo (Base64)

```http
POST /api/social/storage/upload-base64
Authorization: Bearer <token>
Content-Type: application/json

{
  "data": "data:image/png;base64,iVBORw0KGgo...",
  "category": "images"
}
```

#### Eliminar Archivo

```http
DELETE /api/social/storage/delete
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "/uploads/images/filename.jpg"
}
```

#### Estadísticas de Almacenamiento

```http
GET /api/social/storage/stats
Authorization: Bearer <token>
```

---

### 💬 Chat WebSocket

#### Conexión

```javascript
const socket = io('http://localhost:3000');

// Autenticar
socket.emit('authenticate', { token: 'your-jwt-token' });

socket.on('authenticated', (data) => {
  console.log('Authenticated as:', data.userId);
});
```

#### Crear/Obtener Chat

```javascript
socket.emit('create_chat', {
  userIds: ['user_id_1', 'user_id_2']
});

socket.on('chat_created', (data) => {
  console.log('Chat:', data.chat);
});
```

#### Enviar Mensaje

```javascript
socket.emit('send_message', {
  chatId: 'chat_id',
  text: 'Hola!',
  // image: 'url_optional',
  // video: 'url_optional'
});

socket.on('new_message', (data) => {
  console.log('New message:', data.message);
});
```

#### Cargar Mensajes

```javascript
socket.emit('get_messages', {
  chatId: 'chat_id',
  limit: 50,
  offset: 0
});

socket.on('messages_loaded', (data) => {
  console.log('Messages:', data.messages);
});
```

#### Obtener Chats

```javascript
socket.emit('get_chats');

socket.on('chats_loaded', (data) => {
  console.log('Chats:', data.chats);
});
```

#### Indicador de Escritura

```javascript
socket.emit('typing', {
  chatId: 'chat_id',
  isTyping: true
});

socket.on('user_typing', (data) => {
  console.log(`User ${data.userId} is typing...`);
});
```

#### Marcar como Visto

```javascript
socket.emit('mark_seen', {
  chatId: 'chat_id'
});

socket.on('message_seen', (data) => {
  console.log('Seen by:', data.seenBy);
});
```

---

## 🔒 Seguridad

### Headers de Seguridad

- **Helmet**: Configurado con headers de seguridad
- **CORS**: Configurado para `http://localhost:5173` (cambiar en producción)
- **CSRF**: Tokens CSRF habilitados
- **Rate Limiting**: 100 requests por 15 minutos
- **Cookie Security**: HttpOnly, Secure (en producción), SameSite

### JWT

- **Expiración**: 7 días
- **Algoritmo**: HS256
- **Secret**: Configurar en `.env` (mínimo 32 caracteres)

### Contraseñas

- **Hashing**: bcryptjs con 10 rounds
- **Validación**: Implementar en frontend

---

## 📊 Códigos de Estado HTTP

| Código | Significado |
|--------|-------------|
| 200 | OK |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén implementados)
npm test

# Coverage
npm run test:coverage
```

---

## 📝 Logs

Los logs se guardan en:
- Consola (desarrollo)
- `./logs/` (producción)

Niveles: `error`, `warn`, `info`, `debug`

---

## 🚢 Despliegue

### PM2

```bash
npm install -g pm2
pm2 start dist/server.js --name greenly-api
pm2 save
pm2 startup
```

### Docker

```bash
docker build -t greenly-backend .
docker run -p 3000:3000 --env-file .env greenly-backend
```

---

## 🛠️ Desarrollo

### Estructura del Código

```
src/
├── Config/         # Configuraciones
├── Routes/         # Endpoints REST
├── Socket/         # WebSocket handlers
├── Types/          # TypeScript types
├── Utils/          # Utilidades
└── server.ts       # Entry point
```

### Agregar Nueva Ruta

1. Crear archivo en `src/Routes/`
2. Exportar objeto con formato:

```typescript
export default {
    name: 'Route Name',
    category: 'category',
    path: '/api/path',
    method: 'get',
    execution: (req, res) => { /* handler */ }
};
```

### Agregar Nuevo Socket

1. Crear archivo en `src/Socket/`
2. Exportar objeto con formato:

```typescript
export default {
    name: 'Socket Name',
    description: 'Description',
    events: ['event1', 'event2'],
    execution: (io) => { /* handler */ }
};
```

---

## 🐛 Troubleshooting

### Puerto en Uso

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Problemas con JWT

- Verificar `JWT_SECRET` en `.env`
- Verificar que el token no haya expirado
- Verificar formato del header: `Bearer <token>`

### Problemas con CORS

- Verificar origen en `server.ts`
- Agregar dominio del frontend a whitelist

---

## 📞 Soporte

Para reportar bugs o solicitar features, crear un issue en el repositorio.

---

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.
