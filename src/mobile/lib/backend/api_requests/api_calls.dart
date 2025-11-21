import 'dart:convert';
import 'package:http/http.dart' as http;
import '/auth/custom_auth/auth_util.dart';

class PostData {
  final String? id;
  final String content;
  final String? imageUrl;
  final List<String> likes;
  final int commentsCount;
  final List<String> favorites;
  final DateTime createdAt;
  final String? authorId;
  final String? authorUsername;
  final String? authorName;
  final String? authorUniversity;
  final String? authorProfilePicture;
  final bool? authorVerified;

  PostData({
    this.id,
    required this.content,
    this.imageUrl,
    required this.likes,
    required this.commentsCount,
    required this.favorites,
    required this.createdAt,
    this.authorId,
    this.authorUsername,
    this.authorName,
    this.authorUniversity,
    this.authorProfilePicture,
    this.authorVerified,
  });

  factory PostData.fromJson(Map<String, dynamic> json) {
    return PostData(
      id: json['_id']?.toString(),
      content: json['content'] ?? '',
      imageUrl: json['image'] ?? json['imageUrl'],
      likes: (json['likes'] as List?)?.map((e) => e.toString()).toList() ?? [],
      commentsCount: (json['comments'] as List?)?.length ?? 0,
      favorites:
          (json['favorites'] as List?)?.map((e) => e.toString()).toList() ?? [],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      authorId: json['author']?['id']?.toString(),
      authorUsername: json['author']?['username'],
      authorName: json['author']?['name'],
      authorUniversity: json['author']?['university'],
      authorProfilePicture: json['author']?['profilePicture'],
      authorVerified: json['author']?['verified'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'content': content,
      'imageUrl': imageUrl,
      'likes': likes,
      'comments': List.generate(commentsCount, (i) => {}),
      'favorites': favorites,
      'createdAt': createdAt.toIso8601String(),
      'author': {
        'id': authorId,
        'username': authorUsername,
        'name': authorName,
        'university': authorUniversity,
        'profilePicture': authorProfilePicture,
        'verified': authorVerified,
      },
    };
  }
}

class ApiConfig {
  static const String baseUrl = 'https://api.ktxo.xyz';
  static const String apiUrl = '$baseUrl/earthvibe/authentication';

  static Map<String, String> get headers => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

  static Map<String, String> headersWithAuth(String token) => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      };
}

class AuthResponse {
  final bool status;
  final String? msg;
  final AuthData? data;
  final String? error;

  AuthResponse({required this.status, this.msg, this.data, this.error});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      status: json['status'] ?? false,
      msg: json['msg'],
      data: json['data'] != null ? AuthData.fromJson(json['data']) : null,
      error: json['error'],
    );
  }
}

class AuthData {
  final String token;
  final UserData user;

  AuthData({required this.token, required this.user});

  factory AuthData.fromJson(Map<String, dynamic> json) {
    return AuthData(
      token: json['token'],
      user: UserData.fromJson(json['user']),
    );
  }
}

class UserData {
  final String id;
  final String email;
  final String username;
  final String name;
  final String? bio;
  final String? profilePicture;
  final String university;
  final String faculty;
  final bool verified;
  final String role;
  final int points;
  final int totalScans;
  final int totalPosts;
  final DateTime createdAt;
  final List<PostData>? posts;

  UserData({
    required this.id,
    required this.email,
    required this.username,
    required this.name,
    this.bio,
    this.profilePicture,
    required this.university,
    required this.faculty,
    required this.verified,
    this.role = 'user',
    required this.points,
    required this.totalScans,
    required this.totalPosts,
    required this.createdAt,
    this.posts,
  });

  factory UserData.fromJson(Map<String, dynamic> json) {
    return UserData(
      id: json['id']?.toString() ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? '',
      name: json['name'] ?? '',
      bio: json['bio'],
      profilePicture: json['profilePicture'],
      university: json['university'] ?? 'Por definir',
      faculty: json['faculty'] ?? 'Por definir',
      verified: json['verified'] ?? false,
      role: json['role'] ?? 'user',
      points: json['points'] ?? 0,
      totalScans: json['totalScans'] ?? 0,
      totalPosts: json['totalPosts'] ?? 0,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      posts: json['posts'] != null
          ? (json['posts'] as List).map((p) => PostData.fromJson(p)).toList()
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'name': name,
      'bio': bio,
      'profilePicture': profilePicture,
      'university': university,
      'faculty': faculty,
      'verified': verified,
      'role': role,
      'points': points,
      'totalScans': totalScans,
      'totalPosts': totalPosts,
      'createdAt': createdAt.toIso8601String(),
      'posts': posts?.map((p) => p.toJson()).toList(),
    };
  }
}

