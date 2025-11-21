import 'package:connectivity_plus/connectivity_plus.dart';
import 'components/no_internet_widget.dart';
import 'package:provider/provider.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '/utils/firebase_messaging_service.dart';
import 'firebase_options.dart';

import 'auth/custom_auth/auth_util.dart';
import 'auth/custom_auth/custom_auth_user_provider.dart';
import 'auth/custom_auth/user_provider.dart';

import '/flutter_flow/flutter_flow_theme.dart';
import 'flutter_flow/flutter_flow_util.dart';
import 'flutter_flow/internationalization.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:floating_bottom_navigation_bar/floating_bottom_navigation_bar.dart';
import 'flutter_flow/nav/nav.dart';
import 'index.dart';
import 'pages/admin_panel/admin_panel_widget.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  GoRouter.optionURLReflectsImperativeAPIs = true;
  usePathUrlStrategy();

  // Inicializar Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // Configurar el manejador de notificaciones en background
  FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

  await FlutterFlowTheme.initialize();
  await authManager.initialize();

  final appState = FFAppState();
  await appState.initializePersistedState();

  final userProvider = UserProvider();
  await userProvider.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => appState),
        ChangeNotifierProvider.value(value: userProvider),
      ],
      child: MyApp(),
    ),
  );
}

class MyApp extends StatefulWidget {
  // This widget is the root of your application.
  @override
  State<MyApp> createState() => _MyAppState();

  static _MyAppState of(BuildContext context) =>
      context.findAncestorStateOfType<_MyAppState>()!;
}

class _MyAppState extends State<MyApp> {
  Future<bool> checkConnection() async {
    final result = await Connectivity().checkConnectivity();
    return result != ConnectivityResult.none;
  }

  Locale? _locale;

  ThemeMode _themeMode = FlutterFlowTheme.themeMode;

  late AppStateNotifier _appStateNotifier;
  late GoRouter _router;
  String getRoute([RouteMatchBase? routeMatch]) {
    final RouteMatchBase? lastMatch =
        routeMatch ?? _router.routerDelegate.currentConfiguration.last;
    final RouteMatchList matchList = lastMatch is ImperativeRouteMatch
        ? lastMatch.matches
        : _router.routerDelegate.currentConfiguration;
    return matchList.uri.toString();
  }

  List<String> getRouteStack() =>
      _router.routerDelegate.currentConfiguration.matches
          .map((e) => getRoute(e))
          .toList();
  late Stream<EarthVibeAuthUser> userStream;

  @override
  void initState() {
    super.initState();

    _appStateNotifier = AppStateNotifier.instance;
    _router = createRouter(_appStateNotifier);

    final initialAuthUser = currentUser ?? EarthVibeAuthUser(loggedIn: false);
    _appStateNotifier.update(initialAuthUser);

    userStream = earthVibeAuthUserStream()
      ..listen((user) {
        _appStateNotifier.update(user);
      });

    Future.delayed(
      Duration(milliseconds: 300),
      () => _appStateNotifier.stopShowingSplashImage(),
    );
  }

  void setLocale(String language) {
    safeSetState(() => _locale = createLocale(language));
  }

  void setThemeMode(ThemeMode mode) => safeSetState(() {
        _themeMode = mode;
        FlutterFlowTheme.saveThemeMode(mode);
      });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<bool>(
      future: checkConnection(),
      builder: (context, snapshot) {
        if (snapshot.connectionState != ConnectionState.done) {
          return const MaterialApp(
            home: Scaffold(body: Center(child: CircularProgressIndicator())),
          );
        }
        if (snapshot.hasData && !snapshot.data!) {
          return const MaterialApp(
            home: Scaffold(body: NoInternetWidget()),
          );
        }
        return MaterialApp.router(
          debugShowCheckedModeBanner: false,
          title: 'Earth Vibe',
          localizationsDelegates: [
            FFLocalizationsDelegate(),
            GlobalMaterialLocalizations.delegate,
            GlobalWidgetsLocalizations.delegate,
            GlobalCupertinoLocalizations.delegate,
            FallbackMaterialLocalizationDelegate(),
            FallbackCupertinoLocalizationDelegate(),
          ],
          locale: _locale,
          supportedLocales: const [
            Locale('es'),
          ],
          theme: ThemeData(
            brightness: Brightness.light,
            useMaterial3: false,
          ),
          darkTheme: ThemeData(
            brightness: Brightness.dark,
            useMaterial3: false,
          ),
          themeMode: _themeMode,
          routerConfig: _router,
        );
      },
    );
  }
}

