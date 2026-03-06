import 'dart:io';
import 'package:flutter/material.dart';
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
  final List<String> _categories = ["Tất cả", "Kinh nghiệm nuôi", "Hỏi đáp bác sĩ"];
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
      final String uploadedUrl = await petProvider.uploadAvatar(image.path);
      
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tải ảnh bài viết thành công!')),
      );
      debugPrint("Community Uploaded URL: $uploadedUrl");
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Lỗi upload ảnh: $e')),
      );
    } finally {
      if (mounted) setState(() => _isUploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FBFB),
      body: SafeArea(
        child: Column(
          children: [
            _buildSearchBar(),
            Expanded(
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPostInput(),
                    _buildCategoryTabs(),
                    _buildFeaturedSection(),
                    _buildPostList(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      color: Colors.white,
      child: Row(
        children: [
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              height: 44,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F3F4),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Row(
                children: [
                  Icon(Icons.search, color: Colors.grey, size: 20),
                  SizedBox(width: 8),
                  Text('Tìm kiếm bài viết, thú cưng...', style: TextStyle(color: Colors.grey, fontSize: 13)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),
          Stack(
            children: [
              const Icon(Icons.notifications_none_outlined, color: Colors.black87, size: 28),
              Positioned(
                right: 2,
                top: 2,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                ),
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildPostInput() {
    final user = context.watch<AuthProvider>().user;
    return Container(
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CircleAvatar(
                radius: 20,
                backgroundImage: user?.avatarUrl != null 
                  ? NetworkImage(user!.avatarUrl!) 
                  : const NetworkImage('https://i.pravatar.cc/150?u=man1'),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Text(
                  'Bạn muốn chia sẻ điều gì về thú cưng hôm nay?',
                  style: TextStyle(color: Colors.grey, fontSize: 14),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              _isUploading 
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                : IconButton(
                    onPressed: _handleImageUpload, 
                    icon: const Icon(Icons.image_outlined, color: Colors.grey)
                  ),
              const Spacer(),
              ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  elevation: 0,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: const Text('Đăng bài', style: TextStyle(fontWeight: FontWeight.bold)),
              )
            ],
          )
        ],
      ),
    );
  }

  Widget _buildCategoryTabs() {
    return Container(
      height: 50,
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(bottom: BorderSide(color: Color(0xFFEEEEEE))),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 10),
        itemCount: _categories.length,
        itemBuilder: (context, index) {
          bool isSelected = _selectedCategoryIndex == index;
          return GestureDetector(
            onTap: () => setState(() => _selectedCategoryIndex = index),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              alignment: Alignment.center,
              decoration: BoxDecoration(
                border: Border(
                  bottom: BorderSide(
                    color: isSelected ? AppColors.primary : Colors.transparent,
                    width: 2,
                  ),
                ),
              ),
              child: Text(
                _categories[index],
                style: TextStyle(
                  color: isSelected ? Colors.black : Colors.grey,
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                  fontSize: 14,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildFeaturedSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Row(
            children: [
              Icon(Icons.stars, color: Colors.orange, size: 18),
              SizedBox(width: 8),
              Text('Bài viết nổi bật', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
        ),
        SizedBox(
          height: 120,
          child: ListView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            children: [
              _buildFeaturedCard(
                category: "CẨM NANG",
                title: "Cách chọn thức ăn hạt giàu dinh dưỡng cho chó con",
                author: "Dr. Thanh",
                time: "2 giờ trước",
              ),
              _buildFeaturedCard(
                category: "SỨC KHỎE",
                title: "Lịch tiêm phòng cần thiết cho thú cưng năm 2024",
                author: "VetSmart",
                time: "5 giờ trước",
              ),
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
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10)],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(category, style: const TextStyle(color: Color(0xFF20C8B3), fontSize: 10, fontWeight: FontWeight.bold)),
          const SizedBox(height: 6),
          Text(
            title,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13, height: 1.3),
          ),
          const Spacer(),
          Row(
            children: [
              const CircleAvatar(radius: 9, backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=dr1')),
              const SizedBox(width: 6),
              Text('$author • $time', style: const TextStyle(color: Colors.grey, fontSize: 10)),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildPostList() {
    return Column(
      children: [
        _buildPostCard(
          author: "Minh Anh",
          time: "Vừa xong",
          category: "Kinh nghiệm nuôi",
          content: "Vừa tìm được loại hạt này cho bé Poodle nhà mình, trộm vía bé ăn rất ngon và lông mượt hẳn ra! Có ai dùng loại này chưa ạ?",
          imageUrl: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?q=80&w=500",
          likes: 124,
          comments: 18,
        ),
        _buildPostCard(
          author: "Dr. Thanh",
          time: "2 giờ trước",
          category: "Hỏi đáp bác sĩ",
          title: "Giải đáp: Liều lượng thức ăn hạt cho chó lớn",
          content: "Nhiều bạn thắc mắc về lượng hạt mỗi bữa. Theo quy chuẩn, chó trưởng thành cần khoảng 2-3% trọng lượng cơ thể mỗi ngày chia làm 2 bữa...",
          imageUrl: "https://images.unsplash.com/photo-1517849845537-4d257902454a?q=80&w=500",
          likes: 85,
          comments: 32,
          isDoctor: true,
        ),
      ],
    );
  }

  Widget _buildPostCard({
    required String author,
    required String time,
    required String category,
    String? title,
    required String content,
    required String imageUrl,
    required int likes,
    required int comments,
    bool isDoctor = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(20),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              isDoctor 
                ? Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(color: const Color(0xFFE0F7F4), borderRadius: BorderRadius.circular(8)),
                    child: const Icon(Icons.medical_services_outlined, color: AppColors.primary, size: 20),
                  )
                : const CircleAvatar(radius: 20, backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=man1')),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(author, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
                        if (isDoctor) ...[
                          const SizedBox(width: 4),
                          const Icon(Icons.check_circle, color: Colors.blue, size: 14),
                        ]
                      ],
                    ),
                    Text('$time • $category', style: const TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ),
              const Icon(Icons.more_horiz, color: Colors.grey),
            ],
          ),
          const SizedBox(height: 16),
          if (title != null) ...[
            Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF20C8B3))),
            const SizedBox(height: 8),
          ],
          Text(content, style: const TextStyle(fontSize: 14, height: 1.5, color: Colors.black87)),
          const SizedBox(height: 16),
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Image.network(imageUrl, width: double.infinity, height: 200, fit: BoxFit.cover),
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              const Icon(Icons.favorite_border, color: Colors.grey, size: 20),
              const SizedBox(width: 6),
              Text('$likes', style: const TextStyle(color: Colors.grey, fontSize: 13)),
              const SizedBox(width: 20),
              const Icon(Icons.chat_bubble_outline, color: Colors.grey, size: 20),
              const SizedBox(width: 6),
              Text('$comments', style: const TextStyle(color: Colors.grey, fontSize: 13)),
            ],
          )
        ],
      ),
    );
  }
}
