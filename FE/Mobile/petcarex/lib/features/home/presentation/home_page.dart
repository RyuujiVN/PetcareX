import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:petcarex/features/auth/presentation/providers/auth_provider.dart';
import 'package:provider/provider.dart';

import '../../../core/services/camera_service.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/utils/image_helper.dart';
import '../../chat/presentation/chat_page.dart';
import '../../main_navigation/presentation/main_navigation_wrapper.dart';
import '../../notification/presentation/notification.dart';
import '../../pet/data/models/pet_models.dart';
import '../../pet/presentation/add_pet_page.dart';
import '../../pet/presentation/edit_pet_page.dart';
import '../../pet/presentation/provider/pet_provider.dart';

class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  final CameraService _cameraService = CameraService();
  
  final double verticalOffset = -60;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PetProvider>().fetchMyPets();
      context.read<AuthProvider>().fetchProfile();
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
    return SafeArea(
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
            const SizedBox(height: 100),
          ],
        ),
      ),
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
            IconButton(
              onPressed: _openQRScanner, 
              icon: const Icon(Icons.qr_code_scanner, color: Color(0xFF5F6368)),
            ),
            Stack(
              children: [
                IconButton(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const AppointmentNotificationPage(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.notifications_none_outlined, color: Color(0xFF5F6368)),
                ),
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
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        final String displayName = (user?.fullName != null && user!.fullName!.trim().isNotEmpty) 
            ? user.fullName! 
            : "Người dùng";

        return Row(
          children: [
            Container(
              padding: const EdgeInsets.all(3),
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: LinearGradient(colors: [AppColors.primary, Color(0xFF80EEDF)]),
              ),
              child: ClipOval(
                child: (user?.avatarUrl != null && user!.avatarUrl!.isNotEmpty)
                    ? CachedNetworkImage(
                        imageUrl: ImageHelper.getThumbnailUrl(user.avatarUrl!),
                        width: 70,
                        height: 70,
                        fit: BoxFit.cover,
                        placeholder: (context, url) => const Padding(
                          padding: EdgeInsets.all(12.0),
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                        errorWidget: (context, url, error) => Image.asset('assets/images/cho_phoc_soc.png', fit: BoxFit.cover),
                      )
                    : Image.asset('assets/images/cho_phoc_soc.png', width: 70, height: 70, fit: BoxFit.cover),
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Chào bạn, $displayName!',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Hôm nay thú cưng của bạn thế nào?',
                    style: TextStyle(fontSize: 14, color: Colors.grey, height: 1.4),
                  ),
                ],
              ),
            )
          ],
        );
      },
    );
  }

  Widget _buildPetList() {
    return Consumer<PetProvider>(
      builder: (context, petProvider, child) {
        final pets = List<Pet>.from(petProvider.myPets)..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
        return SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              // Hiển thị danh sách pet từ API
              ...pets.asMap().entries.map((entry) {
                int idx = entry.key;
                Pet pet = entry.value;
                return GestureDetector(
                  onTap: () async {
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) => const Center(
                        child: CircularProgressIndicator(color: AppColors.primary),
                      ),
                    );

                    try {
                      final provider = context.read<PetProvider>();
                      await provider.fetchSpecies();
                      if (pet.breed?.speciesId != null) {
                        await provider.fetchBreeds(pet.breed!.speciesId);
                      }
                      
                      if (!mounted) return;
                      Navigator.pop(context); 

                      final result = await Navigator.push(
                        context,
                        MaterialPageRoute(builder: (context) => EditPetPage(pet: pet))
                      );
                      
                      if (result == true) {
                        provider.fetchMyPets();
                      }
                    } catch (e) {
                      if (mounted) Navigator.pop(context);
                      debugPrint("Lỗi khi đồng bộ dữ liệu: $e");
                    }
                  },
                  child: Padding(
                    padding: const EdgeInsets.only(right: 16),
                    child: _buildPetItem(
                      pet.name, 
                      pet.avatar, 
                      idx == 0 
                    ),
                  ),
                );
              }),
              
              // Nút thêm mới luôn ở cuối
              GestureDetector(
                onTap: () async {
                  final result = await Navigator.push(
                    context, 
                    MaterialPageRoute(builder: (context) => const AddPetPage())
                  );
                  if (result == true) {
                    petProvider.fetchMyPets();
                  }
                },
                child: Column(
                  children: [
                    Container(
                      width: 60,
                      height: 60,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: Colors.white,
                        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                      ),
                      child: const Icon(Icons.add, color: Colors.grey),
                    ),
                    const SizedBox(height: 8),
                    const Text('Thêm mới', style: TextStyle(fontSize: 12, color: Colors.grey)),
                  ],
                ),
              )
            ],
          ),
        );
      },
    );
  }

  Widget _buildPetItem(String name, String? imageUrl, bool isActive) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(2),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: isActive ? AppColors.primary : Colors.transparent, width: 2),
          ),
          child: ClipOval(
            child: Container(
              width: 56,
              height: 56,
              color: Colors.grey[200], // Nền xám mặc định
              child: (imageUrl != null && imageUrl.startsWith('http'))
                  ? CachedNetworkImage(
                      imageUrl: ImageHelper.getThumbnailUrl(imageUrl),
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) {
                        return const Center(child: Icon(Icons.pets, color: Colors.grey, size: 28));
                      },
                      placeholder: (context, url) {
                        return const Center(
                          child: SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                        );
                      },
                    )
                  : const Center(child: Icon(Icons.pets, color: Colors.grey, size: 28)), // Nếu không có ảnh
            ),
          ),
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
          onTap: () {
            MainNavigationWrapper.of(context)?.setSelectedIndex(1);
          },
        ),
        const SizedBox(height: 12),
        _buildActionTile(
          Icons.smart_toy_outlined, 
          "Tư vấn AI Chatbot", 
          "Hỗ trợ sức khỏe 24/7", 
          const Color(0xFFEEF3FF), 
          const Color(0xFF4285F4),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const ChatPage()));
          },
        ),
        const SizedBox(height: 12),
        _buildActionTile(Icons.location_on_outlined, "Tìm phòng khám gần nhất", "Tìm kiếm trên bản đồ", const Color(0xFFFFF4E8), const Color(0xFFFF9800)),
      ],
    );
  }

  Widget _buildActionTile(IconData icon, String title, String sub, Color bg, Color iconColor, {VoidCallback? onTap}) {
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
}

