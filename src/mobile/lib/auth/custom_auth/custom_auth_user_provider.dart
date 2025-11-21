import 'package:rxdart/rxdart.dart';

import 'custom_auth_manager.dart';

class EarthVibeAuthUser {
  EarthVibeAuthUser({required this.loggedIn, this.uid});

  bool loggedIn;
  String? uid;
}

/// Generates a stream of the authenticated user.
BehaviorSubject<EarthVibeAuthUser> earthVibeAuthUserSubject =
    BehaviorSubject.seeded(EarthVibeAuthUser(loggedIn: false));
Stream<EarthVibeAuthUser> earthVibeAuthUserStream() => earthVibeAuthUserSubject
    .asBroadcastStream()
    .map((user) => currentUser = user);
