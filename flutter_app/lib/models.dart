// Data models for the ShopReview Flutter app

class Shop {
  final String id, name, category, location;
  final double averageRating;
  final int reviewCount;
  final List<ShopPhoto> photos;
  final int mainPhotoIndex;

  Shop({required this.id, required this.name, required this.category,
    required this.location, required this.averageRating, required this.reviewCount,
    this.photos = const [], this.mainPhotoIndex = 0});

  factory Shop.fromJson(Map<String, dynamic> j) => Shop(
    id: j['_id']?.toString() ?? '',
    name: j['name']?.toString() ?? 'Unknown',
    category: j['category']?.toString() ?? 'N/A',
    location: j['location']?.toString() ?? 'N/A',
    averageRating: (j['averageRating'] as num?)?.toDouble() ?? 0.0,
    reviewCount: (j['reviewCount'] as num?)?.toInt() ?? 0,
    photos: (j['photos'] as List?)?.map((p) => ShopPhoto.fromJson(p)).toList() ?? [],
    mainPhotoIndex: (j['mainPhotoIndex'] as num?)?.toInt() ?? 0,
  );
}

class ShopPhoto {
  final String url, caption;
  ShopPhoto({required this.url, this.caption = ''});
  factory ShopPhoto.fromJson(Map<String, dynamic> j) => ShopPhoto(
    url: j['url']?.toString() ?? '', caption: j['caption']?.toString() ?? '');
}

class Review {
  final String id, reviewer, comment, date, userId, shopId;
  final int rating, helpfulCount;
  final List<String> images;

  Review({required this.id, required this.reviewer, required this.rating,
    required this.comment, required this.date, this.userId = '',
    this.shopId = '', this.helpfulCount = 0, this.images = const []});

  String get dateFormatted {
    try {
      final dt = DateTime.parse(date);
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) { return date; }
  }

  factory Review.fromJson(Map<String, dynamic> j) => Review(
    id: j['_id']?.toString() ?? '',
    reviewer: j['reviewer']?.toString() ?? 'Anonymous',
    rating: (j['rating'] as num?)?.toInt() ?? 0,
    comment: j['comment']?.toString() ?? '',
    date: j['date']?.toString() ?? DateTime.now().toIso8601String(),
    userId: j['userId']?.toString() ?? '',
    shopId: j['shopId']?.toString() ?? '',
    helpfulCount: (j['helpfulCount'] as num?)?.toInt() ?? 0,
    images: (j['images'] as List?)?.map((e) => e.toString()).toList() ?? [],
  );
}

class AppUser {
  final String id, username, email, role, token;
  AppUser({required this.id, required this.username, required this.email,
    required this.role, required this.token});

  bool get isAdmin => role == 'admin';

  factory AppUser.fromJson(Map<String, dynamic> j) => AppUser(
    id: j['_id']?.toString() ?? '',
    username: j['username']?.toString() ?? '',
    email: j['email']?.toString() ?? '',
    role: j['role']?.toString() ?? 'user',
    token: j['token']?.toString() ?? '',
  );

  Map<String, dynamic> toJson() => {
    '_id': id, 'username': username, 'email': email, 'role': role, 'token': token,
  };
}
