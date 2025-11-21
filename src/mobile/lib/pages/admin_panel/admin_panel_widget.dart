import 'package:provider/provider.dart';
import 'package:flutter/material.dart';
import '/auth/custom_auth/user_provider.dart';
import '/backend/api_requests/api_calls.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'create_challenge_page.dart';
import 'create_reward_page.dart';
import 'admin_panel_model.dart';
export 'admin_panel_model.dart';

class AdminPanelWidget extends StatefulWidget {
  const AdminPanelWidget({super.key});

  @override
  State<AdminPanelWidget> createState() => _AdminPanelWidgetState();
}

class _AdminPanelWidgetState extends State<AdminPanelWidget>
    with TickerProviderStateMixin {
  late AdminPanelModel _model;
  late TabController _tabController;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => AdminPanelModel());
    _tabController = TabController(length: 6, vsync: this);

    // Cargar datos iniciales
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadInitialData();
    });
  }

  @override
  void dispose() {
    _model.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialData() async {
    await _loadStats();
    await _loadUsers();
    await _loadPosts();
    await _loadNotifications();
    await _loadRewards();
    await _loadChallenges();
  }

  Future<void> _loadRewards() async {
    if (!mounted) return;
    setState(() => _model.isLoadingRewards = true);
    try {
      final response = await RewardApiCalls.getRewards();
      if (response['status'] == true) {
        if (mounted) {
          setState(() {
            _model.rewards = response['data'] ?? [];
          });
        }
      }
    } catch (e) {
      print('Error cargando recompensas: $e');
    } finally {
      if (mounted) {
        setState(() => _model.isLoadingRewards = false);
      }
    }
  }

  Future<void> _loadChallenges() async {
    if (!mounted) return;
    setState(() => _model.isLoadingChallenges = true);
    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final userId = userProvider.currentUser?.id;
      if (userId == null) return;

      final response = await ChallengesApiCalls.getChallenges(userId: userId);
      if (response['status'] == true) {
        if (mounted) {
          setState(() {
            _model.challenges = response['data'] ?? [];
          });
        }
      }
    } catch (e) {
      print('Error cargando retos: $e');
    } finally {
      if (mounted) {
        setState(() => _model.isLoadingChallenges = false);
      }
    }
  }

  Future<void> _loadStats() async {
    if (!mounted) return;
    setState(() => _model.isLoadingStats = true);

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;
      final response = await AdminApiCalls.getDashboardStats(token: token);
      if (response['status'] == true) {
        if (mounted) {
          setState(() {
            // Los datos vienen en data.overview
            _model.stats = response['data']?['overview'] ?? {};
          });
        }
      }
    } catch (e) {
      print('Error cargando estadísticas: $e');
    } finally {
      if (mounted) {
        setState(() => _model.isLoadingStats = false);
      }
    }
  }

  Future<void> _loadUsers({int page = 1, String search = ''}) async {
    if (!mounted) return;
    setState(() => _model.isLoadingUsers = true);

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;
      final response = await AdminApiCalls.getUsers(
        page: page,
        limit: 20,
        search: search,
        token: token,
      );

      if (response['status'] == true) {
        if (mounted) {
          setState(() {
            _model.users = response['data']['users'] ?? [];
            _model.currentUserPage = response['data']['currentPage'] ?? 1;
            _model.totalUserPages = response['data']['totalPages'] ?? 1;
          });
        }
      }
    } catch (e) {
      print('Error cargando usuarios: $e');
    } finally {
      if (mounted) {
        setState(() => _model.isLoadingUsers = false);
      }
    }
  }

  Future<void> _loadPosts({int page = 1}) async {
    if (!mounted) return;
    setState(() => _model.isLoadingPosts = true);

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;
      final response = await AdminApiCalls.getAllPosts(
        page: page,
        limit: 20,
        token: token,
      );

      if (response['status'] == true) {
        if (mounted) {
          setState(() {
            _model.posts = response['data']['posts'] ?? [];
            _model.currentPostPage = response['data']['currentPage'] ?? 1;
            _model.totalPostPages = response['data']['totalPages'] ?? 1;
          });
        }
      }
    } catch (e) {
      print('Error cargando publicaciones: $e');
    } finally {
      if (mounted) {
        setState(() => _model.isLoadingPosts = false);
      }
    }
  }

  Future<void> _updateUserRole(String userId, String newRole) async {
    try {
      final response = await AdminApiCalls.updateUser(
        userId: userId,
        role: newRole,
      );

      if (!mounted) return;

      if (response['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Rol actualizado correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        await _loadUsers(page: _model.currentUserPage);
      } else {
        throw Exception(response['msg'] ?? 'Error al actualizar');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    }
  }

  Future<void> _deleteUser(String userId, String userName) async {
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 4,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).alternate,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            SizedBox(height: 24),
            Icon(
              Icons.warning_amber_rounded,
              color: FlutterFlowTheme.of(context).error,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Confirmar eliminación',
              style: FlutterFlowTheme.of(context).headlineSmall,
            ),
            SizedBox(height: 8),
            Text(
              '¿Estás seguro de eliminar a "$userName"?\nEsta acción no se puede deshacer.',
              textAlign: TextAlign.center,
              style: FlutterFlowTheme.of(context).bodyMedium,
            ),
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, false),
                    text: 'Cancelar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                fontFamily: 'Readex Pro',
                                color: FlutterFlowTheme.of(context).primaryText,
                              ),
                      elevation: 0,
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, true),
                    text: 'Eliminar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).error,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                fontFamily: 'Readex Pro',
                                color: Colors.white,
                              ),
                      elevation: 0,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
          ],
        ),
      ),
    );

    if (confirm != true) return;

    try {
      final response = await AdminApiCalls.deleteUser(userId: userId);

      if (!mounted) return;

      if (response['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Usuario eliminado correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        await _loadUsers(page: _model.currentUserPage);
      } else {
        throw Exception(response['msg'] ?? 'Error al eliminar');
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    }
  }

  Future<void> _loadNotifications({int page = 1}) async {
    if (!mounted) return;
    setState(() => _model.isLoadingNotifications = true);

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;

      if (token == null) return;

      final response = await NotificationApiCalls.getAllNotifications(
        token: token,
        page: page,
        limit: 20,
      );

      if (response['status'] == true) {
        if (mounted) {
          setState(() {
            _model.notifications = response['data']['notifications'] ?? [];
            _model.currentNotificationPage =
                response['data']['currentPage'] ?? 1;
            _model.totalNotificationPages = response['data']['totalPages'] ?? 1;
          });
        }
      }
    } catch (e) {
      print('Error cargando notificaciones: $e');
    } finally {
      if (mounted) {
        setState(() => _model.isLoadingNotifications = false);
      }
    }
  }

  Future<void> _sendNotification() async {
    final title = _model.notificationTitleController.text.trim();
    final message = _model.notificationMessageController.text.trim();

    if (title.isEmpty || message.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Título y mensaje son requeridos'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
      return;
    }

    setState(() => _model.isSendingNotification = true);

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;

      if (token == null) {
        throw Exception('No hay token de autenticación');
      }

      final response = await NotificationApiCalls.sendNotification(
        token: token,
        title: title,
        message: message,
        type: _model.notificationType,
        priority: _model.notificationPriority,
        recipients: _model.notificationRecipients,
        expiresInDays: _model.notificationExpiresInDays,
      );

      if (!mounted) return;

      if (response['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Notificación enviada correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );

        // Limpiar formulario
        _model.notificationTitleController.clear();
        _model.notificationMessageController.clear();
        setState(() {
          _model.notificationType = 'general';
          _model.notificationPriority = 'medium';
          _model.notificationRecipients = 'all';
          _model.notificationExpiresInDays = null;
        });

        // Recargar lista
        await _loadNotifications(page: 1);
      } else {
        throw Exception(response['msg'] ?? 'Error al enviar');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: ${e.toString()}'),
            backgroundColor: FlutterFlowTheme.of(context).error,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _model.isSendingNotification = false);
      }
    }
  }

  Future<void> _deletePost(String postId) async {
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 4,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).alternate,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            SizedBox(height: 24),
            Icon(
              Icons.delete_forever_rounded,
              color: FlutterFlowTheme.of(context).error,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Confirmar eliminación',
              style: FlutterFlowTheme.of(context).headlineSmall,
            ),
            SizedBox(height: 8),
            Text(
              '¿Estás seguro de eliminar esta publicación?\nEsta acción no se puede deshacer.',
              textAlign: TextAlign.center,
              style: FlutterFlowTheme.of(context).bodyMedium,
            ),
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, false),
                    text: 'Cancelar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                fontFamily: 'Readex Pro',
                                color: FlutterFlowTheme.of(context).primaryText,
                              ),
                      elevation: 0,
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, true),
                    text: 'Eliminar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).error,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                fontFamily: 'Readex Pro',
                                color: Colors.white,
                              ),
                      elevation: 0,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
          ],
        ),
      ),
    );

    if (confirm != true) return;

    try {
      final response = await AdminApiCalls.deletePost(postId: postId);

      if (response['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Publicación eliminada correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        await _loadPosts(page: _model.currentPostPage);
      } else {
        throw Exception(response['msg'] ?? 'Error al eliminar');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    }
  }

  Future<void> _deleteComment(
      String postId, String commentId, String userId) async {
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 4,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).alternate,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            SizedBox(height: 24),
            Icon(
              Icons.delete_sweep_rounded,
              color: FlutterFlowTheme.of(context).error,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Eliminar Comentario',
              style: FlutterFlowTheme.of(context).headlineSmall,
            ),
            SizedBox(height: 8),
            Text(
              '¿Estás seguro de eliminar este comentario?',
              textAlign: TextAlign.center,
              style: FlutterFlowTheme.of(context).bodyMedium,
            ),
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, false),
                    text: 'Cancelar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                fontFamily: 'Readex Pro',
                                color: FlutterFlowTheme.of(context).primaryText,
                              ),
                      elevation: 0,
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, true),
                    text: 'Eliminar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).error,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                fontFamily: 'Readex Pro',
                                color: Colors.white,
                              ),
                      elevation: 0,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
          ],
        ),
      ),
    );

    if (confirm != true) return;

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;

      final response = await AdminApiCalls.deleteComment(
        postId: postId,
        commentId: commentId,
        userId: userId,
        token: token!,
      );

      if (response['status'] == true) {
        Navigator.pop(
            context); // Close details modal to refresh or just refresh
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Comentario eliminado correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        await _loadPosts(page: _model.currentPostPage);
      } else {
        throw Exception(response['msg'] ?? 'Error al eliminar comentario');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    }
  }

  void _showPostDetails(Map<String, dynamic> post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.9,
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          children: [
            Padding(
              padding: EdgeInsets.all(16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Detalles de la Publicación',
                    style: FlutterFlowTheme.of(context).headlineSmall,
                  ),
                  IconButton(
                    icon: Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
            ),
            Divider(height: 1),
            Expanded(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (post['image'] != null)
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          post['image'],
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    SizedBox(height: 24),
                    Text(
                      'Contenido',
                      style: FlutterFlowTheme.of(context).labelMedium,
                    ),
                    SizedBox(height: 8),
                    Text(
                      post['content'] ?? '',
                      style: FlutterFlowTheme.of(context).bodyLarge,
                    ),
                    SizedBox(height: 24),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildDetailStat(
                          Icons.favorite,
                          'Likes',
                          '${post['likes']?.length ?? 0}',
                          Colors.red,
                        ),
                        _buildDetailStat(
                          Icons.comment,
                          'Comentarios',
                          '${post['comments']?.length ?? 0}',
                          Colors.blue,
                        ),
                      ],
                    ),
                    SizedBox(height: 24),
                    Text(
                      'Comentarios',
                      style: FlutterFlowTheme.of(context).headlineSmall,
                    ),
                    SizedBox(height: 16),
                    if (post['comments'] == null || post['comments'].isEmpty)
                      Text(
                        'No hay comentarios',
                        style: FlutterFlowTheme.of(context).bodyMedium,
                      )
                    else
                      ListView.builder(
                        shrinkWrap: true,
                        physics: NeverScrollableScrollPhysics(),
                        itemCount: post['comments'].length,
                        itemBuilder: (context, index) {
                          final comment = post['comments'][index];
                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor:
                                  FlutterFlowTheme.of(context).alternate,
                              child: Text(
                                (comment['username'] ?? 'U')[0].toUpperCase(),
                                style: TextStyle(
                                    color: FlutterFlowTheme.of(context)
                                        .primaryText),
                              ),
                            ),
                            title: Text(
                              comment['username'] ?? 'Usuario',
                              style: FlutterFlowTheme.of(context).titleSmall,
                            ),
                            subtitle: Text(
                              comment['content'] ?? '',
                              style: FlutterFlowTheme.of(context).bodySmall,
                            ),
                            trailing: IconButton(
                              icon: Icon(Icons.delete_outline,
                                  color: FlutterFlowTheme.of(context).error),
                              onPressed: () => _deleteComment(
                                post['_id'],
                                comment['_id'] ??
                                    '', // Assuming comment has _id
                                post['user']['_id'], // Post author ID
                              ),
                            ),
                          );
                        },
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailStat(
      IconData icon, String label, String value, Color color) {
    return Column(
      children: [
        Container(
          padding: EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color, size: 24),
        ),
        SizedBox(height: 8),
        Text(
          value,
          style: FlutterFlowTheme.of(context).headlineSmall,
        ),
        Text(
          label,
          style: FlutterFlowTheme.of(context).labelMedium,
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => _model.unfocusNode.canRequestFocus
          ? FocusScope.of(context).requestFocus(_model.unfocusNode)
          : FocusScope.of(context).unfocus(),
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
        body: Column(
          children: [
            Container(
              width: double.infinity,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    FlutterFlowTheme.of(context).primary,
                    FlutterFlowTheme.of(context).secondary,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.only(
                  bottomLeft: Radius.circular(30),
                  bottomRight: Radius.circular(30),
                ),
              ),
              child: SafeArea(
                bottom: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding:
                          EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      child: Row(
                        children: [
                          IconButton(
                            icon: Icon(Icons.arrow_back, color: Colors.white),
                            onPressed: () => context.pop(),
                          ),
                          SizedBox(width: 8),
                          Text(
                            'Panel de Administración',
                            style: FlutterFlowTheme.of(context)
                                .headlineMedium
                                .override(
                                  fontFamily: 'Outfit',
                                  color: Colors.white,
                                  fontSize: 24.0,
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Padding(
                      padding: EdgeInsets.fromLTRB(24, 0, 24, 24),
                      child: Text(
                        'Gestiona usuarios, contenido y recompensas desde un solo lugar.',
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                              fontFamily: 'Readex Pro',
                              color: Colors.white.withOpacity(0.9),
                            ),
                      ),
                    ),
                    Container(
                      margin: EdgeInsets.symmetric(horizontal: 16),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        isScrollable: true,
                        labelColor: Colors.white,
                        unselectedLabelColor: Colors.white70,
                        indicatorColor: Colors.white,
                        indicatorWeight: 3,
                        labelStyle:
                            FlutterFlowTheme.of(context).titleSmall.override(
                                  fontFamily: 'Readex Pro',
                                  fontWeight: FontWeight.bold,
                                ),
                        tabs: [
                          Tab(text: 'Dashboard'),
                          Tab(text: 'Usuarios'),
                          Tab(text: 'Publicaciones'),
                          Tab(text: 'Notificaciones'),
                          Tab(text: 'Retos'),
                          Tab(text: 'Recompensas'),
                        ],
                      ),
                    ),
                    SizedBox(height: 16),
                  ],
                ),
              ),
            ),
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _buildDashboardTab(),
                  _buildUsersTab(),
                  _buildPostsTab(),
                  _buildNotificationsTab(),
                  _buildChallengesTab(),
                  _buildRewardsTab(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDashboardTab() {
    if (_model.isLoadingStats) {
      return Center(child: CircularProgressIndicator());
    }

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: SingleChildScrollView(
        physics: AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Estadísticas Generales',
              style: FlutterFlowTheme.of(context).headlineSmall,
            ),
            SizedBox(height: 20),
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: NeverScrollableScrollPhysics(),
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 1.5,
              children: [
                _buildStatCard(
                  'Total Usuarios',
                  '${_model.stats['totalUsers'] ?? 0}',
                  Icons.people,
                  Colors.blue,
                ),
                _buildStatCard(
                  'Administradores',
                  '${_model.stats['totalAdmins'] ?? 0}',
                  Icons.admin_panel_settings,
                  Colors.orange,
                ),
                _buildStatCard(
                  'Total Posts',
                  '${_model.stats['totalPosts'] ?? 0}',
                  Icons.article,
                  Colors.green,
                ),
                _buildStatCard(
                  'Usuarios Recientes',
                  '${_model.stats['recentUsers'] ?? 0}',
                  Icons.person_add,
                  Colors.purple,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(
      String title, String value, IconData icon, Color color) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: FlutterFlowTheme.of(context).secondaryBackground,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            blurRadius: 4,
            color: Color(0x33000000),
            offset: Offset(0, 2),
          )
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, color: color, size: 32),
          SizedBox(height: 8),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(
              value,
              style: FlutterFlowTheme.of(context).displaySmall.override(
                    fontFamily: 'Outfit',
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                  ),
            ),
          ),
          SizedBox(height: 4),
          Text(
            title,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: FlutterFlowTheme.of(context).bodySmall.override(
                  fontFamily: 'Readex Pro',
                  color: FlutterFlowTheme.of(context).secondaryText,
                ),
          ),
        ],
      ),
    );
  }

  Widget _buildUsersTab() {
    return Column(
      children: [
        // Buscador
        Padding(
          padding: EdgeInsets.all(16),
          child: TextField(
            decoration: InputDecoration(
              hintText: 'Buscar usuarios...',
              hintStyle: FlutterFlowTheme.of(context).labelSmall,
              prefixIcon: Icon(
                Icons.search,
                color: FlutterFlowTheme.of(context).secondaryText,
              ),
              enabledBorder: OutlineInputBorder(
                borderSide: BorderSide(
                  color: FlutterFlowTheme.of(context).alternate,
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              focusedBorder: OutlineInputBorder(
                borderSide: BorderSide(
                  color: FlutterFlowTheme.of(context).primary,
                  width: 2,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: FlutterFlowTheme.of(context).secondaryBackground,
            ),
            onChanged: (value) {
              // Debounce search
              Future.delayed(Duration(milliseconds: 500), () {
                if (value == _model.userSearchQuery) return;
                _loadUsers(page: 1, search: value);
              });
            },
          ),
        ),

        // Lista de usuarios
        Expanded(
          child: _model.isLoadingUsers
              ? Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: () => _loadUsers(page: _model.currentUserPage),
                  child: ListView.builder(
                    itemCount: _model.users.length,
                    itemBuilder: (context, index) {
                      final user = _model.users[index];
                      return _buildUserCard(user);
                    },
                  ),
                ),
        ),

        // Paginación
        if (_model.totalUserPages > 1)
          Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: Icon(Icons.chevron_left),
                  onPressed: _model.currentUserPage > 1
                      ? () => _loadUsers(page: _model.currentUserPage - 1)
                      : null,
                ),
                Text(
                  'Página ${_model.currentUserPage} de ${_model.totalUserPages}',
                  style: FlutterFlowTheme.of(context).bodyMedium,
                ),
                IconButton(
                  icon: Icon(Icons.chevron_right),
                  onPressed: _model.currentUserPage < _model.totalUserPages
                      ? () => _loadUsers(page: _model.currentUserPage + 1)
                      : null,
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildUserCard(Map<String, dynamic> user) {
    final role = user['role'] ?? 'user';
    final roleColor = role == 'superadmin'
        ? FlutterFlowTheme.of(context).error
        : role == 'admin'
            ? FlutterFlowTheme.of(context).warning
            : FlutterFlowTheme.of(context).info;

    return Card(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      color: FlutterFlowTheme.of(context).secondaryBackground,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: FlutterFlowTheme.of(context).primary,
                      width: 2,
                    ),
                  ),
                  child: CircleAvatar(
                    radius: 28,
                    backgroundColor: FlutterFlowTheme.of(context).alternate,
                    backgroundImage: user['profilePicture'] != null
                        ? NetworkImage(user['profilePicture'])
                        : null,
                    child: user['profilePicture'] == null
                        ? Icon(
                            Icons.person,
                            size: 30,
                            color: FlutterFlowTheme.of(context).primaryText,
                          )
                        : null,
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user['name'] ?? 'Sin nombre',
                        style: FlutterFlowTheme.of(context).bodyLarge.override(
                              fontFamily: 'Readex Pro',
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        '@${user['username'] ?? 'username'}',
                        style: FlutterFlowTheme.of(context).bodySmall,
                      ),
                      Text(
                        user['email'] ?? '',
                        style: FlutterFlowTheme.of(context).bodySmall.override(
                              fontFamily: 'Readex Pro',
                              color: FlutterFlowTheme.of(context).secondaryText,
                            ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: roleColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: roleColor.withOpacity(0.5)),
                  ),
                  child: Text(
                    role.toUpperCase(),
                    style: TextStyle(
                      color: roleColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            Divider(height: 24),
            Row(
              children: [
                Icon(
                  Icons.school,
                  size: 18,
                  color: FlutterFlowTheme.of(context).secondaryText,
                ),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    user['university'] ?? 'Sin universidad',
                    style: FlutterFlowTheme.of(context).bodyMedium,
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).accent1,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    '${user['points'] ?? 0} pts',
                    style: FlutterFlowTheme.of(context).bodyMedium.override(
                          fontFamily: 'Readex Pro',
                          color: FlutterFlowTheme.of(context).primary,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                FFButtonWidget(
                  onPressed: () => _showEditUserDialog(user),
                  text: 'Editar',
                  icon: Icon(Icons.edit, size: 16),
                  options: FFButtonOptions(
                    height: 36,
                    padding: EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
                    iconPadding: EdgeInsetsDirectional.fromSTEB(0, 0, 4, 0),
                    color: FlutterFlowTheme.of(context).primary,
                    textStyle: FlutterFlowTheme.of(context).labelSmall.override(
                          fontFamily: 'Readex Pro',
                          color: Colors.white,
                        ),
                    elevation: 0,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                SizedBox(width: 8),
                FFButtonWidget(
                  onPressed: () => _deleteUser(user['_id'], user['name']),
                  text: 'Eliminar',
                  icon: Icon(Icons.delete, size: 16),
                  options: FFButtonOptions(
                    height: 36,
                    padding: EdgeInsetsDirectional.fromSTEB(16, 0, 16, 0),
                    iconPadding: EdgeInsetsDirectional.fromSTEB(0, 0, 4, 0),
                    color: FlutterFlowTheme.of(context).error,
                    textStyle: FlutterFlowTheme.of(context).labelSmall.override(
                          fontFamily: 'Readex Pro',
                          color: Colors.white,
                        ),
                    elevation: 0,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPostsTab() {
    return Column(
      children: [
        Expanded(
          child: _model.isLoadingPosts
              ? Center(child: CircularProgressIndicator())
              : RefreshIndicator(
                  onRefresh: () => _loadPosts(page: _model.currentPostPage),
                  child: ListView.builder(
                    padding: EdgeInsets.all(16),
                    itemCount: _model.posts.length,
                    itemBuilder: (context, index) {
                      final post = _model.posts[index];
                      return _buildPostCard(post);
                    },
                  ),
                ),
        ),

        // Paginación
        if (_model.totalPostPages > 1)
          Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                IconButton(
                  icon: Icon(Icons.chevron_left),
                  onPressed: _model.currentPostPage > 1
                      ? () => _loadPosts(page: _model.currentPostPage - 1)
                      : null,
                ),
                Text(
                  'Página ${_model.currentPostPage} de ${_model.totalPostPages}',
                  style: FlutterFlowTheme.of(context).bodyMedium,
                ),
                IconButton(
                  icon: Icon(Icons.chevron_right),
                  onPressed: _model.currentPostPage < _model.totalPostPages
                      ? () => _loadPosts(page: _model.currentPostPage + 1)
                      : null,
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildPostCard(Map<String, dynamic> post) {
    final user = post['user'] ?? {};
    return Card(
      margin: EdgeInsets.only(bottom: 16),
      color: FlutterFlowTheme.of(context).secondaryBackground,
      child: Padding(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 20,
                  backgroundColor: FlutterFlowTheme.of(context).alternate,
                  backgroundImage: user['profilePicture'] != null
                      ? NetworkImage(user['profilePicture'])
                      : null,
                  child: user['profilePicture'] == null
                      ? Icon(
                          Icons.person,
                          color: FlutterFlowTheme.of(context).primaryText,
                        )
                      : null,
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        user['name'] ?? 'Usuario',
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                              fontFamily: 'Readex Pro',
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      Text(
                        '@${user['username'] ?? 'username'}',
                        style: FlutterFlowTheme.of(context).bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12),
            if (post['content'] != null)
              Text(
                post['content'],
                style: FlutterFlowTheme.of(context).bodyMedium,
              ),
            if (post['image'] != null) ...[
              SizedBox(height: 12),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  post['image'],
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
              ),
            ],
            SizedBox(height: 12),
            Row(
              children: [
                Icon(
                  Icons.favorite,
                  size: 16,
                  color: FlutterFlowTheme.of(context).secondaryText,
                ),
                SizedBox(width: 4),
                Text(
                  '${post['likes']?.length ?? 0}',
                  style: FlutterFlowTheme.of(context).bodySmall,
                ),
                SizedBox(width: 16),
                Icon(
                  Icons.comment,
                  size: 16,
                  color: FlutterFlowTheme.of(context).secondaryText,
                ),
                SizedBox(width: 4),
                Text(
                  '${post['comments']?.length ?? 0}',
                  style: FlutterFlowTheme.of(context).bodySmall,
                ),
                Spacer(),
                FFButtonWidget(
                  onPressed: () => _showPostDetails(post),
                  text: 'Ver',
                  icon: Icon(Icons.visibility, size: 16),
                  options: FFButtonOptions(
                    height: 32,
                    padding: EdgeInsetsDirectional.fromSTEB(12, 0, 12, 0),
                    iconPadding: EdgeInsetsDirectional.fromSTEB(0, 0, 4, 0),
                    color: FlutterFlowTheme.of(context).secondary,
                    textStyle: FlutterFlowTheme.of(context).labelSmall.override(
                          fontFamily: 'Readex Pro',
                          color: Colors.white,
                        ),
                    elevation: 2,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                SizedBox(width: 8),
                FFButtonWidget(
                  onPressed: () => _deletePost(post['_id']),
                  text: 'Eliminar',
                  icon: Icon(Icons.delete, size: 16),
                  options: FFButtonOptions(
                    height: 32,
                    padding: EdgeInsetsDirectional.fromSTEB(12, 0, 12, 0),
                    iconPadding: EdgeInsetsDirectional.fromSTEB(0, 0, 4, 0),
                    color: FlutterFlowTheme.of(context).error,
                    textStyle: FlutterFlowTheme.of(context).labelSmall.override(
                          fontFamily: 'Readex Pro',
                          color: Colors.white,
                        ),
                    elevation: 2,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _updateUser(
    String userId, {
    String? name,
    String? role,
    int? points,
    int? bottles,
  }) async {
    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;

      final response = await AdminApiCalls.updateUser(
        userId: userId,
        token: token,
        name: name,
        role: role,
        points: points,
        bottles: bottles,
      );

      if (response['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Usuario actualizado correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        _loadUsers(page: _model.currentUserPage);
      } else {
        throw Exception(response['msg'] ?? 'Error al actualizar');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    }
  }

  void _showEditUserDialog(Map<String, dynamic> user) {
    final nameController = TextEditingController(text: user['name']);
    final pointsController =
        TextEditingController(text: (user['points'] ?? 0).toString());
    final bottlesController =
        TextEditingController(text: (user['totalScans'] ?? 0).toString());
    String role = user['role'] ?? 'user';

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => Container(
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).secondaryBackground,
            borderRadius: BorderRadius.only(
              topLeft: Radius.circular(20),
              topRight: Radius.circular(20),
            ),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Padding(
            padding: EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Editar Usuario',
                      style: FlutterFlowTheme.of(context).headlineSmall,
                    ),
                    IconButton(
                      icon: Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                SizedBox(height: 24),
                TextFormField(
                  controller: nameController,
                  decoration: InputDecoration(
                    labelText: 'Nombre',
                    labelStyle: FlutterFlowTheme.of(context).labelMedium,
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).primary,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: FlutterFlowTheme.of(context).primaryBackground,
                  ),
                ),
                SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: role,
                  decoration: InputDecoration(
                    labelText: 'Rol',
                    labelStyle: FlutterFlowTheme.of(context).labelMedium,
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).primary,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: FlutterFlowTheme.of(context).primaryBackground,
                  ),
                  items: ['user', 'admin', 'superadmin'].map((r) {
                    return DropdownMenuItem(
                        value: r, child: Text(r.toUpperCase()));
                  }).toList(),
                  onChanged: (val) => setState(() => role = val!),
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: pointsController,
                  decoration: InputDecoration(
                    labelText: 'Puntos',
                    labelStyle: FlutterFlowTheme.of(context).labelMedium,
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).primary,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: FlutterFlowTheme.of(context).primaryBackground,
                  ),
                  keyboardType: TextInputType.number,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: bottlesController,
                  decoration: InputDecoration(
                    labelText: 'Botellas Recicladas',
                    labelStyle: FlutterFlowTheme.of(context).labelMedium,
                    enabledBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).primary,
                        width: 2,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: FlutterFlowTheme.of(context).primaryBackground,
                  ),
                  keyboardType: TextInputType.number,
                ),
                SizedBox(height: 24),
                FFButtonWidget(
                  onPressed: () {
                    Navigator.pop(context);
                    _updateUser(
                      user['_id'],
                      name: nameController.text,
                      role: role,
                      points: int.tryParse(pointsController.text),
                      bottles: int.tryParse(bottlesController.text),
                    );
                  },
                  text: 'Guardar Cambios',
                  options: FFButtonOptions(
                    width: double.infinity,
                    height: 50,
                    color: FlutterFlowTheme.of(context).primary,
                    textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                          fontFamily: 'Readex Pro',
                          color: Colors.white,
                        ),
                    elevation: 2,
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                SizedBox(height: 16),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNotificationsTab() {
    return SingleChildScrollView(
      padding: EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Formulario para enviar notificación
          Container(
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).secondaryBackground,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            child: Padding(
              padding: EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.campaign,
                        color: FlutterFlowTheme.of(context).primary,
                        size: 28,
                      ),
                      SizedBox(width: 12),
                      Text(
                        'Enviar Notificación',
                        style: FlutterFlowTheme.of(context)
                            .headlineSmall
                            .override(
                              fontFamily: 'Outfit',
                              color: FlutterFlowTheme.of(context).primaryText,
                            ),
                      ),
                    ],
                  ),
                  SizedBox(height: 20),
                  TextField(
                    controller: _model.notificationTitleController,
                    style: FlutterFlowTheme.of(context).bodyMedium,
                    decoration: InputDecoration(
                      labelText: 'Título',
                      labelStyle: FlutterFlowTheme.of(context).labelMedium,
                      hintText: 'Título de la notificación',
                      hintStyle: FlutterFlowTheme.of(context).labelSmall,
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).alternate,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                      contentPadding:
                          EdgeInsetsDirectional.fromSTEB(20, 24, 0, 24),
                      counterText:
                          '${_model.notificationTitleController.text.length}/100',
                      counterStyle: FlutterFlowTheme.of(context).bodySmall,
                    ),
                    maxLength: 100,
                    onChanged: (_) => setState(() {}),
                  ),
                  SizedBox(height: 16),
                  TextField(
                    controller: _model.notificationMessageController,
                    style: FlutterFlowTheme.of(context).bodyMedium,
                    decoration: InputDecoration(
                      labelText: 'Mensaje',
                      labelStyle: FlutterFlowTheme.of(context).labelMedium,
                      hintText: 'Contenido de la notificación',
                      hintStyle: FlutterFlowTheme.of(context).labelSmall,
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).alternate,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                      contentPadding:
                          EdgeInsetsDirectional.fromSTEB(20, 24, 20, 24),
                      counterText:
                          '${_model.notificationMessageController.text.length}/500',
                      counterStyle: FlutterFlowTheme.of(context).bodySmall,
                    ),
                    maxLength: 500,
                    maxLines: 4,
                    onChanged: (_) => setState(() {}),
                  ),
                  SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _model.notificationType,
                          style: FlutterFlowTheme.of(context).bodyMedium,
                          decoration: InputDecoration(
                            labelText: 'Tipo',
                            labelStyle:
                                FlutterFlowTheme.of(context).labelMedium,
                            enabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color: FlutterFlowTheme.of(context).alternate,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color: FlutterFlowTheme.of(context).primary,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: FlutterFlowTheme.of(context)
                                .secondaryBackground,
                            contentPadding:
                                EdgeInsetsDirectional.fromSTEB(20, 24, 20, 24),
                          ),
                          items: [
                            DropdownMenuItem(
                                value: 'general', child: Text('General')),
                            DropdownMenuItem(
                                value: 'announcement', child: Text('Anuncio')),
                            DropdownMenuItem(
                                value: 'alert', child: Text('Alerta')),
                            DropdownMenuItem(
                                value: 'update', child: Text('Actualización')),
                          ],
                          onChanged: (value) {
                            setState(() =>
                                _model.notificationType = value ?? 'general');
                          },
                        ),
                      ),
                      SizedBox(width: 16),
                      Expanded(
                        child: DropdownButtonFormField<String>(
                          value: _model.notificationPriority,
                          style: FlutterFlowTheme.of(context).bodyMedium,
                          decoration: InputDecoration(
                            labelText: 'Prioridad',
                            labelStyle:
                                FlutterFlowTheme.of(context).labelMedium,
                            enabledBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color: FlutterFlowTheme.of(context).alternate,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderSide: BorderSide(
                                color: FlutterFlowTheme.of(context).primary,
                                width: 2,
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: FlutterFlowTheme.of(context)
                                .secondaryBackground,
                            contentPadding:
                                EdgeInsetsDirectional.fromSTEB(20, 24, 20, 24),
                          ),
                          items: [
                            DropdownMenuItem(value: 'low', child: Text('Baja')),
                            DropdownMenuItem(
                                value: 'medium', child: Text('Media')),
                            DropdownMenuItem(
                                value: 'high', child: Text('Alta')),
                          ],
                          onChanged: (value) {
                            setState(() => _model.notificationPriority =
                                value ?? 'medium');
                          },
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: _model.notificationRecipients,
                    style: FlutterFlowTheme.of(context).bodyMedium,
                    decoration: InputDecoration(
                      labelText: 'Destinatarios',
                      labelStyle: FlutterFlowTheme.of(context).labelMedium,
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).alternate,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                      contentPadding:
                          EdgeInsetsDirectional.fromSTEB(20, 24, 20, 24),
                    ),
                    items: [
                      DropdownMenuItem(
                          value: 'all', child: Text('Todos los usuarios')),
                      DropdownMenuItem(
                          value: 'verified',
                          child: Text('Solo usuarios verificados')),
                    ],
                    onChanged: (value) {
                      setState(
                          () => _model.notificationRecipients = value ?? 'all');
                    },
                  ),
                  SizedBox(height: 16),
                  TextField(
                    style: FlutterFlowTheme.of(context).bodyMedium,
                    decoration: InputDecoration(
                      labelText: 'Expira en (días)',
                      labelStyle: FlutterFlowTheme.of(context).labelMedium,
                      hintText: 'Opcional - Ej: 7',
                      hintStyle: FlutterFlowTheme.of(context).labelSmall,
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).alternate,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).primary,
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                      contentPadding:
                          EdgeInsetsDirectional.fromSTEB(20, 24, 20, 24),
                      helperText: 'Dejar vacío para notificación permanente',
                      helperStyle: FlutterFlowTheme.of(context).bodySmall,
                    ),
                    keyboardType: TextInputType.number,
                    onChanged: (value) {
                      setState(() {
                        _model.notificationExpiresInDays = int.tryParse(value);
                      });
                    },
                  ),
                  SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: FFButtonWidget(
                      onPressed: _model.isSendingNotification
                          ? null
                          : _sendNotification,
                      text: _model.isSendingNotification
                          ? 'Enviando...'
                          : 'Enviar Notificación',
                      options: FFButtonOptions(
                        height: 50,
                        color: FlutterFlowTheme.of(context).primary,
                        textStyle:
                            FlutterFlowTheme.of(context).titleSmall.override(
                                  fontFamily: 'Readex Pro',
                                  color: Colors.white,
                                ),
                        elevation: 3,
                        borderSide: BorderSide.none,
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          SizedBox(height: 24),
          // Lista de notificaciones enviadas
          Container(
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).secondaryBackground,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 8,
                  offset: Offset(0, 2),
                ),
              ],
            ),
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(
                          Icons.history,
                          color: FlutterFlowTheme.of(context).primary,
                          size: 24,
                        ),
                        SizedBox(width: 12),
                        Text(
                          'Notificaciones Enviadas',
                          style: FlutterFlowTheme.of(context)
                              .headlineSmall
                              .override(
                                fontFamily: 'Outfit',
                                color: FlutterFlowTheme.of(context).primaryText,
                              ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: Icon(
                        Icons.refresh,
                        color: FlutterFlowTheme.of(context).primary,
                      ),
                      onPressed: () => _loadNotifications(page: 1),
                    ),
                  ],
                ),
                SizedBox(height: 16),
                if (_model.isLoadingNotifications)
                  Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: CircularProgressIndicator(
                        valueColor: AlwaysStoppedAnimation<Color>(
                          FlutterFlowTheme.of(context).primary,
                        ),
                      ),
                    ),
                  )
                else if (_model.notifications.isEmpty)
                  Center(
                    child: Padding(
                      padding: EdgeInsets.all(32),
                      child: Text(
                        'No hay notificaciones enviadas',
                        style: FlutterFlowTheme.of(context).bodyLarge,
                      ),
                    ),
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: NeverScrollableScrollPhysics(),
                    itemCount: _model.notifications.length,
                    itemBuilder: (context, index) {
                      final notification = _model.notifications[index];
                      final createdAt =
                          DateTime.tryParse(notification['createdAt'] ?? '');
                      final formattedDate = createdAt != null
                          ? '${createdAt.day}/${createdAt.month}/${createdAt.year} ${createdAt.hour}:${createdAt.minute.toString().padLeft(2, '0')}'
                          : 'Fecha desconocida';

                      return Container(
                        margin: EdgeInsets.only(bottom: 12),
                        decoration: BoxDecoration(
                          color: FlutterFlowTheme.of(context).primaryBackground,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: FlutterFlowTheme.of(context).alternate,
                            width: 1,
                          ),
                        ),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor: _getPriorityColor(
                                notification['priority'] ?? 'medium'),
                            child: Icon(
                              _getTypeIcon(notification['type'] ?? 'general'),
                              color: Colors.white,
                            ),
                          ),
                          title: Text(
                            notification['title'] ?? 'Sin título',
                            style: FlutterFlowTheme.of(context)
                                .titleMedium
                                .override(
                                  fontFamily: 'Readex Pro',
                                  color:
                                      FlutterFlowTheme.of(context).primaryText,
                                ),
                          ),
                          subtitle: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              SizedBox(height: 4),
                              Text(
                                notification['message'] ?? '',
                                style: FlutterFlowTheme.of(context)
                                    .bodySmall
                                    .override(
                                      fontFamily: 'Readex Pro',
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                    ),
                              ),
                              SizedBox(height: 6),
                              Row(
                                children: [
                                  Icon(
                                    Icons.calendar_today,
                                    size: 12,
                                    color: FlutterFlowTheme.of(context)
                                        .secondaryText,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    formattedDate,
                                    style: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .override(
                                          fontFamily: 'Readex Pro',
                                          fontSize: 11,
                                          color: FlutterFlowTheme.of(context)
                                              .secondaryText,
                                        ),
                                  ),
                                  SizedBox(width: 12),
                                  Icon(
                                    Icons.remove_red_eye,
                                    size: 12,
                                    color: FlutterFlowTheme.of(context)
                                        .secondaryText,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    '${notification['readCount'] ?? 0} leídos',
                                    style: FlutterFlowTheme.of(context)
                                        .bodySmall
                                        .override(
                                          fontFamily: 'Readex Pro',
                                          fontSize: 11,
                                          color: FlutterFlowTheme.of(context)
                                              .secondaryText,
                                        ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                          isThreeLine: true,
                        ),
                      );
                    },
                  ),
                // Paginación
                if (_model.totalNotificationPages > 1)
                  Padding(
                    padding: EdgeInsets.only(top: 16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        IconButton(
                          icon: Icon(Icons.chevron_left),
                          onPressed: _model.currentNotificationPage > 1
                              ? () => _loadNotifications(
                                  page: _model.currentNotificationPage - 1)
                              : null,
                        ),
                        Text(
                          'Página ${_model.currentNotificationPage} de ${_model.totalNotificationPages}',
                          style: FlutterFlowTheme.of(context).bodyMedium,
                        ),
                        IconButton(
                          icon: Icon(Icons.chevron_right),
                          onPressed: _model.currentNotificationPage <
                                  _model.totalNotificationPages
                              ? () => _loadNotifications(
                                  page: _model.currentNotificationPage + 1)
                              : null,
                        ),
                      ],
                    ),
                  ),
              ],
            ),
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
        return Icons.warning;
      case 'update':
        return Icons.system_update;
      default:
        return Icons.notifications;
    }
  }

  Widget _buildChallengesTab() {
    if (_model.isLoadingChallenges) {
      return Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.all(16.0),
          child: FFButtonWidget(
            onPressed: () => _showCreateChallengeDialog(),
            text: 'Crear Nuevo Reto',
            icon: Icon(Icons.add, size: 15),
            options: FFButtonOptions(
              width: double.infinity,
              height: 50,
              color: FlutterFlowTheme.of(context).primary,
              textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                    fontFamily: 'Outfit',
                    color: Colors.white,
                  ),
              elevation: 2,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadChallenges,
            child: ListView.builder(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
              itemCount: _model.challenges.length,
              itemBuilder: (context, index) {
                final challenge = _model.challenges[index];
                return Container(
                  margin: EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).secondaryBackground,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        blurRadius: 8,
                        color: Color(0x1A000000),
                        offset: Offset(0, 4),
                      )
                    ],
                  ),
                  child: Column(
                    children: [
                      Container(
                        padding: EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: FlutterFlowTheme.of(context)
                              .primary
                              .withOpacity(0.05),
                          borderRadius: BorderRadius.vertical(
                              top: Radius.circular(16)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  colors: [
                                    FlutterFlowTheme.of(context).primary,
                                    FlutterFlowTheme.of(context).secondary,
                                  ],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                challenge['icon'] == 'recycling'
                                    ? Icons.recycling
                                    : Icons.qr_code,
                                color: Colors.white,
                                size: 24,
                              ),
                            ),
                            SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    challenge['title'] ?? 'Sin título',
                                    style: FlutterFlowTheme.of(context)
                                        .titleMedium
                                        .override(
                                          fontFamily: 'Readex Pro',
                                          fontWeight: FontWeight.bold,
                                        ),
                                  ),
                                  Text(
                                    challenge['type'] == 'daily'
                                        ? 'Diario'
                                        : 'Semanal',
                                    style: FlutterFlowTheme.of(context)
                                        .labelSmall
                                        .override(
                                          fontFamily: 'Readex Pro',
                                          color: FlutterFlowTheme.of(context)
                                              .primary,
                                        ),
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: EdgeInsets.symmetric(
                                  horizontal: 12, vertical: 6),
                              decoration: BoxDecoration(
                                color: FlutterFlowTheme.of(context).accent1,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.star,
                                    size: 16,
                                    color: FlutterFlowTheme.of(context).primary,
                                  ),
                                  SizedBox(width: 4),
                                  Text(
                                    '${challenge['rewardPoints'] ?? 0}',
                                    style: TextStyle(
                                      color:
                                          FlutterFlowTheme.of(context).primary,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              challenge['description'] ?? '',
                              style: FlutterFlowTheme.of(context).bodyMedium,
                              maxLines: 3,
                              overflow: TextOverflow.ellipsis,
                            ),
                            SizedBox(height: 16),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Row(
                                  children: [
                                    Icon(
                                      Icons.track_changes,
                                      size: 16,
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                    ),
                                    SizedBox(width: 4),
                                    Text(
                                      'Meta: ${challenge['targetValue'] ?? 0}',
                                      style: FlutterFlowTheme.of(context)
                                          .bodySmall,
                                    ),
                                  ],
                                ),
                                Row(
                                  children: [
                                    IconButton(
                                      icon: Icon(Icons.edit,
                                          color: FlutterFlowTheme.of(context)
                                              .primary),
                                      onPressed: () =>
                                          _showCreateChallengeDialog(
                                              existingChallenge: challenge),
                                    ),
                                    IconButton(
                                      icon: Icon(Icons.delete_outline,
                                          color: FlutterFlowTheme.of(context)
                                              .error),
                                      onPressed: () =>
                                          _deleteChallenge(challenge['_id']),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildRewardsTab() {
    if (_model.isLoadingRewards) {
      return Center(child: CircularProgressIndicator());
    }

    return Column(
      children: [
        Padding(
          padding: EdgeInsets.all(16.0),
          child: FFButtonWidget(
            onPressed: () => _showCreateRewardDialog(),
            text: 'Crear Nueva Recompensa',
            icon: Icon(Icons.add, size: 15),
            options: FFButtonOptions(
              width: double.infinity,
              height: 50,
              color: FlutterFlowTheme.of(context).primary,
              textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                    fontFamily: 'Outfit',
                    color: Colors.white,
                  ),
              elevation: 2,
              borderRadius: BorderRadius.circular(8),
            ),
          ),
        ),
        Expanded(
          child: RefreshIndicator(
            onRefresh: _loadRewards,
            child: GridView.builder(
              padding: EdgeInsets.fromLTRB(16, 0, 16, 16),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.7,
              ),
              itemCount: _model.rewards.length,
              itemBuilder: (context, index) {
                final reward = _model.rewards[index];
                return Container(
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).secondaryBackground,
                    borderRadius: BorderRadius.circular(16),
                    boxShadow: [
                      BoxShadow(
                        blurRadius: 8,
                        color: Color(0x1A000000),
                        offset: Offset(0, 4),
                      )
                    ],
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Stack(
                          children: [
                            Image.network(
                              reward['imageUrl'] ??
                                  'https://via.placeholder.com/150',
                              width: double.infinity,
                              height: double.infinity,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => Container(
                                color: Colors.grey[300],
                                child: Icon(Icons.image, color: Colors.grey),
                              ),
                            ),
                            Positioned(
                              top: 8,
                              right: 8,
                              child: Row(
                                children: [
                                  InkWell(
                                    onTap: () => _showCreateRewardDialog(
                                        existingReward: reward),
                                    child: Container(
                                      padding: EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.9),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        Icons.edit,
                                                                               size: 18,
                                        color: FlutterFlowTheme.of(context)
                                            .primary,
                                      ),
                                    ),
                                  ),
                                  SizedBox(width: 8),
                                  InkWell(
                                    onTap: () => _deleteReward(reward['_id']),
                                    child: Container(
                                      padding: EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.9),
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        Icons.delete_outline,
                                        size: 18,
                                        color:
                                            FlutterFlowTheme.of(context).error,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            Positioned(
                              bottom: 8,
                              left: 8,
                              child: Container(
                                padding: EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context).accent1,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${reward['points'] ?? 0} pts',
                                  style: TextStyle(
                                    color: FlutterFlowTheme.of(context).primary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      Padding(
                        padding: EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              reward['name'] ?? 'Sin nombre',
                              style: FlutterFlowTheme.of(context)
                                  .titleSmall
                                  .override(
                                    fontFamily: 'Readex Pro',
                                    fontWeight: FontWeight.bold,
                                  ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            SizedBox(height: 4),
                            Text(
                              reward['category'] ?? 'General',
                              style: FlutterFlowTheme.of(context).labelSmall,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ),
      ],
    );
  }

  Future<void> _showCreateChallengeDialog(
      {Map<String, dynamic>? existingChallenge}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreateChallengePage(
          existingChallenge: existingChallenge,
        ),
      ),
    );

    if (result == true) {
      _loadChallenges();
    }
  }

  Future<void> _showCreateRewardDialog(
      {Map<String, dynamic>? existingReward}) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CreateRewardPage(
          existingReward: existingReward,
        ),
      ),
    );

    if (result == true) {
      _loadRewards();
    }
  }

  Future<void> _deleteChallenge(String challengeId) async {
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 4,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).alternate,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            SizedBox(height: 24),
            Icon(
              Icons.delete_forever_rounded,
              color: FlutterFlowTheme.of(context).error,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Eliminar Reto',
              style: FlutterFlowTheme.of(context).headlineSmall,
            ),
            SizedBox(height: 8),
            Text(
              '¿Estás seguro de eliminar este reto?',
              textAlign: TextAlign.center,
              style: FlutterFlowTheme.of(context).bodyMedium,
            ),
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, false),
                    text: 'Cancelar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                            fontFamily: 'Readex Pro',
                            color: FlutterFlowTheme.of(context).primaryText,
                          ),
                      elevation: 0,
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, true),
                    text: 'Eliminar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).error,
                      textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                            fontFamily: 'Readex Pro',
                            color: Colors.white,
                          ),
                      elevation: 0,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
          ],
        ),
      ),
    );

    if (confirm != true) return;

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;
      final response = await AdminApiCalls.deleteChallenge(
        challengeId: challengeId,
        token: token!,
      );

      if (response['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Reto eliminado correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        await _loadChallenges();
      } else {
        throw Exception(response['msg'] ?? 'Error al eliminar reto');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    }
  }

  Future<void> _deleteReward(String rewardId) async {
    final confirm = await showModalBottomSheet<bool>(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        padding: EdgeInsets.all(24),
        decoration: BoxDecoration(
          color: FlutterFlowTheme.of(context).secondaryBackground,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(20),
            topRight: Radius.circular(20),
          ),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 50,
              height: 4,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).alternate,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            SizedBox(height: 24),
            Icon(
              Icons.delete_forever_rounded,
              color: FlutterFlowTheme.of(context).error,
              size: 48,
            ),
            SizedBox(height: 16),
            Text(
              'Eliminar Recompensa',
              style: FlutterFlowTheme.of(context).headlineSmall,
            ),
            SizedBox(height: 8),
            Text(
              '¿Estás seguro de eliminar esta recompensa?',
              textAlign: TextAlign.center,
              style: FlutterFlowTheme.of(context).bodyMedium,
            ),
            SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, false),
                    text: 'Cancelar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).secondaryBackground,
                      textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                            fontFamily: 'Readex Pro',
                            color: FlutterFlowTheme.of(context).primaryText,
                          ),
                      elevation: 0,
                      borderSide: BorderSide(
                        color: FlutterFlowTheme.of(context).alternate,
                        width: 1,
                      ),
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: FFButtonWidget(
                    onPressed: () => Navigator.pop(context, true),
                    text: 'Eliminar',
                    options: FFButtonOptions(
                      height: 50,
                      color: FlutterFlowTheme.of(context).error,
                      textStyle: FlutterFlowTheme.of(context).titleSmall.override(
                            fontFamily: 'Readex Pro',
                            color: Colors.white,
                          ),
                      elevation: 0,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
          ],
        ),
      ),
    );

    if (confirm != true) return;

    try {
      final userProvider = Provider.of<UserProvider>(context, listen: false);
      final token = userProvider.token;
      final response = await AdminApiCalls.deleteReward(
        rewardId: rewardId,
        token: token!,
      );

      if (response['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Recompensa eliminada correctamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        await _loadRewards();
      } else {
        throw Exception(response['msg'] ?? 'Error al eliminar recompensa');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    }
  }
}
