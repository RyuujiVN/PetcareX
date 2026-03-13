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