class AuthApiCalls {
  static Future<AuthResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/login'),
        headers: ApiConfig.headers,
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode >= 500) {
        return AuthResponse(
          status: false,
          error: 'Error del servidor (${response.statusCode})',
        );
      }

      if (response.body.isEmpty) {
        return AuthResponse(
          status: false,
          error: 'Respuesta vacía del servidor',
        );
      }

      try {
        final jsonResponse = jsonDecode(response.body);
        return AuthResponse.fromJson(jsonResponse);
      } catch (jsonError) {
        return AuthResponse(
          status: false,
          error:
              'Error al procesar respuesta: ${response.body.substring(0, 100)}',
        );
      }
    } catch (e) {
      return AuthResponse(
        status: false,
        error: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  static Future<AuthResponse> register({
    required String email,
    required String password,
    required String username,
    required String name,
    required String university,
    required String faculty,
    String? bio,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/register'),
        headers: ApiConfig.headers,
        body: jsonEncode({
          'email': email,
          'password': password,
          'username': username,
          'name': name,
          'university': university,
          'faculty': faculty,
          if (bio != null) 'bio': bio,
        }),
      );

      if (response.statusCode >= 500) {
        return AuthResponse(
          status: false,
          error: 'Error del servidor (${response.statusCode})',
        );
      }

      if (response.body.isEmpty) {
        return AuthResponse(
          status: false,
          error: 'Respuesta vacía del servidor',
        );
      }

      try {
        final jsonResponse = jsonDecode(response.body);
        return AuthResponse.fromJson(jsonResponse);
      } catch (jsonError) {
        return AuthResponse(
          status: false,
          error:
              'Error al procesar respuesta: ${response.body.substring(0, 100)}',
        );
      }
    } catch (e) {
      return AuthResponse(
        status: false,
        error: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  static Future<Map<String, dynamic>> googleSignIn({
    required String email,
    required String name,
    required String googleId,
    String? profilePicture,
    String? idToken,
    String? accessToken,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.apiUrl}/google-signin'),
        headers: ApiConfig.headers,
        body: jsonEncode({
          'email': email,
          'name': name,
          'googleId': googleId,
          if (profilePicture != null) 'profilePicture': profilePicture,
          if (idToken != null) 'idToken': idToken,
          if (accessToken != null) 'accessToken': accessToken,
        }),
      );

      if (response.statusCode >= 500) {
        return {
          'status': false,
          'msg': 'Error del servidor (${response.statusCode})',
        };
      }

      if (response.body.isEmpty) {
        return {
          'status': false,
          'msg': 'Respuesta vacía del servidor',
        };
      }

      try {
        final jsonResponse = jsonDecode(response.body);

        if (jsonResponse['status'] == true) {
          return {
            'status': true,
            'data': AuthResponse.fromJson(jsonResponse),
            'msg': jsonResponse['msg'] ?? 'Inicio de sesión exitoso',
          };
        } else {
          return {
            'status': false,
            'msg': jsonResponse['msg'] ?? 'Error al iniciar sesión',
          };
        }
      } catch (jsonError) {
        return {
          'status': false,
          'msg':
              'Error al procesar respuesta: ${response.body.substring(0, 100)}',
        };
      }
    } catch (e) {
      return {
        'status': false,
        'msg': 'Error de conexión: ${e.toString()}',
      };
    }
  }

  static Future<AuthResponse> verifyToken(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.apiUrl}/verify'),
        headers: ApiConfig.headersWithAuth(token),
      );

      final jsonResponse = jsonDecode(response.body);

      if (jsonResponse['status'] == true) {
        final data = jsonResponse['data'];
        data['token'] = token;
        return AuthResponse.fromJson({
          'status': true,
          'msg': jsonResponse['msg'],
          'data': data,
        });
      }

      return AuthResponse.fromJson(jsonResponse);
    } catch (e) {
      return AuthResponse(
        status: false,
        error: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  static Future<Map<String, dynamic>> getProfile(String token) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/user/profile'),
        headers: ApiConfig.headersWithAuth(token),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> updateProfile({
    required String token,
    String? name,
    String? bio,
    String? university,
    String? faculty,
  }) async {
    try {
      final body = <String, dynamic>{};
      if (name != null) body['name'] = name;
      if (bio != null) body['bio'] = bio;
      if (university != null) body['university'] = university;
      if (faculty != null) body['faculty'] = faculty;

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/user/update'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode(body),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  static Future<AuthResponse> uploadProfilePicture({
    required String token,
    required String imageBase64,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/upload-profile-picture'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'imageBase64': imageBase64}),
      );

      final jsonResponse = jsonDecode(response.body);

      if (jsonResponse['success'] == true && jsonResponse['user'] != null) {
        return AuthResponse(
          status: true,
          msg: jsonResponse['message'],
          data: AuthData(
            token: token,
            user: UserData.fromJson(jsonResponse['user']),
          ),
        );
      }

      return AuthResponse(
        status: false,
        error: jsonResponse['message'] ?? 'Error al subir la imagen',
      );
    } catch (e) {
      return AuthResponse(
        status: false,
        error: 'Error de conexión: ${e.toString()}',
      );
    }
  }

  static Future<Map<String, dynamic>> updateFCMToken({
    required String token,
    required String fcmToken,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/user/update-fcm-token'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'fcmToken': fcmToken}),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }
}

class ProductApiCalls {
  static Future<Map<String, dynamic>> scanProduct({
    required String token,
    required String barcode,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/product/scan'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'barcode': barcode}),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }
}

class PostApiCalls {
  static Future<Map<String, dynamic>> createPost({
    required String token,
    required String content,
    String? imageUrl,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/post/create'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({
          'content': content,
          if (imageUrl != null) 'imageUrl': imageUrl,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> getAllPosts({
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
          '${ApiConfig.baseUrl}/earthvibe/post/all?page=$page&limit=$limit',
        ),
        headers: ApiConfig.headers,
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> getPost(String postId) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/post/$postId'),
        headers: ApiConfig.headers,
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  static Future<Map<String, dynamic>> likePost(
      String postId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/post/like'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'postId': postId}),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  // Favorite Post
  static Future<Map<String, dynamic>> favoritePost(
      String postId, String token) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/post/favorite'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'postId': postId}),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  // Add Comment
  static Future<Map<String, dynamic>> addComment(
    String postId,
    String content,
    String token,
  ) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/post/comment'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({
          'postId': postId,
          'content': content,
        }),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }
}

// Llamadas para ranking
// Llamadas para premios y canjes
class RewardApiCalls {
  // Obtener premios disponibles
  static Future<Map<String, dynamic>> getRewards() async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/rewards'),
        headers: ApiConfig.headers,
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {
        'status': false,
        'error': 'Error de conexión: [0m${e.toString()}'
      };
    }
  }

  // Canjear premio
  static Future<Map<String, dynamic>> redeemReward(
      {required String token, required String rewardId}) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/rewards/redeem'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'rewardId': rewardId}),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  // Historial de canjes
  static Future<Map<String, dynamic>> getRedeemHistory(
      {required String token}) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/rewards/history'),
        headers: ApiConfig.headersWithAuth(token),
      );
      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }
}

class RankingApiCalls {
  // Get Ranking
  static Future<Map<String, dynamic>> getRanking({int limit = 10}) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/ranking?limit=$limit'),
        headers: ApiConfig.headers,
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }
}

