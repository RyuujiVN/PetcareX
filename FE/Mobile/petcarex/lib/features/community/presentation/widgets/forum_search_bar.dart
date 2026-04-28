import 'dart:async';

import 'package:flutter/material.dart';

import '../../../../core/theme/app_colors.dart';

// Search input cho forum: debounce 500ms để không gọi API mỗi ký tự, đồng bộ với Web FE.
// Icon kính lúp bên trái, nút clear bên phải (chỉ hiện khi có text).
class ForumSearchBar extends StatefulWidget {
  final String value;
  final ValueChanged<String> onSearch;
  final String hintText;
  final Duration debounce;

  const ForumSearchBar({
    super.key,
    required this.value,
    required this.onSearch,
    required this.hintText,
    this.debounce = const Duration(milliseconds: 500),
  });

  @override
  State<ForumSearchBar> createState() => _ForumSearchBarState();
}

class _ForumSearchBarState extends State<ForumSearchBar> {
  late final TextEditingController _controller;
  Timer? _debounceTimer;
  String _lastEmitted = '';

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.value);
    _lastEmitted = widget.value;
  }

  @override
  void didUpdateWidget(covariant ForumSearchBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    // Đồng bộ external value (ví dụ parent reset về '') mà không loop lại onSearch.
    if (widget.value != _lastEmitted && widget.value != _controller.text) {
      _controller.text = widget.value;
      _lastEmitted = widget.value;
    }
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String text) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(widget.debounce, () {
      if (!mounted) return;
      final trimmed = text.trim();
      if (trimmed == _lastEmitted) return;
      _lastEmitted = trimmed;
      widget.onSearch(trimmed);
    });
    setState(() {}); // refresh clear button visibility
  }

  void _clear() {
    _debounceTimer?.cancel();
    _controller.clear();
    if (_lastEmitted.isNotEmpty) {
      _lastEmitted = '';
      widget.onSearch('');
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final hasText = _controller.text.isNotEmpty;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      height: 44,
      decoration: BoxDecoration(
        color: AppColors.formFillDisabled,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          const Icon(Icons.search, color: AppColors.iconGrey, size: 20),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              controller: _controller,
              onChanged: _onChanged,
              textInputAction: TextInputAction.search,
              style: const TextStyle(
                color: AppColors.textDark,
                fontSize: 13,
              ),
              decoration: InputDecoration(
                isCollapsed: true,
                border: InputBorder.none,
                hintText: widget.hintText,
                hintStyle: const TextStyle(
                  color: AppColors.textGrey,
                  fontSize: 13,
                ),
              ),
            ),
          ),
          if (hasText)
            GestureDetector(
              onTap: _clear,
              child: const Padding(
                padding: EdgeInsets.only(left: 8),
                child: Icon(Icons.close, color: AppColors.iconGrey, size: 18),
              ),
            ),
        ],
      ),
    );
  }
}
