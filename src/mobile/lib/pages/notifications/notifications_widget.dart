import 'package:provider/provider.dart';
import 'package:flutter/material.dart';
import '/auth/custom_auth/user_provider.dart';
import '/backend/api_requests/api_calls.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'notifications_model.dart';
export 'notifications_model.dart';

class NotificationsWidget extends StatefulWidget {
  const NotificationsWidget({super.key});

  @override
  State<NotificationsWidget> createState() => _NotificationsWidgetState();
}

class _NotificationsWidgetState extends State<NotificationsWidget> {
  late NotificationsModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => NotificationsModel());

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNotifications();
      // Refrescar contador en el UserProvider
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      userProvider.refreshUnreadNotifications();
    });
  }

  @override
  void dispose() {
    _model.dispose();
    super.dispose();
  }

  Future<void> _loadNotifications({int page = 1}) async {
    setState(() => _model.isLoading = true);

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;

      if (token == null) {
        setState(() => _model.isLoading = false);
        return;
      }

      final response = await NotificationApiCalls.getUserNotifications(
        token: token,
        page: page,
        limit: 20,
      );

      if (response['status'] == true) {
        setState(() {
          _model.notifications = response['notifications'] ?? [];
          _model.unreadCount = response['unreadCount'] ?? 0;
          _model.currentPage = response['currentPage'] ?? 1;
          _model.totalPages = response['totalPages'] ?? 1;
        });
      }
    } catch (e) {
      // Error cargando notificaciones
    } finally {
      setState(() => _model.isLoading = false);
    }
  }

  Future<void> _markAsRead(String notificationId, int index) async {
    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;

      if (token == null) return;

      // Marcar visualmente como leída de inmediato
      setState(() {
        if (index < _model.notifications.length) {
          final notif = _model.notifications[index];
          if (!notif.isRead) {
            _model.unreadCount =
                (_model.unreadCount - 1).clamp(0, double.infinity).toInt();
          }
        }
      });

      // Enviar solicitud al servidor
      await NotificationApiCalls.markAsRead(
        token: token,
        notificationId: notificationId,
      );

      // Recargar para asegurar sincronización
      await _loadNotifications(page: _model.currentPage);
    } catch (e) {
      // Error marcando como leída
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).secondary,
          automaticallyImplyLeading: false,
          leading: IconButton(
            icon: Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => context.pop(),
          ),
          title: Row(
            mainAxisSize: MainAxisSize.max,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Notificaciones',
                style: FlutterFlowTheme.of(context).headlineMedium.override(
                      fontFamily: 'Outfit',
                      color: Colors.white,
                      fontSize: 22.0,
                      letterSpacing: 0.0,
                    ),
              ),
              if (_model.unreadCount > 0)
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).error,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${_model.unreadCount} nueva${_model.unreadCount != 1 ? 's' : ''}',
                    style: FlutterFlowTheme.of(context).bodySmall.override(
                          fontFamily: 'Readex Pro',
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
            ],
          ),
          actions: [
            IconButton(
              icon: Icon(Icons.refresh, color: Colors.white),
              onPressed: () => _loadNotifications(page: 1),
            ),
          ],
          centerTitle: false,
          elevation: 2.0,
        ),
        body: SafeArea(
          top: true,
          child: _buildBody(),
        ),
      ),
    );
  }

  Widget _buildBody() {
    if (_model.isLoading && _model.notifications.isEmpty) {
      return Center(
        child: CircularProgressIndicator(
          valueColor: AlwaysStoppedAnimation<Color>(
            FlutterFlowTheme.of(context).primary,
          ),
        ),
      );
    }

    if (_model.notifications.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.notifications_off_outlined,
              size: 80,
              color: FlutterFlowTheme.of(context).secondaryText,
            ),
            SizedBox(height: 16),
            Text(
              'No tienes notificaciones',
              style: FlutterFlowTheme.of(context).headlineSmall.override(
                    fontFamily: 'Outfit',
                    color: FlutterFlowTheme.of(context).secondaryText,
                  ),
            ),
            SizedBox(height: 8),
            Text(
              'Las notificaciones de Earth Vibe\naparecerán aquí',
              textAlign: TextAlign.center,
              style: FlutterFlowTheme.of(context).bodyMedium.override(
                    fontFamily: 'Readex Pro',
                    color: FlutterFlowTheme.of(context).secondaryText,
                  ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => _loadNotifications(page: 1),
      child: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: EdgeInsets.zero,
              itemCount: _model.notifications.length,
              itemBuilder: (context, index) {
                final notification = _model.notifications[index];
                return _buildNotificationCard(notification, index);
              },
            ),
          ),
          if (_model.totalPages > 1) _buildPagination(),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(NotificationData notification, int index) {
    final priorityColor = _getPriorityColor(notification.priority);
    final typeIcon = _getTypeIcon(notification.type);
    final isNew = !notification.isRead;
    final isDarkMode = Theme.of(context).brightness == Brightness.dark;

    return InkWell(
      onTap: () => _markAsRead(notification.id, index),
      child: Container(
        margin: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
        decoration: BoxDecoration(
          color: isNew
              ? (isDarkMode
                  ? FlutterFlowTheme.of(context).secondary.withOpacity(0.1)
                  : FlutterFlowTheme.of(context).secondary.withOpacity(0.05))
              : FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isNew
                ? FlutterFlowTheme.of(context).secondary.withOpacity(0.3)
                : FlutterFlowTheme.of(context).alternate,
            width: isNew ? 2 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: isDarkMode
                  ? Colors.black.withOpacity(0.3)
                  : Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Icono de prioridad
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: priorityColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  typeIcon,
                  color: priorityColor,
                  size: 24,
                ),
              ),
              SizedBox(width: 12),
              // Contenido
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            notification.title,
                            style: FlutterFlowTheme.of(context)
                                .titleMedium
                                .override(
                                  fontFamily: 'Readex Pro',
                                  fontWeight:
                                      isNew ? FontWeight.bold : FontWeight.w600,
                                ),
                          ),
                        ),
                        if (isNew)
                          Container(
                            width: 8,
                            height: 8,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context).secondary,
                              shape: BoxShape.circle,
                            ),
                          ),
                      ],
                    ),
                    SizedBox(height: 8),
                    Text(
                      notification.message,
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                            fontFamily: 'Readex Pro',
                            color: FlutterFlowTheme.of(context).secondaryText,
                          ),
                    ),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.person_outline,
                          size: 14,
                          color: FlutterFlowTheme.of(context).secondaryText,
                        ),
                        SizedBox(width: 4),
                        Text(
                          notification.sentBy,
                          style: FlutterFlowTheme.of(context)
                              .bodySmall
                              .override(
                                fontFamily: 'Readex Pro',
                                fontSize: 12,
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
                              ),
                        ),
                        SizedBox(width: 12),
                        Icon(
                          Icons.access_time,
                          size: 14,
                          color: FlutterFlowTheme.of(context).secondaryText,
                        ),
                        SizedBox(width: 4),
                        Text(
                          _getTimeAgo(notification.createdAt),
                          style: FlutterFlowTheme.of(context)
                              .bodySmall
                              .override(
                                fontFamily: 'Readex Pro',
                                fontSize: 12,
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
                              ),
                        ),
                      ],
                    ),
                    if (notification.expiresAt != null) ...[
                      SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.event_busy,
                            size: 14,
                            color: FlutterFlowTheme.of(context).error,
                          ),
                          SizedBox(width: 4),
                          Text(
                            'Expira: ${_formatDate(notification.expiresAt!)}',
                            style:
                                FlutterFlowTheme.of(context).bodySmall.override(
                                      fontFamily: 'Readex Pro',
                                      fontSize: 11,
                                      color: FlutterFlowTheme.of(context).error,
                                      fontStyle: FontStyle.italic,
                                    ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: FlutterFlowTheme.of(context).secondaryBackground,
        border: Border(
          top: BorderSide(
            color: FlutterFlowTheme.of(context).alternate,
            width: 1,
          ),
        ),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: Icon(Icons.chevron_left),
            onPressed: _model.currentPage > 1
                ? () => _loadNotifications(page: _model.currentPage - 1)
                : null,
            color: _model.currentPage > 1
                ? FlutterFlowTheme.of(context).primaryText
                : FlutterFlowTheme.of(context).secondaryText,
          ),
          SizedBox(width: 8),
          Text(
            'Página ${_model.currentPage} de ${_model.totalPages}',
            style: FlutterFlowTheme.of(context).bodyMedium,
          ),
          SizedBox(width: 8),
          IconButton(
            icon: Icon(Icons.chevron_right),
            onPressed: _model.currentPage < _model.totalPages
                ? () => _loadNotifications(page: _model.currentPage + 1)
                : null,
            color: _model.currentPage < _model.totalPages
                ? FlutterFlowTheme.of(context).primaryText
                : FlutterFlowTheme.of(context).secondaryText,
          ),
        ],
      ),
    );
  }

  Color _getPriorityColor(String priority) {
    switch (priority) {
      case 'high':
        return FlutterFlowTheme.of(context).error;
      case 'medium':
        return FlutterFlowTheme.of(context).warning;
      case 'low':
        return FlutterFlowTheme.of(context).info;
      default:
        return FlutterFlowTheme.of(context).secondaryText;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'announcement':
        return Icons.campaign;
      case 'alert':
        return Icons.warning_amber_rounded;
      case 'update':
        return Icons.system_update_alt;
      default:
        return Icons.notifications_active;
    }
  }

  String _getTimeAgo(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inDays > 365) {
      final years = (difference.inDays / 365).floor();
      return 'Hace $years año${years > 1 ? 's' : ''}';
    } else if (difference.inDays > 30) {
      final months = (difference.inDays / 30).floor();
      return 'Hace $months mes${months > 1 ? 'es' : ''}';
    } else if (difference.inDays > 0) {
      return 'Hace ${difference.inDays} día${difference.inDays > 1 ? 's' : ''}';
    } else if (difference.inHours > 0) {
      return 'Hace ${difference.inHours} hora${difference.inHours > 1 ? 's' : ''}';
    } else if (difference.inMinutes > 0) {
      return 'Hace ${difference.inMinutes} minuto${difference.inMinutes > 1 ? 's' : ''}';
    } else {
      return 'Ahora mismo';
    }
  }

  String _formatDate(DateTime dateTime) {
    final months = [
      'Ene',
      'Feb',
      'Mar',
      'Abr',
      'May',
      'Jun',
      'Jul',
      'Ago',
      'Sep',
      'Oct',
      'Nov',
      'Dic'
    ];
    return '${dateTime.day} ${months[dateTime.month - 1]} ${dateTime.year}';
  }
}
