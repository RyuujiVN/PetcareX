import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_helper.dart';
import '../../pet/data/models/pet_models.dart';
import '../../pet/presentation/add_pet_page.dart';
import '../../pet/presentation/edit_pet_page.dart';
import '../../pet/presentation/provider/pet_provider.dart';

class MyPetsPage extends StatefulWidget {
  const MyPetsPage({super.key});

  @override
  State<MyPetsPage> createState() => _MyPetsPageState();
}

class _MyPetsPageState extends State<MyPetsPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<PetProvider>().fetchMyPets();
    });
  }

  void _showDeleteConfirmDialog(BuildContext context, Pet pet) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Text('Xác nhận xoá', style: TextStyle(fontWeight: FontWeight.bold)),
          content: Text('Bạn có chắc chắn muốn xoá thú cưng "${pet.name}" không? Thao tác này không thể hoàn tác.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              style: TextButton.styleFrom(foregroundColor: Colors.grey),
              child: const Text('Hủy', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(dialogContext); // Đóng dialog
                
                // Hiện loading mờ
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                );

                final provider = context.read<PetProvider>();
                final success = await provider.deletePet(pet.id);

                if (mounted) {
                  Navigator.pop(context); // Tắt loading
                  if (success) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Xoá thú cưng thành công', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green),
                    );
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(provider.errorMessage ?? 'Xoá thất bại', style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red),
                    );
                  }
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: const Text('Xoá', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPetCard(Pet pet) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
        border: Border.all(color: Colors.grey.withOpacity(0.1)),
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          borderRadius: BorderRadius.circular(20),
          onTap: () async {
            showDialog(
              context: context,
              barrierDismissible: false,
              builder: (context) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
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
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Avatar thú cưng
                Container(
                  width: 65,
                  height: 65,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withOpacity(0.5), width: 2),
                  ),
                  child: ClipOval(
                    child: (pet.avatar != null && pet.avatar!.startsWith('http'))
                      ? CachedNetworkImage(
                          imageUrl: ImageHelper.getThumbnailUrl(pet.avatar!),
                          fit: BoxFit.cover,
                          placeholder: (context, url) => const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: CircularProgressIndicator(strokeWidth: 2),
                          ),
                          errorWidget: (context, url, error) => const Icon(Icons.pets, color: Colors.grey),
                        )
                      : Container(
                          color: Colors.grey[200],
                          child: const Icon(Icons.pets, color: Colors.grey, size: 30),
                        ),
                  ),
                ),
                const SizedBox(width: 16),
                
                // Thông tin
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pet.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textDark),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.category_outlined, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text(pet.breed?.name ?? 'Chưa cập nhật', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(pet.gender == 'MALE' ? Icons.male : Icons.female, 
                               size: 14, 
                               color: pet.gender == 'MALE' ? Colors.blue : Colors.pink),
                          const SizedBox(width: 4),
                          Text(
                            pet.gender == 'MALE' ? 'Đực' : (pet.gender == 'FEMALE' ? 'Cái' : 'Chưa rõ'),
                            style: TextStyle(color: Colors.grey[600], fontSize: 13)
                          ),
                          const SizedBox(width: 16),
                          Icon(Icons.scale_outlined, size: 14, color: Colors.grey[600]),
                          const SizedBox(width: 4),
                          Text('${pet.weight} kg', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
                        ],
                      ),
                    ],
                  ),
                ),
                
                // Nút Xoá
                IconButton(
                  onPressed: () => _showDeleteConfirmDialog(context, pet),
                  icon: const Icon(Icons.delete_outline, color: Colors.redAccent),
                  tooltip: 'Xoá thú cưng',
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      appBar: AppBar(
        title: const Text('Thú cưng của tôi', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textDark)),
        backgroundColor: Colors.white,
        centerTitle: true,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
          onPressed: () => Navigator.pop(context),
        ),
        actions: [
          IconButton(
            onPressed: () async {
              final provider = context.read<PetProvider>();
              final result = await Navigator.push(
                context, 
                MaterialPageRoute(builder: (context) => const AddPetPage())
              );
              if (result == true) {
                provider.fetchMyPets();
              }
            },
            icon: const Icon(Icons.add_circle_outline, color: AppColors.primary, size: 28),
          ),
          const SizedBox(width: 8),
        ],
      ),
      body: Consumer<PetProvider>(
        builder: (context, provider, child) {
          final sortedPets = List<Pet>.from(provider.myPets)..sort((a, b) => a.name.toLowerCase().compareTo(b.name.toLowerCase()));
          if (provider.isLoading && provider.myPets.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }
          if (provider.myPets.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.pets, size: 80, color: Colors.grey[300]),
                  const SizedBox(height: 16),
                  Text('Bạn chưa có thú cưng nào', style: TextStyle(color: Colors.grey[600], fontSize: 16)),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () async {
                      final result = await Navigator.push(
                        context, 
                        MaterialPageRoute(builder: (context) => const AddPetPage())
                      );
                      if (result == true) {
                        provider.fetchMyPets();
                      }
                    },
                    icon: const Icon(Icons.add, color: Colors.white),
                    label: const Text('Thêm thú cưng ngay', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  )
                ],
              ),
            );
          }
          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () => provider.fetchMyPets(),
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: sortedPets.length,
              itemBuilder: (context, index) {
                return _buildPetCard(sortedPets[index]);
              },
            ),
          );
        },
      ),
    );
  }
}
