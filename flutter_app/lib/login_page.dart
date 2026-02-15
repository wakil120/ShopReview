import 'package:flutter/material.dart';
import 'services.dart';

class LoginPage extends StatefulWidget {
  final VoidCallback onLoginSuccess;
  const LoginPage({super.key, required this.onLoginSuccess});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool _isLogin = true, _isLoading = false, _obscurePass = true;
  final _emailC = TextEditingController();
  final _passC = TextEditingController();
  final _usernameC = TextEditingController();
  String? _error;

  @override
  void dispose() { _emailC.dispose(); _passC.dispose(); _usernameC.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (_emailC.text.isEmpty || _passC.text.isEmpty || (!_isLogin && _usernameC.text.isEmpty)) {
      setState(() => _error = 'Please fill all fields');
      return;
    }
    setState(() { _isLoading = true; _error = null; });

    final result = _isLogin
        ? await AuthService.login(_emailC.text.trim(), _passC.text)
        : await AuthService.register(_usernameC.text.trim(), _emailC.text.trim(), _passC.text);

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (result['success'] == true) {
      widget.onLoginSuccess();
      Navigator.pop(context);
    } else {
      setState(() => _error = result['message'] ?? 'An error occurred');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft, end: Alignment.bottomRight,
            colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Card(
                elevation: 12,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                child: Padding(
                  padding: const EdgeInsets.all(32),
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    Text(_isLogin ? '🔐 Welcome Back' : '🎉 Create Account',
                      style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(_isLogin ? 'Sign in to continue' : 'Join ShopReview today',
                      style: TextStyle(color: Colors.grey[600])),
                    const SizedBox(height: 24),
                    if (_error != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.red[50], borderRadius: BorderRadius.circular(8)),
                        child: Text(_error!, style: TextStyle(color: Colors.red[700]))),
                    if (!_isLogin) ...[
                      TextField(
                        controller: _usernameC,
                        decoration: InputDecoration(
                          labelText: 'Username', prefixIcon: const Icon(Icons.person),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
                      const SizedBox(height: 16),
                    ],
                    TextField(
                      controller: _emailC,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        labelText: 'Email', prefixIcon: const Icon(Icons.email),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passC,
                      obscureText: _obscurePass,
                      decoration: InputDecoration(
                        labelText: 'Password', prefixIcon: const Icon(Icons.lock),
                        suffixIcon: IconButton(
                          icon: Icon(_obscurePass ? Icons.visibility_off : Icons.visibility),
                          onPressed: () => setState(() => _obscurePass = !_obscurePass)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)))),
                    const SizedBox(height: 24),
                    SizedBox(
                      width: double.infinity, height: 48,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _submit,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF667eea),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                        child: _isLoading
                            ? const SizedBox(height: 20, width: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                            : Text(_isLogin ? 'Login' : 'Register',
                                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold)))),
                    const SizedBox(height: 16),
                    TextButton(
                      onPressed: () => setState(() { _isLogin = !_isLogin; _error = null; }),
                      child: Text(_isLogin
                          ? "Don't have an account? Sign up"
                          : 'Already have an account? Login',
                        style: const TextStyle(color: Color(0xFF667eea)))),
                  ]),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
