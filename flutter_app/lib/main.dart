import 'package:flutter/material.dart';
import 'services.dart';
import 'home_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await AuthService.init();
  runApp(const ShopReviewApp());
}

class ShopReviewApp extends StatelessWidget {
  const ShopReviewApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ShopReview',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        primarySwatch: Colors.indigo,
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF667eea),
          brightness: Brightness.light,
        ),
        appBarTheme: const AppBarTheme(
          elevation: 2,
          centerTitle: true,
        ),
        cardTheme: CardTheme(
          elevation: 3,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
        inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
          filled: true,
          fillColor: Colors.grey[50],
        ),
      ),
      home: const HomePage(),
    );
  }
}
