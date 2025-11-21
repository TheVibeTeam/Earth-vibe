import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../backend/api_requests/api_calls.dart';

class AuthManager {
  static const String _tokenKey = 'auth_token';
  static const String _userDataKey = 'user_data';

  // Guardar sesión después del login
  static Future<void> saveSession({
    required String token,
    required UserData userData,
  }) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_tokenKey, token);
    await prefs.setString(_userDataKey, jsonEncode(userData.toJson()));
  }

  // Obtener token guardado
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_tokenKey);
  }

  // Obtener datos de usuario guardados
  static Future<UserData?> getUserData() async {
    final prefs = await SharedPreferences.getInstance();
    final userDataString = prefs.getString(_userDataKey);

    if (userDataString == null) return null;

    try {
      final userDataMap = jsonDecode(userDataString) as Map<String, dynamic>;
      return UserData.fromJson(userDataMap);
    } catch (e) {
      print('Error al decodificar datos de usuario: $e');
      // Limpiar datos corruptos
      await prefs.remove(_userDataKey);
      return null;
    }
  }

  // Verificar si hay sesión activa
  static Future<bool> hasActiveSession() async {
    final token = await getToken();
    if (token == null) return false;

    // Verificar si el token es válido
    final response = await AuthApiCalls.verifyToken(token);
    return response.status;
  }

  // Actualizar datos de usuario en storage
  static Future<void> updateUserData(UserData userData) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_userDataKey, jsonEncode(userData.toJson()));
  }

  // Cerrar sesión
  static Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_tokenKey);
    await prefs.remove(_userDataKey);
  }

  // Obtener perfil actualizado desde el servidor
  static Future<UserData?> refreshUserProfile() async {
    final token = await getToken();
    if (token == null) return null;

    try {
      final response = await AuthApiCalls.getProfile(token);

      if (response['status'] == true && response['data'] != null) {
        final userData = UserData.fromJson(response['data']);
        await updateUserData(userData);
        return userData;
      }

      return null;
    } catch (e) {
      print('Error al refrescar perfil: $e');
      return null;
    }
  }
}
