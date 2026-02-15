import 'package:flutter/material.dart';
import 'dart:math';
import 'models.dart';
import 'services.dart';
import 'login_page.dart';
import 'shop_detail_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});
  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Shop> _shops = [], _filteredShops = [];
  bool _isLoading = true;
  String? _error, _selectedCategory, _selectedLocation;
  final _searchC = TextEditingController();
  String _sessionId = '';
  Set<String> _favoriteIds = {};

  @override
  void initState() {
    super.initState();
    _sessionId = 'flutter_${DateTime.now().millisecondsSinceEpoch}_${Random().nextInt(99999)}';
    _init();
  }

  Future<void> _init() async {
    await AuthService.init();
    await _fetchShops();
    _loadFavorites();
  }

  Future<void> _fetchShops() async {
    if (!mounted) return;
    setState(() { _isLoading = true; _error = null; });
    try {
      final shops = await ApiService.getShops();
      if (mounted) setState(() { _shops = shops; _applyFilters(); _isLoading = false; });
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _isLoading = false; });
    }
  }

  void _applyFilters() {
    _filteredShops = _shops.where((s) {
      if (_selectedCategory != null && s.category.toLowerCase() != _selectedCategory!.toLowerCase()) return false;
      if (_selectedLocation != null && s.location.toLowerCase() != _selectedLocation!.toLowerCase()) return false;
      if (_searchC.text.isNotEmpty && !s.name.toLowerCase().contains(_searchC.text.toLowerCase())) return false;
      return true;
    }).toList();
  }

  Future<void> _loadFavorites() async {
    final favs = await ApiService.getFavorites(_sessionId);
    if (mounted) setState(() => _favoriteIds = favs.map((s) => s.id).toSet());
  }

  Future<void> _toggleFavorite(String shopId) async {
    await ApiService.toggleFavorite(shopId, _sessionId);
    setState(() {
      if (_favoriteIds.contains(shopId)) { _favoriteIds.remove(shopId); }
      else { _favoriteIds.add(shopId); }
    });
  }

  Set<String> get _categories => _shops.map((s) => s.category).toSet();
  Set<String> get _locations => _shops.map((s) => s.location).toSet();

  void _navigateToLogin() {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => LoginPage(onLoginSuccess: () => setState(() {}))));
  }

  void _logout() async {
    final confirmed = await showDialog<bool>(context: context,
      builder: (_) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to log out?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('No')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Yes')),
        ]));
    if (confirmed == true) { await AuthService.logout(); setState(() {}); }
  }

  void _showAddShopDialog() {
    final nameC = TextEditingController(), catC = TextEditingController(), locC = TextEditingController();
    showDialog(context: context, builder: (_) => AlertDialog(
      title: const Text('➕ Add New Shop'),
      content: Column(mainAxisSize: MainAxisSize.min, children: [
        TextField(controller: nameC, decoration: const InputDecoration(labelText: 'Shop Name', prefixIcon: Icon(Icons.store))),
        const SizedBox(height: 8),
        TextField(controller: catC, decoration: const InputDecoration(labelText: 'Category', prefixIcon: Icon(Icons.category))),
        const SizedBox(height: 8),
        TextField(controller: locC, decoration: const InputDecoration(labelText: 'Location', prefixIcon: Icon(Icons.location_on))),
      ]),
      actions: [
        TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF667eea), foregroundColor: Colors.white),
          onPressed: () async {
            if (nameC.text.isNotEmpty && catC.text.isNotEmpty && locC.text.isNotEmpty) {
              final ok = await ApiService.addShop(nameC.text.trim(), catC.text.trim(), locC.text.trim());
              if (context.mounted) Navigator.pop(context);
              if (ok) { _fetchShops(); _showSnack('Shop added!'); } else { _showSnack('Failed'); }
            }
          }, child: const Text('Add')),
      ]));
  }

  void _showComparator() {
    final c1 = TextEditingController(), c2 = TextEditingController();
    showDialog(context: context, builder: (_) => StatefulBuilder(
      builder: (ctx, setDialogState) {
        Map<String, dynamic>? result;
        return AlertDialog(
          title: const Text('⚖️ Compare Shops'),
          content: SizedBox(width: double.maxFinite, child: SingleChildScrollView(child: Column(mainAxisSize: MainAxisSize.min, children: [
            TextField(controller: c1, decoration: const InputDecoration(labelText: 'Shop 1', prefixIcon: Icon(Icons.store))),
            const Padding(padding: EdgeInsets.symmetric(vertical: 8), child: Text('VS', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF667eea)))),
            TextField(controller: c2, decoration: const InputDecoration(labelText: 'Shop 2', prefixIcon: Icon(Icons.store))),
            const SizedBox(height: 12),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF667eea), foregroundColor: Colors.white),
              onPressed: () async {
                if (c1.text.isNotEmpty && c2.text.isNotEmpty) {
                  try {
                    final r = await ApiService.compareShops(c1.text.trim(), c2.text.trim());
                    setDialogState(() => result = r);
                  } catch (e) { _showSnack('Comparison failed: $e'); }
                }
              }, child: const Text('Compare Now')),
            if (result != null) ...[
              const SizedBox(height: 16),
              _buildCompareResult(result!),
            ],
          ]))),
          actions: [TextButton(onPressed: () => Navigator.pop(context), child: const Text('Close'))],
        );
      }));
  }

  Widget _buildCompareResult(Map<String, dynamic> data) {
    final s1 = data['shop1'] ?? {}, s2 = data['shop2'] ?? {};
    final w = data['winner'];
    return Card(
      color: Colors.grey[50], child: Padding(padding: const EdgeInsets.all(12),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        if (w != null) Text('🏆 Winner: ${w['name']}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF667eea))),
        const SizedBox(height: 8),
        _compareRow('Rating', '${s1['averageRating'] ?? 0}', '${s2['averageRating'] ?? 0}'),
        _compareRow('Reviews', '${s1['reviewCount'] ?? 0}', '${s2['reviewCount'] ?? 0}'),
        _compareRow('Category', '${s1['category'] ?? ''}', '${s2['category'] ?? ''}'),
      ])));
  }

  Widget _compareRow(String label, String v1, String v2) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(children: [
      Expanded(child: Text(v1, textAlign: TextAlign.center)),
      SizedBox(width: 80, child: Text(label, textAlign: TextAlign.center, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12))),
      Expanded(child: Text(v2, textAlign: TextAlign.center)),
    ]));

  void _showFavorites() {
    showModalBottomSheet(context: context, isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.6, minChildSize: 0.3, maxChildSize: 0.9, expand: false,
        builder: (_, controller) => Column(children: [
          Padding(padding: const EdgeInsets.all(16),
            child: Row(children: [
              const Icon(Icons.favorite, color: Colors.red),
              const SizedBox(width: 8),
              const Text('My Favorites', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
              const Spacer(),
              IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close)),
            ])),
          Expanded(child: FutureBuilder<List<Shop>>(
            future: ApiService.getFavorites(_sessionId),
            builder: (_, snap) {
              if (snap.connectionState == ConnectionState.waiting) return const Center(child: CircularProgressIndicator());
              final favs = snap.data ?? [];
              if (favs.isEmpty) return const Center(child: Text('No favorites yet'));
              return ListView.builder(controller: controller, itemCount: favs.length,
                itemBuilder: (_, i) => ListTile(
                  leading: CircleAvatar(backgroundColor: const Color(0xFF667eea), child: Text(favs[i].name[0], style: const TextStyle(color: Colors.white))),
                  title: Text(favs[i].name), subtitle: Text('${favs[i].category} • ${favs[i].location}'),
                  trailing: Text('${favs[i].averageRating.toStringAsFixed(1)} ⭐'),
                  onTap: () { Navigator.pop(context); _openShopDetail(favs[i]); },
                ));
            })),
        ])));
  }

  void _openShopDetail(Shop shop) {
    Navigator.push(context, MaterialPageRoute(
      builder: (_) => ShopDetailPage(shop: shop, sessionId: _sessionId))).then((_) => _fetchShops());
  }

  void _showSnack(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        flexibleSpace: Container(decoration: const BoxDecoration(
          gradient: LinearGradient(colors: [Color(0xFF667eea), Color(0xFF764ba2)]))),
        title: const Text('🏪 ShopReview', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(icon: const Icon(Icons.compare_arrows), onPressed: _showComparator, tooltip: 'Compare'),
          Stack(children: [
            IconButton(icon: const Icon(Icons.favorite), onPressed: _showFavorites, tooltip: 'Favorites'),
            if (_favoriteIds.isNotEmpty) Positioned(right: 4, top: 4, child: Container(
              padding: const EdgeInsets.all(4), decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
              child: Text('${_favoriteIds.length}', style: const TextStyle(color: Colors.white, fontSize: 10)))),
          ]),
          if (AuthService.isLoggedIn) ...[
            PopupMenuButton(icon: const Icon(Icons.person, color: Colors.white), itemBuilder: (_) => [
              PopupMenuItem(child: Text('👤 ${AuthService.currentUser!.username}', style: const TextStyle(fontWeight: FontWeight.bold))),
              if (AuthService.isAdmin) PopupMenuItem(onTap: _showAddShopDialog, child: const Text('➕ Add Shop')),
              PopupMenuItem(onTap: _logout, child: const Text('🚪 Logout')),
            ]),
          ] else
            IconButton(icon: const Icon(Icons.login), onPressed: _navigateToLogin, tooltip: 'Login'),
          IconButton(icon: const Icon(Icons.refresh), onPressed: _fetchShops),
        ],
      ),
      body: Column(children: [
        // Search
        Padding(padding: const EdgeInsets.all(12),
          child: TextField(
            controller: _searchC,
            onChanged: (_) => setState(() => _applyFilters()),
            decoration: InputDecoration(
              hintText: 'Search shops...', prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchC.text.isNotEmpty ? IconButton(icon: const Icon(Icons.clear),
                onPressed: () { _searchC.clear(); setState(() => _applyFilters()); }) : null,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              filled: true, fillColor: Colors.grey[50]))),
        // Filters
        SizedBox(height: 40, child: ListView(scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 12), children: [
          _filterChip('All', _selectedCategory == null && _selectedLocation == null, () => setState(() { _selectedCategory = null; _selectedLocation = null; _applyFilters(); })),
          const SizedBox(width: 4),
          ..._categories.map((c) => Padding(padding: const EdgeInsets.only(right: 4),
            child: _filterChip(c, _selectedCategory == c, () => setState(() { _selectedCategory = _selectedCategory == c ? null : c; _applyFilters(); })))),
          const SizedBox(width: 8),
          const VerticalDivider(),
          const SizedBox(width: 8),
          ..._locations.map((l) => Padding(padding: const EdgeInsets.only(right: 4),
            child: _filterChip('📍$l', _selectedLocation == l, () => setState(() { _selectedLocation = _selectedLocation == l ? null : l; _applyFilters(); })))),
        ])),
        const SizedBox(height: 8),
        // Shop list
        Expanded(child: _buildBody()),
      ]),
      floatingActionButton: AuthService.isAdmin ? FloatingActionButton(
        backgroundColor: const Color(0xFF667eea), foregroundColor: Colors.white,
        onPressed: _showAddShopDialog, child: const Icon(Icons.add)) : null,
    );
  }

  Widget _filterChip(String label, bool selected, VoidCallback onTap) => GestureDetector(onTap: onTap,
    child: Chip(label: Text(label, style: TextStyle(color: selected ? Colors.white : Colors.black87, fontSize: 12)),
      backgroundColor: selected ? const Color(0xFF667eea) : Colors.grey[200],
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap));

  Widget _buildBody() {
    if (_isLoading) return const Center(child: CircularProgressIndicator());
    if (_error != null) return Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      const Icon(Icons.error_outline, size: 64, color: Colors.red),
      const SizedBox(height: 16),
      Padding(padding: const EdgeInsets.all(32), child: Text(_error!, textAlign: TextAlign.center)),
      ElevatedButton(onPressed: _fetchShops, child: const Text('Retry'))]));
    if (_filteredShops.isEmpty) return const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
      Icon(Icons.store_outlined, size: 64, color: Colors.grey),
      SizedBox(height: 16), Text('No shops found')]));

    return RefreshIndicator(onRefresh: _fetchShops,
      child: ListView.builder(itemCount: _filteredShops.length, padding: const EdgeInsets.all(8),
        itemBuilder: (_, i) {
          final shop = _filteredShops[i];
          final isFav = _favoriteIds.contains(shop.id);
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 6), elevation: 3,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: InkWell(
              borderRadius: BorderRadius.circular(12),
              onTap: () => _openShopDetail(shop),
              child: Padding(padding: const EdgeInsets.all(16), child: Row(children: [
                Container(width: 50, height: 50,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(colors: [Color(0xFF667eea), Color(0xFF764ba2)]),
                    borderRadius: BorderRadius.circular(10)),
                  child: Center(child: Text(shop.name[0].toUpperCase(),
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 22)))),
                const SizedBox(width: 16),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(shop.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 4),
                  Text('${shop.category} • ${shop.location}', style: TextStyle(fontSize: 13, color: Colors.grey[600])),
                  const SizedBox(height: 6),
                  Row(children: [
                    Text(shop.averageRating.toStringAsFixed(1), style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.amber)),
                    const SizedBox(width: 4),
                    ...List.generate(5, (j) => Icon(j < shop.averageRating.floor() ? Icons.star : Icons.star_border, size: 16, color: Colors.amber)),
                    const SizedBox(width: 8),
                    Text('(${shop.reviewCount})', style: TextStyle(fontSize: 12, color: Colors.grey[500])),
                  ]),
                ])),
                Column(children: [
                  IconButton(icon: Icon(isFav ? Icons.favorite : Icons.favorite_border,
                    color: isFav ? Colors.red : Colors.grey), onPressed: () => _toggleFavorite(shop.id)),
                  if (AuthService.isAdmin)
                    IconButton(icon: const Icon(Icons.delete, color: Colors.red, size: 20),
                      onPressed: () async {
                        final confirm = await showDialog<bool>(context: context,
                          builder: (_) => AlertDialog(
                            title: const Text('Delete Shop?'),
                            content: Text('Delete "${shop.name}"?'),
                            actions: [
                              TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
                              TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
                            ]));
                        if (confirm == true) {
                          final ok = await ApiService.deleteShop(shop.id);
                          if (ok) { _fetchShops(); _showSnack('Shop deleted'); }
                        }
                      }),
                ]),
              ])),
            ),
          );
        }));
  }
}
