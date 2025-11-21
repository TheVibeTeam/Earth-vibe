import 'package:flutter/material.dart';

class NoInternetWidget extends StatelessWidget {
  final VoidCallback? onRetry;
  const NoInternetWidget({Key? key, this.onRetry}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.wifi_off, size: 80, color: Colors.blueGrey[300]),
            const SizedBox(height: 24),
            Text(
              'Sin conexión a Internet',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: Colors.blueGrey[700],
                    fontWeight: FontWeight.bold,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              'Por favor verifica tu conexión y vuelve a intentarlo.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.blueGrey[500],
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton.icon(
              icon: const Icon(Icons.refresh),
              label: const Text('Reintentar'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.blueGrey[700],
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
                elevation: 4,
              ),
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }
}
