import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';

class AdminPanelModel extends FlutterFlowModel {
  ///  State fields for stateful widgets in this page.

  final unfocusNode = FocusNode();

  // Estado de carga
  bool isLoadingUsers = false;
  bool isLoadingPosts = false;
  bool isLoadingStats = false;
  bool isLoadingNotifications = false;
  bool isSendingNotification = false;
  bool isLoadingRewards = false;
  bool isLoadingChallenges = false;

  // Datos de usuarios
  List<dynamic> users = [];
  int currentUserPage = 1;
  int totalUserPages = 1;
  String userSearchQuery = '';

  // Datos de publicaciones
  List<dynamic> posts = [];
  int currentPostPage = 1;
  int totalPostPages = 1;

  // Datos de notificaciones
  List<dynamic> notifications = [];
  int currentNotificationPage = 1;
  int totalNotificationPages = 1;

  // Estadísticas
  Map<String, dynamic> stats = {};

  // Datos de recompensas
  List<dynamic> rewards = [];

  // Datos de retos
  List<dynamic> challenges = [];

  // Tab seleccionada
  int selectedTab = 0;

  // Controladores de formulario de notificación
  TextEditingController notificationTitleController = TextEditingController();
  TextEditingController notificationMessageController = TextEditingController();
  String notificationType = 'general';
  String notificationPriority = 'medium';
  String notificationRecipients = 'all';
  int? notificationExpiresInDays;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    unfocusNode.dispose();
    notificationTitleController.dispose();
    notificationMessageController.dispose();
  }

  // Cargar estadísticas del dashboard
  Future<void> loadStats() async {
    isLoadingStats = true;
    // Se cargará desde el widget usando api_calls.dart
  }

  // Cargar usuarios con paginación
  Future<void> loadUsers({int page = 1, String search = ''}) async {
    isLoadingUsers = true;
    currentUserPage = page;
    userSearchQuery = search;
    // Se cargará desde el widget usando api_calls.dart
  }

  // Cargar publicaciones con paginación
  Future<void> loadPosts({int page = 1}) async {
    isLoadingPosts = true;
    currentPostPage = page;
    // Se cargará desde el widget usando api_calls.dart
  }

  // Cargar recompensas
  Future<void> loadRewards({int page = 1}) async {
    isLoadingRewards = true;
    currentPostPage = page;
    // Se cargará desde el widget usando api_calls.dart
  }

  // Cargar retos
  Future<void> loadChallenges({int page = 1}) async {
    isLoadingChallenges = true;
    currentPostPage = page;
    // Se cargará desde el widget usando api_calls.dart
  }
}
