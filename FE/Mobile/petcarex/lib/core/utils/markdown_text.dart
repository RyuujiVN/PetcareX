import 'package:flutter/material.dart';

List<InlineSpan> buildBoldMarkdownSpans(
  String text,
  TextStyle baseStyle,
) {
  final spans = <InlineSpan>[];
  final regex = RegExp(r'\*\*(.*?)\*\*', dotAll: true);

  var currentIndex = 0;
  for (final match in regex.allMatches(text)) {
    if (match.start > currentIndex) {
      spans.add(
        TextSpan(
          text: text.substring(currentIndex, match.start),
          style: baseStyle,
        ),
      );
    }

    spans.add(
      TextSpan(
        text: match.group(1) ?? '',
        style: baseStyle.copyWith(fontWeight: FontWeight.w700),
      ),
    );

    currentIndex = match.end;
  }

  if (currentIndex < text.length) {
    spans.add(
      TextSpan(
        text: text.substring(currentIndex),
        style: baseStyle,
      ),
    );
  }

  if (spans.isEmpty) {
    spans.add(TextSpan(text: text, style: baseStyle));
  }

  return spans;
}
