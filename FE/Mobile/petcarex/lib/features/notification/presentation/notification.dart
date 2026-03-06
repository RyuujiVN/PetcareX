import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../core/services/camera_service.dart';
import '../../home/presentation/home_page.dart';

class AppointmentNotificationPage extends StatefulWidget {
  const AppointmentNotificationPage({super.key});

  @override
  State<AppointmentNotificationPage> createState() => _AppointmentNotificationPageState();
}

class _AppointmentNotificationPageState extends State<AppointmentNotificationPage> {
  final CameraService _cameraService = CameraService();

  Future<void> _openQRScanner() async {
    bool hasPermission = await _cameraService.requestCameraPermission();

    if (hasPermission) {
      await Future.delayed(const Duration(milliseconds: 300));
      if (!mounted) return;

      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => QRScannerScreen(
            onScan: (code) {
              Navigator.pop(context);
              _showQRResult(code);
            },
          ),
        ),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Bạn cần cấp quyền Camera để quét mã QR')),
      );
    }
  }

  void _showQRResult(String code) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Kết quả quét'),
        content: Text('Nội dung mã QR: $code'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Đóng'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Thông báo & Nhắc lịch',
          style: TextStyle(
            color: Colors.black,
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildSectionHeader('Sắp tới'),
            const SizedBox(height: 16),
            _buildUpcomingCard(),
            const SizedBox(height: 32),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSectionHeader('Nhắc nhở tiêm phòng'),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1F1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Text(
                    '2 nhắc nhở mới',
                    style: TextStyle(color: Colors.red, fontSize: 12, fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            _buildVaccinationReminder(
              title: 'Nhắc tiêm dại:',
              petName: 'LuLu',
              subTitle: 'Đã đến hạn tiêm định kỳ hàng năm',
              status: 'HẾT HẠN',
              timeRange: '2 ngày trước',
              isExpired: true,
              image: 'assets/images/cho_phoc_soc.png',
            ),
            const SizedBox(height: 12),
            _buildVaccinationReminder(
              title: 'Tiêm 4 bệnh:',
              petName: 'MeoMeo',
              subTitle: 'Còn 5 ngày nữa tới lịch hẹn',
              status: 'SẮP TỚI',
              timeRange: '30/10',
              isExpired: false,
              image: 'assets/images/meo_anh_long_ngan.png',
            ),
            const SizedBox(height: 32),
            _buildSectionHeader('Thông báo cũ hơn'),
            const SizedBox(height: 16),
            _buildOldNotification(
              icon: Icons.shopping_bag_outlined,
              title: 'Đơn hàng đã giao thành công',
              description: 'Đơn hàng #12345 đã được giao bởi Shipper.',
              time: '15/10/2023',
            ),
            _buildOldNotification(
              icon: Icons.eco_outlined,
              title: 'Mẹo chăm sóc mèo mùa thu',
              description: 'Khám phá cách giữ ấm cho boss khi trời trở lạnh.',
              time: '12/10/2023',
            ),
            _buildSettingsTile(),
            const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
    );
  }

  Widget _buildUpcomingCard() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4))
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F7F4),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: const Text(
                    'LỊCH HẸN THÚ Y',
                    style: TextStyle(color: AppColors.primary, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Khám sức khỏe tổng quát - LuLu',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                const Row(
                  children: [
                    Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey),
                    SizedBox(width: 4),
                    Text('14:30 - 25/10/2023', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
                const SizedBox(height: 4),
                const Row(
                  children: [
                    Icon(Icons.location_on_outlined, size: 14, color: Colors.grey),
                    SizedBox(width: 4),
                    Text('Phòng khám PetJoy', style: TextStyle(color: Colors.grey, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.asset(
              'assets/images/cho_phoc_soc.png',
              width: 80,
              height: 80,
              fit: BoxFit.cover,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVaccinationReminder({
    required String title,
    required String petName,
    required String subTitle,
    required String status,
    required String timeRange,
    required bool isExpired,
    required String image,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 10, offset: const Offset(0, 4))
        ],
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 30,
            backgroundImage: AssetImage(image),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    RichText(
                      text: TextSpan(
                        style: const TextStyle(color: Colors.black, fontSize: 14),
                        children: [
                          TextSpan(text: '$title ', style: const TextStyle(fontWeight: FontWeight.bold)),
                          TextSpan(text: petName, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  subTitle,
                  style: const TextStyle(color: Colors.grey, fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                GestureDetector(
                  onTap: () {},
                  child: const Row(
                    children: [
                      Text(
                        'Đặt lịch ngay',
                        style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Icon(Icons.chevron_right, color: AppColors.primary, size: 14),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                status,
                style: TextStyle(
                  color: isExpired ? Colors.red : Colors.grey[400],
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                timeRange,
                style: TextStyle(
                  color: isExpired ? Colors.red : Colors.black,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildOldNotification({
    required IconData icon,
    required String title,
    required String description,
    required String time,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: const BoxDecoration(
              color: Color(0xFFF1F4F9),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: Colors.grey[400], size: 24),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E2124)),
                ),
                const SizedBox(height: 4),
                Text(
                  description,
                  style: const TextStyle(color: Color(0xFF7D848D), fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  time,
                  style: const TextStyle(color: Color(0xFFADB5BD), fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingsTile() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF1FDFB),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.notifications_active_outlined, color: AppColors.primary),
          ),
          const SizedBox(width: 16),
          const Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Cài đặt nhắc nhở',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF1E2124)),
                ),
                Text(
                  'Quản lý cách bạn nhận thông báo',
                  style: TextStyle(color: Color(0xFF7D848D), fontSize: 13),
                ),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Color(0xFFADB5BD)),
        ],
      ),
    );
  }
}
