import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/auth/custom_auth/user_provider.dart';
import '/backend/api_requests/api_calls.dart';
import '/utils/alert_helper.dart';
import 'dart:convert';
import 'dart:io';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import 'my_profile_model.dart';
export 'my_profile_model.dart';

/// crea una pagina para personalizar el perfil su imagen solo eso
class MyProfileWidget extends StatefulWidget {
  const MyProfileWidget({super.key});

  static String routeName = 'my_profile';
  static String routePath = '/myProfile';

  @override
  State<MyProfileWidget> createState() => _MyProfileWidgetState();
}

class _MyProfileWidgetState extends State<MyProfileWidget> {
  late MyProfileModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => MyProfileModel());
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
        body: SafeArea(
          top: true,
          child: Padding(
            padding: EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.max,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.max,
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.center,
                    children: [
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 8.0),
                        child: Text(
                          'Personaliza tu perfil',
                          textAlign: TextAlign.center,
                          style: FlutterFlowTheme.of(context)
                              .headlineMedium
                              .override(
                                font: GoogleFonts.outfit(
                                  fontWeight: FontWeight.bold,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .headlineMedium
                                      .fontStyle,
                                ),
                                fontSize: 28.0,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.bold,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .headlineMedium
                                    .fontStyle,
                              ),
                        ),
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 48.0),
                        child: Text(
                          'Agrega una foto de perfil para que otros usuarios puedan reconocerte fácilmente',
                          textAlign: TextAlign.center,
                          style: FlutterFlowTheme.of(context)
                              .bodyMedium
                              .override(
                                font: GoogleFonts.plusJakartaSans(
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontStyle,
                                ),
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
                                fontSize: 16.0,
                                letterSpacing: 0.0,
                                fontWeight: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .fontWeight,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .fontStyle,
                                lineHeight: 1.4,
                              ),
                        ),
                      ),
                      Stack(
                        alignment: AlignmentDirectional(0.0, 0.0),
                        children: [
                          Consumer<UserProvider>(
                            builder: (context, userProvider, child) {
                              final user = userProvider.currentUser;
                              final hasProfilePic =
                                  user?.profilePicture != null &&
                                      user!.profilePicture!.isNotEmpty;
                              final hasSelectedImage =
                                  _model.selectedImage != null;

                              return Container(
                                width: 160.0,
                                height: 160.0,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context).accent1,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: hasProfilePic || hasSelectedImage
                                        ? FlutterFlowTheme.of(context).secondary
                                        : FlutterFlowTheme.of(context).primary,
                                    width: 3.0,
                                  ),
                                ),
                                child: hasSelectedImage
                                    ? ClipOval(
                                        child: Image.file(
                                          File(_model.selectedImage!.path),
                                          width: 160.0,
                                          height: 160.0,
                                          fit: BoxFit.cover,
                                        ),
                                      )
                                    : hasProfilePic
                                        ? ClipOval(
                                            child: (user.profilePicture!
                                                        .startsWith('http') ||
                                                    user.profilePicture!
                                                        .startsWith('/'))
                                                ? Image.network(
                                                    user.profilePicture!
                                                            .startsWith('/')
                                                        ? '${ApiConfig.baseUrl}${user.profilePicture}'
                                                        : user.profilePicture!,
                                                    width: 160.0,
                                                    height: 160.0,
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (context,
                                                        error, stackTrace) {
                                                      return Icon(
                                                        Icons.person_rounded,
                                                        color:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .secondaryText,
                                                        size: 64.0,
                                                      );
                                                    },
                                                  )
                                                : Image.memory(
                                                    base64Decode(
                                                        user.profilePicture!),
                                                    width: 160.0,
                                                    height: 160.0,
                                                    fit: BoxFit.cover,
                                                    errorBuilder: (context,
                                                        error, stackTrace) {
                                                      return Icon(
                                                        Icons.person_rounded,
                                                        color:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .secondaryText,
                                                        size: 64.0,
                                                      );
                                                    },
                                                  ),
                                          )
                                        : Align(
                                            alignment:
                                                AlignmentDirectional(0.0, 0.0),
                                            child: Icon(
                                              Icons.person_rounded,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .secondaryText,
                                              size: 64.0,
                                            ),
                                          ),
                              );
                            },
                          ),
                          Align(
                            alignment: AlignmentDirectional(0.7, 0.7),
                            child: InkWell(
                              onTap: () async {
                                // Mostrar opciones para seleccionar imagen
                                final ImagePicker picker = ImagePicker();
                                final XFile? image = await picker.pickImage(
                                  source: ImageSource.gallery,
                                  maxWidth: 1024,
                                  maxHeight: 1024,
                                  imageQuality: 85,
                                );

                                if (!mounted) return;
                                if (image != null) {
                                  setState(() {
                                    _model.selectedImage = image;
                                  });
                                }
                              },
                              child: Container(
                                width: 48.0,
                                height: 48.0,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context).secondary,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                    color: FlutterFlowTheme.of(context)
                                        .primaryBackground,
                                    width: 3.0,
                                  ),
                                ),
                                child: Align(
                                  alignment: AlignmentDirectional(0.0, 0.0),
                                  child: Icon(
                                    Icons.camera_alt_rounded,
                                    color: Colors.white,
                                    size: 24.0,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          if (_model.isUploading)
                            Container(
                              width: 160.0,
                              height: 160.0,
                              decoration: BoxDecoration(
                                color: Colors.black45,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: CircularProgressIndicator(
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    FlutterFlowTheme.of(context).secondary,
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                      Padding(
                        padding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 32.0, 0.0, 0.0),
                        child: Text(
                          'Toca el ícono de la cámara para agregar tu foto',
                          textAlign: TextAlign.center,
                          style: FlutterFlowTheme.of(context)
                              .bodyMedium
                              .override(
                                font: GoogleFonts.plusJakartaSans(
                                  fontWeight: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontWeight,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .fontStyle,
                                ),
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
                                fontSize: 14.0,
                                letterSpacing: 0.0,
                                fontWeight: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .fontWeight,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .fontStyle,
                              ),
                        ),
                      ),
                    ],
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.max,
                  children: [
                    FFButtonWidget(
                      onPressed: () async {
                        if (_model.selectedImage != null) {
                          setState(() {
                            _model.isUploading = true;
                          });

                          try {
                            // Leer bytes de la imagen
                            final bytes =
                                await _model.selectedImage!.readAsBytes();

                            if (!mounted) return;

                            // Convertir a base64
                            final base64Image =
                                'data:image/jpeg;base64,${base64Encode(bytes)}';

                            // Obtener UserProvider
                            final userProvider = Provider.of<UserProvider>(
                                context,
                                listen: false);

                            // Subir imagen
                            final response = await userProvider
                                .uploadProfilePicture(base64Image);

                            if (!mounted) return;
                            setState(() {
                              _model.isUploading = false;
                            });

                            if (response.status) {
                              // Éxito
                              showSuccessAlert(
                                context,
                                title: 'Foto actualizada',
                                message:
                                    'Tu foto de perfil ha sido actualizada correctamente',
                              );
                              // Ir a home después de un delay
                              await Future.delayed(
                                  Duration(milliseconds: 1500));

                              if (!mounted) return;
                              context.pushNamed(HomePageWidget.routeName);
                            } else {
                              // Error
                              showErrorAlert(
                                context,
                                title: 'Error',
                                message: response.error ??
                                    'No se pudo actualizar la foto de perfil',
                              );
                            }
                          } catch (e) {
                            setState(() {
                              _model.isUploading = false;
                            });
                            showErrorAlert(
                              context,
                              title: 'Error',
                              message: 'Error al procesar la imagen',
                            );
                          }
                        } else {
                          // No hay imagen seleccionada, pedir al usuario que seleccione una
                          showErrorAlert(
                            context,
                            title: 'Imagen requerida',
                            message: 'Por favor selecciona una foto de perfil',
                          );
                        }
                      },
                      text: 'Continuar',
                      options: FFButtonOptions(
                        width: double.infinity,
                        height: 52.0,
                        padding: EdgeInsets.all(8.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        color: FlutterFlowTheme.of(context).secondary,
                        textStyle:
                            FlutterFlowTheme.of(context).titleMedium.override(
                                  font: GoogleFonts.plusJakartaSans(
                                    fontWeight: FontWeight.w600,
                                    fontStyle: FlutterFlowTheme.of(context)
                                        .titleMedium
                                        .fontStyle,
                                  ),
                                  color: Colors.white,
                                  letterSpacing: 0.0,
                                  fontWeight: FontWeight.w600,
                                  fontStyle: FlutterFlowTheme.of(context)
                                      .titleMedium
                                      .fontStyle,
                                ),
                        elevation: 0.0,
                        borderSide: BorderSide(
                          color: Colors.transparent,
                        ),
                        borderRadius: BorderRadius.circular(12.0),
                      ),
                    ),
                    FFButtonWidget(
                      onPressed: () async {
                        context.pushNamed(HomePageWidget.routeName);
                      },
                      text: 'Omitir por ahora',
                      options: FFButtonOptions(
                        width: double.infinity,
                        height: 52.0,
                        padding: EdgeInsets.all(8.0),
                        iconPadding:
                            EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 0.0),
                        color: FlutterFlowTheme.of(context).secondaryBackground,
                        textStyle: FlutterFlowTheme.of(context)
                            .titleMedium
                            .override(
                              font: GoogleFonts.plusJakartaSans(
                                fontWeight: FontWeight.w500,
                                fontStyle: FlutterFlowTheme.of(context)
                                    .titleMedium
                                    .fontStyle,
                              ),
                              color: FlutterFlowTheme.of(context).secondaryText,
                              letterSpacing: 0.0,
                              fontWeight: FontWeight.w500,
                              fontStyle: FlutterFlowTheme.of(context)
                                  .titleMedium
                                  .fontStyle,
                            ),
                        elevation: 0.0,
                        borderSide: BorderSide(
                          color: FlutterFlowTheme.of(context).alternate,
                          width: 1.0,
                        ),
                        borderRadius: BorderRadius.circular(12.0),
                      ),
                    ),
                  ].divide(SizedBox(height: 16.0)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
