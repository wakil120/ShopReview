import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

void main() {
  runApp(const ShopReviewApp());
}

class ShopReviewApp extends StatelessWidget {
  const ShopReviewApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ShopReview',
      theme: ThemeData(
        primarySwatch: Colors.indigo,
        useMaterial3: true,
        appBarTheme: const AppBarTheme(
          elevation: 2,
          centerTitle: true,
        ),
      ),
      home: const ShopListPage(),
    );
  }
}

class ShopListPage extends StatefulWidget {
  const ShopListPage({Key? key}) : super(key: key);

  @override
  State<ShopListPage> createState() => _ShopListPageState();
}

class _ShopListPageState extends State<ShopListPage> {
  List<Shop> shops = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    fetchShops();
  }

  /// Fetch shops from the backend API
  Future<void> fetchShops() async {
    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      // For Android emulator, use 10.0.2.2 instead of localhost
      // For web/Chrome, use localhost
      // For physical devices, use your machine's IP address
      final response = await http
          .get(Uri.parse('http://localhost:3000/api/shops'))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(response.body);
        setState(() {
          shops = jsonData.map((json) => Shop.fromJson(json)).toList();
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage = 'Failed to load shops (${response.statusCode})';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: ${e.toString()}';
        isLoading = false;
      });
    }
  }

  /// Generate star rating display
  String generateStars(double rating) {
    int fullStars = rating.toInt();
    String stars = '⭐' * fullStars;
    if (rating % 1 >= 0.5 && fullStars < 5) {
      stars += '✨';
    }
    return stars;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '🏪 ShopReview',
          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 24),
        ),
        elevation: 4,
      ),
      body: isLoading
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading shops...'),
                ],
              ),
            )
          : errorMessage != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 64, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        errorMessage!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 24),
                      ElevatedButton(
                        onPressed: fetchShops,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : shops.isEmpty
                  ? const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.store_outlined,
                              size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('No shops available'),
                        ],
                      ),
                    )
                  : RefreshIndicator(
                      onRefresh: fetchShops,
                      child: ListView.builder(
                        itemCount: shops.length,
                        padding: const EdgeInsets.all(8),
                        itemBuilder: (context, index) {
                          final shop = shops[index];
                          return ShopCard(
                            shop: shop,
                            stars: generateStars(shop.averageRating),
                          );
                        },
                      ),
                    ),
      floatingActionButton: FloatingActionButton(
        onPressed: fetchShops,
        tooltip: 'Refresh',
        child: const Icon(Icons.refresh),
      ),
    );
  }
}

/// Shop Card Widget
class ShopCard extends StatelessWidget {
  final Shop shop;
  final String stars;

  const ShopCard({
    Key? key,
    required this.shop,
    required this.stars,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
      elevation: 2,
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.indigo.shade400, Colors.indigo.shade700],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Center(
            child: Text(
              shop.name.isNotEmpty ? shop.name[0].toUpperCase() : '?',
              style: const TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 24,
              ),
            ),
          ),
        ),
        title: Text(
          shop.name,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 6),
            Text(
              '${shop.category} • ${shop.location}',
              style: const TextStyle(fontSize: 13, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text(
                  shop.averageRating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.amber,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  stars,
                  style: const TextStyle(fontSize: 14),
                ),
                const SizedBox(width: 8),
                Text(
                  '(${shop.reviewCount})',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
        trailing:
            const Icon(Icons.arrow_forward_ios, size: 16, color: Colors.grey),
        onTap: () {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('${shop.name} - ${shop.averageRating} ⭐'),
              duration: const Duration(seconds: 2),
            ),
          );
        },
      ),
    );
  }
}

/// Shop Model
class Shop {
  final String id;
  final String name;
  final String category;
  final String location;
  final double averageRating;
  final int reviewCount;

  Shop({
    required this.id,
    required this.name,
    required this.category,
    required this.location,
    required this.averageRating,
    required this.reviewCount,
  });

  /// Create Shop instance from JSON
  factory Shop.fromJson(Map<String, dynamic> json) {
    return Shop(
      id: json['_id'] ?? '',
      name: json['name'] ?? 'Unknown',
      category: json['category'] ?? 'N/A',
      location: json['location'] ?? 'N/A',
      averageRating: (json['averageRating'] ?? 0).toDouble(),
      reviewCount: json['reviewCount'] ?? 0,
    );
  }
}
