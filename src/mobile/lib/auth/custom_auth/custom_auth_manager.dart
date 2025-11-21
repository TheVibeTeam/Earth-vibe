import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'custom_auth_user_provider.dart';
import '/backend/api_requests/api_calls.dart';

export 'custom_auth_manager.dart';

const _kAuthTokenKey = '_auth_authentication_token_';
const _kRefreshTokenKey = '_auth_refresh_token_';
const _kTokenExpirationKey = '_auth_token_expiration_';
const _kUidKey = '_auth_uid_';
const _kUserDataKey = '_auth_user_data_';

class CustomAuthManager {
  // Auth session attributes
  String? authenticationToken;
  String? refreshToken;
  DateTime? tokenExpiration;
  // User attributes
  String? uid;

  Future signOut() async {
    authenticationToken = null;
    refreshToken = null;
    tokenExpiration = null;
    uid = null;

    // Update the current user.
    earthVibeAuthUserSubject.add(
      EarthVibeAuthUser(loggedIn: false),
    );
    persistAuthData();
  }

  Future<EarthVibeAuthUser?> signIn({
    String? authenticationToken,
    String? refreshToken,
    DateTime? tokenExpiration,
    String? authUid,
  }) async =>
      _updateCurrentUser(
        authenticationToken: authenticationToken,
        refreshToken: refreshToken,
        tokenExpiration: tokenExpiration,
        authUid: authUid,
      );

  void updateAuthUserData({
    String? authenticationToken,
    String? refreshToken,
    DateTime? tokenExpiration,
    String? authUid,
  }) {
    assert(
      currentUser?.loggedIn ?? false,
      'User must be logged in to update auth user data.',
    );

    _updateCurrentUser(
      authenticationToken: authenticationToken,
      refreshToken: refreshToken,
      tokenExpiration: tokenExpiration,
      authUid: authUid,
    );
  }

  EarthVibeAuthUser? _updateCurrentUser({
    String? authenticationToken,
    String? refreshToken,
    DateTime? tokenExpiration,
    String? authUid,
  }) {
    this.authenticationToken = authenticationToken;
    this.refreshToken = refreshToken;
    this.tokenExpiration = tokenExpiration;
    this.uid = authUid;

    // Update the current user stream.
    final updatedUser = EarthVibeAuthUser(
      loggedIn: true,
      uid: authUid,
    );
    earthVibeAuthUserSubject.add(updatedUser);
    persistAuthData();
    return updatedUser;
  }

  late SharedPreferences _prefs;
  Future initialize() async {
    _prefs = await SharedPreferences.getInstance();

    try {
      authenticationToken = _prefs.getString(_kAuthTokenKey);
      refreshToken = _prefs.getString(_kRefreshTokenKey);
      tokenExpiration = _prefs.getInt(_kTokenExpirationKey) != null
          ? DateTime.fromMillisecondsSinceEpoch(
              _prefs.getInt(_kTokenExpirationKey)!)
          : null;
      uid = _prefs.getString(_kUidKey);
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing auth: $e');
      }
      return;
    }

    final authTokenExists = authenticationToken != null;
    final tokenExpired =
        tokenExpiration != null && tokenExpiration!.isBefore(DateTime.now());
    final updatedUser = EarthVibeAuthUser(
      loggedIn: authTokenExists && !tokenExpired,
      uid: uid,
    );
    earthVibeAuthUserSubject.add(updatedUser);
  }

  void persistAuthData() {
    authenticationToken != null
        ? _prefs.setString(_kAuthTokenKey, authenticationToken!)
        : _prefs.remove(_kAuthTokenKey);
    refreshToken != null
        ? _prefs.setString(_kRefreshTokenKey, refreshToken!)
        : _prefs.remove(_kRefreshTokenKey);
    tokenExpiration != null
        ? _prefs.setInt(
            _kTokenExpirationKey, tokenExpiration!.millisecondsSinceEpoch)
        : _prefs.remove(_kTokenExpirationKey);
    uid != null ? _prefs.setString(_kUidKey, uid!) : _prefs.remove(_kUidKey);
  }

  static Future<UserData?> refreshUserProfile() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(_kAuthTokenKey);

      if (token == null) return null;

      final response = await AuthApiCalls.getProfile(token);

      if (response['status'] == true && response['data'] != null) {
        return UserData.fromJson(response['data']);
      }
      return null;
    } catch (e) {
      if (kDebugMode) {
        print('Error refrescando perfil: $e');
      }
      return null;
    }
  }
}

EarthVibeAuthUser? currentUser;
bool get loggedIn => currentUser?.loggedIn ?? false;
