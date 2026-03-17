import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/utils/image_helper.dart';
import '../../../../l10n/generated/app_localizations.dart';
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
      if (mounted) {
        context.read<PetProvider>().fetchMyPets();
      }
    });
  }

  String _calculateAge(String dateOfBirthStr, AppLocalizations l10n) {
    try {
      final dob = DateTime.parse(dateOfBirthStr);
      final now = DateTime.now();

      int years = now.year - dob.year;
      int months = now.month - dob.month;
      int days = now.day - dob.day;

      if (months < 0 || (months == 0 && days < 0)) {
        years--;
        months += 12;
      }

      if (days < 0) {
        final previousMonth = DateTime(now.year, now.month, 0);
        days += previousMonth.day;
        months--;
      }
      
      if (years > 0) return l10n.ageYears(years);
      if (months > 0) return l10n.ageMonths(months);
      return l10n.ageDays(days <= 0 ? 1 : days);
    } catch (e) {
      return l10n.failed;
    }
  }

  void _showDeleteConfirmDialog(BuildContext context, Pet pet, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (BuildContext dialogContext) {
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: Text(l10n.confirmDelete, style: const TextStyle(fontWeight: FontWeight.bold)),
          content: Text(l10n.deletePetMessage(pet.name)),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              style: TextButton.styleFrom(foregroundColor: AppColors.textGrey),
              child: Text(l10n.cancel, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
            ElevatedButton(
              onPressed: () async {
                Navigator.pop(dialogContext);
                
                showDialog(
                  context: context,
                  barrierDismissible: false,
                  builder: (context) => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                );

                final provider = context.read<PetProvider>();
                final success = await provider.deletePet(pet.id);

                if (!context.mounted) return;
                Navigator.pop(context);

                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(l10n.success), backgroundColor: AppColors.success),
                  );
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text(provider.errorMessage ?? l10n.failed), backgroundColor: AppColors.error),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.error,
                foregroundColor: AppColors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(l10n.delete, style: const TextStyle(fontWeight: FontWeight.bold)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPetCard(Pet pet, AppLocalizations l10n) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: AppColors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: AppColors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
        border: Border.all(color: AppColors.borderGrey),
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
              if (result == true && mounted) {
                context.read<PetProvider>().fetchMyPets();
              }
            } catch (e) {
              if (mounted) Navigator.pop(context);
            }
          },
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Container(
                  width: 65,
                  height: 65,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppColors.primary.withValues(alpha: 0.5), width: 2),
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
                          errorWidget: (context, url, error) => const Icon(Icons.pets, color: AppColors.iconGrey),
                        )
                      : Container(
                          color: AppColors.background,
                          child: const Icon(Icons.pets, color: AppColors.iconGrey, size: 30),
                        ),
                  ),
                ),
                const SizedBox(width: 16),
                
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pet.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textDark),
                      ),
                      const SizedBox(height: 4),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            const Icon(Icons.category_outlined, size: 14, color: AppColors.textGrey),
                            const SizedBox(width: 4),
                            Text(pet.breed?.name ?? l10n.failed, style: const TextStyle(color: AppColors.textGrey, fontSize: 13)),
                            const SizedBox(width: 12),
                            Icon(pet.gender ? Icons.male : Icons.female, 
                                 size: 14, 
                                 color: pet.gender ? AppColors.male : AppColors.female),
                            const SizedBox(width: 4),
                            Text(
                              pet.gender ? l10n.male : l10n.female,
                              style: const TextStyle(color: AppColors.textGrey, fontSize: 13)
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 4),
                      SingleChildScrollView(
                        scrollDirection: Axis.horizontal,
                        child: Row(
                          children: [
                            const Icon(Icons.cake_outlined, size: 14, color: AppColors.textGrey),
                            const SizedBox(width: 4),
                            Text(_calculateAge(pet.dateOfBirth, l10n), style: const TextStyle(color: AppColors.textGrey, fontSize: 13)),
                            const SizedBox(width: 12),
                            const Icon(Icons.monitor_weight_outlined, size: 14, color: AppColors.textGrey),
                            const SizedBox(width: 4),
                            Text('${pet.weight} kg', style: const TextStyle(color: AppColors.textGrey, fontSize: 13)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                
                IconButton(
                  onPressed: () => _showDeleteConfirmDialog(context, pet, l10n),
                  icon: const Icon(Icons.delete_outline, color: AppColors.error),
                  tooltip: l10n.delete,
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
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(l10n.myPets, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: AppColors.textDark)),
        backgroundColor: AppColors.white,
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
              final result = await Navigator.push(
                context, 
                MaterialPageRoute(builder: (context) => const AddPetPage())
              );
              if (result == true && mounted) {
                context.read<PetProvider>().fetchMyPets();
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
                  const Icon(Icons.pets, size: 80, color: AppColors.iconGrey),
                  const SizedBox(height: 16),
                  Text(l10n.petInfoSubtitle, style: const TextStyle(color: AppColors.textGrey, fontSize: 16)),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: () async {
                      final result = await Navigator.push(
                        context, 
                        MaterialPageRoute(builder: (context) => const AddPetPage())
                      );
                      if (result == true && mounted) {
                        context.read<PetProvider>().fetchMyPets();
                      }
                    },
                    icon: const Icon(Icons.add, color: AppColors.white),
                    label: Text(l10n.addPet, style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.white)),
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
                return _buildPetCard(sortedPets[index], l10n);
              },
            ),
          );
        },
      ),
    );
  }
}
