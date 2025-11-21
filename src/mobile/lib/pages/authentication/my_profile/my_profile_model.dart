import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'my_profile_widget.dart' show MyProfileWidget;
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class MyProfileModel extends FlutterFlowModel<MyProfileWidget> {
  // Estado para la imagen seleccionada
  XFile? selectedImage;
  bool isUploading = false;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {}
}
