import 'package:flutter/material.dart';
import 'models.dart';
import 'services.dart';

class ShopDetailPage extends StatefulWidget {
  final Shop shop;
  final String sessionId;
  const ShopDetailPage({super.key, required this.shop, required this.sessionId});
  @override
  State<ShopDetailPage> createState() => _ShopDetailPageState();
}

class _ShopDetailPageState extends State<ShopDetailPage> {
  List<Review> _reviews = [];
  bool _isLoading = true;
  String? _error;
  int _selectedRating = 5;
  String _sortBy = 'newest';
  int? _filterRating;
  final _commentC = TextEditingController();
  late Shop _shop;
  bool _isFav = false;

  @override
  void initState() {
    super.initState();
    _shop = widget.shop;
    _refresh();
  }

  Future<void> _refresh() async {
    try {
      _shop = await ApiService.getShop(widget.shop.id);
    } catch (_) {}
    _isFav = await ApiService.isFavorite(_shop.id, widget.sessionId);
    _fetchReviews();
  }

  Future<void> _fetchReviews() async {
    if (!mounted) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final reviews = await ApiService.getReviews(widget.shop.id, sortBy: _sortBy, minRating: _filterRating);
      if (mounted) setState(() { _reviews = reviews; _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  Future<void> _submitReview() async {
    if (_commentC.text.isEmpty) { _showSnack('Please write a comment'); return; }
    if (!AuthService.isLoggedIn) { _showSnack('Please login first'); return; }
    final ok = await ApiService.addReview(widget.shop.id, _selectedRating, _commentC.text.trim());
    if (ok) { _commentC.clear(); setState(() => _selectedRating = 5); _refresh(); _showSnack('Review added!'); }
    else { _showSnack('Failed to add review'); }
  }

  Future<void> _editReview(Review review) async {
    final ratingC = ValueNotifier(review.rating);
    final editC = TextEditingController(text: review.comment);
    final result = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('✏️ Edit Review'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        ValueListenableBuilder<int>(valueListenable: ratingC,
          builder: (_, val, __) => Row(children: [
            const Text('Rating: '),
            ...List.generate(5, (i) => IconButton(
              icon: Icon(i < val ? Icons.star : Icons.star_border, color: Colors.amber),
              onPressed: () => ratingC.value = i + 1, iconSize: 28, padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32))),
          ])),
        const SizedBox(height: 8),
        TextField(controller: editC, maxLines: 3, decoration: const InputDecoration(
          labelText: 'Comment', border: OutlineInputBorder())),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF667eea), foregroundColor: Colors.white),
          onPressed: () async {
            final ok = await ApiService.updateReview(review.id, ratingC.value, editC.text.trim());
            if (context.mounted) Navigator.pop(context, ok);
          }, child: const Text('Update')),
      ]));
    if (result == true) { _refresh(); _showSnack('Review updated!'); }
  }

  Future<void> _deleteReview(Review review) async {
    final confirm = await showDialog<bool>(context: context, builder: (_) => AlertDialog(
      title: const Text('🗑️ Delete Review'),
      content: const Text('Are you sure?'),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
        TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
      ]));
    if (confirm == true) {
      final ok = await ApiService.deleteReview(review.id);
      if (ok) { _refresh(); _showSnack('Review deleted'); } else { _showSnack('Failed to delete'); }
    }
  }

  void _showSnack(String msg) { if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg))); }

  @override
  void dispose() { _commentC.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        flexibleSpace: Container(decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [Color(0xFF667eea), Color(0xFF764ba2)]))),
        title: Text(_shop.name, style: const TextStyle(color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(icon: Icon(_isFav ? Icons.favorite : Icons.favorite_border, color: _isFav ? Colors.red : Colors.white),
            onPressed: () async {
              await ApiService.toggleFavorite(_shop.id, widget.sessionId);
              setState(() => _isFav = !_isFav);
            }),
        ],
      ),
      body: RefreshIndicator(onRefresh: _refresh,
        child: SingleChildScrollView(physics: const AlwaysScrollableScrollPhysics(), child: Column(children: [
          _buildShopInfo(),
          if (_shop.photos.isNotEmpty) _buildPhotoGallery(),
          _buildSortFilter(),
          _buildReviews(),
          if (AuthService.isLoggedIn) _buildAddReviewForm(),
        ]))),
    );
  }

  Widget _buildShopInfo() => Card(
    margin: const EdgeInsets.all(16), elevation: 4,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
    child: Padding(padding: const EdgeInsets.all(20), child: Column(
      crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(_shop.name, style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Row(children: [
          const Icon(Icons.category, size: 16, color: Colors.grey),
          const SizedBox(width: 4),
          Text(_shop.category, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(width: 16),
          const Icon(Icons.location_on, size: 16, color: Colors.grey),
          const SizedBox(width: 4),
          Text(_shop.location, style: TextStyle(color: Colors.grey[600])),
        ]),
        const Divider(height: 24),
        Row(children: [
          Text(_shop.averageRating.toStringAsFixed(1), style: const TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Colors.amber)),
          const SizedBox(width: 12),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: List.generate(5, (i) => Icon(i < _shop.averageRating.floor() ? Icons.star : Icons.star_border, color: Colors.amber, size: 20))),
            const SizedBox(height: 4),
            Text('${_shop.reviewCount} reviews', style: TextStyle(color: Colors.grey[600])),
          ]),
        ]),
      ])));

  Widget _buildPhotoGallery() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('📸 Photo Gallery', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      const SizedBox(height: 8),
      SizedBox(height: 120, child: ListView.builder(
        scrollDirection: Axis.horizontal, itemCount: _shop.photos.length,
        itemBuilder: (_, i) => Container(
          margin: const EdgeInsets.only(right: 8), width: 150,
          decoration: BoxDecoration(borderRadius: BorderRadius.circular(12),
            border: i == _shop.mainPhotoIndex ? Border.all(color: const Color(0xFF667eea), width: 3) : null),
          child: ClipRRect(borderRadius: BorderRadius.circular(12),
            child: Stack(fit: StackFit.expand, children: [
              Image.network('$baseUrl${_shop.photos[i].url}', fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => Container(color: Colors.grey[200], child: const Icon(Icons.broken_image))),
              if (_shop.photos[i].caption.isNotEmpty)
                Positioned(bottom: 0, left: 0, right: 0,
                  child: Container(color: Colors.black54, padding: const EdgeInsets.all(4),
                    child: Text(_shop.photos[i].caption, style: const TextStyle(color: Colors.white, fontSize: 10)))),
              if (i == _shop.mainPhotoIndex)
                Positioned(top: 4, left: 4, child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: const Color(0xFF667eea), borderRadius: BorderRadius.circular(4)),
                  child: const Text('Main', style: TextStyle(color: Colors.white, fontSize: 10)))),
            ]))))),
      const SizedBox(height: 16),
    ]));

  Widget _buildSortFilter() => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 16),
    child: Row(children: [
      const Text('Reviews', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      const Spacer(),
      DropdownButton<String>(value: _sortBy, underline: const SizedBox(), style: const TextStyle(fontSize: 12, color: Colors.black87),
        items: const [
          DropdownMenuItem(value: 'newest', child: Text('Newest')),
          DropdownMenuItem(value: 'oldest', child: Text('Oldest')),
          DropdownMenuItem(value: 'highest', child: Text('Highest')),
          DropdownMenuItem(value: 'lowest', child: Text('Lowest')),
        ],
        onChanged: (v) { if (v != null) { _sortBy = v; _fetchReviews(); } }),
      const SizedBox(width: 8),
      DropdownButton<int?>(value: _filterRating, underline: const SizedBox(), style: const TextStyle(fontSize: 12, color: Colors.black87),
        hint: const Text('Filter', style: TextStyle(fontSize: 12)),
        items: [
          const DropdownMenuItem(value: null, child: Text('All ⭐')),
          ...List.generate(5, (i) => DropdownMenuItem(value: i + 1, child: Text('${i + 1}+ ⭐'))),
        ],
        onChanged: (v) { _filterRating = v; _fetchReviews(); }),
    ]));

  Widget _buildReviews() {
    if (_isLoading) return const Padding(padding: EdgeInsets.all(32), child: Center(child: CircularProgressIndicator()));
    if (_error != null) return Padding(padding: const EdgeInsets.all(32), child: Center(child: Text(_error!, style: const TextStyle(color: Colors.red))));
    if (_reviews.isEmpty) return const Padding(padding: EdgeInsets.all(32), child: Center(child: Text('No reviews yet. Be the first!')));

    return ListView.builder(shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(16), itemCount: _reviews.length,
      itemBuilder: (_, i) {
        final r = _reviews[i];
        final isOwner = AuthService.isLoggedIn && String(r.userId) == String(AuthService.userId);
        final canEdit = isOwner || AuthService.isAdmin;
        return Card(margin: const EdgeInsets.only(bottom: 12), elevation: 2,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          child: Padding(padding: const EdgeInsets.all(14), child: Column(
            crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                CircleAvatar(radius: 16, backgroundColor: const Color(0xFF667eea),
                  child: Text(r.reviewer[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 14))),
                const SizedBox(width: 8),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(r.reviewer, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                  Text(r.dateFormatted, style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                ])),
                Row(mainAxisSize: MainAxisSize.min, children: List.generate(5, (j) =>
                  Icon(j < r.rating ? Icons.star : Icons.star_border, size: 16, color: Colors.amber))),
              ]),
              const SizedBox(height: 10),
              Text(r.comment, style: const TextStyle(fontSize: 14, height: 1.4)),
              if (r.images.isNotEmpty) ...[
                const SizedBox(height: 8),
                SizedBox(height: 80, child: ListView.builder(
                  scrollDirection: Axis.horizontal, itemCount: r.images.length,
                  itemBuilder: (_, j) => Padding(padding: const EdgeInsets.only(right: 8),
                    child: ClipRRect(borderRadius: BorderRadius.circular(8),
                      child: Image.network('$baseUrl${r.images[j]}', width: 80, height: 80, fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(width: 80, height: 80, color: Colors.grey[200], child: const Icon(Icons.broken_image))))))),
              ],
              const SizedBox(height: 8),
              Row(children: [
                _HelpfulButton(reviewId: r.id, sessionId: widget.sessionId, initialCount: r.helpfulCount),
                const Spacer(),
                if (isOwner)
                  IconButton(icon: const Icon(Icons.edit, size: 18, color: Color(0xFF667eea)),
                    onPressed: () => _editReview(r), tooltip: 'Edit'),
                if (canDelete)
                  IconButton(icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                    onPressed: () => _deleteReview(r), tooltip: 'Delete'),
              ]),
            ])));
      });
  }

  Widget _buildAddReviewForm() => Padding(
    padding: const EdgeInsets.all(16),
    child: Card(elevation: 3, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(padding: const EdgeInsets.all(20), child: Column(
        crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('✍️ Write a Review', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          Row(children: [
            const Text('Rating: '),
            ...List.generate(5, (i) => IconButton(
              icon: Icon(i < _selectedRating ? Icons.star : Icons.star_border, color: Colors.amber),
              onPressed: () => setState(() => _selectedRating = i + 1),
              iconSize: 28, padding: EdgeInsets.zero, constraints: const BoxConstraints(minWidth: 36))),
          ]),
          const SizedBox(height: 12),
          TextField(controller: _commentC, maxLines: 3, decoration: InputDecoration(
            labelText: 'Your review...', border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            prefixIcon: const Icon(Icons.comment))),
          const SizedBox(height: 12),
          SizedBox(width: double.infinity, height: 44, child: ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF667eea), foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            onPressed: _submitReview, child: const Text('Submit Review', style: TextStyle(fontWeight: FontWeight.bold)))),
        ]))));
}

