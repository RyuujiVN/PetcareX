import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_vi.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'generated/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
    : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
        delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
      ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('vi'),
  ];

  /// No description provided for @appName.
  ///
  /// In vi, this message translates to:
  /// **'PetCareX'**
  String get appName;

  /// No description provided for @login.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập'**
  String get login;

  /// No description provided for @register.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký'**
  String get register;

  /// No description provided for @email.
  ///
  /// In vi, this message translates to:
  /// **'Email'**
  String get email;

  /// No description provided for @password.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu'**
  String get password;

  /// No description provided for @forgotPassword.
  ///
  /// In vi, this message translates to:
  /// **'Quên mật khẩu?'**
  String get forgotPassword;

  /// No description provided for @dontHaveAccount.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có tài khoản? '**
  String get dontHaveAccount;

  /// No description provided for @registerNow.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký ngay'**
  String get registerNow;

  /// No description provided for @loginWithGoogle.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập với Google'**
  String get loginWithGoogle;

  /// No description provided for @rememberMe.
  ///
  /// In vi, this message translates to:
  /// **'Ghi nhớ đăng nhập'**
  String get rememberMe;

  /// No description provided for @emailHint.
  ///
  /// In vi, this message translates to:
  /// **'example@email.com'**
  String get emailHint;

  /// No description provided for @enterEmail.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập email'**
  String get enterEmail;

  /// No description provided for @enterPassword.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập mật khẩu'**
  String get enterPassword;

  /// No description provided for @enterConfirmPassword.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập xác nhận mật khẩu'**
  String get enterConfirmPassword;

  /// No description provided for @loginFailed.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập thất bại'**
  String get loginFailed;

  /// No description provided for @petName.
  ///
  /// In vi, this message translates to:
  /// **'Tên thú cưng'**
  String get petName;

  /// No description provided for @species.
  ///
  /// In vi, this message translates to:
  /// **'Loài'**
  String get species;

  /// No description provided for @breed.
  ///
  /// In vi, this message translates to:
  /// **'Giống'**
  String get breed;

  /// No description provided for @gender.
  ///
  /// In vi, this message translates to:
  /// **'Giới tính'**
  String get gender;

  /// No description provided for @birthDate.
  ///
  /// In vi, this message translates to:
  /// **'Ngày sinh'**
  String get birthDate;

  /// No description provided for @age.
  ///
  /// In vi, this message translates to:
  /// **'Tuổi'**
  String get age;

  /// No description provided for @weight.
  ///
  /// In vi, this message translates to:
  /// **'Cân nặng (kg)'**
  String get weight;

  /// No description provided for @furColor.
  ///
  /// In vi, this message translates to:
  /// **'Màu lông'**
  String get furColor;

  /// No description provided for @save.
  ///
  /// In vi, this message translates to:
  /// **'Lưu thông tin'**
  String get save;

  /// No description provided for @addPet.
  ///
  /// In vi, this message translates to:
  /// **'Thêm thú cưng mới'**
  String get addPet;

  /// No description provided for @fullName.
  ///
  /// In vi, this message translates to:
  /// **'Họ và tên'**
  String get fullName;

  /// No description provided for @confirmPassword.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận mật khẩu'**
  String get confirmPassword;

  /// No description provided for @agreeTerms.
  ///
  /// In vi, this message translates to:
  /// **'Tôi đồng ý với các Điều khoản & Bảo mật của PetCareX'**
  String get agreeTerms;

  /// No description provided for @createAccount.
  ///
  /// In vi, this message translates to:
  /// **'Tạo tài khoản'**
  String get createAccount;

  /// No description provided for @alreadyHaveAccount.
  ///
  /// In vi, this message translates to:
  /// **'Đã có tài khoản? '**
  String get alreadyHaveAccount;

  /// No description provided for @loginNow.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập ngay'**
  String get loginNow;

  /// No description provided for @account.
  ///
  /// In vi, this message translates to:
  /// **'Tài khoản'**
  String get account;

  /// No description provided for @personalInfo.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin cá nhân'**
  String get personalInfo;

  /// No description provided for @petInfo.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin thú cưng'**
  String get petInfo;

  /// No description provided for @changePassword.
  ///
  /// In vi, this message translates to:
  /// **'Đổi mật khẩu'**
  String get changePassword;

  /// No description provided for @aboutUs.
  ///
  /// In vi, this message translates to:
  /// **'Về chúng tôi'**
  String get aboutUs;

  /// No description provided for @logout.
  ///
  /// In vi, this message translates to:
  /// **'Đăng xuất'**
  String get logout;

  /// No description provided for @confirmLogout.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận đăng xuất'**
  String get confirmLogout;

  /// No description provided for @logoutMessage.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc chắn muốn đăng xuất khỏi tài khoản không?'**
  String get logoutMessage;

  /// No description provided for @cancel.
  ///
  /// In vi, this message translates to:
  /// **'Hủy'**
  String get cancel;

  /// No description provided for @close.
  ///
  /// In vi, this message translates to:
  /// **'Đóng'**
  String get close;

  /// No description provided for @version.
  ///
  /// In vi, this message translates to:
  /// **'Phiên bản'**
  String get version;

  /// No description provided for @otpSentTo.
  ///
  /// In vi, this message translates to:
  /// **'Mã OTP đã được gửi đến'**
  String get otpSentTo;

  /// No description provided for @resendOTP.
  ///
  /// In vi, this message translates to:
  /// **'Gửi lại mã OTP'**
  String get resendOTP;

  /// No description provided for @resendAfter.
  ///
  /// In vi, this message translates to:
  /// **'Gửi lại sau'**
  String get resendAfter;

  /// No description provided for @enterNewPassword.
  ///
  /// In vi, this message translates to:
  /// **'Nhập mật khẩu mới'**
  String get enterNewPassword;

  /// No description provided for @reEnterPassword.
  ///
  /// In vi, this message translates to:
  /// **'Nhập lại mật khẩu'**
  String get reEnterPassword;

  /// No description provided for @backToForgot.
  ///
  /// In vi, this message translates to:
  /// **'Quay lại quên mật khẩu'**
  String get backToForgot;

  /// No description provided for @updatePassword.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật mật khẩu'**
  String get updatePassword;

  /// No description provided for @changePasswordMessage.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập mật khẩu cũ và mật khẩu mới để bảo mật tài khoản của bạn.'**
  String get changePasswordMessage;

  /// No description provided for @changePasswordSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Thay đổi mật khẩu thành công'**
  String get changePasswordSuccess;

  /// No description provided for @loginSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập thành công!'**
  String get loginSuccess;

  /// No description provided for @loginGoogleSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đăng nhập Google thành công!'**
  String get loginGoogleSuccess;

  /// No description provided for @registerSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Đăng ký thành công!'**
  String get registerSuccess;

  /// No description provided for @resetPasswordSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Thiết lập lại mật khẩu thành công!'**
  String get resetPasswordSuccess;

  /// No description provided for @oldPassword.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu cũ'**
  String get oldPassword;

  /// No description provided for @newPassword.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu mới'**
  String get newPassword;

  /// No description provided for @confirmNewPassword.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận mật khẩu mới'**
  String get confirmNewPassword;

  /// No description provided for @exitAccount.
  ///
  /// In vi, this message translates to:
  /// **'Thoát khỏi tài khoản'**
  String get exitAccount;

  /// No description provided for @aboutAppName.
  ///
  /// In vi, this message translates to:
  /// **'Về PetCareX'**
  String get aboutAppName;

  /// No description provided for @aboutProjectHeadline.
  ///
  /// In vi, this message translates to:
  /// **'Đồ án Capstone 2 - Hệ thống chăm sóc thú cưng toàn diện.'**
  String get aboutProjectHeadline;

  /// No description provided for @aboutDevelopedBy.
  ///
  /// In vi, this message translates to:
  /// **'Phát triển bởi: Nhóm PetCareX'**
  String get aboutDevelopedBy;

  /// No description provided for @aboutProjectDescription.
  ///
  /// In vi, this message translates to:
  /// **'Ứng dụng này giúp bạn quản lý sức khỏe thú cưng, lịch hẹn và kết nối nhanh chóng với các bác sĩ thú y uy tín.'**
  String get aboutProjectDescription;

  /// No description provided for @personalInfoSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Xem và chỉnh sửa thông tin cá nhân'**
  String get personalInfoSubtitle;

  /// No description provided for @petInfoSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Xem và chỉnh sửa thông tin thú cưng'**
  String get petInfoSubtitle;

  /// No description provided for @changePasswordSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật mật khẩu của bạn'**
  String get changePasswordSubtitle;

  /// No description provided for @aboutUsSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin về dự án PetCareX'**
  String get aboutUsSubtitle;

  /// No description provided for @others.
  ///
  /// In vi, this message translates to:
  /// **'Khác'**
  String get others;

  /// No description provided for @resetPassword.
  ///
  /// In vi, this message translates to:
  /// **'Thiết lập lại mật khẩu'**
  String get resetPassword;

  /// No description provided for @navHome.
  ///
  /// In vi, this message translates to:
  /// **'TRANG CHỦ'**
  String get navHome;

  /// No description provided for @navBooking.
  ///
  /// In vi, this message translates to:
  /// **'ĐẶT LỊCH'**
  String get navBooking;

  /// No description provided for @navAppointments.
  ///
  /// In vi, this message translates to:
  /// **'LỊCH HẸN'**
  String get navAppointments;

  /// No description provided for @appointmentsTitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch hẹn'**
  String get appointmentsTitle;

  /// No description provided for @navCommunity.
  ///
  /// In vi, this message translates to:
  /// **'CỘNG ĐỒNG'**
  String get navCommunity;

  /// No description provided for @navProfile.
  ///
  /// In vi, this message translates to:
  /// **'CÁ NHÂN'**
  String get navProfile;

  /// No description provided for @hello.
  ///
  /// In vi, this message translates to:
  /// **'Chào bạn'**
  String get hello;

  /// No description provided for @user.
  ///
  /// In vi, this message translates to:
  /// **'Người dùng'**
  String get user;

  /// No description provided for @howIsPetToday.
  ///
  /// In vi, this message translates to:
  /// **'Hôm nay thú cưng của bạn thế nào?'**
  String get howIsPetToday;

  /// No description provided for @addNew.
  ///
  /// In vi, this message translates to:
  /// **'Thêm mới'**
  String get addNew;

  /// No description provided for @quickBooking.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lịch khám nhanh'**
  String get quickBooking;

  /// No description provided for @quickBookingSub.
  ///
  /// In vi, this message translates to:
  /// **'Chọn bác sĩ nhanh nhất ngay'**
  String get quickBookingSub;

  /// No description provided for @aiChatbot.
  ///
  /// In vi, this message translates to:
  /// **'Tư vấn AI Chatbot'**
  String get aiChatbot;

  /// No description provided for @aiChatbotSub.
  ///
  /// In vi, this message translates to:
  /// **'Hỗ trợ sức khỏe 24/7'**
  String get aiChatbotSub;

  /// No description provided for @findClinic.
  ///
  /// In vi, this message translates to:
  /// **'Tìm phòng khám gần nhất'**
  String get findClinic;

  /// No description provided for @findClinicSub.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm trên bản đồ'**
  String get findClinicSub;

  /// No description provided for @myAppointments.
  ///
  /// In vi, this message translates to:
  /// **'Lịch hẹn của tôi'**
  String get myAppointments;

  /// No description provided for @viewAll.
  ///
  /// In vi, this message translates to:
  /// **'Xem tất cả'**
  String get viewAll;

  /// No description provided for @viewDetail.
  ///
  /// In vi, this message translates to:
  /// **'Xem chi tiết'**
  String get viewDetail;

  /// No description provided for @retry.
  ///
  /// In vi, this message translates to:
  /// **'Thử lại'**
  String get retry;

  /// No description provided for @petCareForum.
  ///
  /// In vi, this message translates to:
  /// **'Diễn đàn PetCareX'**
  String get petCareForum;

  /// No description provided for @explore.
  ///
  /// In vi, this message translates to:
  /// **'Khám phá'**
  String get explore;

  /// No description provided for @scanQR.
  ///
  /// In vi, this message translates to:
  /// **'Quét mã QR'**
  String get scanQR;

  /// No description provided for @cameraPermission.
  ///
  /// In vi, this message translates to:
  /// **'Bạn cần cấp quyền Camera để quét mã QR'**
  String get cameraPermission;

  /// No description provided for @qrResult.
  ///
  /// In vi, this message translates to:
  /// **'Kết quả quét'**
  String get qrResult;

  /// No description provided for @qrContent.
  ///
  /// In vi, this message translates to:
  /// **'Nội dung mã QR'**
  String get qrContent;

  /// No description provided for @confirmAppointment.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận lịch'**
  String get confirmAppointment;

  /// No description provided for @cancelAppointment.
  ///
  /// In vi, this message translates to:
  /// **'Hủy'**
  String get cancelAppointment;

  /// No description provided for @confirmCancel.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận hủy lịch'**
  String get confirmCancel;

  /// No description provided for @cancelMessage.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc chắn muốn hủy lịch hẹn này không?'**
  String get cancelMessage;

  /// No description provided for @appointmentCancelSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Hủy lịch thành công!'**
  String get appointmentCancelSuccess;

  /// No description provided for @yes.
  ///
  /// In vi, this message translates to:
  /// **'Có'**
  String get yes;

  /// No description provided for @no.
  ///
  /// In vi, this message translates to:
  /// **'Không'**
  String get no;

  /// No description provided for @statusUpcoming.
  ///
  /// In vi, this message translates to:
  /// **'Hẹn thành công'**
  String get statusUpcoming;

  /// No description provided for @statusInProgress.
  ///
  /// In vi, this message translates to:
  /// **'Đang khám'**
  String get statusInProgress;

  /// No description provided for @statusCompleted.
  ///
  /// In vi, this message translates to:
  /// **'Đã khám xong'**
  String get statusCompleted;

  /// No description provided for @statusCancelled.
  ///
  /// In vi, this message translates to:
  /// **'Đã huỷ'**
  String get statusCancelled;

  /// No description provided for @success.
  ///
  /// In vi, this message translates to:
  /// **'Thành công!'**
  String get success;

  /// No description provided for @failed.
  ///
  /// In vi, this message translates to:
  /// **'Thất bại'**
  String get failed;

  /// No description provided for @myPets.
  ///
  /// In vi, this message translates to:
  /// **'Thú cưng của tôi'**
  String get myPets;

  /// No description provided for @petInformation.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin thú cưng'**
  String get petInformation;

  /// No description provided for @male.
  ///
  /// In vi, this message translates to:
  /// **'Đực'**
  String get male;

  /// No description provided for @female.
  ///
  /// In vi, this message translates to:
  /// **'Cái'**
  String get female;

  /// No description provided for @saveChanges.
  ///
  /// In vi, this message translates to:
  /// **'Lưu thay đổi'**
  String get saveChanges;

  /// No description provided for @viewMedicalProfile.
  ///
  /// In vi, this message translates to:
  /// **'Xem hồ sơ y tế'**
  String get viewMedicalProfile;

  /// No description provided for @medicalProfileComingSoon.
  ///
  /// In vi, this message translates to:
  /// **'Tính năng hồ sơ y tế sẽ sớm được cập nhật.'**
  String get medicalProfileComingSoon;

  /// No description provided for @medicalRecordEmptyTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có hồ sơ y tế cho thú cưng này'**
  String get medicalRecordEmptyTitle;

  /// No description provided for @medicalRecordCode.
  ///
  /// In vi, this message translates to:
  /// **'Mã hồ sơ'**
  String get medicalRecordCode;

  /// No description provided for @medicalRecordClinicName.
  ///
  /// In vi, this message translates to:
  /// **'Tên phòng khám'**
  String get medicalRecordClinicName;

  /// No description provided for @medicalRecordVeterinarianName.
  ///
  /// In vi, this message translates to:
  /// **'Tên bác sĩ'**
  String get medicalRecordVeterinarianName;

  /// No description provided for @medicalRecordExamDate.
  ///
  /// In vi, this message translates to:
  /// **'Ngày khám'**
  String get medicalRecordExamDate;

  /// No description provided for @medicalRecordWeightAtExam.
  ///
  /// In vi, this message translates to:
  /// **'Cân nặng lúc khám'**
  String get medicalRecordWeightAtExam;

  /// No description provided for @medicalRecordDiagnosis.
  ///
  /// In vi, this message translates to:
  /// **'Chẩn đoán'**
  String get medicalRecordDiagnosis;

  /// No description provided for @medicalRecordSymptoms.
  ///
  /// In vi, this message translates to:
  /// **'Triệu chứng'**
  String get medicalRecordSymptoms;

  /// No description provided for @medicalRecordConclusion.
  ///
  /// In vi, this message translates to:
  /// **'Kết luận'**
  String get medicalRecordConclusion;

  /// No description provided for @medicalRecordOrders.
  ///
  /// In vi, this message translates to:
  /// **'Phiếu chỉ định'**
  String get medicalRecordOrders;

  /// No description provided for @medicalRecordMedicines.
  ///
  /// In vi, this message translates to:
  /// **'Thuốc'**
  String get medicalRecordMedicines;

  /// No description provided for @medicalRecordNoOrders.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có phiếu chỉ định'**
  String get medicalRecordNoOrders;

  /// No description provided for @medicalRecordNoMedicines.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có thuốc'**
  String get medicalRecordNoMedicines;

  /// No description provided for @viewDetails.
  ///
  /// In vi, this message translates to:
  /// **'Xem chi tiết'**
  String get viewDetails;

  /// No description provided for @profileUpdateSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật thông tin thành công!'**
  String get profileUpdateSuccess;

  /// No description provided for @petCreateSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Thêm thú cưng thành công!'**
  String get petCreateSuccess;

  /// No description provided for @petUpdateSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Chỉnh sửa thú cưng thành công!'**
  String get petUpdateSuccess;

  /// No description provided for @petDeleteSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Xóa thú cưng thành công!'**
  String get petDeleteSuccess;

  /// No description provided for @profile.
  ///
  /// In vi, this message translates to:
  /// **'Hồ sơ cá nhân'**
  String get profile;

  /// No description provided for @loyalCustomer.
  ///
  /// In vi, this message translates to:
  /// **'Chủ nuôi thân thiết'**
  String get loyalCustomer;

  /// No description provided for @phone.
  ///
  /// In vi, this message translates to:
  /// **'Số điện thoại'**
  String get phone;

  /// No description provided for @address.
  ///
  /// In vi, this message translates to:
  /// **'Địa chỉ'**
  String get address;

  /// No description provided for @bookingTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lịch khám'**
  String get bookingTitle;

  /// No description provided for @choosePet.
  ///
  /// In vi, this message translates to:
  /// **'Chọn thú cưng của bạn'**
  String get choosePet;

  /// No description provided for @choosePetSub.
  ///
  /// In vi, this message translates to:
  /// **'Chọn thú cưng cần được thăm khám hôm nay'**
  String get choosePetSub;

  /// No description provided for @bookingClinicSub.
  ///
  /// In vi, this message translates to:
  /// **'Chọn phòng khám phù hợp cho thú cưng'**
  String get bookingClinicSub;

  /// No description provided for @bookingServiceSub.
  ///
  /// In vi, this message translates to:
  /// **'Chọn dịch vụ và nhập triệu chứng bắt buộc'**
  String get bookingServiceSub;

  /// No description provided for @bookingDoctorSub.
  ///
  /// In vi, this message translates to:
  /// **'Chọn bác sĩ thú y phù hợp'**
  String get bookingDoctorSub;

  /// No description provided for @bookingTimeSub.
  ///
  /// In vi, this message translates to:
  /// **'Chọn ngày và khung giờ khám'**
  String get bookingTimeSub;

  /// No description provided for @stepPet.
  ///
  /// In vi, this message translates to:
  /// **'Thú cưng'**
  String get stepPet;

  /// No description provided for @stepClinic.
  ///
  /// In vi, this message translates to:
  /// **'Phòng khám'**
  String get stepClinic;

  /// No description provided for @stepService.
  ///
  /// In vi, this message translates to:
  /// **'Dịch vụ'**
  String get stepService;

  /// No description provided for @stepDoctor.
  ///
  /// In vi, this message translates to:
  /// **'Bác sĩ'**
  String get stepDoctor;

  /// No description provided for @stepTime.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian'**
  String get stepTime;

  /// No description provided for @continueBtn.
  ///
  /// In vi, this message translates to:
  /// **'Tiếp tục'**
  String get continueBtn;

  /// No description provided for @upcoming.
  ///
  /// In vi, this message translates to:
  /// **'Sắp tới'**
  String get upcoming;

  /// No description provided for @history.
  ///
  /// In vi, this message translates to:
  /// **'Lịch sử'**
  String get history;

  /// No description provided for @appointmentEmptyUpcomingTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có lịch hẹn sắp tới'**
  String get appointmentEmptyUpcomingTitle;

  /// No description provided for @appointmentEmptyUpcomingDescription.
  ///
  /// In vi, this message translates to:
  /// **'Bạn chưa có lịch hẹn nào. Hãy đặt lịch để theo dõi sức khỏe thú cưng.'**
  String get appointmentEmptyUpcomingDescription;

  /// No description provided for @appointmentBookNow.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lịch ngay'**
  String get appointmentBookNow;

  /// No description provided for @appointmentEmptyHistoryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có lịch sử khám'**
  String get appointmentEmptyHistoryTitle;

  /// No description provided for @appointmentEmptyHistoryDescription.
  ///
  /// In vi, this message translates to:
  /// **'Các lịch đã hoàn thành hoặc đã hủy sẽ xuất hiện tại đây.'**
  String get appointmentEmptyHistoryDescription;

  /// No description provided for @appointmentDetail.
  ///
  /// In vi, this message translates to:
  /// **'Chi tiết lịch hẹn'**
  String get appointmentDetail;

  /// No description provided for @doctorInfo.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin bác sĩ & Phòng khám'**
  String get doctorInfo;

  /// No description provided for @doctor.
  ///
  /// In vi, this message translates to:
  /// **'Bác sĩ'**
  String get doctor;

  /// No description provided for @specialty.
  ///
  /// In vi, this message translates to:
  /// **'Chuyên môn'**
  String get specialty;

  /// No description provided for @clinic.
  ///
  /// In vi, this message translates to:
  /// **'Phòng khám'**
  String get clinic;

  /// No description provided for @serviceInfo.
  ///
  /// In vi, this message translates to:
  /// **'Dịch vụ khám'**
  String get serviceInfo;

  /// No description provided for @service.
  ///
  /// In vi, this message translates to:
  /// **'Dịch vụ'**
  String get service;

  /// No description provided for @time.
  ///
  /// In vi, this message translates to:
  /// **'Thời gian'**
  String get time;

  /// No description provided for @note.
  ///
  /// In vi, this message translates to:
  /// **'Ghi chú'**
  String get note;

  /// No description provided for @searchHint.
  ///
  /// In vi, this message translates to:
  /// **'Tìm kiếm bài viết, thú cưng...'**
  String get searchHint;

  /// No description provided for @shareSomething.
  ///
  /// In vi, this message translates to:
  /// **'Bạn muốn chia sẻ điều gì về thú cưng hôm nay?'**
  String get shareSomething;

  /// No description provided for @chooseTopic.
  ///
  /// In vi, this message translates to:
  /// **'Chọn chủ đề'**
  String get chooseTopic;

  /// No description provided for @pleaseChooseTopic.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn một chủ đề'**
  String get pleaseChooseTopic;

  /// No description provided for @noCommentsYet.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có bình luận nào'**
  String get noCommentsYet;

  /// No description provided for @replyingTo.
  ///
  /// In vi, this message translates to:
  /// **'Đang trả lời {name}'**
  String replyingTo(Object name);

  /// No description provided for @commentHint.
  ///
  /// In vi, this message translates to:
  /// **'Viết bình luận...'**
  String get commentHint;

  /// No description provided for @replyHint.
  ///
  /// In vi, this message translates to:
  /// **'Viết câu trả lời...'**
  String get replyHint;

  /// No description provided for @reply.
  ///
  /// In vi, this message translates to:
  /// **'Trả lời'**
  String get reply;

  /// No description provided for @viewReplies.
  ///
  /// In vi, this message translates to:
  /// **'Xem câu trả lời'**
  String get viewReplies;

  /// No description provided for @post.
  ///
  /// In vi, this message translates to:
  /// **'Đăng bài'**
  String get post;

  /// No description provided for @all.
  ///
  /// In vi, this message translates to:
  /// **'Tất cả'**
  String get all;

  /// No description provided for @petExperience.
  ///
  /// In vi, this message translates to:
  /// **'Kinh nghiệm nuôi'**
  String get petExperience;

  /// No description provided for @askDoctor.
  ///
  /// In vi, this message translates to:
  /// **'Hỏi đáp bác sĩ'**
  String get askDoctor;

  /// No description provided for @featuredPosts.
  ///
  /// In vi, this message translates to:
  /// **'Bài viết nổi bật'**
  String get featuredPosts;

  /// No description provided for @editPost.
  ///
  /// In vi, this message translates to:
  /// **'Chỉnh sửa bài viết'**
  String get editPost;

  /// No description provided for @update.
  ///
  /// In vi, this message translates to:
  /// **'Cập nhật'**
  String get update;

  /// No description provided for @deletePostConfirm.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc chắn muốn xóa bài viết này không?'**
  String get deletePostConfirm;

  /// No description provided for @deletePostSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Xóa bài viết thành công'**
  String get deletePostSuccess;

  /// No description provided for @handbook.
  ///
  /// In vi, this message translates to:
  /// **'CẨM NANG'**
  String get handbook;

  /// No description provided for @health.
  ///
  /// In vi, this message translates to:
  /// **'SỨC KHỎE'**
  String get health;

  /// No description provided for @delete.
  ///
  /// In vi, this message translates to:
  /// **'Xóa'**
  String get delete;

  /// No description provided for @confirmDelete.
  ///
  /// In vi, this message translates to:
  /// **'Xác nhận xóa'**
  String get confirmDelete;

  /// No description provided for @deletePetMessage.
  ///
  /// In vi, this message translates to:
  /// **'Bạn có chắc chắn muốn xóa thú cưng \"{name}\" không?'**
  String deletePetMessage(String name);

  /// No description provided for @ageYears.
  ///
  /// In vi, this message translates to:
  /// **'{count} tuổi'**
  String ageYears(int count);

  /// No description provided for @ageMonths.
  ///
  /// In vi, this message translates to:
  /// **'{count} tháng'**
  String ageMonths(int count);

  /// No description provided for @ageDays.
  ///
  /// In vi, this message translates to:
  /// **'{count} ngày'**
  String ageDays(int count);

  /// No description provided for @ageYearsMonths.
  ///
  /// In vi, this message translates to:
  /// **'{years} tuổi {months} tháng'**
  String ageYearsMonths(int years, int months);

  /// No description provided for @ageDisplayMinimumOneMonth.
  ///
  /// In vi, this message translates to:
  /// **'1 tháng tuổi'**
  String get ageDisplayMinimumOneMonth;

  /// No description provided for @ageDisplayYearsMonths.
  ///
  /// In vi, this message translates to:
  /// **'{years} năm {months} tháng'**
  String ageDisplayYearsMonths(int years, int months);

  /// No description provided for @ageDisplayYearsOnly.
  ///
  /// In vi, this message translates to:
  /// **'{count} năm'**
  String ageDisplayYearsOnly(int count);

  /// No description provided for @ageUnavailable.
  ///
  /// In vi, this message translates to:
  /// **'Chưa có'**
  String get ageUnavailable;

  /// No description provided for @forgotPasswordSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Nhập email của bạn và chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.'**
  String get forgotPasswordSubtitle;

  /// No description provided for @sendOTP.
  ///
  /// In vi, this message translates to:
  /// **'Gửi mã OTP'**
  String get sendOTP;

  /// No description provided for @otpLabel.
  ///
  /// In vi, this message translates to:
  /// **'Mã OTP'**
  String get otpLabel;

  /// No description provided for @pleaseEnter.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập {field}'**
  String pleaseEnter(String field);

  /// No description provided for @pleaseSelect.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn {field}'**
  String pleaseSelect(String field);

  /// No description provided for @selectSpeciesFirst.
  ///
  /// In vi, this message translates to:
  /// **'Chọn loài trước'**
  String get selectSpeciesFirst;

  /// No description provided for @invalidWeight.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập cân nặng hợp lệ lớn hơn 0'**
  String get invalidWeight;

  /// No description provided for @invalidWeightMax.
  ///
  /// In vi, this message translates to:
  /// **'Cân nặng tối đa là 99.9 kg'**
  String get invalidWeightMax;

  /// No description provided for @uploadPhoto.
  ///
  /// In vi, this message translates to:
  /// **'Tải ảnh'**
  String get uploadPhoto;

  /// No description provided for @uploadingImage.
  ///
  /// In vi, this message translates to:
  /// **'Đang tải ảnh lên, vui lòng đợi...'**
  String get uploadingImage;

  /// No description provided for @uploadImageSuccess.
  ///
  /// In vi, this message translates to:
  /// **'Tải ảnh thành công!'**
  String get uploadImageSuccess;

  /// No description provided for @uploadImageFailed.
  ///
  /// In vi, this message translates to:
  /// **'Tải ảnh thất bại. Vui lòng thử lại.'**
  String get uploadImageFailed;

  /// No description provided for @footerCopyright.
  ///
  /// In vi, this message translates to:
  /// **'© 2026 PetCareX Vietnam'**
  String get footerCopyright;

  /// No description provided for @invalidEmail.
  ///
  /// In vi, this message translates to:
  /// **'Email không hợp lệ'**
  String get invalidEmail;

  /// No description provided for @passwordComplexityError.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số'**
  String get passwordComplexityError;

  /// No description provided for @otpSent.
  ///
  /// In vi, this message translates to:
  /// **'Mã OTP đã được gửi thành công'**
  String get otpSent;

  /// No description provided for @invalidOtp.
  ///
  /// In vi, this message translates to:
  /// **'Mã OTP không đúng'**
  String get invalidOtp;

  /// No description provided for @otpExpired.
  ///
  /// In vi, this message translates to:
  /// **'Mã OTP đã hết hạn'**
  String get otpExpired;

  /// No description provided for @connectionError.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi kết nối tới máy chủ'**
  String get connectionError;

  /// No description provided for @passwordsNotMatch.
  ///
  /// In vi, this message translates to:
  /// **'Mật khẩu không khớp'**
  String get passwordsNotMatch;

  /// No description provided for @agreeToTermsError.
  ///
  /// In vi, this message translates to:
  /// **'Bạn cần đồng ý với điều khoản dịch vụ'**
  String get agreeToTermsError;

  /// No description provided for @validChoosePet.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn một thú cưng để đặt lịch!'**
  String get validChoosePet;

  /// No description provided for @validChooseClinic.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn phòng khám!'**
  String get validChooseClinic;

  /// No description provided for @validChooseService.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn dịch vụ!'**
  String get validChooseService;

  /// No description provided for @validEnterNote.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng nhập triệu chứng hoặc ghi chú cho thú cưng!'**
  String get validEnterNote;

  /// No description provided for @validChooseDoctor.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn bác sĩ thú y!'**
  String get validChooseDoctor;

  /// No description provided for @validChooseTime.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng chọn khung giờ khám!'**
  String get validChooseTime;

  /// No description provided for @errorUnknown.
  ///
  /// In vi, this message translates to:
  /// **'Đã có lỗi xảy ra'**
  String get errorUnknown;

  /// No description provided for @errorNetwork.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi mạng: Vui lòng kiểm tra lại kết nối Internet.'**
  String get errorNetwork;

  /// No description provided for @errorFirebase.
  ///
  /// In vi, this message translates to:
  /// **'Lỗi cấu hình hệ thống (Firebase).'**
  String get errorFirebase;

  /// No description provided for @errorGoogleAuth.
  ///
  /// In vi, this message translates to:
  /// **'Không thể lấy thông tin xác thực từ Google.'**
  String get errorGoogleAuth;

  /// No description provided for @servicePeriodicHealthCheck.
  ///
  /// In vi, this message translates to:
  /// **'Khám sức khoẻ định kỳ'**
  String get servicePeriodicHealthCheck;

  /// No description provided for @serviceMedicalExamination.
  ///
  /// In vi, this message translates to:
  /// **'Khám bệnh'**
  String get serviceMedicalExamination;

  /// No description provided for @serviceVaccination.
  ///
  /// In vi, this message translates to:
  /// **'Tiêm chủng'**
  String get serviceVaccination;

  /// No description provided for @serviceDeworming.
  ///
  /// In vi, this message translates to:
  /// **'Tẩy giun'**
  String get serviceDeworming;

  /// No description provided for @serviceUltrasoundAndTest.
  ///
  /// In vi, this message translates to:
  /// **'Siêu âm xét nghiệm'**
  String get serviceUltrasoundAndTest;

  /// No description provided for @serviceSurgery.
  ///
  /// In vi, this message translates to:
  /// **'Phẫu thuật'**
  String get serviceSurgery;

  /// No description provided for @serviceEmergency.
  ///
  /// In vi, this message translates to:
  /// **'Cấp cứu'**
  String get serviceEmergency;

  /// No description provided for @bookingErrorCompleteAllSteps.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng hoàn thành tất cả các bước!'**
  String get bookingErrorCompleteAllSteps;

  /// No description provided for @bookingServiceQualityDescription.
  ///
  /// In vi, this message translates to:
  /// **'Dịch vụ chăm sóc chất lượng cao'**
  String get bookingServiceQualityDescription;

  /// No description provided for @bookingPetSymptomsLabel.
  ///
  /// In vi, this message translates to:
  /// **'Triệu chứng của thú cưng '**
  String get bookingPetSymptomsLabel;

  /// No description provided for @bookingSymptomsRequiredHelper.
  ///
  /// In vi, this message translates to:
  /// **'Bắt buộc nhập để bác sĩ nắm tình trạng trước khi khám.'**
  String get bookingSymptomsRequiredHelper;

  /// No description provided for @bookingSymptomsHint.
  ///
  /// In vi, this message translates to:
  /// **'Ghi rõ triệu chứng hoặc tình trạng bệnh...'**
  String get bookingSymptomsHint;

  /// No description provided for @bookingDoctorNotFoundBySpecialty.
  ///
  /// In vi, this message translates to:
  /// **'Không tìm thấy bác sĩ cho chuyên môn này'**
  String get bookingDoctorNotFoundBySpecialty;

  /// No description provided for @bookingInfo.
  ///
  /// In vi, this message translates to:
  /// **'Thông tin'**
  String get bookingInfo;

  /// No description provided for @bookingSelectExamDate.
  ///
  /// In vi, this message translates to:
  /// **'Chọn ngày khám'**
  String get bookingSelectExamDate;

  /// No description provided for @bookingMorning.
  ///
  /// In vi, this message translates to:
  /// **'Buổi sáng'**
  String get bookingMorning;

  /// No description provided for @bookingAfternoon.
  ///
  /// In vi, this message translates to:
  /// **'Buổi chiều'**
  String get bookingAfternoon;

  /// No description provided for @bookingTimeMinAdvanceNotice.
  ///
  /// In vi, this message translates to:
  /// **'Chỉ được đặt lịch cách thời điểm hiện tại ít nhất 3 tiếng'**
  String get bookingTimeMinAdvanceNotice;

  /// No description provided for @bookingSummaryInstruction.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng kiểm tra lại thông tin trước khi xác nhận đặt lịch'**
  String get bookingSummaryInstruction;

  /// No description provided for @bookingSummaryTitle.
  ///
  /// In vi, this message translates to:
  /// **'Tóm tắt lịch hẹn'**
  String get bookingSummaryTitle;

  /// No description provided for @bookingSuccessTitle.
  ///
  /// In vi, this message translates to:
  /// **'Đặt lịch thành công'**
  String get bookingSuccessTitle;

  /// No description provided for @bookingSuccessSubtitle.
  ///
  /// In vi, this message translates to:
  /// **'Lịch hẹn của bạn đã được đặt! Vui lòng kiểm tra lại thông tin bên dưới'**
  String get bookingSuccessSubtitle;

  /// No description provided for @bookingCheckinQrTitle.
  ///
  /// In vi, this message translates to:
  /// **'Mã QR check-in'**
  String get bookingCheckinQrTitle;

  /// No description provided for @bookingQrInstruction.
  ///
  /// In vi, this message translates to:
  /// **'Vui lòng xuất trình mã QR này tại quầy lễ tân khi bạn đến\nđể làm thủ tục check-in nhanh chóng.'**
  String get bookingQrInstruction;

  /// No description provided for @specialtyGeneralExamination.
  ///
  /// In vi, this message translates to:
  /// **'Khám tổng quát'**
  String get specialtyGeneralExamination;

  /// No description provided for @specialtyInternalMedicine.
  ///
  /// In vi, this message translates to:
  /// **'Nội khoa'**
  String get specialtyInternalMedicine;

  /// No description provided for @specialtySurgery.
  ///
  /// In vi, this message translates to:
  /// **'Phẫu thuật'**
  String get specialtySurgery;

  /// No description provided for @specialtyUltrasound.
  ///
  /// In vi, this message translates to:
  /// **'Siêu âm'**
  String get specialtyUltrasound;

  /// No description provided for @specialtyVaccinationAndPrevention.
  ///
  /// In vi, this message translates to:
  /// **'Tiêm phòng & phòng ngừa'**
  String get specialtyVaccinationAndPrevention;

  /// No description provided for @invoiceStatusPaid.
  ///
  /// In vi, this message translates to:
  /// **'Đã thanh toán'**
  String get invoiceStatusPaid;

  /// No description provided for @invoiceStatusUnpaid.
  ///
  /// In vi, this message translates to:
  /// **'Chưa thanh toán'**
  String get invoiceStatusUnpaid;

  /// No description provided for @roleAdmin.
  ///
  /// In vi, this message translates to:
  /// **'Quản trị viên'**
  String get roleAdmin;

  /// No description provided for @roleAdminClinic.
  ///
  /// In vi, this message translates to:
  /// **'Quản trị phòng khám'**
  String get roleAdminClinic;

  /// No description provided for @roleVeterinarian.
  ///
  /// In vi, this message translates to:
  /// **'Bác sĩ thú y'**
  String get roleVeterinarian;

  /// No description provided for @roleCustomer.
  ///
  /// In vi, this message translates to:
  /// **'Khách hàng'**
  String get roleCustomer;

  /// No description provided for @medicineUnitPill.
  ///
  /// In vi, this message translates to:
  /// **'Viên nén'**
  String get medicineUnitPill;

  /// No description provided for @medicineUnitBlister.
  ///
  /// In vi, this message translates to:
  /// **'Vỉ'**
  String get medicineUnitBlister;

  /// No description provided for @medicineUnitCapsule.
  ///
  /// In vi, this message translates to:
  /// **'Viên nang'**
  String get medicineUnitCapsule;

  /// No description provided for @medicineUnitSachet.
  ///
  /// In vi, this message translates to:
  /// **'Gói'**
  String get medicineUnitSachet;

  /// No description provided for @medicineUnitBottle.
  ///
  /// In vi, this message translates to:
  /// **'Chai'**
  String get medicineUnitBottle;

  /// No description provided for @medicineUnitVial.
  ///
  /// In vi, this message translates to:
  /// **'Lọ'**
  String get medicineUnitVial;

  /// No description provided for @medicineUnitAmpoule.
  ///
  /// In vi, this message translates to:
  /// **'Ống'**
  String get medicineUnitAmpoule;

  /// No description provided for @medicineUnitMl.
  ///
  /// In vi, this message translates to:
  /// **'ml'**
  String get medicineUnitMl;

  /// No description provided for @medicineUnitMg.
  ///
  /// In vi, this message translates to:
  /// **'mg'**
  String get medicineUnitMg;

  /// No description provided for @petSpeciesDog.
  ///
  /// In vi, this message translates to:
  /// **'Chó'**
  String get petSpeciesDog;

  /// No description provided for @petSpeciesCat.
  ///
  /// In vi, this message translates to:
  /// **'Mèo'**
  String get petSpeciesCat;

  /// No description provided for @petSpeciesBird.
  ///
  /// In vi, this message translates to:
  /// **'Chim'**
  String get petSpeciesBird;

  /// No description provided for @petSpeciesRabbit.
  ///
  /// In vi, this message translates to:
  /// **'Thỏ'**
  String get petSpeciesRabbit;

  /// No description provided for @petBreedDogGoldenRetriever.
  ///
  /// In vi, this message translates to:
  /// **'Chó Golden Retriever'**
  String get petBreedDogGoldenRetriever;

  /// No description provided for @petBreedDogPoodle.
  ///
  /// In vi, this message translates to:
  /// **'Chó Poodle'**
  String get petBreedDogPoodle;

  /// No description provided for @petBreedDogPomeranian.
  ///
  /// In vi, this message translates to:
  /// **'Chó Pomeranian'**
  String get petBreedDogPomeranian;

  /// No description provided for @petBreedDogCorgi.
  ///
  /// In vi, this message translates to:
  /// **'Chó Corgi'**
  String get petBreedDogCorgi;

  /// No description provided for @petBreedDogHusky.
  ///
  /// In vi, this message translates to:
  /// **'Chó Husky'**
  String get petBreedDogHusky;

  /// No description provided for @petBreedDogLabrador.
  ///
  /// In vi, this message translates to:
  /// **'Chó Labrador'**
  String get petBreedDogLabrador;

  /// No description provided for @petBreedDogShibaInu.
  ///
  /// In vi, this message translates to:
  /// **'Chó Shiba Inu'**
  String get petBreedDogShibaInu;

  /// No description provided for @petBreedCatBritishShorthair.
  ///
  /// In vi, this message translates to:
  /// **'Mèo Anh lông ngắn'**
  String get petBreedCatBritishShorthair;

  /// No description provided for @petBreedCatBritishLonghair.
  ///
  /// In vi, this message translates to:
  /// **'Mèo Anh lông dài'**
  String get petBreedCatBritishLonghair;

  /// No description provided for @petBreedCatPersian.
  ///
  /// In vi, this message translates to:
  /// **'Mèo Ba Tư'**
  String get petBreedCatPersian;

  /// No description provided for @petBreedCatSiamese.
  ///
  /// In vi, this message translates to:
  /// **'Mèo Xiêm'**
  String get petBreedCatSiamese;

  /// No description provided for @petBreedCatBengal.
  ///
  /// In vi, this message translates to:
  /// **'Mèo Bengal'**
  String get petBreedCatBengal;

  /// No description provided for @petBreedBirdRedWhiskeredBulbul.
  ///
  /// In vi, this message translates to:
  /// **'Chào mào'**
  String get petBreedBirdRedWhiskeredBulbul;

  /// No description provided for @petBreedBirdParrot.
  ///
  /// In vi, this message translates to:
  /// **'Vẹt'**
  String get petBreedBirdParrot;

  /// No description provided for @petBreedBirdBudgerigar.
  ///
  /// In vi, this message translates to:
  /// **'Yến phụng'**
  String get petBreedBirdBudgerigar;

  /// No description provided for @petBreedRabbitDutch.
  ///
  /// In vi, this message translates to:
  /// **'Thỏ Dutch'**
  String get petBreedRabbitDutch;

  /// No description provided for @petBreedRabbitLionhead.
  ///
  /// In vi, this message translates to:
  /// **'Thỏ Lionhead'**
  String get petBreedRabbitLionhead;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'vi'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'vi':
      return AppLocalizationsVi();
  }

  throw FlutterError(
    'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
    'an issue with the localizations generation tool. Please file an issue '
    'on GitHub with a reproducible sample app and the gen-l10n configuration '
    'that was used.',
  );
}
