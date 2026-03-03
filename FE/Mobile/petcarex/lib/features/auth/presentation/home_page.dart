import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import 'appointment_notification.dart';
import 'booking_page.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FBFB),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              _buildHeader(),
              const SizedBox(height: 24),
              _buildUserInfo(),
              const SizedBox(height: 24),
              _buildPetList(),
              const SizedBox(height: 24),
              _buildQuickActions(),
              const SizedBox(height: 32),
              _buildSectionHeader("Lịch hẹn của tôi", "Xem tất cả"),
              const SizedBox(height: 16),
              _buildAppointmentCard(),
              const SizedBox(height: 32),
              _buildSectionHeader("Diễn đàn PetCareX", "Khám phá"),
              const SizedBox(height: 16),
              _buildForumPost(),
              const SizedBox(height: 100), // Khoảng trống cho BottomNav
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        backgroundColor: AppColors.primary,
        shape: const CircleBorder(),
        child: const Icon(Icons.add, color: Colors.white, size: 32),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: _buildBottomNav(),
    );
  }

  Widget _buildHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFFE0F7F4),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Image.asset('assets/images/icon.png', width: 24, height: 24),
            ),
            const SizedBox(width: 10),
            const Text(
              'PetCareX',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
            ),
          ],
        ),
        Row(
          children: [
            IconButton(onPressed: () {}, icon: const Icon(Icons.search, color: Color(0xFF5F6368))),
            Stack(
              children: [
                IconButton(onPressed: () {}, icon: const Icon(Icons.notifications_none_outlined, color: Color(0xFF5F6368))),
                Positioned(
                  right: 12,
                  top: 12,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                  ),
                )
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildUserInfo() {
    return Row(
      children: [
        Stack(
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [AppColors.primary, Color(0xFF80EEDF)]),
              ),
              child: const CircleAvatar(
                radius: 35,
                backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=man1'),
              ),
            ),
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                child: const Icon(Icons.edit, size: 12, color: AppColors.primary),
              ),
            )
          ],
        ),
        const SizedBox(width: 16),
        const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Chào bạn, Minh Anh!',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
            ),
            SizedBox(height: 4),
            Text(
              'Hôm nay thú cưng của bạn thế\nnào?',
              style: TextStyle(fontSize: 14, color: Colors.grey, height: 1.4),
            ),
          ],
        )
      ],
    );
  }

  Widget _buildPetList() {
    return Row(
      children: [
        _buildPetItem('Mimi', 'assets/images/meo_anh_long_ngan.png', true),
        const SizedBox(width: 16),
        _buildPetItem('LuLu', 'assets/images/cho_phoc_soc.png', false),
        const SizedBox(width: 16),
        Column(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey.withOpacity(0.3), style: BorderStyle.none),
                shape: BoxShape.circle,
                color: Colors.white,
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
              ),
              child: const Icon(Icons.add, color: Colors.grey),
            ),
            const SizedBox(height: 8),
            const Text('Thêm mới', style: TextStyle(fontSize: 12, color: Colors.grey)),
          ],
        )
      ],
    );
  }

  Widget _buildPetItem(String name, String url, bool isActive) {
    final ImageProvider imageProvider =
        url.startsWith('http') ? NetworkImage(url) : AssetImage(url);
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: isActive ? AppColors.primary : Colors.transparent, width: 2),
          ),
          child: CircleAvatar(radius: 28, backgroundImage: imageProvider),
        ),
        const SizedBox(height: 8),
        Text(name, style: TextStyle(fontSize: 12, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      children: [
        _buildActionTile(
          Icons.calendar_month,
          "Đặt lịch khám nhanh",
          "Chọn bác sĩ nhanh nhất ngay",
          const Color(0xFFE8F9F7),
          AppColors.primary,
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => const BookingPage())),
        ),
        const SizedBox(height: 12),
        _buildActionTile(Icons.smart_toy_outlined, "Tư vấn AI Chatbot", "Hỗ trợ sức khỏe 24/7", const Color(0xFFEEF3FF), const Color(0xFF4285F4)),
        const SizedBox(height: 12),
        _buildActionTile(Icons.location_on_outlined, "Tìm phòng khám gần nhất", "Tìm kiếm trên bản đồ", const Color(0xFFFFF4E8), const Color(0xFFFF9800)),
      ],
    );
  }

  Widget _buildActionTile(
    IconData icon,
    String title,
    String sub,
    Color bg,
    Color iconColor, {
    VoidCallback? onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
              child: Icon(icon, color: iconColor),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                  const SizedBox(height: 2),
                  Text(sub, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Colors.grey),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, String action) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        Text(action, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
      ],
    );
  }

  Widget _buildAppointmentCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(color: const Color(0xFFF0F2F5), borderRadius: BorderRadius.circular(12)),
                child: const Column(
                  children: [
                    Text("THỨ 4", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Text("15", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Tiêm phòng định kỳ – Mimi", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.access_time, size: 14, color: Colors.grey),
                        SizedBox(width: 4),
                        Text("09:30 AM - BS. Hùng", style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                    SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                        SizedBox(width: 4),
                        Text("PetCare Center, Quận 7", style: TextStyle(fontSize: 12, color: Colors.grey)),
                      ],
                    ),
                  ],
                ),
              )
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                flex: 2,
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("Xác nhận lịch", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFF0F2F5),
                    foregroundColor: Colors.grey[700],
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text("Hủy", style: TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildForumPost() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 10))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const CircleAvatar(radius: 18, backgroundImage: NetworkImage('https://i.pravatar.cc/150?u=woman1')),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Lan Hương", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text("2 giờ trước • Kinh nghiệm nuôi mèo", style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text(
            "Có ai biết loại pate nào tốt cho mèo bị sỏi thận không ạ? Bé Mimi nhà mình dạo này kén ăn quá...",
            style: TextStyle(fontSize: 13, height: 1.5),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Icon(Icons.favorite_border, size: 16, color: Colors.grey[400]),
              const SizedBox(width: 4),
              Text("24", style: TextStyle(fontSize: 12, color: Colors.grey[400])),
              const SizedBox(width: 16),
              Icon(Icons.chat_bubble_outline, size: 16, color: Colors.grey[400]),
              const SizedBox(width: 4),
              Text("12", style: TextStyle(fontSize: 12, color: Colors.grey[400])),
            ],
          )
        ],
      ),
    );
  }

  Widget _buildBottomNav() {
    return BottomAppBar(
      shape: const CircularNotchedRectangle(),
      notchMargin: 8,
      child: SizedBox(
        height: 60,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceAround,
          children: [
            _buildNavItem(Icons.home_filled, "Trang chủ", 0),
            _buildNavItem(Icons.calendar_today_outlined, "Lịch hẹn", 1, onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (context) => const AppointmentNotificationPage()),
              );
            }),
            const SizedBox(width: 40), // Space for FAB
            _buildNavItem(Icons.forum_outlined, "CỘNG ĐỒNG", 2),
            _buildNavItem(Icons.person_outline, "CÁ NHÂN", 3),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, String label, int index, {VoidCallback? onTap}) {
    bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: onTap ?? () => setState(() => _selectedIndex = index),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: isSelected ? AppColors.primary : Colors.grey[400], size: 24),
          const SizedBox(height: 4),
          Text(label, style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: isSelected ? AppColors.primary : Colors.grey[400])),
        ],
      ),
    );
  }
}
