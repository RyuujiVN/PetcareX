import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart'; // Thêm lại import này
import '../../../l10n/generated/app_localizations.dart';
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
  final CameraService _cameraService = CameraService();
  final bool _hasUnreadNotifications = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PetProvider>().fetchMyPets();
      context.read<AuthProvider>().fetchProfile();
    });
  }

  Future<void> _openQRScanner(AppLocalizations l10n) async {
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
              _showQRResult(code, l10n);
            },
          ),
        ),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(l10n.cameraPermission)),
      );
    }
  }

  void _showQRResult(String code, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(l10n.qrResult),
        content: Text('${l10n.qrContent}: $code'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.close),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return SafeArea(
      child: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 16),
            _buildHeader(l10n),
            const SizedBox(height: 24),
            _buildUserInfo(l10n),
            const SizedBox(height: 24),
            _buildPetList(l10n),
            const SizedBox(height: 24),
            _buildQuickActions(l10n),
            const SizedBox(height: 32),
            _buildSectionHeader(l10n.myAppointments, l10n.viewAll, onTap: () {
              MainNavigationWrapper.of(context)?.setSelectedIndex(2);
            }),
            const SizedBox(height: 16),
            _buildAppointmentCard(l10n),
            const SizedBox(height: 32),
            _buildSectionHeader(l10n.petCareForum, l10n.explore, onTap: () {
              MainNavigationWrapper.of(context)?.setSelectedIndex(3);
            }),
            const SizedBox(height: 16),
            _buildForumPost(),
            const SizedBox(height: 100),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(AppLocalizations l10n) {
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
            Text(
              l10n.appName,
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
            ),
          ],
        ),
        Row(
          children: [
            IconButton(
              onPressed: () => _openQRScanner(l10n), 
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
                if (_hasUnreadNotifications)
                  Positioned(
                    right: 12,
                    top: 12,
                    child: Container(
                      width: 8,
                      height: 8,
                      decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildUserInfo(AppLocalizations l10n) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        final user = authProvider.user;
        final String displayName = (user?.fullName != null && user!.fullName.trim().isNotEmpty) 
            ? user.fullName 
            : l10n.user;

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
                    '${l10n.hello}, $displayName!',
                    style: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFF1A1C1E)),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n.howIsPetToday,
                    style: const TextStyle(fontSize: 14, color: Colors.grey, height: 1.4),
                  ),
                ],
              ),
            )
          ],
        );
      },
    );
  }

  Widget _buildPetList(AppLocalizations l10n) {
    return Selector<PetProvider, List<Pet>>(
      selector: (_, provider) => provider.myPets,
      builder: (context, myPets, child) {
        final pets = List<Pet>.from(myPets)
          ..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
        
        return SizedBox(
          height: 90,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: pets.length + 1,
            itemBuilder: (context, index) {
              if (index == pets.length) {
                return _buildAddPetButton(l10n);
              }
              
              final pet = pets[index];
              return GestureDetector(
                onTap: () => _onPetTapped(pet),
                child: Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: _buildPetItem(pet.name, pet.avatar, index == 0),
                ),
              );
            },
          ),
        );
      },
    );
  }

  Future<void> _onPetTapped(Pet pet) async {
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
        MaterialPageRoute(builder: (context) => EditPetPage(pet: pet)),
      );

      if (result == true) {
        provider.fetchMyPets();
      }
    } catch (e) {
      if (mounted) Navigator.pop(context);
    }
  }

  Widget _buildAddPetButton(AppLocalizations l10n) {
    return GestureDetector(
      onTap: () async {
        final result = await Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => const AddPetPage()),
        );
        if (result == true) {
          context.read<PetProvider>().fetchMyPets();
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
          Text(l10n.addNew, style: const TextStyle(fontSize: 12, color: Colors.grey)),
        ],
      ),
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
              color: Colors.grey[200],
              child: (imageUrl != null && imageUrl.startsWith('http'))
                  ? CachedNetworkImage(
                      imageUrl: ImageHelper.getThumbnailUrl(imageUrl),
                      fit: BoxFit.cover,
                      errorWidget: (context, url, error) => const Center(child: Icon(Icons.pets, color: Colors.grey, size: 28)),
                      placeholder: (context, url) => const Center(child: SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))),
                    )
                  : const Center(child: Icon(Icons.pets, color: Colors.grey, size: 28)),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(name, style: TextStyle(fontSize: 12, fontWeight: isActive ? FontWeight.bold : FontWeight.normal)),
      ],
    );
  }

  Widget _buildQuickActions(AppLocalizations l10n) {
    return Column(
      children: [
        _buildActionTile(
          Icons.calendar_month,
          l10n.quickBooking,
          l10n.quickBookingSub,
          const Color(0xFFE8F9F7),
          AppColors.primary,
          onTap: () {
            MainNavigationWrapper.of(context)?.setSelectedIndex(1);
          },
        ),
        const SizedBox(height: 12),
        _buildActionTile(
          Icons.smart_toy_outlined, 
          l10n.aiChatbot, 
          l10n.aiChatbotSub, 
          const Color(0xFFEEF3FF), 
          const Color(0xFF4285F4),
          onTap: () {
            Navigator.push(context, MaterialPageRoute(builder: (context) => const ChatPage()));
          },
        ),
        const SizedBox(height: 12),
        _buildActionTile(
          Icons.location_on_outlined,
          l10n.findClinic,
          l10n.findClinicSub,
          const Color(0xFFFFF4E8),
          const Color(0xFFFF9800),
          onTap: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Developing...'), duration: Duration(seconds: 2)),
            );
          },
        ),
      ],
    );
  }

  Widget _buildActionTile(IconData icon, String title, String sub, Color bg, Color iconColor, {VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
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

  Widget _buildSectionHeader(String title, String action, {VoidCallback? onTap}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
        GestureDetector(
          onTap: onTap,
          child: Text(action, style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
        ),
      ],
    );
  }

  Widget _buildAppointmentCard(AppLocalizations l10n) {
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
                    Text("WED", style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
                    Text("15", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Mimi – Vaccination", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Icon(Icons.access_time, size: 14, color: Colors.grey),
                        SizedBox(width: 4),
                        Text("09:30 AM - Dr. Hung", style: TextStyle(fontSize: 12, color: Colors.grey)),
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
                  style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white, elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: Text(l10n.confirmAppointment, style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton(
                  onPressed: () {},
                  style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF0F2F5), foregroundColor: Colors.grey[700], elevation: 0, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
                  child: Text(l10n.cancelAppointment, style: const TextStyle(fontWeight: FontWeight.bold)),
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
              CachedNetworkImage(
                imageUrl: 'https://i.pravatar.cc/150?u=woman1',
                imageBuilder: (context, imageProvider) => CircleAvatar(radius: 18, backgroundImage: imageProvider),
                placeholder: (context, url) => const CircleAvatar(radius: 18, child: SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2))),
                errorWidget: (context, url, error) => const CircleAvatar(radius: 18, child: Icon(Icons.person, size: 18)),
              ),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("Lan Huong", style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text("2h ago • Cat Experience", style: TextStyle(fontSize: 11, color: Colors.grey)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          const Text("Any tips for kidney stones in cats?", style: TextStyle(fontSize: 13, height: 1.5)),
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
    return Scaffold(
      body: Stack(
        children: [
          MobileScanner(controller: controller, onDetect: (capture) {
            for (final barcode in capture.barcodes) {
              if (barcode.rawValue != null) { widget.onScan(barcode.rawValue!); break; }
            }
          }),
          Positioned(top: 40, left: 10, child: IconButton(icon: const Icon(Icons.arrow_back, color: Colors.white, size: 30), onPressed: () => Navigator.pop(context))),
        ],
      ),
    );
  }
}