class _HelpfulButton extends StatefulWidget {
  final String reviewId, sessionId;
  final int initialCount;
  const _HelpfulButton({required this.reviewId, required this.sessionId, required this.initialCount});
  @override
  State<_HelpfulButton> createState() => _HelpfulButtonState();
}

class _HelpfulButtonState extends State<_HelpfulButton> {
  bool _voted = false;
  int _count = 0;

  @override
  void initState() {
    super.initState();
    _count = widget.initialCount;
    _check();
  }

  Future<void> _check() async {
    final data = await ApiService.checkHelpful(widget.reviewId, widget.sessionId);
    if (mounted) setState(() { _voted = data['hasVoted'] == true; _count = (data['helpfulCount'] as num?)?.toInt() ?? _count; });
  }

  @override
  Widget build(BuildContext context) => TextButton.icon(
    style: TextButton.styleFrom(foregroundColor: _voted ? const Color(0xFF667eea) : Colors.grey[600]),
    icon: Icon(_voted ? Icons.thumb_up : Icons.thumb_up_outlined, size: 16),
    label: Text('Helpful ($_count)', style: const TextStyle(fontSize: 12)),
    onPressed: () async {
      await ApiService.toggleHelpful(widget.reviewId, widget.sessionId);
      _check();
    });
}
