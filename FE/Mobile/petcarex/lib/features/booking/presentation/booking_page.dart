import 'dart:ui';
import 'package:flutter/material.dart';
import '../../../../core/theme/app_colors.dart';
import '../../pet/presentation/add_pet_page.dart';

class BookingPage extends StatefulWidget {
  const BookingPage({super.key});

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  int _currentStep = 0; // 0 to 5 (Step 5 is Confirmation, Step 6 is Success)
  bool _isSuccess = false;

  // Dữ liệu lựa chọn (Sẵn sàng để map với API)
  int _selectedPetIndex = 0;
  int _selectedClinicIndex = 0;
  int _selectedServiceIndex = 0;
  int _selectedDoctorIndex = 0;
  int _selectedDateIndex = 0; // Mặc định ngày đầu tiên trong danh sách
  String? _selectedTime;

  final List<String> _steps = ['Thú cưng', 'Phòng khám', 'Dịch vụ', 'Bác sĩ', 'Thời gian'];

  // Mock Data
  final List<String> _petNames = ['Lu Lu', 'Mimi'];
  final List<String> _clinics = ['PetCare', 'PetHealth', 'PetCenter'];
  final List<String> _services = ['Khám tổng quát', 'Tiêm phòng', 'Phẫu thuật'];
  final List<String> _doctors = ['BS. Nguyễn Văn An', 'BS. Lê Thị Mai'];
  
  // Tạo danh sách 7 ngày tới tính từ hôm nay
  final List<DateTime> _availableDates = List.generate(7, (index) => DateTime.now().add(Duration(days: index)));

