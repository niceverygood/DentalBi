import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

class AuthService extends ChangeNotifier {
  String? _token;
  String? _userName;
  String? _serverUrl;

  bool get isAuthenticated => _token != null;
  String? get token => _token;
  String? get userName => _userName;
  String get serverUrl => _serverUrl ?? 'http://localhost:8000';

  AuthService() {
    _loadSavedAuth();
  }

  Future<void> _loadSavedAuth() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('access_token');
    _userName = prefs.getString('user_name');
    _serverUrl = prefs.getString('server_url');
    notifyListeners();
  }

  Future<bool> login(String email, String password, String serverUrl) async {
    try {
      _serverUrl = serverUrl;
      final response = await http.post(
        Uri.parse('$serverUrl/api/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        _token = data['access_token'];
        _userName = data['user']['name'];

        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('access_token', _token!);
        await prefs.setString('user_name', _userName!);
        await prefs.setString('server_url', serverUrl);

        notifyListeners();
        return true;
      }
    } catch (e) {
      debugPrint('Login error: $e');
    }
    return false;
  }

  Future<void> logout() async {
    _token = null;
    _userName = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('user_name');
    notifyListeners();
  }
}
