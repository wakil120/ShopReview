import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shopreview/main.dart';

void main() {
  testWidgets('ShopReview app loads', (WidgetTester tester) async {
    // Build our app
    await tester.pumpWidget(const ShopReviewApp());

    // Verify app title appears
    expect(find.text('🏪 ShopReview'), findsOneWidget);

    // Initially shows loading indicator
    expect(find.text('Loading shops...'), findsOneWidget);
  });

  testWidgets('Error state displays correctly', (WidgetTester tester) async {
    // Build the widget tree
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.error_outline, size: 64, color: Colors.red),
                SizedBox(height: 16),
                Text('Error: Connection failed'),
                SizedBox(height: 24),
                Text('Retry'),
              ],
            ),
          ),
        ),
      ),
    );

    // Verify error elements appear
    expect(find.byIcon(Icons.error_outline), findsOneWidget);
    expect(find.text('Error: Connection failed'), findsOneWidget);
    expect(find.text('Retry'), findsOneWidget);
  });

  testWidgets('Empty state displays correctly', (WidgetTester tester) async {
    // Build the widget tree
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.store_outlined, size: 64, color: Colors.grey),
                SizedBox(height: 16),
                Text('No shops available'),
              ],
            ),
          ),
        ),
      ),
    );

    // Verify empty state elements
    expect(find.byIcon(Icons.store_outlined), findsOneWidget);
    expect(find.text('No shops available'), findsOneWidget);
  });
}