  void _nextStep() {
    if (_currentStep == 4 && _selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Vui lòng chọn thời gian khám')));
      return;
    }

    setState(() {
      if (_currentStep < 5) {
        _currentStep++;
      } else if (_currentStep == 5) {
        _isSuccess = true;
        _currentStep = 6;
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: _isSuccess 
          ? const SizedBox() 
          : IconButton(
              icon: const Icon(Icons.arrow_back, color: AppColors.textDark),
              onPressed: () {
                if (_currentStep > 0) {
                  setState(() => _currentStep--);
                } else {
                  Navigator.pop(context);
                }
              },
            ),
        title: const Text('Đặt lịch khám', style: TextStyle(color: AppColors.textDark, fontWeight: FontWeight.bold, fontSize: 18)),
      ),
      body: Column(
        children: [
          if (!_isSuccess) ...[
            Container(
              color: Colors.white,
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildStepIndicator(),
            ),
          ],
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _isSuccess ? _buildSuccessView() : _buildCurrentView(),
            ),
          ),
        ],
      ),
      bottomNavigationBar: _buildBottomSection(),
    );
  }

  Widget _buildStepIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(_steps.length, (index) {
          final isCompleted = index < _currentStep;
          final isActive = index == _currentStep || (_currentStep >= 5 && index == 4);
          
          return Expanded(
            child: GestureDetector(
              onTap: () {
                // CHỈ CHO PHÉP QUAY LẠI, KHÔNG CHO NHẢY TỚI TRƯỚC
                if (index < _currentStep && !_isSuccess) {
                  setState(() {
                    _currentStep = index;
                  });
                }
              },
              child: Column(
                children: [
                  Container(
                    height: 4,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: (isActive || isCompleted) ? AppColors.primary : Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _steps[index],
                    style: TextStyle(
                      fontSize: 10,
                      color: (isActive || isCompleted) ? AppColors.primary : Colors.grey.shade400,
                      fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
                    ),
                  )
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildCurrentView() {
    if (_currentStep == 5) return _buildConfirmationView();
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildStepTitle(),
        const SizedBox(height: 8),
        _buildStepSubtitle(),
        const SizedBox(height: 24),
        _buildStepContent(),
        const SizedBox(height: 32),
        if (_currentStep < 5) _buildSmallSummary(),
      ],
    );
  }

  Widget _buildStepTitle() {
    final titles = ["Chọn thú cưng", "Chọn phòng khám", "Lựa chọn dịch vụ", "Chọn bác sĩ", "Chọn thời gian khám"];
    return Text(titles[_currentStep], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold));
  }

  Widget _buildStepSubtitle() {
    final subs = [
      "Chọn thú cưng cần được thăm khám hôm nay",
      "Chọn phòng khám mà bạn mong muốn nhé",
      "Chọn một dịch vụ cho thú cưng của bạn",
      "Chọn bác sĩ chuyên khoa phù hợp",
      "Lựa chọn ngày và thời gian khám"
    ];
    return Text(subs[_currentStep], style: TextStyle(fontSize: 14, color: Colors.grey.shade600));
  }

  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0: return _buildPetStep();
      case 1: return _buildClinicStep();
      case 2: return _buildServiceStep();
      case 3: return _buildDoctorStep();
      case 4: return _buildTimeStep();
      default: return Container();
    }
  }

  // --- UI COMPONENTS FOR STEPS (Gọn gàng hơn cho API) ---
  Widget _buildPetStep() {
    return GridView.count(
      crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 16, crossAxisSpacing: 16, childAspectRatio: 0.85,
      children: [
        _petItem(0, 'Lu Lu', 'assets/images/cho_phoc_soc.png', 'Chó Phốc Sóc'),
        _petItem(1, 'Mimi', 'assets/images/meo_anh_long_ngan.png', 'Mèo Anh lông ngắn'),
        _addNewItem(),
      ],
    );
  }

  Widget _petItem(int index, String name, String img, String breed) {
    bool isSel = _selectedPetIndex == index;
    return GestureDetector(
      onTap: () => setState(() => _selectedPetIndex = index),
      child: Container(
        decoration: BoxDecoration(
          color: isSel ? AppColors.primary.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSel ? AppColors.primary : Colors.grey.shade200, width: 1.5),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircleAvatar(radius: 35, backgroundImage: AssetImage(img)),
            const SizedBox(height: 12),
            Text(name, style: const TextStyle(fontWeight: FontWeight.bold)),
            Text(breed, style: const TextStyle(fontSize: 11, color: Colors.grey)),
          ],
        ),
      ),
    );
  }

  Widget _addNewItem() {
    return GestureDetector(
      onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const AddPetPage())),
      child: CustomPaint(
        painter: DashedBorderPainter(),
        child: const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [Icon(Icons.add, color: Colors.grey), Text('Thêm mới', style: TextStyle(color: Colors.grey, fontSize: 12))])),
      ),
    );
  }

  Widget _buildClinicStep() {
    return Column(children: List.generate(_clinics.length, (i) => _listTile(i, _clinics[i], "123 Đường Nguyễn Huệ, Quận 1", _selectedClinicIndex, (val) => _selectedClinicIndex = val, Icons.medical_services_outlined)));
  }

  Widget _buildServiceStep() {
    return Column(children: List.generate(_services.length, (i) => _listTile(i, _services[i], "Dịch vụ chăm sóc chất lượng cao", _selectedServiceIndex, (val) => _selectedServiceIndex = val, Icons.medical_information_outlined)));
  }

  Widget _buildDoctorStep() {
    return Column(children: List.generate(_doctors.length, (i) => _listTile(i, _doctors[i], "Chuyên khoa thú y", _selectedDoctorIndex, (val) => _selectedDoctorIndex = val, Icons.person_outline)));
  }

  Widget _listTile(int index, String title, String sub, int selectedVar, Function(int) onSelect, IconData icon) {
    bool isSel = selectedVar == index;
    return GestureDetector(
      onTap: () => setState(() => onSelect(index)),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: isSel ? AppColors.primary : Colors.grey.shade200, width: 1.5)),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(8), decoration: BoxDecoration(color: const Color(0xFFE0F7F4), borderRadius: BorderRadius.circular(10)), child: Icon(icon, color: AppColors.primary)),
          const SizedBox(width: 16),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.bold)), Text(sub, style: const TextStyle(fontSize: 12, color: Colors.grey))])),
          if (isSel) const Icon(Icons.check_circle, color: AppColors.primary),
        ]),
      ),
    );
  }

  Widget _buildTimeStep() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text("Chọn ngày khám", style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(children: List.generate(_availableDates.length, (index) => _dateItem(index))),
        ),
        const SizedBox(height: 32),
        const Text("Chọn giờ khám", style: TextStyle(fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Wrap(
          spacing: 10, runSpacing: 10,
          children: ["08:00", "08:30", "09:00", "09:30", "10:00", "14:00", "14:30", "15:00", "15:30", "16:00"].map((time) => _timeSlot(time)).toList(),
        ),
      ],
    );
  }

  Widget _dateItem(int index) {
    DateTime date = _availableDates[index];
    bool isSel = _selectedDateIndex == index;
    return GestureDetector(
      onTap: () => setState(() { _selectedDateIndex = index; _selectedTime = null; }), // Reset giờ khi đổi ngày
      child: Container(
        width: 60, margin: const EdgeInsets.only(right: 10), padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(color: isSel ? AppColors.primary : Colors.white, borderRadius: BorderRadius.circular(15), border: Border.all(color: isSel ? AppColors.primary : Colors.grey.shade200)),
        child: Column(children: [
          Text("T${date.weekday + 1 == 8 ? 'CN' : date.weekday + 1}", style: TextStyle(fontSize: 10, color: isSel ? Colors.white70 : Colors.grey)),
          const SizedBox(height: 4),
          Text("${date.day}", style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: isSel ? Colors.white : Colors.black)),
        ]),
      ),
    );
  }

  Widget _timeSlot(String time) {
    // LOGIC THỜI GIAN TƯƠNG LAI
    DateTime now = DateTime.now();
    DateTime selectedDate = _availableDates[_selectedDateIndex];
    int hour = int.parse(time.split(':')[0]);
    int min = int.parse(time.split(':')[1]);
    
    // Nếu chọn ngày hôm nay, phải kiểm tra giờ
    bool isPast = false;
    if (selectedDate.day == now.day && selectedDate.month == now.month) {
      if (hour < now.hour || (hour == now.hour && min <= now.minute)) {
        isPast = true;
      }
    }

    bool isSel = _selectedTime == time;
    return GestureDetector(
      onTap: isPast ? null : () => setState(() => _selectedTime = time),
      child: Container(
        width: (MediaQuery.of(context).size.width - 64) / 3,
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: isSel ? AppColors.primary : (isPast ? Colors.grey.shade100 : Colors.white),
          borderRadius: BorderRadius.circular(15),
          border: Border.all(color: isSel ? AppColors.primary : Colors.grey.shade200),
        ),
        child: Center(child: Text(time, style: TextStyle(fontWeight: FontWeight.bold, color: isPast ? Colors.grey.shade300 : (isSel ? Colors.white : Colors.black)))),
      ),
    );
  }

  // --- VIEWS ---
  Widget _buildConfirmationView() {
    return Column(children: [
      const Text("Vui lòng kiểm tra lại thông tin trước khi xác nhận đặt lịch", textAlign: TextAlign.center, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
      const SizedBox(height: 32),
      _summaryCard(),
    ]);
  }

  Widget _buildSuccessView() {
    return Column(children: [
      const Icon(Icons.check_circle, color: Colors.green, size: 80),
      const SizedBox(height: 16),
      const Text("ĐẶT LỊCH THÀNH CÔNG", style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
      const SizedBox(height: 32),
      _summaryCard(),
      const SizedBox(height: 32),
      const Text("MÃ QR CHECK-IN", style: TextStyle(fontWeight: FontWeight.bold, color: Colors.blueGrey)),
      const SizedBox(height: 16),
      Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(color: const Color(0xFF20C8B3), borderRadius: BorderRadius.circular(24)),
        child: Column(children: [
          Container(padding: const EdgeInsets.all(10), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)), child: const Icon(Icons.qr_code_2, size: 100, color: Colors.black)),
          const SizedBox(height: 12),
          const Text("Booking ID: #PET12345", style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
        ]),
      ),
      const SizedBox(height: 16),
      const Text("Vui lòng xuất trình mã QR này tại quầy lễ tân.", textAlign: TextAlign.center, style: TextStyle(fontSize: 12, color: Colors.grey)),
    ]);
  }

  Widget _summaryCard() {
    DateTime d = _availableDates[_selectedDateIndex];
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(color: const Color(0xFFF7F9FA), borderRadius: BorderRadius.circular(24), border: Border.all(color: Colors.grey.shade200)),
      child: Column(children: [
        _row(Icons.pets, "Thú cưng", _petNames[_selectedPetIndex]),
        _row(Icons.location_on_outlined, "Phòng khám", _clinics[_selectedClinicIndex]),
        _row(Icons.medical_services_outlined, "Dịch vụ", _services[_selectedServiceIndex]),
        _row(Icons.person_outline, "Bác sĩ", _doctors[_selectedDoctorIndex]),
        _row(Icons.calendar_today, "Thời gian", "$_selectedTime - ${d.day}/${d.month}/${d.year}"),
      ]),
    );
  }

  Widget _row(IconData i, String t, String v) => Padding(padding: const EdgeInsets.only(bottom: 16), child: Row(children: [Icon(i, color: AppColors.primary, size: 20), const SizedBox(width: 12), Text(t, style: const TextStyle(color: Colors.grey)), const Spacer(), Text(v, style: const TextStyle(fontWeight: FontWeight.bold))]));

  Widget _buildSmallSummary() {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: const Color(0xFFF7F9FA), borderRadius: BorderRadius.circular(20), border: Border.all(color: Colors.grey.shade200)),
      child: Column(children: [
        _smallRow(Icons.pets, "Thú cưng", _petNames[_selectedPetIndex], true),
        _smallRow(Icons.location_on_outlined, "Phòng khám", _clinics[_selectedClinicIndex], _currentStep >= 1),
        _smallRow(Icons.medical_services_outlined, "Dịch vụ", _services[_selectedServiceIndex], _currentStep >= 2),
        _smallRow(Icons.person_outline, "Bác sĩ", _doctors[_selectedDoctorIndex], _currentStep >= 3),
      ]),
    );
  }

  Widget _smallRow(IconData i, String t, String v, bool a) => Padding(padding: const EdgeInsets.only(bottom: 8), child: Row(children: [Icon(i, color: a ? AppColors.primary : Colors.grey, size: 16), const SizedBox(width: 8), Text(t, style: TextStyle(fontSize: 12, color: Colors.grey[600])), const Spacer(), Text(a ? v : "Chưa chọn", style: TextStyle(fontSize: 12, fontWeight: a ? FontWeight.bold : FontWeight.normal))]));

  Widget _buildBottomSection() {
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
      decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: Color(0xFFF1F1F1)))),
      child: SizedBox(
        width: double.infinity, height: 54,
        child: ElevatedButton(
          onPressed: _isSuccess ? () => Navigator.pop(context) : _nextStep,
          style: ElevatedButton.styleFrom(backgroundColor: _isSuccess ? Colors.white : AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(27)), side: _isSuccess ? const BorderSide(color: AppColors.primary) : BorderSide.none),
          child: Text(_isSuccess ? 'Thoát' : (_currentStep == 5 ? 'Xác nhận đặt lịch' : 'Tiếp tục'), style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: _isSuccess ? AppColors.primary : Colors.white)),
        ),
      ),
    );
  }
}

class DashedBorderPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = Colors.grey.shade300..strokeWidth = 1.5..style = PaintingStyle.stroke;
    final path = Path()..addRRect(RRect.fromRectAndRadius(Rect.fromLTWH(0, 0, size.width, size.height), const Radius.circular(20)));
    for (PathMetric p in path.computeMetrics()) {
      double d = 0; while (d < p.length) { canvas.drawPath(p.extractPath(d, d + 8), paint); d += 14; }
    }
  }
  @override
  bool shouldRepaint(CustomPainter oldDelegate) => false;
}
