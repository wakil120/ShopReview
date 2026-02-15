import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'models.dart';

String get baseUrl {
  if (kIsWeb) return 'http://localhost:3000';
  return 'http://10.0.2.2:3000'; // Android emulator
}

class AuthService {
  static AppUser? _currentUser;
  static AppUser? get currentUser => _currentUser;
  static bool get isLoggedIn => _currentUser != null;
  static bool get isAdmin => _currentUser?.isAdmin ?? false;
  static String get userId => _currentUser?.id ?? '';

  static Map<String, String> get authHeaders => {
    'Authorization': 'Bearer ${_currentUser?.token ?? ''}',
  };

  static Map<String, String> get jsonAuthHeaders => {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${_currentUser?.token ?? ''}',
  };

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final userData = prefs.getString('user');
    if (userData != null) {
      try { _currentUser = AppUser.fromJson(json.decode(userData)); } catch (_) {}
    }
  }

  static Future<Map<String, dynamic>> login(String email, String password) async {
    final resp = await http.post(Uri.parse('$baseUrl/api/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'email': email, 'password': password}));
    final data = json.decode(resp.body);
    if (resp.statusCode == 200) {
      _currentUser = AppUser.fromJson(data['user']);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', json.encode(_currentUser!.toJson()));
      return {'success': true};
    }
    return {'success': false, 'message': data['message'] ?? 'Login failed'};
  }

  static Future<Map<String, dynamic>> register(String username, String email, String password) async {
    final resp = await http.post(Uri.parse('$baseUrl/api/auth/register'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({'username': username, 'email': email, 'password': password}));
    final data = json.decode(resp.body);
    if (resp.statusCode == 201) {
      _currentUser = AppUser.fromJson(data['user']);
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('user', json.encode(_currentUser!.toJson()));
      return {'success': true};
    }
    return {'success': false, 'message': data['message'] ?? 'Registration failed'};
  }

  static Future<void> logout() async {
    _currentUser = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('user');
  }
}

class ApiService {
  static Future<List<Shop>> getShops() async {
    final resp = await http.get(Uri.parse('$baseUrl/api/shops')).timeout(const Duration(seconds: 10));
    if (resp.statusCode == 200) {
      return (json.decode(resp.body) as List).map((j) => Shop.fromJson(j)).toList();
    }
    throw Exception('Failed to load shops');
  }

  static Future<List<Shop>> searchShops(String query) async {
    final resp = await http.get(Uri.parse('$baseUrl/api/shops/search?name=${Uri.encodeComponent(query)}'));
    if (resp.statusCode == 200) {
      return (json.decode(resp.body) as List).map((j) => Shop.fromJson(j)).toList();
    }
    throw Exception('Search failed');
  }

  static Future<Shop> getShop(String id) async {
    final resp = await http.get(Uri.parse('$baseUrl/api/shops/$id'));
    if (resp.statusCode == 200) return Shop.fromJson(json.decode(resp.body));
    throw Exception('Failed to load shop');
  }

  static Future<List<Review>> getReviews(String shopId, {String? sortBy, int? minRating}) async {
    final params = <String, String>{};
    if (sortBy != null) params['sortBy'] = sortBy;
    if (minRating != null) params['minRating'] = minRating.toString();
    final uri = Uri.parse('$baseUrl/api/reviews/$shopId/filter').replace(queryParameters: params);
    final resp = await http.get(uri);
    if (resp.statusCode == 200) {
      final data = json.decode(resp.body);
      return (data['reviews'] as List).map((j) => Review.fromJson(j)).toList();
    }
    throw Exception('Failed to load reviews');
  }

  static Future<bool> addReview(String shopId, int rating, String comment) async {
    final resp = await http.post(Uri.parse('$baseUrl/api/reviews'),
      headers: AuthService.jsonAuthHeaders,
      body: json.encode({'shopId': shopId, 'rating': rating, 'comment': comment}));
    return resp.statusCode == 201;
  }

  static Future<bool> updateReview(String reviewId, int rating, String comment) async {
    final resp = await http.put(Uri.parse('$baseUrl/api/reviews/$reviewId'),
      headers: AuthService.jsonAuthHeaders,
      body: json.encode({'rating': rating, 'comment': comment}));
    return resp.statusCode == 200;
  }

  static Future<bool> deleteReview(String reviewId) async {
    final resp = await http.delete(Uri.parse('$baseUrl/api/reviews/$reviewId'),
      headers: AuthService.authHeaders);
    return resp.statusCode == 200;
  }

  static Future<Review> getReview(String reviewId) async {
    final resp = await http.get(Uri.parse('$baseUrl/api/reviews/single/$reviewId'));
    if (resp.statusCode == 200) return Review.fromJson(json.decode(resp.body));
    throw Exception('Review not found');
  }

  static Future<Map<String, dynamic>> compareShops(String name1, String name2) async {
    final resp = await http.get(Uri.parse(
      '$baseUrl/api/shops/compare-by-name?shop1=${Uri.encodeComponent(name1)}&shop2=${Uri.encodeComponent(name2)}'));
    if (resp.statusCode == 200) return json.decode(resp.body);
    throw Exception('Comparison failed');
  }

  static Future<bool> toggleFavorite(String shopId, String sessionId) async {
    final checkResp = await http.get(Uri.parse('$baseUrl/api/favorites/check/$shopId?sessionId=$sessionId'));
    if (checkResp.statusCode == 200) {
      final isFav = json.decode(checkResp.body)['isFavorite'] == true;
      if (isFav) {
        final resp = await http.delete(Uri.parse('$baseUrl/api/favorites/$shopId?sessionId=$sessionId'));
        return resp.statusCode == 200;
      } else {
        final resp = await http.post(Uri.parse('$baseUrl/api/favorites'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'shopId': shopId, 'sessionId': sessionId}));
        return resp.statusCode == 201;
      }
    }
    return false;
  }

  static Future<bool> isFavorite(String shopId, String sessionId) async {
    final resp = await http.get(Uri.parse('$baseUrl/api/favorites/check/$shopId?sessionId=$sessionId'));
    if (resp.statusCode == 200) return json.decode(resp.body)['isFavorite'] == true;
    return false;
  }

  static Future<List<Shop>> getFavorites(String sessionId) async {
    final resp = await http.get(Uri.parse('$baseUrl/api/favorites?sessionId=$sessionId'));
    if (resp.statusCode == 200) {
      return (json.decode(resp.body) as List).map((j) => Shop.fromJson(j['shopId'] ?? j)).toList();
    }
    return [];
  }

  static Future<bool> addShop(String name, String category, String location) async {
    final resp = await http.post(Uri.parse('$baseUrl/api/shops'),
      headers: AuthService.jsonAuthHeaders,
      body: json.encode({'name': name, 'category': category, 'location': location}));
    return resp.statusCode == 201;
  }

  static Future<bool> deleteShop(String shopId) async {
    final resp = await http.delete(Uri.parse('$baseUrl/api/shops/$shopId'),
      headers: AuthService.authHeaders);
    return resp.statusCode == 200;
  }

  static Future<bool> toggleHelpful(String reviewId, String sessionId) async {
    final checkResp = await http.get(Uri.parse('$baseUrl/api/reviews/$reviewId/helpful?sessionId=$sessionId'));
    if (checkResp.statusCode == 200) {
      final hasVoted = json.decode(checkResp.body)['hasVoted'] == true;
      if (hasVoted) {
        await http.delete(Uri.parse('$baseUrl/api/reviews/$reviewId/helpful?sessionId=$sessionId'));
      } else {
        await http.post(Uri.parse('$baseUrl/api/reviews/$reviewId/helpful'),
          headers: {'Content-Type': 'application/json'},
          body: json.encode({'sessionId': sessionId}));
      }
      return true;
    }
    return false;
  }

  static Future<Map<String, dynamic>> checkHelpful(String reviewId, String sessionId) async {
    final resp = await http.get(Uri.parse('$baseUrl/api/reviews/$reviewId/helpful?sessionId=$sessionId'));
    if (resp.statusCode == 200) return json.decode(resp.body);
    return {'hasVoted': false, 'helpfulCount': 0};
  }
}
