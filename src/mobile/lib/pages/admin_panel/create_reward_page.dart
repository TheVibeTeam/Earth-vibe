import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '/auth/custom_auth/user_provider.dart';
import '/backend/api_requests/api_calls.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_widgets.dart';

class CreateRewardPage extends StatefulWidget {
  final Map<String, dynamic>? existingReward;
  const CreateRewardPage({Key? key, this.existingReward}) : super(key: key);

  @override
  _CreateRewardPageState createState() => _CreateRewardPageState();
}

class _CreateRewardPageState extends State<CreateRewardPage> {
  final nameController = TextEditingController();
  final descController = TextEditingController();
  final pointsController = TextEditingController();
  File? _selectedImage;
  String? _existingImageUrl;
  String category = 'General';
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    if (widget.existingReward != null) {
      final r = widget.existingReward!;
      nameController.text = r['name'] ?? '';
      descController.text = r['description'] ?? '';
      pointsController.text = (r['points'] ?? '').toString();
      category = r['category'] ?? 'General';
      _existingImageUrl = r['imageUrl'];
    }
  }

  @override
  void dispose() {
    nameController.dispose();
    descController.dispose();
    pointsController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);

    if (pickedFile != null) {
      setState(() {
        _selectedImage = File(pickedFile.path);
      });
    }
  }

  Future<void> _saveReward() async {
    if (nameController.text.isEmpty ||
        descController.text.isEmpty ||
        pointsController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Por favor completa todos los campos requeridos'),
          backgroundColor: FlutterFlowTheme.of(context).error,
        ),
      );
      return;
    }

    final points = int.tryParse(pointsController.text);

    if (points == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Los puntos deben ser un número válido'),
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

    try {
      String? imageUrl = _existingImageUrl;
      if (_selectedImage != null) {
        final bytes = await _selectedImage!.readAsBytes();
        final base64Image = base64Encode(bytes);
        imageUrl = 'data:image/jpeg;base64,$base64Image';
      }

      Map<String, dynamic> res;
      if (widget.existingReward != null) {
        res = await AdminApiCalls.updateReward(
          id: widget.existingReward!['_id'],
          name: nameController.text,
          description: descController.text,
          points: points,
          category: category,
          imageUrl: imageUrl ?? 'https://via.placeholder.com/150',
          token: token,
        );
      } else {
        res = await AdminApiCalls.createReward(
          name: nameController.text,
          description: descController.text,
          points: points,
          category: category,
          imageUrl: imageUrl ?? 'https://via.placeholder.com/150',
          token: token,
        );
      }

      if (res['status'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(widget.existingReward != null
                ? 'Recompensa actualizada exitosamente'
                : 'Recompensa creada exitosamente'),
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
                      widget.existingReward != null
                          ? 'Editar Recompensa'
                          : 'Crear Nueva Recompensa',
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
                    widget.existingReward != null
                        ? 'Editar Detalles'
                        : 'Detalles de la Recompensa',
                    style: FlutterFlowTheme.of(context).headlineSmall,
                  ),
                  SizedBox(height: 16),
                  TextFormField(
                    controller: nameController,
                    decoration: InputDecoration(
                      labelText: 'Nombre',
                      hintText: 'Ej: Botella de Agua',
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
                      hintText: 'Describe la recompensa...',
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
                  TextFormField(
                    controller: pointsController,
                    decoration: InputDecoration(
                      labelText: 'Costo en Puntos',
                      hintText: 'Ej: 500',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                      filled: true,
                      fillColor:
                          FlutterFlowTheme.of(context).secondaryBackground,
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  SizedBox(height: 16),
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      width: double.infinity,
                      height: 150,
                      decoration: BoxDecoration(
                        color: FlutterFlowTheme.of(context).secondaryBackground,
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(
                          color: FlutterFlowTheme.of(context).alternate,
                          width: 1,
                        ),
                      ),
                      child: _selectedImage != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Image.file(
                                _selectedImage!,
                                fit: BoxFit.cover,
                              ),
                            )
                          : (_existingImageUrl != null &&
                                  _existingImageUrl!.isNotEmpty)
                              ? ClipRRect(
                                  borderRadius: BorderRadius.circular(8),
                                  child: Image.network(
                                    _existingImageUrl!,
                                    fit: BoxFit.cover,
                                    errorBuilder:
                                        (context, error, stackTrace) => Column(
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Icon(Icons.broken_image,
                                            size: 40, color: Colors.grey),
                                        Text('Error al cargar imagen'),
                                      ],
                                    ),
                                  ),
                                )
                              : Column(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Icon(
                                      Icons.add_a_photo,
                                      size: 40,
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                    ),
                                    SizedBox(height: 8),
                                    Text(
                                      'Toca para subir una imagen',
                                      style: FlutterFlowTheme.of(context)
                                          .bodyMedium,
                                    ),
                                  ],
                                ),
                    ),
                  ),
                  SizedBox(height: 16),
                  DropdownButtonFormField<String>(
                    value: category,
                    items: [
                      DropdownMenuItem(
                          value: 'General', child: Text('General')),
                      DropdownMenuItem(
                          value: 'Academico', child: Text('Académico')),
                      DropdownMenuItem(value: 'Comida', child: Text('Comida')),
                      DropdownMenuItem(value: 'Otros', child: Text('Otros')),
                    ],
                    onChanged: (val) => setState(() => category = val!),
                    decoration: InputDecoration(
                      labelText: 'Categoría',
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
                    onPressed: _isLoading ? null : _saveReward,
                    text: _isLoading
                        ? 'Guardando...'
                        : (widget.existingReward != null
                            ? 'Actualizar Recompensa'
                            : 'Crear Recompensa'),
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