// Activity API Calls
class ActivityApiCalls {
  // Get Last Activity
  static Future<Map<String, dynamic>> getLastActivity({
    required String token,
  }) async {
    try {
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/user/last-activity'),
        headers: ApiConfig.headersWithAuth(token),
      );

      return jsonDecode(response.body);
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }

  // Get Activity History
  static Future<Map<String, dynamic>> getActivityHistory({
    required String token,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
            '${ApiConfig.baseUrl}/earthvibe/user/activity?page=$page&limit=$limit'),
        headers: ApiConfig.headersWithAuth(token),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {'status': false, 'error': 'Error de conexión: ${e.toString()}'};
    }
  }
}

// Llamadas para decodificar y validar QR
class DecodeQRCall {
  static Future<ApiCallResponse> call({required String encryptedData}) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/utils/qr/decode'),
        headers: ApiConfig.headers,
        body: jsonEncode({'encryptedData': encryptedData}),
      );

      return ApiCallResponse(
        statusCode: response.statusCode,
        jsonBody: jsonDecode(response.body),
        bodyText: response.body,
        headers: response.headers,
      );
    } catch (e) {
      return ApiCallResponse(
        statusCode: 500,
        jsonBody: {
          'status': false,
          'msg': 'Error de conexión: ${e.toString()}'
        },
        bodyText: '',
        headers: {},
      );
    }
  }
}