class QRScannerScreen extends StatefulWidget {
  final Function(String) onScan;

  const QRScannerScreen({super.key, required this.onScan});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> with SingleTickerProviderStateMixin {
  final MobileScannerController controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
    torchEnabled: false,
  );

  late AnimationController _animationController;
  
  final double verticalOffset = -60;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
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
              final List<Barcode> barcodes = capture.barcodes;
              for (final barcode in barcodes) {
                if (barcode.rawValue != null) {
                  widget.onScan(barcode.rawValue!);
                  break;
                }
              }
            },
          ),
          Positioned.fill(
            child: AnimatedBuilder(
              animation: _animationController,
              builder: (context, child) {
                return CustomPaint(
                  painter: ScannerOverlayPainter(
                    scanBoxSize: size, 
                    offset: verticalOffset,
                    scanPosition: _animationController.value,
                  ),
                );
              },
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
          Positioned(
            top: 40,
            right: 10,
            child: IconButton(
              icon: const Icon(Icons.flash_on, color: Colors.white),
              onPressed: () => controller.toggleTorch(),
            ),
          ),
          Center(
            child: Transform.translate(
              offset: Offset(0, verticalOffset + (size / 2) + 40),
              child: const Text(
                'Đặt mã QR trong khung',
                style: TextStyle(
                  color: Colors.white, 
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 60,
            left: 0,
            right: 0,
            child: Column(
              children: [
                const Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.qr_code_2, color: Color(0xFF20C8B3), size: 24),
                    SizedBox(width: 8),
                    Text('Mã QR', style: TextStyle(color: Color(0xFF20C8B3), fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 40),
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: Colors.white, width: 4),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class ScannerOverlayPainter extends CustomPainter {
  final double scanBoxSize;
  final double offset;
  final double scanPosition;

  ScannerOverlayPainter({
    required this.scanBoxSize, 
    required this.offset,
    required this.scanPosition,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final backgroundPaint = Paint()..color = Colors.black.withOpacity(0.5);
    final center = Offset(size.width / 2, size.height / 2 + offset);
    
    final scanRect = Rect.fromCenter(
      center: center,
      width: scanBoxSize,
      height: scanBoxSize,
    );

    canvas.drawPath(
      Path.combine(
        PathOperation.difference,
        Path()..addRect(Rect.fromLTWH(0, 0, size.width, size.height)),
        Path()..addRRect(RRect.fromRectAndRadius(scanRect, const Radius.circular(20))),
      ),
      backgroundPaint,
    );

    final borderPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4;
    
    final path = Path();
    const cornerLen = 25.0;

    path.moveTo(scanRect.left, scanRect.top + cornerLen);
    path.lineTo(scanRect.left, scanRect.top);
    path.lineTo(scanRect.left + cornerLen, scanRect.top);

    path.moveTo(scanRect.right - cornerLen, scanRect.top);
    path.lineTo(scanRect.right, scanRect.top);
    path.lineTo(scanRect.right, scanRect.top + cornerLen);

    path.moveTo(scanRect.left, scanRect.bottom - cornerLen);
    path.lineTo(scanRect.left, scanRect.bottom);
    path.lineTo(scanRect.left + cornerLen, scanRect.bottom);

    path.moveTo(scanRect.right - cornerLen, scanRect.bottom);
    path.lineTo(scanRect.right, scanRect.bottom);
    path.lineTo(scanRect.right, scanRect.bottom - cornerLen);

    canvas.drawPath(path, borderPaint);

    final linePaint = Paint()
      ..shader = LinearGradient(
        colors: [Colors.white.withOpacity(0), Colors.white, Colors.white.withOpacity(0)],
      ).createShader(Rect.fromLTWH(scanRect.left, scanRect.top + (scanBoxSize * scanPosition), scanBoxSize, 2))
      ..strokeWidth = 2;

    canvas.drawLine(
      Offset(scanRect.left + 10, scanRect.top + (scanBoxSize * scanPosition)),
      Offset(scanRect.right - 10, scanRect.top + (scanBoxSize * scanPosition)),
      linePaint,
    );
  }

  @override
  bool shouldRepaint(covariant ScannerOverlayPainter oldDelegate) => 
      oldDelegate.scanPosition != scanPosition;
}
