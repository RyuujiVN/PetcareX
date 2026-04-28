import '../enums/service_enum.dart';
import '../enums/veterinary_specialty_enum.dart';

class ServiceSpecialtyMapper {
  static List<VeterinarySpecialtyEnum>? getSpecialties(ServiceEnum service) {
    return switch (service) {
      ServiceEnum.PERIODIC_HEALTH_CHECK => [
        VeterinarySpecialtyEnum.GENERAL_EXAMINATION,
      ],
      ServiceEnum.MEDICAL_EXAMINATION => [
        VeterinarySpecialtyEnum.INTERNAL_MEDICINE,
        VeterinarySpecialtyEnum.GENERAL_EXAMINATION,
      ],
      ServiceEnum.VACCINATION => [
        VeterinarySpecialtyEnum.VACCINATION_AND_PREVENTION,
      ],
      ServiceEnum.DEWORMING => [
        VeterinarySpecialtyEnum.VACCINATION_AND_PREVENTION,
      ],
      ServiceEnum.ULTRASOUND_AND_TEST => [
        VeterinarySpecialtyEnum.ULTRASOUND,
      ],
      ServiceEnum.SURGERY => [
        VeterinarySpecialtyEnum.SURGERY,
      ],
      ServiceEnum.EMERGENCY => null, // All doctors
    };
  }

  /// Returns the primary specialty value string for API query, or null for all.
  static String? getPrimarySpecialtyValue(ServiceEnum service) {
    final specialties = getSpecialties(service);
    if (specialties == null || specialties.isEmpty) return null;
    return specialties.first.value;
  }
}
