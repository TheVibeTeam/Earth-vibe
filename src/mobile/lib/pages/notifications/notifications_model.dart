import '/flutter_flow/flutter_flow_util.dart';
import '/backend/api_requests/api_calls.dart';
import 'package:flutter/material.dart';

class NotificationsModel extends FlutterFlowModel {
  ///  State fields for stateful widgets in this page.

  final unfocusNode = FocusNode();

  // Estado de carga
  bool isLoading = false;
  bool isLoadingMore = false;

  // Datos de notificaciones
  List<NotificationData> notifications = [];
  int currentPage = 1;
  int totalPages = 1;
  int unreadCount = 0;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    unfocusNode.dispose();
  }
}
