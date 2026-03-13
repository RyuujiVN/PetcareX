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
/// import 'l10n/app_localizations.dart';
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
