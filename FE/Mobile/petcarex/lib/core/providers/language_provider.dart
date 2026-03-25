import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LanguageProvider extends ChangeNotifier {
  static const String _langKey = 'selected_language';
  static const String _userSelectedLangKey = 'user_selected_language';
  Locale _locale = const Locale('vi');

  Locale get locale => _locale;

  LanguageProvider() {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    final hasUserSelectedLanguage =
        prefs.getBool(_userSelectedLangKey) ?? false;
    final langCode = prefs.getString(_langKey);

    // Quy ước: người dùng vào app lần đầu luôn mặc định tiếng Việt.
    if (!hasUserSelectedLanguage) {
      _locale = const Locale('vi');
      await prefs.setString(_langKey, _locale.languageCode);
      notifyListeners();
      return;
    }

    if (langCode != null && langCode != _locale.languageCode) {
      _locale = Locale(langCode);
      notifyListeners();
    }
  }

  Future<void> setLocale(Locale locale) async {
    final prefs = await SharedPreferences.getInstance();

    if (_locale != locale) {
      _locale = locale;
      notifyListeners();
    }

    await prefs.setString(_langKey, locale.languageCode);
    await prefs.setBool(_userSelectedLangKey, true);
  }
}
