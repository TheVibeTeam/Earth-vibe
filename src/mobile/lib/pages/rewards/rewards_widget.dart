import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import '/auth/custom_auth/user_provider.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/backend/api_requests/api_calls.dart';
import '/utils/alert_helper.dart';

import 'redeem_history_widget.dart';

class RewardsWidget extends StatefulWidget {
  const RewardsWidget({super.key});

  static String routeName = 'rewards';
  static String routePath = '/rewards';

  @override
  State<RewardsWidget> createState() => _RewardsWidgetState();
}

class _RewardsWidgetState extends State<RewardsWidget> {
  List<Map<String, dynamic>> _rewards = [];
  bool _isLoading = true;
  bool _showAllRewards = false;
  final int _initialRewardCount = 3;

  @override
  void initState() {
    super.initState();
    _fetchRewards();
  }

  Future<void> _fetchRewards() async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final token = userProvider.token;
    if (token == null) {
      setState(() {
        _isLoading = false;
      });
      showErrorAlert(
        context,
        title: 'Error de autenticación',
        message: 'Debes iniciar sesión para ver premios.',
      );
      return;
    }
    try {
      final res = await RewardApiCalls.getRewards();
      if (res['status'] == true && res['data'] is List) {
        setState(() {
          _rewards = (res['data'] as List)
              .map((e) => Map<String, dynamic>.from(e))
              .toList();
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
        if (!mounted) return;
        showErrorAlert(
          context,
          title: 'Error al cargar',
          message: 'No se pudieron cargar los premios.',
        );
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (!mounted) return;
      showErrorAlert(
        context,
        title: 'Error de conexión',
        message: 'No se pudo conectar con el servidor. Intenta nuevamente.',
      );
    }
  }

  Future<void> _redeemReward(
      String rewardId, String rewardName, int points) async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final token = userProvider.token;
    final currentPoints = userProvider.currentUser?.points ?? 0;

    if (token == null) {
      showErrorAlert(
        context,
        title: 'Error de autenticación',
        message: 'Debes iniciar sesión para canjear premios.',
      );
      return;
    }

    if (currentPoints < points) {
      showErrorAlert(
        context,
        title: 'Puntos insuficientes',
        message: 'No tienes suficientes puntos. Necesitas $points pts.',
      );
      return;
    }

    final confirm = await showDialog<bool>(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Confirmar Canje'),
          content: Text(
            '¿Deseas canjear "$rewardName" por $points puntos?\n\nPuntos actuales: $currentPoints',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancelar'),
            ),
            FFButtonWidget(
              onPressed: () => Navigator.of(context).pop(true),
              text: 'Canjear',
              options: FFButtonOptions(
                height: 40,
                color: FlutterFlowTheme.of(context).secondary,
                textStyle: FlutterFlowTheme.of(context)
                    .bodyMedium
                    .copyWith(color: Colors.white),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ],
        );
      },
    );

    if (confirm != true) return;

    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/rewards/redeem'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'rewardId': rewardId}),
      );
      final res = json.decode(response.body);
      if (res['status'] == true) {
        await userProvider.refreshProfile();

        if (!mounted) return;
        showSuccessAlert(
          context,
          title: '¡Canje exitoso!',
          message: res['msg'] ?? 'Premio canjeado correctamente.',
        );

        _fetchRewards();
      } else {
        if (!mounted) return;
        showErrorAlert(
          context,
          title: 'Error en el canje',
          message: res['msg'] ?? 'No se pudo canjear el premio.',
        );
      }
    } catch (e) {
      if (!mounted) return;
      showErrorAlert(
        context,
        title: 'Error de conexión',
        message: 'No se pudo procesar el canje. Intenta nuevamente.',
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final displayRewards = _showAllRewards
        ? _rewards
        : _rewards.take(_initialRewardCount).toList();
    final hasMoreRewards = _rewards.length > _initialRewardCount;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Premios y Canje'),
        backgroundColor: FlutterFlowTheme.of(context).secondary,
        elevation: 2,
        actions: [
          Consumer<UserProvider>(
            builder: (context, userProvider, _) {
              final points = userProvider.currentUser?.points ?? 0;
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Center(
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.2),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.stars, color: Colors.white, size: 20),
                        const SizedBox(width: 6),
                        Text(
                          NumberFormat('#,###', 'es').format(points),
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            },
          ),
        ],
      ),
      backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                Expanded(
                  child: _rewards.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.card_giftcard,
                                size: 80,
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No hay premios disponibles',
                                style:
                                    FlutterFlowTheme.of(context).headlineSmall,
                              ),
                            ],
                          ),
                        )
                      : RefreshIndicator(
                          onRefresh: _fetchRewards,
                          child: ListView(
                            padding: const EdgeInsets.all(16),
                            children: [
                              Text(
                                'Canjea tus puntos',
                                style: FlutterFlowTheme.of(context)
                                    .headlineMedium
                                    .copyWith(fontWeight: FontWeight.bold),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                'Selecciona el premio que deseas canjear',
                                style: FlutterFlowTheme.of(context).bodyMedium,
                              ),
                              const SizedBox(height: 20),
                              ...displayRewards.map((reward) {
                                return _buildRewardCard(reward);
                              }),
                              if (hasMoreRewards && !_showAllRewards)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 16.0),
                                  child: TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _showAllRewards = true;
                                      });
                                    },
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Ver más premios',
                                          style: TextStyle(
                                            color: FlutterFlowTheme.of(context)
                                                .secondary,
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Icon(
                                          Icons.expand_more,
                                          color: FlutterFlowTheme.of(context)
                                              .secondary,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              if (_showAllRewards && hasMoreRewards)
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                      vertical: 16.0),
                                  child: TextButton(
                                    onPressed: () {
                                      setState(() {
                                        _showAllRewards = false;
                                      });
                                    },
                                    child: Row(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text(
                                          'Ver menos',
                                          style: TextStyle(
                                            color: FlutterFlowTheme.of(context)
                                                .secondary,
                                            fontSize: 16,
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Icon(
                                          Icons.expand_less,
                                          color: FlutterFlowTheme.of(context)
                                              .secondary,
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                            ],
                          ),
                        ),
                ),
                Container(
                  padding: const EdgeInsets.all(16.0),
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).primaryBackground,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.1),
                        blurRadius: 10,
                        offset: const Offset(0, -5),
                      ),
                    ],
                  ),
                  child: FFButtonWidget(
                    onPressed: () {
                      Navigator.of(context).push(MaterialPageRoute(
                        builder: (context) => const RedeemHistoryWidget(),
                      ));
                    },
                    text: 'Ver mis canjes',
                    icon: const Icon(
                      Icons.history,
                      size: 20,
                    ),
                    options: FFButtonOptions(
                      width: double.infinity,
                      height: 50,
                      color: FlutterFlowTheme.of(context).secondary,
                      textStyle: FlutterFlowTheme.of(context)
                          .titleMedium
                          .copyWith(color: Colors.white),
                      borderRadius: BorderRadius.circular(12),
                      elevation: 2,
                    ),
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildRewardCard(Map<String, dynamic> reward) {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final currentPoints = userProvider.currentUser?.points ?? 0;
    final rewardPoints = reward['points'] ?? 0;
    final canAfford = currentPoints >= rewardPoints;

    return Card(
      color: FlutterFlowTheme.of(context).primaryBackground,
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 3,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: canAfford
            ? BorderSide(
                color: FlutterFlowTheme.of(context).secondary.withOpacity(0.3),
                width: 2,
              )
            : BorderSide.none,
      ),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Imagen del premio
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: reward['imageUrl'] != null &&
                      reward['imageUrl'].toString().isNotEmpty
                  ? Image.network(
                      reward['imageUrl'],
                      width: 80,
                      height: 80,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return _buildPlaceholderImage();
                      },
                    )
                  : _buildPlaceholderImage(),
            ),
            const SizedBox(width: 16),
            // Información del premio
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    reward['name'] ?? 'Premio',
                    style: FlutterFlowTheme.of(context).titleMedium.copyWith(
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    reward['description'] ?? '',
                    style: FlutterFlowTheme.of(context).bodyMedium.copyWith(
                          color: FlutterFlowTheme.of(context).secondaryText,
                        ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      // Badge de puntos
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: canAfford
                              ? FlutterFlowTheme.of(context).secondary
                              : FlutterFlowTheme.of(context).secondaryText,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(
                              Icons.stars,
                              size: 16,
                              color: Colors.white,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              '${NumberFormat('#,###', 'es').format(rewardPoints)} pts',
                              style: const TextStyle(
                                color: Colors.white,
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Spacer(),
                      // Botón de canjear
                      FFButtonWidget(
                        onPressed: canAfford
                            ? () async {
                                await _redeemReward(
                                  reward['_id'] ?? reward['id'] ?? '',
                                  reward['name'] ?? 'Premio',
                                  rewardPoints,
                                );
                              }
                            : null,
                        text: 'Canjear',
                        options: FFButtonOptions(
                          height: 36,
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          color: canAfford
                              ? FlutterFlowTheme.of(context).secondary
                              : FlutterFlowTheme.of(context).secondaryText,
                          textStyle:
                              FlutterFlowTheme.of(context).bodyMedium.copyWith(
                                    color: Colors.white,
                                    fontWeight: FontWeight.bold,
                                  ),
                          borderRadius: BorderRadius.circular(20),
                          elevation: canAfford ? 2 : 0,
                        ),
                      ),
                    ],
                  ),
                  if (!canAfford)
                    Padding(
                      padding: const EdgeInsets.only(top: 8.0),
                      child: Text(
                        'Necesitas ${NumberFormat('#,###', 'es').format(rewardPoints - currentPoints)} puntos más',
                        style: FlutterFlowTheme.of(context).bodySmall.copyWith(
                              color: Colors.red,
                              fontStyle: FontStyle.italic,
                            ),
                      ),
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderImage() {
    return Container(
      width: 80,
      height: 80,
      decoration: BoxDecoration(
        color: FlutterFlowTheme.of(context).secondary.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Icon(
        Icons.card_giftcard,
        size: 40,
        color: FlutterFlowTheme.of(context).secondary,
      ),
    );
  }
}
