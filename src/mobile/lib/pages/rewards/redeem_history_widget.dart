import 'package:flutter/material.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import 'package:provider/provider.dart';
import '/auth/custom_auth/user_provider.dart';
import '/backend/api_requests/api_calls.dart';
import 'package:intl/intl.dart';
import '/utils/alert_helper.dart';

class RedeemHistoryWidget extends StatefulWidget {
  const RedeemHistoryWidget({super.key});

  static String routeName = 'redeem_history';
  static String routePath = '/redeemHistory';

  @override
  State<RedeemHistoryWidget> createState() => _RedeemHistoryWidgetState();
}

class _RedeemHistoryWidgetState extends State<RedeemHistoryWidget>
    with SingleTickerProviderStateMixin {
  List<dynamic> _history = [];
  bool _isLoading = true;
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchHistory();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _fetchHistory() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final token = userProvider.token;
    if (token == null) {
      setState(() {
        _isLoading = false;
      });
      showErrorAlert(
        context,
        title: 'Error de autenticación',
        message: 'Debes iniciar sesión para ver tu historial de canjes.',
      );
      return;
    }
    try {
      final res = await RewardApiCalls.getRedeemHistory(token: token);
      if (res['status'] == true && res['data'] is List) {
        setState(() {
          _history = (res['data'] as List)
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
          // Ordenar por fecha más reciente primero
          _history.sort((a, b) {
            final dateA =
                DateTime.tryParse(a['createdAt'] ?? '') ?? DateTime.now();
            final dateB =
                DateTime.tryParse(b['createdAt'] ?? '') ?? DateTime.now();
            return dateB.compareTo(dateA);
          });
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
        showErrorAlert(
          context,
          title: 'Error al cargar',
          message: 'No se pudo obtener el historial de canjes.',
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      showErrorAlert(
        context,
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor. Intenta nuevamente.',
      );
    }
  }

  List<Map<String, dynamic>> get _pendingRedeems {
    return _history
        .where((redeem) =>
            redeem['status'] == 'pending' || redeem['status'] == 'processing')
        .cast<Map<String, dynamic>>()
        .toList();
  }

  List<Map<String, dynamic>> get _completedRedeems {
    return _history
        .where((redeem) =>
            redeem['status'] == 'completed' || redeem['status'] == 'delivered')
        .cast<Map<String, dynamic>>()
        .toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Canjes'),
        backgroundColor: FlutterFlowTheme.of(context).secondary,
        elevation: 2,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: Colors.white,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: [
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.hourglass_top, size: 20),
                  const SizedBox(width: 8),
                  Text('Pendientes (${_pendingRedeems.length})'),
                ],
              ),
            ),
            Tab(
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.check_circle, size: 20),
                  const SizedBox(width: 8),
                  Text('Procesados (${_completedRedeems.length})'),
                ],
              ),
            ),
          ],
        ),
      ),
      backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : TabBarView(
              controller: _tabController,
              children: [
                // Tab de Pendientes
                _buildRedeemList(_pendingRedeems, isPending: true),
                // Tab de Procesados
                _buildRedeemList(_completedRedeems, isPending: false),
              ],
            ),
    );
  }

  Widget _buildRedeemList(List<Map<String, dynamic>> redeems,
      {required bool isPending}) {
    if (redeems.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isPending ? Icons.hourglass_empty : Icons.check_circle_outline,
              size: 80,
              color: FlutterFlowTheme.of(context).secondaryText,
            ),
            const SizedBox(height: 16),
            Text(
              isPending
                  ? 'No tienes canjes pendientes'
                  : 'No tienes canjes procesados',
              style: FlutterFlowTheme.of(context).headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              isPending
                  ? 'Tus canjes aparecerán aquí'
                  : 'Tus canjes completados aparecerán aquí',
              style: FlutterFlowTheme.of(context).bodyMedium,
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchHistory,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: redeems.length,
        itemBuilder: (context, index) {
          final redeem = redeems[index];
          return _buildRedeemCard(redeem, isPending: isPending);
        },
      ),
    );
  }

  Widget _buildRedeemCard(Map<String, dynamic> redeem,
      {required bool isPending}) {
    DateTime createdAt;
    if (redeem['createdAt'] is String) {
      createdAt = DateTime.tryParse(redeem['createdAt']) ?? DateTime.now();
    } else if (redeem['createdAt'] is DateTime) {
      createdAt = redeem['createdAt'];
    } else {
      createdAt = DateTime.now();
    }

    final status = redeem['status'] ?? 'pending';
    final statusInfo = _getStatusInfo(status);

    return Card(
      color: FlutterFlowTheme.of(context).primaryBackground,
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: statusInfo['color'].withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                // Icono de estado
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: statusInfo['color'].withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    statusInfo['icon'],
                    color: statusInfo['color'],
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                // Información principal
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        redeem['reward']?['name'] ?? redeem['name'] ?? 'Premio',
                        style:
                            FlutterFlowTheme.of(context).titleMedium.copyWith(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 18,
                                ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(
                            Icons.stars,
                            size: 16,
                            color: FlutterFlowTheme.of(context).secondary,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            '${NumberFormat('#,###', 'es').format(redeem['points'] ?? 0)} pts',
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: FlutterFlowTheme.of(context).secondary,
                                ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Badge de estado
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: statusInfo['color'],
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    statusInfo['label'],
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Descripción o mensaje
            if (redeem['reward']?['description'] != null ||
                redeem['message'] != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  redeem['reward']?['description'] ?? redeem['message'] ?? '',
                  style: FlutterFlowTheme.of(context).bodyMedium.copyWith(
                        color: FlutterFlowTheme.of(context).secondaryText,
                      ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            // Fecha y detalles
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).secondaryBackground,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: FlutterFlowTheme.of(context).secondaryText,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat('dd/MM/yyyy - HH:mm', 'es').format(createdAt),
                    style: FlutterFlowTheme.of(context).bodySmall.copyWith(
                          color: FlutterFlowTheme.of(context).secondaryText,
                        ),
                  ),
                  if (isPending) ...[
                    const Spacer(),
                    Text(
                      'En proceso',
                      style: FlutterFlowTheme.of(context).bodySmall.copyWith(
                            color: statusInfo['color'],
                            fontStyle: FontStyle.italic,
                          ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Map<String, dynamic> _getStatusInfo(String status) {
    switch (status.toLowerCase()) {
      case 'pending':
        return {
          'icon': Icons.hourglass_top,
          'label': 'Pendiente',
          'color': Colors.orange,
        };
      case 'processing':
        return {
          'icon': Icons.sync,
          'label': 'Procesando',
          'color': Colors.blue,
        };
      case 'completed':
        return {
          'icon': Icons.check_circle,
          'label': 'Completado',
          'color': Colors.green,
        };
      case 'delivered':
        return {
          'icon': Icons.local_shipping,
          'label': 'Entregado',
          'color': const Color(0xFF4CAF50),
        };
      case 'cancelled':
        return {
          'icon': Icons.cancel,
          'label': 'Cancelado',
          'color': Colors.red,
        };
      default:
        return {
          'icon': Icons.info,
          'label': status,
          'color': Colors.grey,
        };
    }
  }
}
