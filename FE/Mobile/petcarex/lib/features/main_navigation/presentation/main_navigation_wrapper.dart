import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import '../../../../core/services/camera_service.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../features/account/presentation/account_page.dart';
import '../../../../features/booking/presentation/booking_page.dart';
import '../../../../features/community/presentation/community_page.dart';
import '../../../../features/home/presentation/home_page.dart';

class MainNavigationWrapper extends StatefulWidget {
  const MainNavigationWrapper({super.key});

  @override
  State<MainNavigationWrapper> createState() => _MainNavigationWrapperState();
}

class _MainNavigationWrapperState extends State<MainNavigationWrapper> {
  int _selectedIndex = 0;
  final CameraService _cameraService = CameraService();

  final List<Widget> _pages = [
    const HomePage(),
    const BookingPage(),
    const CommunityPage(), // Trang cộng đồng đúng vị trí index 2
    const AccountPage(),
  ];

  void _onItemTapped(int index) {
    if (index == _selectedIndex) return;
    setState(() {
      _selectedIndex = index;
    });
  }

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
      body: IndexedStack(
        index: _selectedIndex,
        children: _pages,
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _openQRScanner,
        backgroundColor: AppColors.primary,
        shape: const CircleBorder(),
        child: const Icon(Icons.qr_code_scanner, color: Colors.white, size: 28),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      bottomNavigationBar: BottomAppBar(
        shape: const CircularNotchedRectangle(),
        notchMargin: 8,
        child: SizedBox(
          height: 60,
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildNavItem(Icons.home_outlined, Icons.home, "TRANG CHỦ", 0),
              _buildNavItem(Icons.calendar_today_outlined, Icons.calendar_today, "ĐẶT LỊCH", 1),
              const SizedBox(width: 40),
              _buildNavItem(Icons.forum_outlined, Icons.forum, "CỘNG ĐỒNG", 2),
              _buildNavItem(Icons.person_outline, Icons.person, "CÁ NHÂN", 3),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(IconData icon, IconData activeIcon, String label, int index) {
    bool isSelected = _selectedIndex == index;
    return GestureDetector(
      onTap: () => _onItemTapped(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            isSelected ? activeIcon : icon,
            color: isSelected ? AppColors.primary : Colors.grey[400],
            size: 24,
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 9,
              fontWeight: FontWeight.bold,
              color: isSelected ? AppColors.primary : Colors.grey[400],
            ),
          ),
        ],
      ),
    );
  }
}

// Lớp QRScannerScreen giữ nguyên như bản cập nhật trước
class QRScannerScreen extends StatefulWidget {
  final Function(String) onScan;
  const QRScannerScreen({super.key, required this.onScan});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with SingleTickerProviderStateMixin {
  final MobileScannerController controller = MobileScannerController(detectionSpeed: DetectionSpeed.noDuplicates);
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
  }

  @override
  void dispose() {
    controller.dispose();
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size.width * 0.7;
    return Scaffold(
      body: Stack(
        children: [
          MobileScanner(
            controller: controller,
            onDetect: (capture) {
              for (final barcode in capture.barcodes) {
                if (barcode.rawValue != null) {
                  widget.onScan(barcode.rawValue!);
                  break;
                }
              }
            },
          ),
          Positioned.fill(
            child: CustomPaint(
              painter: ScannerOverlayPainter(scanBoxSize: size, scanPosition: _animationController.value),
            ),
          ),
          Positioned(
            top: 40,
            left: 10,
            child: IconButton(
              icon: const Icon(Icons.arrow_back, color: Colors.white, size: 30),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ],
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  final double scanBoxSize;
  final double scanPosition;
  ScannerOverlayPainter({required this.scanBoxSize, required this.scanPosition});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2 - 60);
    final scanRect = Rect.fromCenter(center: center, width: scanBoxSize, height: scanBoxSize);

    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height)),
        Path()..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(20))),
      ),
      Paint()..color = Colors.black.withOpacity(0.5),
    );

    final borderPaint = Paint()..color = Colors.white..style = PaintingStyle.stroke..strokeWidth = 4;
    final path = Path();
    const cornerLen = 25.0;
    path.moveTo(scanRect.left, scanRect.top + cornerLen); path.lineTo(scanRect.left, scanRect.top); path.lineTo(scanRect.left + cornerLen, scanRect.top);
    path.moveTo(scanRect.right - cornerLen, scanRect.top); path.lineTo(scanRect.right, scanRect.top); path.lineTo(scanRect.right, scanRect.top + cornerLen);
    path.moveTo(scanRect.left, scanRect.bottom - cornerLen); path.lineTo(scanRect.left, scanRect.bottom); path.lineTo(scanRect.left + cornerLen, scanRect.bottom);
    path.moveTo(scanRect.right - cornerLen, scanRect.bottom); path.lineTo(scanRect.right, scanRect.bottom); path.lineTo(scanRect.right, scanRect.bottom - cornerLen);
    canvas.drawPath(path, borderPaint);

    canvas.drawLine(
      Offset(scanRect.left + 10, scanRect.top + (scanBoxSize * scanPosition)),
      Offset(scanRect.right - 10, scanRect.top + (scanBoxSize * scanPosition)),
      Paint()..color = Colors.white..strokeWidth = 2,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