// Modelo de respuesta de API Call
class ApiCallResponse {
  final int statusCode;
  final Map<String, dynamic> jsonBody;
  final String bodyText;
  final Map<String, String> headers;

  ApiCallResponse({
    required this.statusCode,
    required this.jsonBody,
    required this.bodyText,
    required this.headers,
  });

  bool get succeeded => statusCode >= 200 && statusCode < 300;
}

// Challenges API Calls
class ChallengesApiCalls {
  // Obtener lista de challenges activos con progreso del usuario
  static Future<Map<String, dynamic>> getChallenges({
    required String userId,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/challenges?userId=$userId'),
        headers: headers,
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200,
        'data': data['data'] ?? [],
        'message': data['msg'] ?? data['message'],
      };
    } catch (e) {
      return {
        'status': false,
        'data': [],
        'error': 'Error obteniendo challenges: ${e.toString()}',
      };
    }
  }

  // Reclamar recompensa de un challenge completado
  static Future<Map<String, dynamic>> claimChallenge({
    required String userId,
    required String challengeId,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/challenges/claim'),
        headers: headers,
        body: jsonEncode({
          'userId': userId,
          'challengeId': challengeId,
        }),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200,
        'data': data['data'],
        'message': data['msg'] ?? data['message'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error reclamando recompensa: ${e.toString()}',
      };
    }
  }
}

