import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'dart:io'; // For Platform check

void main() {
  runApp(const ShopReviewApp());
}

class ShopReviewApp extends StatelessWidget {
  const ShopReviewApp({super.key});

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

// Base URL helper
String get baseUrl {
  if (kIsWeb) {
    return 'http://localhost:5000'; // ← FIXED: Changed from 3000 to 5000
  }
  if (Platform.isAndroid) {
    return 'http://10.0.2.2:5000'; // ← Also update Android emulator if you test on it
  }
  return 'http://localhost:5000'; // ← Update all to 5000 for consistency
}

class ShopListPage extends StatefulWidget {
  const ShopListPage({super.key});

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

  Future<void> fetchShops() async {
    if (!mounted) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await http
          .get(Uri.parse('$baseUrl/api/shops'))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(response.body);
        if (mounted) {
          setState(() {
            shops = jsonData.map((json) => Shop.fromJson(json)).toList();
            isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            errorMessage = 'Failed to load shops (${response.statusCode})';
            isLoading = false;
          });
        }
      }
    } catch (e) {
      // ← FIXED: Removed extra } and added space
      if (mounted) {
        setState(() {
          errorMessage = 'Connection Error: ${e.toString()}\n\n'
              'Please ensure:\n'
              '1. Backend server is running (npm start in backend/)\n'
              '2. MongoDB is running (mongod command)\n'
              '3. Correct IP for your platform:\n'
              '   - Android Emulator: 10.0.2.2:3000\n'
              '   - iOS Simulator: localhost:3000\n'
              '   - Web: localhost:3000';
          isLoading = false;
        });
      }
    }
  }

  String generateStars(double rating) {
    int fullStars = rating.floor();
    bool hasHalfStar = (rating - fullStars) >= 0.5;

    String stars = '⭐' * fullStars;
    if (hasHalfStar) {
      stars += '✨';
    }
    // Add empty stars
    int totalStars = fullStars + (hasHalfStar ? 1 : 0);
    stars += '☆' * (5 - totalStars);

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
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: fetchShops,
          ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading shops...'),
          ],
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 32),
              child: Text(
                errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: fetchShops,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (shops.isEmpty) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.store_outlined, size: 64, color: Colors.grey),
            SizedBox(height: 16),
            Text('No shops available'),
            SizedBox(height: 8),
            Text('Check if backend server is running'),
          ],
        ),
      );
    }

    return RefreshIndicator(
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
    );
  }
}

class ShopCard extends StatelessWidget {
  final Shop shop;
  final String stars;

  const ShopCard({
    super.key,
    required this.shop,
    required this.stars,
  });

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
          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
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
                Text(stars, style: const TextStyle(fontSize: 14)),
                const SizedBox(width: 8),
                Text(
                  '(${shop.reviewCount})',
                  style: const TextStyle(fontSize: 12, color: Colors.grey),
                ),
              ],
            ),
          ],
        ),
        trailing: const Icon(
          Icons.arrow_forward_ios,
          size: 16,
          color: Colors.grey,
        ),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ShopDetailPage(shop: shop),
            ),
          );
        },
      ),
    );
  }
}

class ShopDetailPage extends StatefulWidget {
  final Shop shop;

  const ShopDetailPage({super.key, required this.shop});

  @override
  State<ShopDetailPage> createState() => _ShopDetailPageState();
}

class _ShopDetailPageState extends State<ShopDetailPage> {
  List<Review> reviews = [];
  bool isLoading = true;
  String? errorMessage;
  final _commentController = TextEditingController();
  final _reviewerController = TextEditingController();
  int _selectedRating = 5;

  @override
  void initState() {
    super.initState();
    fetchReviews();
  }

