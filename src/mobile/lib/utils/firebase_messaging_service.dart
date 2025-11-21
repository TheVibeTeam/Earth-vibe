import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import '/backend/api_requests/api_calls.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

// Instancia global para notificaciones locales
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

class FirebaseMessagingService {
  static final FirebaseMessaging _firebaseMessaging =
      FirebaseMessaging.instance;

  // Inicializar el servicio de mensajería
  static Future<void> initialize() async {
    // Configurar notificaciones locales para Android
    await _initializeLocalNotifications();

    // Solicitar permisos para notificaciones
    NotificationSettings settings = await _firebaseMessaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );

    if (settings.authorizationStatus == AuthorizationStatus.authorized) {
      if (kDebugMode) {
        print('Usuario concedió permisos de notificaciones');
      }

      // Obtener el token FCM
      String? token = await _firebaseMessaging.getToken();
      if (token != null) {
        if (kDebugMode) {
          print('FCM Token: $token');
        }
        // Guardar el token en el backend
        await _saveFCMToken(token);
      }

      // Escuchar cuando el token se actualice
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        if (kDebugMode) {
          print('FCM Token actualizado: $newToken');
        }
        _saveFCMToken(newToken);
      });

      // Manejar notificaciones cuando la app está en foreground
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // Manejar notificaciones cuando se hace tap en ellas
      FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

      // Verificar si la app se abrió desde una notificación
      RemoteMessage? initialMessage =
          await _firebaseMessaging.getInitialMessage();
      if (initialMessage != null) {
        _handleMessageOpenedApp(initialMessage);
      }
    } else {
      if (kDebugMode) {
        print('Usuario denegó permisos de notificaciones');
      }
    }
  }

  // Guardar el token FCM en el backend
  static Future<void> _saveFCMToken(String token) async {
    try {
      // Llamar al endpoint del backend para guardar el token
      await UpdateFCMTokenCall.call(
        fcmToken: token,
      );
      if (kDebugMode) {
        print('Token FCM guardado en el backend');
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error al guardar token FCM: $e');
      }
    }
  }

  // Inicializar notificaciones locales para Android
  static Future<void> _initializeLocalNotifications() async {
    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
    );

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        if (kDebugMode) {
          print('Notificación tocada: ${response.payload}');
        }
        // Aquí puedes navegar según el payload
      },
    );

    // Crear canal de notificaciones para Android
    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'earthvibe_notifications', // ID debe coincidir con el AndroidManifest.xml
      'Notificaciones de EarthVibe', // Nombre visible
      description: 'Notificaciones generales de la aplicación',
      importance: Importance.high,
      playSound: true,
      enableVibration: true,
    );

    await flutterLocalNotificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  // Manejar notificaciones cuando la app está en foreground
  static void _handleForegroundMessage(RemoteMessage message) {
    if (kDebugMode) {
      print(
          'Notificación recibida en foreground: ${message.notification?.title}');
    }

    // Mostrar la notificación manualmente cuando la app está abierta
    final notification = message.notification;
    final android = message.notification?.android;

    if (notification != null) {
      flutterLocalNotificationsPlugin.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'earthvibe_notifications',
            'Notificaciones de EarthVibe',
            channelDescription: 'Notificaciones generales de la aplicación',
            importance: Importance.high,
            priority: Priority.high,
            icon: android?.smallIcon ?? '@mipmap/ic_launcher',
            playSound: true,
            enableVibration: true,
          ),
        ),
        payload: message.data.toString(),
      );
    }
  }

  // Manejar cuando se hace tap en una notificación
  static void _handleMessageOpenedApp(RemoteMessage message) {
    if (kDebugMode) {
      print('Notificación abierta: ${message.notification?.title}');
    }
    // Aquí puedes navegar a una pantalla específica según el tipo de notificación
    // Por ejemplo: context.pushNamed('/notifications')
  }
}

// Handler para notificaciones en background (debe ser función top-level)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  if (kDebugMode) {
    print(
        'Notificación recibida en background: ${message.notification?.title}');
  }
}
