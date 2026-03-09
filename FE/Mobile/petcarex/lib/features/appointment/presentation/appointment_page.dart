import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';

import '../../../../core/theme/app_colors.dart';
import '../data/appointment_model.dart';
import 'provider/appointment_provider.dart';

class AppointmentPage extends StatefulWidget {
  const AppointmentPage({super.key});

  @override
  State<AppointmentPage> createState() => _AppointmentPageState();
}

class _AppointmentPageState extends State<AppointmentPage> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AppointmentProvider>().fetchAppointments();
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'Lịch khám thú cưng',
          style: TextStyle(
            color: Color(0xFF1A1C1E),
            fontWeight: FontWeight.bold,
            fontSize: 18,
          ),
        ),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: Colors.grey,
          indicatorWeight: 3,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'Sắp tới'),
            Tab(text: 'Lịch sử'),
          ],
        ),
      ),
      body: Consumer<AppointmentProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }

          if (provider.errorMessage != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(provider.errorMessage!, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.fetchAppointments(),
                    child: const Text('Thử lại'),
                  ),
                ],
              ),
            );
          }

          return TabBarView(
            controller: _tabController,
            children: [
              _buildAppointmentList(provider.upcomingAppointments, isUpcoming: true),
              _buildAppointmentList(provider.historicalAppointments, isUpcoming: false),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAppointmentList(List<Appointment> appointments, {required bool isUpcoming}) {
    if (appointments.isEmpty) {
      return RefreshIndicator(
        onRefresh: () => context.read<AppointmentProvider>().fetchAppointments(),
        color: AppColors.primary,
        child: CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverFillRemaining(
              hasScrollBody: false,
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.calendar_today_outlined, size: 64, color: Colors.grey[300]),
                    const SizedBox(height: 16),
                    Text(
                      isUpcoming ? 'Bạn không có lịch hẹn sắp tới' : 'Chưa có lịch sử khám bệnh',
                      style: TextStyle(color: Colors.grey[600], fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => context.read<AppointmentProvider>().fetchAppointments(),
      color: AppColors.primary,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: appointments.length,
        itemBuilder: (context, index) {
          return _buildAppointmentCard(appointments[index], isUpcoming);
        },
      ),
    );
  }

  Widget _buildAppointmentCard(Appointment item, bool isUpcoming) {
    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
          color: isUpcoming ? AppColors.primary.withOpacity(0.3) : Colors.grey.shade200,
          width: 1,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.03),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(24),
        onTap: () => _showAppointmentDetails(context, item),
        child: Column(
          children: [
            Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: item.pet.avatar != null && item.pet.avatar!.isNotEmpty
                      ? Image.network(
                          item.pet.avatar!,
                          width: 70,
                          height: 70,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Container(
                            width: 70,
                            height: 70,
                            color: Colors.grey[200],
                            child: const Icon(Icons.pets, color: Colors.grey),
                          ),
                        )
                      : Container(
                          width: 70,
                          height: 70,
                          color: Colors.grey[200],
                          child: const Icon(Icons.pets, color: Colors.grey),
                        ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            item.pet.name,
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          _buildStatusBadge(item.status),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        item.service,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey.shade600,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildInfoRow(
                        Icons.calendar_today_outlined,
                        '${DateFormat('dd/MM/yyyy').format(item.appointmentDate)} • ${item.appointmentTime}',
                      ),
                      const SizedBox(height: 6),
                      _buildInfoRow(Icons.medical_services_outlined, 'Bác sĩ: ${item.veterinarian.fullName}'),
                      const SizedBox(height: 6),
                      _buildInfoRow(Icons.location_on_outlined, item.clinic.address),
                    ],
                  ),
                ),
              ],
            ),
          ),
          if (isUpcoming && item.status == 'Hẹn thành công') ...[
            const Divider(height: 1, indent: 16, endIndent: 16),
            InkWell(
              onTap: () => _confirmCancel(item.id),
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 14),
                child: Center(
                  child: Text(
                    'Hủy lịch',
                    style: TextStyle(
                      color: Colors.red[400],
                      fontWeight: FontWeight.bold,
                      fontSize: 15,
                    ),
                  ),
                ),
              ),
            ),
          ] else if (!isUpcoming) ...[
            const Divider(height: 1, indent: 16, endIndent: 16),
            const Padding(
              padding: EdgeInsets.symmetric(vertical: 14),
              child: Text(
                'Xem lại',
                style: TextStyle(color: Colors.grey, fontSize: 13, fontWeight: FontWeight.bold),
              ),
            )
          ],
        ],
      ),
    ));
  }

  void _showAppointmentDetails(BuildContext context, Appointment item) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
            top: 16,
            left: 20,
            right: 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade300,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 20),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Chi tiết lịch hẹn',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  _buildStatusBadge(item.status),
                ],
              ),
              const SizedBox(height: 20),
              
              // Thông tin thú cưng
              Text(
                'Thông tin thú cưng',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  CircleAvatar(
                    radius: 25,
                    backgroundImage: (item.pet.avatar != null && item.pet.avatar!.isNotEmpty)
                        ? NetworkImage(item.pet.avatar!)
                        : null,
                    backgroundColor: Colors.grey.shade200,
                    child: (item.pet.avatar == null || item.pet.avatar!.isEmpty)
                        ? const Icon(Icons.pets, color: Colors.grey)
                        : null,
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(item.pet.name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      const SizedBox(height: 2),
                      Text('Giống loài: ${item.pet.breedName}', style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
                    ],
                  )
                ],
              ),
              const Divider(height: 30),

              // Dịch vụ và Thời gian
              Text(
                'Dịch vụ khám',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              _buildDetailRow(Icons.medical_information_outlined, 'Dịch vụ:', item.service),
              const SizedBox(height: 8),
              _buildDetailRow(
                Icons.calendar_month_outlined, 
                'Thời gian:', 
                '${item.appointmentTime} - ${DateFormat('dd/MM/yyyy').format(item.appointmentDate)}'
              ),
              if (item.note.isNotEmpty) ...[
                const SizedBox(height: 8),
                _buildDetailRow(Icons.notes_outlined, 'Ghi chú:', item.note),
              ],
              const Divider(height: 30),

              // Bác sĩ và phòng khám
              Text(
                'Thông tin bác sĩ & Phòng khám',
                style: TextStyle(fontSize: 14, color: Colors.grey.shade600, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              _buildDetailRow(Icons.person_outline, 'Bác sĩ:', item.veterinarian.fullName),
              if (item.veterinarian.specialty.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 8.0),
                  child: _buildDetailRow(Icons.star_border_outlined, 'Chuyên môn:', item.veterinarian.specialty),
                ),
              const SizedBox(height: 8),
              _buildDetailRow(Icons.store_outlined, 'Phòng khám:', item.clinic.name),
              const SizedBox(height: 8),
              _buildDetailRow(Icons.location_on_outlined, 'Địa chỉ:', item.clinic.address),

              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 8),
        SizedBox(
          width: 90,
          child: Text(
            label,
            style: TextStyle(color: Colors.grey.shade700, fontSize: 14),
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
          ),
        ),
      ],
    );
  }

  void _confirmCancel(String id) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xác nhận hủy'),
        content: const Text('Bạn có chắc chắn muốn hủy lịch hẹn này không?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Quay lại'),
          ),
          TextButton(
            onPressed: () async {
              final provider = context.read<AppointmentProvider>();
              Navigator.pop(context);
              final success = await provider.cancelAppointment(id);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Đã hủy lịch hẹn thành công' : 'Không thể hủy lịch, vui lòng thử lại'),
                    backgroundColor: success ? Colors.green : Colors.red,
                  ),
                );
              }
            },
            child: const Text('Đồng ý hủy', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusBadge(String status) {
    Color bgColor;
    Color textColor;

    switch (status) {
      case 'Hẹn thành công':
        bgColor = const Color(0xFFE0F7F4);
        textColor = AppColors.primary;
        break;
      case 'Đã khám xong':
        bgColor = const Color(0xFFE8F5E9);
        textColor = Colors.green;
        break;
      case 'Đã huỷ':
        bgColor = const Color(0xFFFFEBEE);
        textColor = Colors.red;
        break;
      default:
        bgColor = Colors.grey.shade100;
        textColor = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(
          color: textColor,
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 14, color: Colors.grey.shade600),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey.shade700,
            ),
          ),
        ),
      ],
    );
  }
}