  Future<void> fetchReviews() async {
    if (!mounted) return;

    setState(() {
      isLoading = true;
      errorMessage = null;
    });

    try {
      final response = await http
          .get(Uri.parse('$baseUrl/api/reviews/${widget.shop.id}'))
          .timeout(const Duration(seconds: 10));

      if (response.statusCode == 200) {
        final List<dynamic> jsonData = json.decode(response.body);
        if (mounted) {
          setState(() {
            reviews = jsonData.map((json) => Review.fromJson(json)).toList();
            isLoading = false;
          });
        }
      } else {
        if (mounted) {
          setState(() {
            errorMessage = 'Failed to load reviews';
            isLoading = false;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          errorMessage = 'Error: ${e.toString()}';
          isLoading = false;
        });
      }
    }
  }

  Future<void> addReview() async {
    if (_commentController.text.isEmpty || _reviewerController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill all fields')),
      );
      return;
    }

    try {
      final response = await http.post(
        Uri.parse('$baseUrl/api/reviews'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({
          'shopId': widget.shop.id,
          'rating': _selectedRating,
          'comment': _commentController.text,
          'reviewer': _reviewerController.text,
        }),
      );

      if (response.statusCode == 201) {
        _commentController.clear();
        _reviewerController.clear();
        setState(() {
          _selectedRating = 5;
        });
        fetchReviews();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review added successfully!')),
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Failed to add review')),
        );
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    }
  }

  @override
  void dispose() {
    _commentController.dispose();
    _reviewerController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.shop.name),
        elevation: 4,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            _buildShopInfo(),
            _buildReviewsSection(),
            _buildAddReviewForm(),
          ],
        ),
      ),
    );
  }

  Widget _buildShopInfo() {
    return Card(
      margin: const EdgeInsets.all(16),
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        widget.shop.name,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${widget.shop.category} • ${widget.shop.location}',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.grey,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const Divider(height: 24),
            Row(
              children: [
                Text(
                  widget.shop.averageRating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.amber,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '⭐' * widget.shop.averageRating.floor(),
                      style: const TextStyle(fontSize: 20),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${widget.shop.reviewCount} reviews',
                      style: const TextStyle(
                        fontSize: 14,
                        color: Colors.grey,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildReviewsSection() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Reviews',
            style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 16),
          if (isLoading)
            const Center(child: CircularProgressIndicator())
          else if (errorMessage != null)
            Center(
              child: Text(
                errorMessage!,
                style: const TextStyle(color: Colors.red),
              ),
            )
          else if (reviews.isEmpty)
            const Center(
              child: Padding(
                padding: EdgeInsets.all(32),
                child: Text('No reviews yet. Be the first!'),
              ),
            )
          else
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: reviews.length,
              itemBuilder: (context, index) {
                final review = reviews[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              review.reviewer,
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              '${review.rating} ⭐',
                              style: const TextStyle(
                                color: Colors.amber,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          review.comment,
                          style: const TextStyle(fontSize: 13),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          review.dateFormatted,
                          style: const TextStyle(
                            fontSize: 11,
                            color: Colors.grey,
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildAddReviewForm() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Card(
        elevation: 2,
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Add Your Review',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  const Text('Rating:'),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Slider(
                      value: _selectedRating.toDouble(),
                      min: 1,
                      max: 5,
                      divisions: 4,
                      label: _selectedRating.toString(),
                      onChanged: (value) {
                        setState(() {
                          _selectedRating = value.toInt();
                        });
                      },
                    ),
                  ),
                  Text(
                    '$_selectedRating ⭐',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.amber,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _reviewerController,
                decoration: const InputDecoration(
                  labelText: 'Your Name',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: _commentController,
                decoration: const InputDecoration(
                  labelText: 'Your Review',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.comment),
                  hintText: 'Share your experience...',
                ),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: addReview,
                  child: const Text('Submit Review'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class Review {
  final String id;
  final String reviewer;
  final int rating;
  final String comment;
  final String date;

  Review({
    required this.id,
    required this.reviewer,
    required this.rating,
    required this.comment,
    required this.date,
  });

  String get dateFormatted {
    try {
      final dt = DateTime.parse(date);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (e) {
      return date;
    }
  }

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['_id']?.toString() ?? '',
      reviewer: json['reviewer']?.toString() ?? 'Anonymous',
      rating: (json['rating'] as num?)?.toInt() ?? 0,
      comment: json['comment']?.toString() ?? '',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String(),
    );
  }
}

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

  factory Shop.fromJson(Map<String, dynamic> json) {
    return Shop(
      id: json['_id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown',
      category: json['category']?.toString() ?? 'N/A',
      location: json['location']?.toString() ?? 'N/A',
      averageRating: (json['averageRating'] as num?)?.toDouble() ?? 0.0,
      reviewCount: (json['reviewCount'] as num?)?.toInt() ?? 0,
    );
  }
}
