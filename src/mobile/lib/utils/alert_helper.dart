import 'package:flutter/material.dart';
import '/components/successful/success_alert/success_alert_widget.dart';
import '/components/failed/error_alert/error_alert_widget.dart';

/// Muestra una alerta de éxito
void showSuccessAlert(
  BuildContext context, {
  required String title,
  required String message,
  Duration duration = const Duration(seconds: 3),
}) {
  showDialog(
    context: context,
    barrierDismissible: true,
    barrierColor: Colors.transparent,
    builder: (BuildContext context) {
      // Auto cerrar después de la duración especificada
      Future.delayed(duration, () {
        if (context.mounted) {
          Navigator.of(context).pop();
        }
      });

      return Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: EdgeInsets.only(bottom: 80.0, left: 16.0, right: 16.0),
          child: Material(
            color: Colors.transparent,
            child: SuccessAlertWidget(
              title: title,
              message: message,
            ),
          ),
        ),
      );
    },
  );
}

/// Muestra una alerta de error
void showErrorAlert(
  BuildContext context, {
  required String title,
  required String message,
  Duration duration = const Duration(seconds: 4),
}) {
  showDialog(
    context: context,
    barrierDismissible: true,
    barrierColor: Colors.transparent,
    builder: (BuildContext context) {
      // Auto cerrar después de la duración especificada
      Future.delayed(duration, () {
        if (context.mounted) {
          Navigator.of(context).pop();
        }
      });

      return Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: EdgeInsets.only(bottom: 80.0, left: 16.0, right: 16.0),
          child: Material(
            color: Colors.transparent,
            child: ErrorAlertWidget(
              title: title,
              message: message,
            ),
          ),
        ),
      );
    },
  );
}
