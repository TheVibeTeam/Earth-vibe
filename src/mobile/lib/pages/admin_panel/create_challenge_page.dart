import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '/auth/custom_auth/user_provider.dart';
import '/backend/api_requests/api_calls.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_widgets.dart';

class CreateChallengePage extends StatefulWidget {
  final Map<String, dynamic>? existingChallenge;
  const CreateChallengePage({Key? key, this.existingChallenge})
      : super(key: key);

  @override
  _CreateChallengePageState createState() => _CreateChallengePageState();
}

class _CreateChallengePageState extends State<CreateChallengePage> {
  final titleController = TextEditingController();
  final descController = TextEditingController();
  final targetController = TextEditingController();
  final pointsController = TextEditingController();
  String activityType = 'scan';
  String frequency = 'daily';
  DateTime expiresAt = DateTime.now().add(Duration(days: 7));
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.existingChallenge != null) {
      final c = widget.existingChallenge!;
      titleController.text = c['title'] ?? '';
      descController.text = c['description'] ?? '';
      targetController.text = (c['targetValue'] ?? '').toString();
      pointsController.text = (c['rewardPoints'] ?? '').toString();
      activityType = (c['icon'] == 'recycling') ? 'recycle' : 'scan';
      frequency = c['type'] ?? 'daily';
      if (c['expiresAt'] != null) {
        expiresAt = DateTime.tryParse(c['expiresAt']) ?? DateTime.now();
      }
    }
  }

  @override
  void dispose() {
    titleController.dispose();
    descController.dispose();
    targetController.dispose();
    pointsController.dispose();
    super.dispose();
  }

  Future<void> _saveChallenge() async {
    if (titleController.text.isEmpty ||
        descController.text.isEmpty ||
        targetController.text.isEmpty ||
        pointsController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Por favor completa todos los campos'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
      return;
    }

    final target = int.tryParse(targetController.text);
    final points = int.tryParse(pointsController.text);

    if (target == null || points == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('La meta y los puntos deben ser números válidos'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
      return;
    }

    setState(() {
      _isLoading = true;
    });

    final userProvider = Provider.of<UserProvider>(context, listen: false);
    final token = userProvider.token;
    if (token == null) {
      setState(() => _isLoading = false);
      return;
    }

    final icon = activityType == 'scan' ? 'qr_code' : 'recycling';

    try {
      Map<String, dynamic> res;
      if (widget.existingChallenge != null) {
        res = await AdminApiCalls.updateChallenge(
          id: widget.existingChallenge!['_id'],
          title: titleController.text,
          description: descController.text,
          target: target,
          pointsReward: points,
          type: frequency,
          icon: icon,
          expiresAt: expiresAt,
          token: token,
        );
      } else {
        res = await AdminApiCalls.createChallenge(
          title: titleController.text,
          description: descController.text,
          target: target,
          pointsReward: points,
          type: frequency,
          icon: icon,
          expiresAt: expiresAt,
          token: token,
        );
      }

      if (res['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.existingChallenge != null
                ? 'Reto actualizado exitosamente'
                : 'Reto creado exitosamente'),
            backgroundColor: FlutterFlowTheme.of(context).success,
          ),
        );
        Navigator.pop(context, true); // Return true to indicate success
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text('Error: ${res['error'] ?? res['msg'] ?? "Desconocido"}'),
            backgroundColor: FlutterFlowTheme.of(context).error,
          ),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error inesperado: $e'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
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
              child: Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 24),
                child: Row(
                  children: [
                    IconButton(
                      icon: Icon(Icons.arrow_back, color: Colors.white),
                      onPressed: () => Navigator.pop(context),
                    ),
                    SizedBox(width: 8),
                    Text(
                      widget.existingChallenge != null
                          ? 'Editar Reto'
                          : 'Crear Nuevo Reto',
                      style:
                          FlutterFlowTheme.of(context).headlineMedium.override(
                                fontFamily: 'Outfit',
                                color: Colors.white,
                                fontSize: 22.0,
                                fontWeight: FontWeight.bold,
                              ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.existingChallenge != null
                        ? 'Editar Detalles'
                        : 'Detalles del Reto',
                    style: FlutterFlowTheme.of(context).headlineSmall,
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: titleController,
                    decoration: InputDecoration(
                      labelText: 'Título',
                      hintText: 'Ej: Reciclaje Matutino',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                    ),
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: descController,
                    decoration: InputDecoration(
                      labelText: 'Descripción',
                      hintText: 'Describe el objetivo del reto...',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                    ),
                    maxLines: 3,
                  ),
                  SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: TextFormField(
                          controller: targetController,
                          decoration: InputDecoration(
                            labelText: 'Meta (cantidad)',
                            hintText: 'Ej: 5',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: FlutterFlowTheme.of(context)
                                .secondaryBackground,
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                      SizedBox(width: 16),
                      Expanded(
                        child: TextFormField(
                          controller: pointsController,
                          decoration: InputDecoration(
                            labelText: 'Puntos',
                            hintText: 'Ej: 100',
                            border: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            filled: true,
                            fillColor: FlutterFlowTheme.of(context)
                                .secondaryBackground,
                          ),
                          keyboardType: TextInputType.number,
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: activityType,
                    items: [
                      DropdownMenuItem(value: 'scan', child: Text('Escaneo')),
                      DropdownMenuItem(
                          value: 'recycle', child: Text('Reciclaje')),
                    ],
                    onChanged: (val) => setState(() => activityType = val!),
                    decoration: InputDecoration(
                      labelText: 'Actividad',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                    ),
                  ),
                  SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: frequency,
                    items: [
                      DropdownMenuItem(value: 'daily', child: Text('Diario')),
                      DropdownMenuItem(value: 'weekly', child: Text('Semanal')),
                      DropdownMenuItem(
                          value: 'monthly', child: Text('Mensual')),
                      DropdownMenuItem(
                          value: 'special', child: Text('Especial')),
                    ],
                    onChanged: (val) => setState(() => frequency = val!),
                    decoration: InputDecoration(
                      labelText: 'Frecuencia',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                    ),
                  ),
                  SizedBox(height: 32),
                  FFButtonWidget(
                    onPressed: _isLoading ? null : _saveChallenge,
                    text: _isLoading
                        ? 'Guardando...'
                        : (widget.existingChallenge != null
                            ? 'Actualizar Reto'
                            : 'Crear Reto'),
                    options: FFButtonOptions(
                      width: double.infinity,
                      height: 50,
                      color: FlutterFlowTheme.of(context).primary,
                      textStyle:
                          FlutterFlowTheme.of(context).titleSmall.override(
                                fontFamily: 'Outfit',
                                color: Colors.white,
                              ),
                      elevation: 2,
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