// API calls para administración
class AdminApiCalls {
  // Obtener estadísticas del dashboard
  static Future<Map<String, dynamic>> getDashboardStats({String? token}) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/admin/dashboard/stats'),
        headers: headers,
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error obteniendo estadísticas: ${e.toString()}',
      };
    }
  }

  // Obtener lista de usuarios con paginación y filtros
  static Future<Map<String, dynamic>> getUsers({
    int page = 1,
    int limit = 20,
    String? search,
    String? role,
    String? university,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;

      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
        if (search != null && search.isNotEmpty) 'search': search,
        if (role != null && role.isNotEmpty) 'role': role,
        if (university != null && university.isNotEmpty)
          'university': university,
      };

      final uri = Uri.parse('${ApiConfig.baseUrl}/admin/users').replace(
        queryParameters: queryParams,
      );

      final response = await http.get(uri, headers: headers);
      final data = jsonDecode(response.body);

      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error obteniendo usuarios: ${e.toString()}',
      };
    }
  }

  // Obtener detalles de un usuario
  static Future<Map<String, dynamic>> getUserDetails({
    required String userId,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;
      final response = await http.get(
        Uri.parse('${ApiConfig.baseUrl}/admin/users/$userId'),
        headers: headers,
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error obteniendo usuario: ${e.toString()}',
      };
    }
  }

  // Actualizar usuario
  static Future<Map<String, dynamic>> updateUser({
    required String userId,
    String? role,
    String? name,
    String? email,
    String? university,
    String? faculty,
    bool? verified,
    int? points,
    int? bottles,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;

      final body = <String, dynamic>{};
      if (role != null) body['role'] = role;
      if (name != null) body['name'] = name;
      if (email != null) body['email'] = email;
      if (university != null) body['university'] = university;
      if (faculty != null) body['faculty'] = faculty;
      if (verified != null) body['verified'] = verified;
      if (points != null) body['points'] = points;
      if (bottles != null) body['totalScans'] = bottles;

      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/admin/users/$userId'),
        headers: headers,
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error actualizando usuario: ${e.toString()}',
      };
    }
  }

  // Eliminar usuario
  static Future<Map<String, dynamic>> deleteUser({
    required String userId,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/admin/users/$userId'),
        headers: headers,
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error eliminando usuario: ${e.toString()}',
      };
    }
  }

  // Obtener todas las publicaciones (para administración)
  static Future<Map<String, dynamic>> getAllPosts({
    int page = 1,
    int limit = 20,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;

      final queryParams = {
        'page': page.toString(),
        'limit': limit.toString(),
      };

      final uri = Uri.parse('${ApiConfig.baseUrl}/admin/posts').replace(
        queryParameters: queryParams,
      );

      final response = await http.get(uri, headers: headers);
      final data = jsonDecode(response.body);

      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error obteniendo publicaciones: ${e.toString()}',
      };
    }
  }

  // Eliminar publicación
  static Future<Map<String, dynamic>> deletePost({
    required String postId,
    String? token,
  }) async {
    try {
      final headers =
          token != null ? ApiConfig.headersWithAuth(token) : ApiConfig.headers;
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/admin/posts/$postId'),
        headers: headers,
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200 && data['status'] == true,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error eliminando publicación: ${e.toString()}',
      };
    }
  }

  // Crear recompensa
  static Future<Map<String, dynamic>> createReward({
    required String name,
    required String description,
    required int points,
    required String category,
    required String imageUrl,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/reward/add'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({
          'name': name,
          'description': description,
          'points': points,
          'category': category,
          'imageUrl': imageUrl,
        }),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 201 || response.statusCode == 200,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error creando recompensa: ${e.toString()}',
      };
    }
  }

  // Crear reto
  static Future<Map<String, dynamic>> createChallenge({
    required String title,
    required String description,
    required int target,
    required int pointsReward,
    required String type, // 'daily', 'weekly', 'monthly', 'special'
    required String icon,
    required DateTime expiresAt,
    required String token,
  }) async {
    try {
      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/admin/challenges/create'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({
          'title': title,
          'description': description,
          'targetValue': target,
          'rewardPoints': pointsReward,
          'type': type,
          'icon': icon,
          'expiresAt': expiresAt.toIso8601String(),
        }),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 201 || response.statusCode == 200,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error creando reto: ${e.toString()}',
      };
    }
  }

  // Actualizar reto
  static Future<Map<String, dynamic>> updateChallenge({
    required String id,
    required String title,
    required String description,
    required int target,
    required int pointsReward,
    required String type,
    required String icon,
    required DateTime expiresAt,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/admin/challenges/update/$id'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({
          'title': title,
          'description': description,
          'targetValue': target,
          'rewardPoints': pointsReward,
          'type': type,
          'icon': icon,
          'expiresAt': expiresAt.toIso8601String(),
        }),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error actualizando reto: ${e.toString()}',
      };
    }
  }

  // Actualizar recompensa
  static Future<Map<String, dynamic>> updateReward({
    required String id,
    required String name,
    required String description,
    required int points,
    required String category,
    required String imageUrl,
    required String token,
  }) async {
    try {
      final response = await http.put(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/reward/update/$id'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({
          'name': name,
          'description': description,
          'points': points,
          'category': category,
          'imageUrl': imageUrl,
        }),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error actualizando recompensa: ${e.toString()}',
      };
    }
  }

  // Eliminar comentario
  static Future<Map<String, dynamic>> deleteComment({
    required String postId,
    required String commentId,
    required String userId, // Author of the post
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse(
            '${ApiConfig.baseUrl}/admin/posts/$postId/comments/$commentId'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode({'userId': userId}),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200,
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error eliminando comentario: ${e.toString()}',
      };
    }
  }

  // Eliminar reto
  static Future<Map<String, dynamic>> deleteChallenge({
    required String challengeId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse(
            '${ApiConfig.baseUrl}/earthvibe/admin/challenges/delete/$challengeId'),
        headers: ApiConfig.headersWithAuth(token),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error eliminando reto: ${e.toString()}',
      };
    }
  }

  // Eliminar recompensa
  static Future<Map<String, dynamic>> deleteReward({
    required String rewardId,
    required String token,
  }) async {
    try {
      final response = await http.delete(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/reward/delete/$rewardId'),
        headers: ApiConfig.headersWithAuth(token),
      );

      final data = jsonDecode(response.body);
      return {
        'status': response.statusCode == 200,
        'data': data['data'],
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error eliminando recompensa: ${e.toString()}',
      };
    }
  }
}

// Modelo de Notificación
class NotificationData {
  final String id;
  final String title;
  final String message;
  final String type;
  final String priority;
  final String sentBy;
  final bool isRead;
  final DateTime createdAt;
  final DateTime? expiresAt;

  NotificationData({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    required this.priority,
    required this.sentBy,
    required this.isRead,
    required this.createdAt,
    this.expiresAt,
  });

