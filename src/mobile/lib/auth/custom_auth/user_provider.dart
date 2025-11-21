import 'package:flutter/foundation.dart';
import '../../backend/api_requests/api_calls.dart';
import 'auth_manager.dart';
import 'auth_util.dart';
import '/utils/firebase_messaging_service.dart';

class UserProvider extends ChangeNotifier {
  UserData? _currentUser;
  String? _token;
  bool _isLoading = false;
  int _unreadNotifications = 0;

  UserData? get currentUser => _currentUser;
  String? get token => _token;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _token != null && _currentUser != null;
  int get unreadNotifications => _unreadNotifications;

  // Inicializar desde sesión guardada
  Future<void> initialize() async {
    _isLoading = true;
    notifyListeners();

    // Solo leer datos locales - el authManager ya maneja la sesión
    _token = await AuthManager.getToken();
    _currentUser = await AuthManager.getUserData();

    // Cargar contador de notificaciones no leídas si hay sesión
    if (_token != null) {
      _loadUnreadNotifications();
    }

    _isLoading = false;
    notifyListeners();
  }

  // Cargar contador de notificaciones no leídas
  Future<void> _loadUnreadNotifications() async {
    if (_token == null) return;

    try {
      final response = await NotificationApiCalls.getUserNotifications(
        token: _token!,
        page: 1,
        limit: 1, // Solo necesitamos el contador
      );

      if (response['status'] == true) {
        _unreadNotifications = response['unreadCount'] ?? 0;
        notifyListeners();
      }
    } catch (e) {
      // Silenciar errores de notificaciones para no interrumpir el flujo
      print('Error cargando contador de notificaciones: $e');
    }
  }

  // Método público para refrescar el contador
  Future<void> refreshUnreadNotifications() async {
    await _loadUnreadNotifications();
  }

  // Decrementar contador cuando se lee una notificación
  void decrementUnreadNotifications() {
    if (_unreadNotifications > 0) {
      _unreadNotifications--;
      notifyListeners();
    }
  }

  // Login
  Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await AuthApiCalls.login(
        email: email,
        password: password,
      );

      if (response.status && response.data != null) {
        _token = response.data!.token;
        _currentUser = response.data!.user;

        // Guardar sesión
        await AuthManager.saveSession(token: _token!, userData: _currentUser!);
        await authManager.signIn(
          authenticationToken: _token,
          authUid: _currentUser!.id,
        );

        // Inicializar Firebase Messaging después del login
        try {
          await FirebaseMessagingService.initialize();
        } catch (e) {
          if (kDebugMode) {
            print('Error inicializando Firebase Messaging: $e');
          }
        }
      }

      _isLoading = false;
      notifyListeners();
      return response;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return AuthResponse(
        status: false,
        error: 'Error al iniciar sesión: ${e.toString()}',
      );
    }
  }

  // Register
  Future<AuthResponse> register({
    required String email,
    required String password,
    required String username,
    required String name,
    required String university,
    required String faculty,
    String? bio,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await AuthApiCalls.register(
        email: email,
        password: password,
        username: username,
        name: name,
        university: university,
        faculty: faculty,
        bio: bio,
      );

      if (response.status && response.data != null) {
        _token = response.data!.token;
        _currentUser = response.data!.user;

        // Guardar sesión
        await AuthManager.saveSession(token: _token!, userData: _currentUser!);
        await authManager.signIn(
          authenticationToken: _token,
          authUid: _currentUser!.id,
        );
      }

      _isLoading = false;
      notifyListeners();
      return response;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return AuthResponse(
        status: false,
        error: 'Error al registrarse: ${e.toString()}',
      );
    }
  }

  // Establecer usuario desde AuthResponse (usado para Google Sign In)
  Future<void> setUserFromAuthResponse(AuthResponse response) async {
    if (response.status && response.data != null) {
      _token = response.data!.token;
      _currentUser = response.data!.user;

      // Guardar sesión
      await AuthManager.saveSession(token: _token!, userData: _currentUser!);
      await authManager.signIn(
        authenticationToken: _token,
        authUid: _currentUser!.id,
      );

      notifyListeners();
    }
  }

  // Logout
  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    _unreadNotifications = 0;
    await AuthManager.logout();
    await authManager.signOut();
    notifyListeners();
  }

  // Actualizar perfil
  Future<bool> updateProfile({
    String? name,
    String? bio,
    String? university,
    String? faculty,
  }) async {
    if (_token == null) return false;

    _isLoading = true;
    notifyListeners();

    try {
      final response = await AuthApiCalls.updateProfile(
        token: _token!,
        name: name,
        bio: bio,
        university: university,
        faculty: faculty,
      );

      if (response['status'] == true) {
        // Actualizar datos locales
        await refreshProfile();
        _isLoading = false;
        notifyListeners();
        return true;
      }

      _isLoading = false;
      notifyListeners();
      return false;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Refrescar perfil desde el servidor
  Future<void> refreshProfile() async {
    if (_token == null) return;

    try {
      final userData =
          await AuthManager.refreshUserProfile().timeout(Duration(seconds: 5));
      if (userData != null) {
        _currentUser = userData;
        notifyListeners();
      }
    } catch (e) {
      print('Error al refrescar perfil: $e');
    }
  }

  // Actualizar likes de un post en memoria y notificar UI
  // Esto permite actualizaciones optimistas desde widgets sin llamar notifyListeners externamente.
  void toggleLikeLocally(String postId, String viewerId, bool add) {
    if (_currentUser == null || _currentUser!.posts == null) return;

    final posts = _currentUser!.posts!;
    for (var p in posts) {
      if (p.id == postId) {
        if (add) {
          if (!p.likes.contains(viewerId)) p.likes.add(viewerId);
        } else {
          p.likes.remove(viewerId);
        }
        break;
      }
    }

    notifyListeners();
  }

  // Escanear producto
  Future<Map<String, dynamic>> scanProduct(String barcode) async {
    if (_token == null) {
      return {'status': false, 'msg': 'No hay sesión activa'};
    }

    final response = await ProductApiCalls.scanProduct(
      token: _token!,
      barcode: barcode,
    );

    // Si el escaneo fue exitoso, actualizar el perfil para obtener los puntos actualizados
    if (response['status'] == true) {
      await refreshProfile();
    }

    return response;
  }

  // Crear post
  Future<Map<String, dynamic>> createPost({
    required String content,
    String? imageUrl,
  }) async {
    if (_token == null) {
      return {'status': false, 'msg': 'No hay sesión activa'};
    }

    final response = await PostApiCalls.createPost(
      token: _token!,
      content: content,
      imageUrl: imageUrl,
    );

    // Si el post fue creado exitosamente, actualizar el perfil
    if (response['status'] == true) {
      await refreshProfile();
    }

    return response;
  }

  // Subir foto de perfil
  Future<AuthResponse> uploadProfilePicture(String imageBase64) async {
    if (_token == null) {
      return AuthResponse(
        status: false,
        error: 'No hay sesión activa',
      );
    }

    _isLoading = true;
    notifyListeners();

    try {
      final response = await AuthApiCalls.uploadProfilePicture(
        token: _token!,
        imageBase64: imageBase64,
      );

      if (response.status && response.data != null) {
        // Actualizar usuario actual con la nueva foto
        _currentUser = response.data!.user;
        await AuthManager.saveSession(token: _token!, userData: _currentUser!);
      }

      _isLoading = false;
      notifyListeners();
      return response;
    } catch (e) {
      _isLoading = false;
      notifyListeners();
      return AuthResponse(
        status: false,
        error: 'Error al subir la foto: ${e.toString()}',
      );
    }
  }
}