class NavBarPage extends StatefulWidget {
  NavBarPage({
    Key? key,
    this.initialPage,
    this.page,
    this.disableResizeToAvoidBottomInset = false,
  }) : super(key: key);

  final String? initialPage;
  final Widget? page;
  final bool disableResizeToAvoidBottomInset;

  @override
  _NavBarPageState createState() => _NavBarPageState();
}

/// This is the private State class that goes with NavBarPage.
class _NavBarPageState extends State<NavBarPage> {
  String _currentPageName = 'home_page';
  late Widget? _currentPage;

  @override
  void initState() {
    super.initState();
    _currentPageName = widget.initialPage ?? _currentPageName;
    _currentPage = widget.page;
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<UserProvider>(
      builder: (context, userProvider, child) {
        final currentUser = userProvider.currentUser;
        final isSuperAdmin = currentUser?.role == 'superadmin';

        final tabs = {
          'home_page': HomePageWidget(),
          'points_page': PointsPageWidget(),
          'profile_user': ProfileUserWidget(),
          if (isSuperAdmin) 'admin_panel': AdminPanelWidget(),
        };

        final currentIndex = tabs.keys.toList().indexOf(_currentPageName);

        final MediaQueryData queryData = MediaQuery.of(context);

        return Scaffold(
          resizeToAvoidBottomInset: !widget.disableResizeToAvoidBottomInset,
          body: MediaQuery(
              data: queryData
                  .removeViewInsets(removeBottom: true)
                  .removeViewPadding(removeBottom: true),
              child: _currentPage ?? tabs[_currentPageName]!),
          extendBody: false,
          bottomNavigationBar: FloatingNavbar(
            currentIndex: currentIndex,
            onTap: (i) {
              safeSetState(() {
                _currentPage = null;
                _currentPageName = tabs.keys.toList()[i];
              });
            },
            backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
            selectedItemColor: FlutterFlowTheme.of(context).secondary,
            unselectedItemColor: FlutterFlowTheme.of(context).secondaryText,
            selectedBackgroundColor: Color(0x00000000),
            borderRadius: 8.0,
            itemBorderRadius: 50.0,
            margin: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
            padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
            width: double.infinity,
            elevation: 0.0,
            items: [
              FloatingNavbarItem(
                customWidget: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      currentIndex == 0 ? Icons.home : Icons.home_outlined,
                      color: currentIndex == 0
                          ? FlutterFlowTheme.of(context).secondary
                          : FlutterFlowTheme.of(context).secondaryText,
                      size: currentIndex == 0 ? 24.0 : 24.0,
                    ),
                    Text(
                      'Inicio',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: currentIndex == 0
                            ? FlutterFlowTheme.of(context).secondary
                            : FlutterFlowTheme.of(context).secondaryText,
                        fontSize: 11.0,
                      ),
                    ),
                  ],
                ),
              ),
              FloatingNavbarItem(
                customWidget: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.emoji_events,
                      color: currentIndex == 1
                          ? FlutterFlowTheme.of(context).secondary
                          : FlutterFlowTheme.of(context).secondaryText,
                      size: 24.0,
                    ),
                    Text(
                      'Puntos',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: currentIndex == 1
                            ? FlutterFlowTheme.of(context).secondary
                            : FlutterFlowTheme.of(context).secondaryText,
                        fontSize: 11.0,
                      ),
                    ),
                  ],
                ),
              ),
              FloatingNavbarItem(
                customWidget: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.account_circle_outlined,
                      color: currentIndex == 2
                          ? FlutterFlowTheme.of(context).secondary
                          : FlutterFlowTheme.of(context).secondaryText,
                      size: 24.0,
                    ),
                    Text(
                      'Perfil',
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        color: currentIndex == 2
                            ? FlutterFlowTheme.of(context).secondary
                            : FlutterFlowTheme.of(context).secondaryText,
                        fontSize: 11.0,
                      ),
                    ),
                  ],
                ),
              ),
              // Botón de Admin (solo visible para superadmin)
              if (isSuperAdmin)
                FloatingNavbarItem(
                  customWidget: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.admin_panel_settings,
                        color: currentIndex == 3
                            ? FlutterFlowTheme.of(context).secondary
                            : FlutterFlowTheme.of(context).secondaryText,
                        size: 24.0,
                      ),
                      Text(
                        'Admin',
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(
                          color: currentIndex == 3
                              ? FlutterFlowTheme.of(context).secondary
                              : FlutterFlowTheme.of(context).secondaryText,
                          fontSize: 11.0,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