  factory NotificationData.fromJson(Map<String, dynamic> json) {
    return NotificationData(
      id: json['id']?.toString() ?? '',
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      type: json['type'] ?? 'general',
      priority: json['priority'] ?? 'medium',
      sentBy: json['sentBy'] ?? 'Admin',
      isRead: json['isRead'] ?? false,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
      expiresAt:
          json['expiresAt'] != null ? DateTime.parse(json['expiresAt']) : null,
    );
  }
}

// API Calls para Notificaciones
class NotificationApiCalls {
  // Obtener notificaciones del usuario
  static Future<Map<String, dynamic>> getUserNotifications({
    required String token,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
            '${ApiConfig.baseUrl}/earthvibe/notifications?page=$page&limit=$limit'),
        headers: ApiConfig.headersWithAuth(token),
      );

      final data = jsonDecode(response.body);
      if (data['status'] == true) {
        final notifications = (data['data']['notifications'] as List)
            .map((n) => NotificationData.fromJson(n))
            .toList();

        return {
          'status': true,
          'notifications': notifications,
          'unreadCount': data['data']['unreadCount'],
          'currentPage': data['data']['currentPage'],
          'totalPages': data['data']['totalPages'],
          'total': data['data']['total'],
        };
      }

      return {'status': false, 'error': data['msg']};
    } catch (e) {
      return {
        'status': false,
        'error': 'Error obteniendo notificaciones: ${e.toString()}',
      };
    }
  }

  // Marcar notificación como leída
  static Future<Map<String, dynamic>> markAsRead({
    required String token,
    required String notificationId,
  }) async {
    try {
      final response = await http.post(
        Uri.parse(
            '${ApiConfig.baseUrl}/earthvibe/notifications/$notificationId/read'),
        headers: ApiConfig.headersWithAuth(token),
      );

      final data = jsonDecode(response.body);
      return {
        'status': data['status'] ?? false,
        'msg': data['msg'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error marcando notificación: ${e.toString()}',
      };
    }
  }

  // ADMIN: Enviar notificación
  static Future<Map<String, dynamic>> sendNotification({
    required String token,
    required String title,
    required String message,
    String type = 'general',
    String priority = 'medium',
    String recipients = 'all',
    List<String>? specificUserIds,
    int? expiresInDays,
  }) async {
    try {
      final body = {
        'title': title,
        'message': message,
        'type': type,
        'priority': priority,
        'recipients': recipients,
        if (specificUserIds != null) 'specificUserIds': specificUserIds,
        if (expiresInDays != null) 'expiresInDays': expiresInDays,
      };

      final response = await http.post(
        Uri.parse('${ApiConfig.baseUrl}/earthvibe/admin/notifications/send'),
        headers: ApiConfig.headersWithAuth(token),
        body: jsonEncode(body),
      );

      final data = jsonDecode(response.body);
      return {
        'status': data['status'] ?? false,
        'msg': data['msg'],
        'data': data['data'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error enviando notificación: ${e.toString()}',
      };
    }
  }

  // ADMIN: Obtener todas las notificaciones
  static Future<Map<String, dynamic>> getAllNotifications({
    required String token,
    int page = 1,
    int limit = 20,
  }) async {
    try {
      final response = await http.get(
        Uri.parse(
            '${ApiConfig.baseUrl}/earthvibe/admin/notifications?page=$page&limit=$limit'),
        headers: ApiConfig.headersWithAuth(token),
      );

      final data = jsonDecode(response.body);
      return {
        'status': data['status'] ?? false,
        'data': data['data'],
      };
    } catch (e) {
      return {
        'status': false,
        'error': 'Error obteniendo notificaciones: ${e.toString()}',
      };
    }
  }
}

// Llamada para actualizar el token FCM
class UpdateFCMTokenCall {
  static Future<void> call({required String fcmToken}) async {
    try {
      // Obtener el token de autenticación del usuario actual
      // Necesitarás importar: import '/auth/custom_auth/auth_util.dart';
      final token = currentAuthenticationToken;
      if (token == null || token.isEmpty) {
        throw Exception('No hay token de autenticación');
      }

      await AuthApiCalls.updateFCMToken(
        token: token,
        fcmToken: fcmToken,
      );
    } catch (e) {
      throw Exception('Error al actualizar token FCM: $e');
    }
  }
}
