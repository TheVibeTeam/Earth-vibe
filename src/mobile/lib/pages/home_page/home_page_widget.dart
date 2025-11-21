import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import 'dart:convert';
import '/index.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:timeago/timeago.dart' as timeago;
import '/auth/custom_auth/user_provider.dart';
import '/backend/api_requests/api_calls.dart';
import '/components/list_none/no_post/no_post_widget.dart';
import '/utils/alert_helper.dart';
import 'home_page_model.dart';
export 'home_page_model.dart';

class HomePageWidget extends StatefulWidget {
  const HomePageWidget({super.key});

  static String routeName = 'home_page';
  static String routePath = '/homePage';

  @override
  State<HomePageWidget> createState() => _HomePageWidgetState();
}

class _HomePageWidgetState extends State<HomePageWidget>
    with TickerProviderStateMixin {
  late HomePageModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final animationsMap = <String, AnimationInfo>{};

  List<PostData> _posts = [];
  bool _isLoadingPosts = true;
  bool _hasError = false;
  Map<String, bool> _likedPosts = {};
  Map<String, bool> _favoritedPosts = {};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => HomePageModel());

    // Configurar timeago en español
    timeago.setLocaleMessages('es', timeago.EsMessages());

    // Cargar posts al iniciar
    _loadPosts();

    animationsMap.addAll({
      'columnOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 600.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
      'listViewOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 600.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
    });
  }

  // Cargar publicaciones desde el servidor
  Future<void> _loadPosts() async {
    setState(() {
      _isLoadingPosts = true;
      _hasError = false;
    });

    try {
      final response = await PostApiCalls.getAllPosts();

      if (response['status'] == true && response['data'] != null) {
        final List<dynamic> postsJson = response['data'];

        final List<PostData> parsedPosts = [];
        for (var json in postsJson) {
          try {
            parsedPosts.add(PostData.fromJson(json));
          } catch (e) {
            // Error parseando post
          }
        }

        if (!mounted) return;
        setState(() {
          _posts = parsedPosts;
          // Ordenar por fecha más reciente primero
          _posts.sort((a, b) => b.createdAt.compareTo(a.createdAt));

          // Inicializar estados de likes y favoritos
          final userProvider =
              Provider.of<UserProvider>(context, listen: false);
          final currentUserId = userProvider.currentUser?.id;

          for (var post in _posts) {
            if (post.id != null) {
              _likedPosts[post.id!] =
                  currentUserId != null && post.likes.contains(currentUserId);
              _favoritedPosts[post.id!] = currentUserId != null &&
                  post.favorites.contains(currentUserId);
            }
          }

          _isLoadingPosts = false;
        });
      } else {
        if (!mounted) return;
        setState(() {
          _hasError = true;
          _isLoadingPosts = false;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _hasError = true;
        _isLoadingPosts = false;
      });
    }
  }

  Future<void> _toggleLike(String postId, int postIndex) async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final token = userProvider.token;

    if (token == null) {
      showErrorAlert(
        context,
        title: 'Error de autenticación',
        message: 'Debes iniciar sesión para dar like',
      );
      return;
    }

    // Actualización optimista de la UI
    final previousState = _likedPosts[postId] ?? false;
    final previousLikes = List<String>.from(_posts[postIndex].likes);

    setState(() {
      _likedPosts[postId] = !previousState;
      if (!previousState) {
        _posts[postIndex].likes.add(userProvider.currentUser!.id);
      } else {
        _posts[postIndex].likes.remove(userProvider.currentUser!.id);
      }
    });

    try {
      final response = await PostApiCalls.likePost(postId, token);

      if (!mounted) return;
      if (response['status'] != true) {
        // Revertir cambios si hubo error
        setState(() {
          _likedPosts[postId] = previousState;
          _posts[postIndex].likes
            ..clear()
            ..addAll(previousLikes);
        });

        showErrorAlert(
          context,
          title: 'Error al dar like',
          message: response['msg'] ?? 'No se pudo procesar el like',
        );
      }
    } catch (e) {
      if (!mounted) return;
      // Revertir cambios si hubo excepción
      setState(() {
        _likedPosts[postId] = previousState;
        _posts[postIndex].likes
          ..clear()
          ..addAll(previousLikes);
      });

      showErrorAlert(
        context,
        title: 'Error de conexión',
        message: 'No se pudo dar like. Intenta nuevamente.',
      );
    }
  }

  Future<void> _toggleFavorite(String postId, int postIndex) async {
    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final token = userProvider.token;

    if (token == null) {
      showErrorAlert(
        context,
        title: 'Error de autenticación',
        message: 'Debes iniciar sesión para guardar favoritos',
      );
      return;
    }

    // Actualización optimista de la UI
    final previousState = _favoritedPosts[postId] ?? false;
    final previousFavorites = List<String>.from(_posts[postIndex].favorites);

    setState(() {
      _favoritedPosts[postId] = !previousState;
      if (!previousState) {
        _posts[postIndex].favorites.add(userProvider.currentUser!.id);
      } else {
        _posts[postIndex].favorites.remove(userProvider.currentUser!.id);
      }
    });

    try {
      final response = await PostApiCalls.favoritePost(postId, token);

      if (!mounted) return;
      if (response['status'] != true) {
        // Revertir cambios si hubo error
        setState(() {
          _favoritedPosts[postId] = previousState;
          _posts[postIndex].favorites
            ..clear()
            ..addAll(previousFavorites);
        });

        showErrorAlert(
          context,
          title: 'Error al guardar',
          message: response['msg'] ?? 'No se pudo guardar como favorito',
        );
      }
    } catch (e) {
      if (!mounted) return;
      // Revertir cambios si hubo excepción
      setState(() {
        _favoritedPosts[postId] = previousState;
        _posts[postIndex].favorites
          ..clear()
          ..addAll(previousFavorites);
      });

      showErrorAlert(
        context,
        title: 'Error de conexión',
        message: 'No se pudo guardar favorito. Intenta nuevamente.',
      );
    }
  }

  String _formatPostTime(DateTime postDate) {
    return timeago.format(postDate, locale: 'es');
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: Scaffold(
        key: scaffoldKey,
        backgroundColor: FlutterFlowTheme.of(context).secondaryBackground,
        appBar: AppBar(
          backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
          automaticallyImplyLeading: false,
          title: Text(
            'Earth Vibe',
            style: FlutterFlowTheme.of(context).labelMedium.override(
                  font: GoogleFonts.outfit(
                    fontWeight:
                        FlutterFlowTheme.of(context).labelMedium.fontWeight,
                    fontStyle:
                        FlutterFlowTheme.of(context).labelMedium.fontStyle,
                  ),
                  fontSize: 24.0,
                  letterSpacing: 0.0,
                  fontWeight:
                      FlutterFlowTheme.of(context).labelMedium.fontWeight,
                  fontStyle: FlutterFlowTheme.of(context).labelMedium.fontStyle,
                ),
          ),
          actions: [
            Consumer<UserProvider>(
              builder: (context, userProvider, child) {
                final unreadCount = userProvider.unreadNotifications;

                return Stack(
                  alignment: Alignment.center,
                  children: [
                    FlutterFlowIconButton(
                      borderRadius: 50.0,
                      buttonSize: 60.0,
                      icon: Icon(
                        Icons.notifications_none,
                        color: FlutterFlowTheme.of(context).secondaryText,
                        size: 24.0,
                      ),
                      onPressed: () async {
                        context.pushNamed('notifications');
                      },
                    ),
                    if (unreadCount > 0)
                      Positioned(
                        right: 12,
                        top: 12,
                        child: Container(
                          padding: EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: FlutterFlowTheme.of(context).error,
                            shape: BoxShape.circle,
                          ),
                          constraints: BoxConstraints(
                            minWidth: 18,
                            minHeight: 18,
                          ),
                          child: Center(
                            child: Text(
                              unreadCount > 9 ? '9+' : '$unreadCount',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
          ],
          centerTitle: false,
          elevation: 2.0,
        ),
        body: SafeArea(
          top: true,
          bottom: false,
          child: Column(
            children: [
              // Header con campo de crear post
              Container(
                decoration: BoxDecoration(
                  color: Colors.transparent,
                ),
                child: Container(
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).secondaryBackground,
                    boxShadow: [
                      BoxShadow(
                        blurRadius: 4.0,
                        color: Color(0x33000000),
                        offset: Offset(
                          0.0,
                          2.0,
                        ),
                        spreadRadius: 0.0,
                      )
                    ],
                    borderRadius: BorderRadius.circular(0.0),
                  ),
                  child: Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Consumer<UserProvider>(
                          builder: (context, userProvider, _) {
                            final user = userProvider.currentUser;
                            return Row(
                              mainAxisSize: MainAxisSize.max,
                              children: [
                                Container(
                                  width: 40.0,
                                  height: 40.0,
                                  decoration: BoxDecoration(
                                    color: FlutterFlowTheme.of(context).accent2,
                                    borderRadius: BorderRadius.circular(20.0),
                                  ),
                                  child: ClipRRect(
                                    borderRadius: BorderRadius.circular(20.0),
                                    child: user?.profilePicture != null &&
                                            user!.profilePicture!.isNotEmpty
                                        ? (user.profilePicture!
                                                    .startsWith('http') ||
                                                user.profilePicture!
                                                    .startsWith('/'))
                                            ? Image.network(
                                                user.profilePicture!
                                                        .startsWith('/')
                                                    ? '${ApiConfig.baseUrl}${user.profilePicture}'
                                                    : user.profilePicture!,
                                                width: 50.0,
                                                height: 50.0,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error,
                                                    stackTrace) {
                                                  return Icon(
                                                    Icons.person,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    size: 24.0,
                                                  );
                                                },
                                              )
                                            : Image.memory(
                                                base64Decode(
                                                    user.profilePicture!),
                                                width: 40.0,
                                                height: 40.0,
                                                fit: BoxFit.cover,
                                                errorBuilder: (context, error,
                                                    stackTrace) {
                                                  return Icon(
                                                    Icons.person,
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryText,
                                                    size: 24.0,
                                                  );
                                                },
                                              )
                                        : Icon(
                                            Icons.person,
                                            color: FlutterFlowTheme.of(context)
                                                .secondaryText,
                                            size: 24.0,
                                          ),
                                  ),
                                ),
                                Expanded(
                                  child: InkWell(
                                    onTap: () {
                                      context.pushNamed(
                                          CreatePostWidget.routeName);
                                    },
                                    child: Container(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          12.0, 16.0, 12.0, 16.0),
                                      decoration: BoxDecoration(
                                        color: FlutterFlowTheme.of(context)
                                            .primaryBackground,
                                        borderRadius:
                                            BorderRadius.circular(20.0),
                                        border: Border.all(
                                          color: FlutterFlowTheme.of(context)
                                              .alternate,
                                          width: 1.0,
                                        ),
                                      ),
                                      child: Text(
                                        '¿Qué estás pensando?',
                                        style: FlutterFlowTheme.of(context)
                                            .bodyLarge
                                            .override(
                                              font: GoogleFonts.plusJakartaSans(
                                                fontWeight:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyLarge
                                                        .fontWeight,
                                                fontStyle:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyLarge
                                                        .fontStyle,
                                              ),
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondaryText,
                                              letterSpacing: 0.0,
                                              fontWeight:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyLarge
                                                      .fontWeight,
                                              fontStyle:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyLarge
                                                      .fontStyle,
                                            ),
                                      ),
                                    ),
                                  ),
                                ),
                              ].divide(SizedBox(width: 12.0)),
                            );
                          },
                        ),
                      ].divide(SizedBox(height: 12.0)),
                    ).animateOnPageLoad(
                        animationsMap['columnOnPageLoadAnimation']!),
                  ),
                ),
              ),
              // Lista de publicaciones
              Expanded(
                child: _isLoadingPosts
                    ? Center(
                        child: Padding(
                          padding: EdgeInsets.all(32.0),
                          child: CircularProgressIndicator(),
                        ),
                      )
                    : _hasError
                        ? Center(
                            child: Padding(
                              padding: EdgeInsets.all(32.0),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(
                                    Icons.error_outline,
                                    size: 48.0,
                                    color: FlutterFlowTheme.of(context).error,
                                  ),
                                  SizedBox(height: 16.0),
                                  Text(
                                    'Error al cargar publicaciones',
                                    style:
                                        FlutterFlowTheme.of(context).bodyMedium,
                                  ),
                                  SizedBox(height: 8.0),
                                  FFButtonWidget(
                                    onPressed: _loadPosts,
                                    text: 'Reintentar',
                                    options: FFButtonOptions(
                                      height: 40.0,
                                      color: FlutterFlowTheme.of(context)
                                          .secondary,
                                      textStyle: FlutterFlowTheme.of(context)
                                          .bodyMedium
                                          .override(
                                            font: GoogleFonts.plusJakartaSans(),
                                            color: Colors.white,
                                          ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        : _posts.isEmpty
                            ? NoPostWidget()
                            : ListView.builder(
                                padding: EdgeInsets.zero,
                                scrollDirection: Axis.vertical,
                                itemCount: _posts.length,
                                itemBuilder: (context, index) {
                                  final post = _posts[index];
                                  return Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        0.0, 0.0, 0.0, 1.0),
                                    child: Container(
                                      width: double.infinity,
                                      decoration: BoxDecoration(
                                        color: FlutterFlowTheme.of(context)
                                            .secondaryBackground,
                                        boxShadow: [
                                          BoxShadow(
                                            blurRadius: 0.0,
                                            color: FlutterFlowTheme.of(context)
                                                .primaryBackground,
                                            offset: Offset(
                                              0.0,
                                              1.0,
                                            ),
                                          )
                                        ],
                                      ),
                                      child: Padding(
                                        padding: EdgeInsets.all(10.0),
                                        child: Column(
                                          mainAxisSize: MainAxisSize.max,
                                          children: [
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(8.0, 8.0, 8.0, 4.0),
                                              child: Row(
                                                mainAxisSize: MainAxisSize.max,
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.center,
                                                children: [
                                                  Container(
                                                    width: 50.0,
                                                    height: 50.0,
                                                    clipBehavior:
                                                        Clip.antiAlias,
                                                    decoration: BoxDecoration(
                                                      shape: BoxShape.circle,
                                                    ),
                                                    child: post.authorProfilePicture !=
                                                                null &&
                                                            post.authorProfilePicture!
                                                                .isNotEmpty
                                                        ? (post.authorProfilePicture!
                                                                    .startsWith(
                                                                        'http') ||
                                                                post.authorProfilePicture!
                                                                    .startsWith(
                                                                        '/'))
                                                            ? Image.network(
                                                                post.authorProfilePicture!
                                                                        .startsWith(
                                                                            '/')
                                                                    ? '${ApiConfig.baseUrl}${post.authorProfilePicture}'
                                                                    : post
                                                                        .authorProfilePicture!,
                                                                fit: BoxFit
                                                                    .cover,
                                                                errorBuilder:
                                                                    (context,
                                                                        error,
                                                                        stackTrace) {
                                                                  return Icon(
                                                                    Icons
                                                                        .person,
                                                                    size: 30.0,
                                                                    color: FlutterFlowTheme.of(
                                                                            context)
                                                                        .secondaryText,
                                                                  );
                                                                },
                                                              )
                                                            : Image.memory(
                                                                base64Decode(post
                                                                    .authorProfilePicture!),
                                                                fit: BoxFit
                                                                    .cover,
                                                                errorBuilder:
                                                                    (context,
                                                                        error,
                                                                        stackTrace) {
                                                                  return Icon(
                                                                    Icons
                                                                        .person,
                                                                    size: 30.0,
                                                                    color: FlutterFlowTheme.of(
                                                                            context)
                                                                        .secondaryText,
                                                                  );
                                                                },
                                                              )
                                                        : Icon(
                                                            Icons.person,
                                                            size: 30.0,
                                                            color: FlutterFlowTheme
                                                                    .of(context)
                                                                .secondaryText,
                                                          ),
                                                  ),
                                                  Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(12.0, 4.0,
                                                                0.0, 4.0),
                                                    child: Column(
                                                      mainAxisSize:
                                                          MainAxisSize.max,
                                                      crossAxisAlignment:
                                                          CrossAxisAlignment
                                                              .start,
                                                      children: [
                                                        Row(
                                                          mainAxisSize:
                                                              MainAxisSize.min,
                                                          children: [
                                                            Text(
                                                              post.authorName ??
                                                                  'Usuario',
                                                              style: FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMedium
                                                                  .override(
                                                                    font: GoogleFonts
                                                                        .plusJakartaSans(
                                                                      fontWeight:
                                                                          FontWeight
                                                                              .w600,
                                                                    ),
                                                                    letterSpacing:
                                                                        0.0,
                                                                  ),
                                                            ),
                                                            if (post.authorVerified ==
                                                                true)
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            4.0,
                                                                            0.0,
                                                                            0.0,
                                                                            0.0),
                                                                child: Icon(
                                                                  Icons
                                                                      .verified,
                                                                  color: Color(
                                                                      0xFF1DA1F2),
                                                                  size: 16.0,
                                                                ),
                                                              ),
                                                          ],
                                                        ),
                                                        RichText(
                                                          text: TextSpan(
                                                            children: [
                                                              TextSpan(
                                                                text:
                                                                    '@${post.authorUsername ?? "user"}',
                                                                style:
                                                                    TextStyle(),
                                                              ),
                                                              TextSpan(
                                                                text: ' • ',
                                                                style:
                                                                    TextStyle(),
                                                              ),
                                                              TextSpan(
                                                                text: _formatPostTime(
                                                                    post.createdAt),
                                                                style:
                                                                    TextStyle(),
                                                              ),
                                                            ],
                                                            style: FlutterFlowTheme
                                                                    .of(context)
                                                                .labelSmall
                                                                .override(
                                                                  font: GoogleFonts
                                                                      .outfit(),
                                                                  letterSpacing:
                                                                      0.0,
                                                                ),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(8.0, 0.0, 8.0, 8.0),
                                              child: Column(
                                                mainAxisSize: MainAxisSize.max,
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.start,
                                                children: [
                                                  Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(0.0, 4.0,
                                                                4.0, 12.0),
                                                    child: InkWell(
                                                      splashColor:
                                                          Colors.transparent,
                                                      focusColor:
                                                          Colors.transparent,
                                                      hoverColor:
                                                          Colors.transparent,
                                                      highlightColor:
                                                          Colors.transparent,
                                                      onTap: () async {
                                                        context.pushNamed(
                                                          PostWidget.routeName,
                                                          extra: <String,
                                                              dynamic>{
                                                            kTransitionInfoKey:
                                                                TransitionInfo(
                                                              hasTransition:
                                                                  true,
                                                              transitionType:
                                                                  PageTransitionType
                                                                      .rightToLeft,
                                                            ),
                                                          },
                                                          queryParameters: {
                                                            'postId':
                                                                serializeParam(
                                                              post.id,
                                                              ParamType.String,
                                                            ),
                                                          }.withoutNulls,
                                                        );
                                                      },
                                                      child: Text(
                                                        post.content,
                                                        style:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .labelMedium
                                                                .override(
                                                                  font: GoogleFonts
                                                                      .outfit(),
                                                                  letterSpacing:
                                                                      0.0,
                                                                ),
                                                      ),
                                                    ),
                                                  ),
                                                  if (post.imageUrl != null &&
                                                      post.imageUrl!.isNotEmpty)
                                                    InkWell(
                                                      splashColor:
                                                          Colors.transparent,
                                                      focusColor:
                                                          Colors.transparent,
                                                      hoverColor:
                                                          Colors.transparent,
                                                      highlightColor:
                                                          Colors.transparent,
                                                      onTap: () async {
                                                        context.pushNamed(
                                                          PostWidget.routeName,
                                                          extra: <String,
                                                              dynamic>{
                                                            kTransitionInfoKey:
                                                                TransitionInfo(
                                                              hasTransition:
                                                                  true,
                                                              transitionType:
                                                                  PageTransitionType
                                                                      .rightToLeft,
                                                            ),
                                                          },
                                                          queryParameters: {
                                                            'postId':
                                                                serializeParam(
                                                              post.id,
                                                              ParamType.String,
                                                            ),
                                                          }.withoutNulls,
                                                        );
                                                      },
                                                      child: ClipRRect(
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(12.0),
                                                        child: (post.imageUrl!
                                                                    .startsWith(
                                                                        'http') ||
                                                                post.imageUrl!
                                                                    .startsWith(
                                                                        '/'))
                                                            ? Image.network(
                                                                post.imageUrl!
                                                                        .startsWith(
                                                                            '/')
                                                                    ? '${ApiConfig.baseUrl}${post.imageUrl}'
                                                                    : post
                                                                        .imageUrl!,
                                                                width: double
                                                                    .infinity,
                                                                height: 250.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                                errorBuilder:
                                                                    (context,
                                                                        error,
                                                                        stackTrace) {
                                                                  return Container(
                                                                    width: double
                                                                        .infinity,
                                                                    height:
                                                                        250.0,
                                                                    color: FlutterFlowTheme.of(
                                                                            context)
                                                                        .secondaryBackground,
                                                                    child: Icon(
                                                                      Icons
                                                                          .broken_image,
                                                                      size: 50,
                                                                      color: FlutterFlowTheme.of(
                                                                              context)
                                                                          .secondaryText,
                                                                    ),
                                                                  );
                                                                },
                                                              )
                                                            : Image.memory(
                                                                base64Decode(post
                                                                    .imageUrl!),
                                                                width: double
                                                                    .infinity,
                                                                height: 250.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                                errorBuilder:
                                                                    (context,
                                                                        error,
                                                                        stackTrace) {
                                                                  return Container(
                                                                    width: double
                                                                        .infinity,
                                                                    height:
                                                                        250.0,
                                                                    color: FlutterFlowTheme.of(
                                                                            context)
                                                                        .secondaryBackground,
                                                                    child: Icon(
                                                                      Icons
                                                                          .broken_image,
                                                                      size: 50,
                                                                      color: FlutterFlowTheme.of(
                                                                              context)
                                                                          .secondaryText,
                                                                    ),
                                                                  );
                                                                },
                                                              ),
                                                      ),
                                                    ),
                                                  Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(4.0, 8.0,
                                                                4.0, 0.0),
                                                    child: Row(
                                                      mainAxisSize:
                                                          MainAxisSize.max,
                                                      mainAxisAlignment:
                                                          MainAxisAlignment
                                                              .spaceEvenly,
                                                      children: [
                                                        InkWell(
                                                          splashColor: Colors
                                                              .transparent,
                                                          focusColor: Colors
                                                              .transparent,
                                                          hoverColor: Colors
                                                              .transparent,
                                                          highlightColor: Colors
                                                              .transparent,
                                                          onTap: () async {
                                                            context.pushNamed(
                                                              PostWidget
                                                                  .routeName,
                                                              extra: <String,
                                                                  dynamic>{
                                                                kTransitionInfoKey:
                                                                    TransitionInfo(
                                                                  hasTransition:
                                                                      true,
                                                                  transitionType:
                                                                      PageTransitionType
                                                                          .rightToLeft,
                                                                ),
                                                              },
                                                              queryParameters: {
                                                                'postId':
                                                                    serializeParam(
                                                                  post.id,
                                                                  ParamType
                                                                      .String,
                                                                ),
                                                              }.withoutNulls,
                                                            );
                                                          },
                                                          child: Row(
                                                            children: [
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            8.0,
                                                                            8.0,
                                                                            0.0,
                                                                            8.0),
                                                                child: Icon(
                                                                  Icons
                                                                      .mode_comment_outlined,
                                                                  color: FlutterFlowTheme.of(
                                                                          context)
                                                                      .secondaryText,
                                                                  size: 24.0,
                                                                ),
                                                              ),
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            8.0,
                                                                            0.0,
                                                                            8.0,
                                                                            0.0),
                                                                child: Text(
                                                                  '${post.commentsCount}',
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .labelMedium
                                                                      .override(
                                                                        font: GoogleFonts
                                                                            .outfit(),
                                                                        letterSpacing:
                                                                            0.0,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        InkWell(
                                                          splashColor: Colors
                                                              .transparent,
                                                          focusColor: Colors
                                                              .transparent,
                                                          hoverColor: Colors
                                                              .transparent,
                                                          highlightColor: Colors
                                                              .transparent,
                                                          onTap: () async {
                                                            if (post.id !=
                                                                null) {
                                                              await _toggleLike(
                                                                  post.id!,
                                                                  index);
                                                            }
                                                          },
                                                          child: Row(
                                                            children: [
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            8.0,
                                                                            8.0,
                                                                            0.0,
                                                                            8.0),
                                                                child: Icon(
                                                                  (_likedPosts[post
                                                                              .id] ??
                                                                          false)
                                                                      ? Icons
                                                                          .favorite
                                                                      : Icons
                                                                          .favorite_border_rounded,
                                                                  color: (_likedPosts[post
                                                                              .id] ??
                                                                          false)
                                                                      ? Color(
                                                                          0xFFFF0000)
                                                                      : FlutterFlowTheme.of(
                                                                              context)
                                                                          .secondaryText,
                                                                  size: 24.0,
                                                                ),
                                                              ),
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            4.0,
                                                                            0.0,
                                                                            8.0,
                                                                            0.0),
                                                                child: Text(
                                                                  '${post.likes.length}',
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .labelMedium
                                                                      .override(
                                                                        font: GoogleFonts
                                                                            .outfit(),
                                                                        letterSpacing:
                                                                            0.0,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                        InkWell(
                                                          splashColor: Colors
                                                              .transparent,
                                                          focusColor: Colors
                                                              .transparent,
                                                          hoverColor: Colors
                                                              .transparent,
                                                          highlightColor: Colors
                                                              .transparent,
                                                          onTap: () async {
                                                            if (post.id !=
                                                                null) {
                                                              await _toggleFavorite(
                                                                  post.id!,
                                                                  index);
                                                            }
                                                          },
                                                          child: Row(
                                                            children: [
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            8.0,
                                                                            8.0,
                                                                            0.0,
                                                                            8.0),
                                                                child: Icon(
                                                                  (_favoritedPosts[post
                                                                              .id] ??
                                                                          false)
                                                                      ? Icons
                                                                          .bookmark
                                                                      : Icons
                                                                          .bookmark_border,
                                                                  color: (_favoritedPosts[post
                                                                              .id] ??
                                                                          false)
                                                                      ? FlutterFlowTheme.of(
                                                                              context)
                                                                          .primary
                                                                      : FlutterFlowTheme.of(
                                                                              context)
                                                                          .secondaryText,
                                                                  size: 24.0,
                                                                ),
                                                              ),
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            4.0,
                                                                            0.0,
                                                                            8.0,
                                                                            0.0),
                                                                child: Text(
                                                                  '${post.favorites.length}',
                                                                  style: FlutterFlowTheme.of(
                                                                          context)
                                                                      .labelMedium
                                                                      .override(
                                                                        font: GoogleFonts
                                                                            .outfit(),
                                                                        letterSpacing:
                                                                            0.0,
                                                                      ),
                                                                ),
                                                              ),
                                                            ],
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ),
                                  );
                                },
                              ).animateOnPageLoad(
                                animationsMap['listViewOnPageLoadAnimation']!),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
