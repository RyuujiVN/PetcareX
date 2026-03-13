import 'dart:io';
import 'package:flutter/material.dart';
import '../../../l10n/generated/app_localizations.dart'; // Import mới
import 'package:provider/provider.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/services/camera_service.dart';
import '../../auth/presentation/providers/auth_provider.dart';
import '../../pet/presentation/provider/pet_provider.dart';

class CommunityPage extends StatefulWidget {
  const CommunityPage({super.key});

  @override
  State<CommunityPage> createState() => _CommunityPageState();
}

class _CommunityPageState extends State<CommunityPage> {
  int _selectedCategoryIndex = 0;
  final CameraService _cameraService = CameraService();
  bool _isUploading = false;

  Future<void> _handleImageUpload() async {
    final File? image = await _cameraService.pickImageFromGallery();
    if (image == null) return;

    if (!mounted) return;
    setState(() => _isUploading = true);

    try {
      final petProvider = context.read<PetProvider>();
      await petProvider.uploadAvatar(image.path);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Success!')));
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final List<String> categories = [l10n.all, l10n.petExperience, l10n.askDoctor];

    return Scaffold(
      backgroundColor: const Color(0xFFF8FBFB),
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(l10n),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPostInput(l10n),
                    _buildCategoryTabs(categories),
                    _buildFeaturedSection(l10n),
                    _buildPostList(l10n),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar(AppLocalizations l10n) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              height: 44,
              decoration: BoxDecoration(color: const Color(0xFFF1F3F4), borderRadius: BorderRadius.circular(12)),
              child: Row(
                children: [
                  const Icon(Icons.search, color: Colors.grey, size: 20),
                  const SizedBox(width: 8),
                  Text(l10n.searchHint, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          const Icon(Icons.notifications_none_outlined, color: Colors.black87, size: 28),
        ],
      ),
    );
  }

  Widget _buildPostInput(AppLocalizations l10n) {
    final user = context.watch<AuthProvider>().user;
    return Container(
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            children: [
              CircleAvatar(radius: 20, backgroundImage: user?.avatarUrl != null ? NetworkImage(user!.avatarUrl!) : const NetworkImage('https://i.pravatar.cc/150?u=man1')),
              const SizedBox(width: 12),
              Expanded(child: Text(l10n.shareSomething, style: const TextStyle(color: Colors.grey, fontSize: 14))),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _isUploading ? const CircularProgressIndicator() : IconButton(onPressed: _handleImageUpload, icon: const Icon(Icons.image_outlined, color: Colors.grey)),
              const Spacer(),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                child: Text(l10n.post, style: const TextStyle(fontWeight: FontWeight.bold)),
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildCategoryTabs(List<String> categories) {
    return Container(
      height: 50,
      decoration: const BoxDecoration(color: Colors.white, border: Border(bottom: BorderSide(color: Color(0xFFEEEEEE)))),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: categories.length,
        itemBuilder: (context, index) {
          bool isSelected = _selectedCategoryIndex == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedCategoryIndex = index),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              decoration: BoxDecoration(border: Border(bottom: BorderSide(color: isSelected ? AppColors.primary : Colors.transparent, width: 2))),
              alignment: Alignment.center,
              child: Text(categories[index], style: TextStyle(color: isSelected ? Colors.black : Colors.grey, fontWeight: isSelected ? FontWeight.bold : FontWeight.normal)),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFeaturedSection(AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(padding: const EdgeInsets.all(20), child: Row(children: [const Icon(Icons.stars, color: Colors.orange), const SizedBox(width: 8), Text(l10n.featuredPosts, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16))])),
        SizedBox(
          height: 120,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              _buildFeaturedCard(category: l10n.handbook, title: "Puppy Care Guide", author: "Dr. Thanh", time: "2h ago"),
              _buildFeaturedCard(category: l10n.health, title: "Vaccination Schedule 2024", author: "VetSmart", time: "5h ago"),
            ],
          ),
        )
      ],
    );
  }

  Widget _buildFeaturedCard({required String category, required String title, required String author, required String time}) {
    return Container(
      width: 220,
      margin: const EdgeInsets.only(right: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(category, style: const TextStyle(color: Color(0xFF20C8B3), fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(title, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
          const Spacer(),
          Text('$author • $time', style: const TextStyle(color: Colors.grey, fontSize: 10)),
        ],
      ),
    );
  }

  Widget _buildPostList(AppLocalizations l10n) {
    return Column(
      children: [
        _buildPostCard(author: "Minh Anh", time: "Just now", category: l10n.petExperience, content: "My Poodle loves this food!", imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500", likes: 124, comments: 18),
      ],
    );
  }

  Widget _buildPostCard({required String author, required String time, required String category, required String content, required String imageUrl, required int likes, required int comments}) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [const CircleAvatar(radius: 20, backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=man1')), const SizedBox(width: 12), Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(author, style: const TextStyle(fontWeight: FontWeight.bold)), Text('$time • $category', style: const TextStyle(color: Colors.grey, fontSize: 12))])]),
          const SizedBox(height: 16),
          Text(content, style: const TextStyle(fontSize: 14)),
          const SizedBox(height: 16),
          ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.network(imageUrl, width: double.infinity, height: 200, fit: BoxFit.cover)),
          const SizedBox(height: 16),
          Row(children: [const Icon(Icons.favorite_border, size: 20), const SizedBox(width: 6), Text('$likes'), const SizedBox(width: 20), const Icon(Icons.chat_bubble_outline, size: 20), const SizedBox(width: 6), Text('$comments')]),
        ],
      ),
    );
  }
}
