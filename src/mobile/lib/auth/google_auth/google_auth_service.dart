import 'package:google_sign_in/google_sign_in.dart';
import '/backend/api_requests/api_calls.dart';

class GoogleAuthService {
  static final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: ['email', 'profile'],
    serverClientId:
        '301754029580-n0bhsp6uvc0khkmvbubovtedcrn94lq8.apps.googleusercontent.com',
  );

  static Future<Map<String, dynamic>> signInWithGoogle() async {
    try {
      await _googleSignIn.signOut();

      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        return {
          'status': false,
          'msg': 'Inicio de sesión cancelado',
        };
      }

      final String? email = googleUser.email;
      final String? displayName = googleUser.displayName;
      final String? photoUrl = googleUser.photoUrl;
      final String? googleId = googleUser.id;

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final String? idToken = googleAuth.idToken;
      final String? accessToken = googleAuth.accessToken;

      if (email == null || googleId == null) {
        return {
          'status': false,
          'msg': 'No se pudo obtener la información de Google',
        };
      }

      final response = await AuthApiCalls.googleSignIn(
        email: email,
        name: displayName ?? email.split('@')[0],
        googleId: googleId,
        profilePicture: photoUrl,
        idToken: idToken,
        accessToken: accessToken,
      );

      return response;
    } catch (error) {
      final errStr = error.toString();

      String userMessage = 'Error al iniciar sesión con Google';
      if (errStr.contains('DEVELOPER_ERROR') || errStr.contains('10:')) {
        userMessage =
            'Error de configuración: verifica SHA-1, package name y Web Client ID en Google/Firebase (DEVELOPER_ERROR 10).';
      } else if (errStr.contains('network') || errStr.contains('Network')) {
        userMessage = 'Error de red: verifica tu conexión a internet.';
      } else if (errStr.contains('popup_closed_by_user') ||
          errStr.contains('User cancelled')) {
        userMessage = 'Inicio de sesión cancelado por el usuario.';
      } else {
        userMessage = 'Error al iniciar sesión con Google: $errStr';
      }

      return {
        'status': false,
        'msg': userMessage,
        'error': errStr,
      };
    }
  }

  static Future<void> signOut() async {
    try {
      await _googleSignIn.signOut();
    } catch (error) {
      print('Error al cerrar sesión de Google: $error');
    }
  }

  static Future<bool> isSignedIn() async {
    return await _googleSignIn.isSignedIn();
  }

  static Future<GoogleSignInAccount?> getCurrentUser() async {
    return _googleSignIn.currentUser;
  }
}
