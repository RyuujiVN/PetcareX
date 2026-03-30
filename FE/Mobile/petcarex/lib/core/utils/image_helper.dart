class ImageHelper {
  /// Get optimized image URL from Cloudinary without cropping
  /// c_limit: scales image to fit within bounds while maintaining aspect ratio
  /// q_90: keeps high quality
  static String getDisplayUrl(String? url) {
    if (url == null || url.isEmpty) return '';
    if (!url.contains('res.cloudinary.com')) return url;
    if (url.contains('/upload/')) {
      return url.replaceFirst('/upload/', '/upload/q_90/');
    }
    return url;
  }

  /// Get optimized thumbnail URL from Cloudinary
  /// c_pad: pads the image to exact dimensions while maintaining aspect ratio (no cropping)
  /// b_auto: uses intelligent background color
  static String getThumbnailUrl(String? url, {int width = 300, int height = 300}) {
    if (url == null || url.isEmpty) return '';
    if (!url.contains('res.cloudinary.com')) return url;
    if (url.contains('/upload/')) {
      return url.replaceFirst('/upload/', '/upload/w_$width,h_$height,c_pad,b_white,q_85/');
    }
    return url;
  }

  /// Get high-quality image for full-screen viewing
  /// Auto-scales based on device, maintains quality
  static String getFullQualityUrl(String? url, {int maxWidth = 1200}) {
    if (url == null || url.isEmpty) return '';
    if (!url.contains('res.cloudinary.com')) return url;
    if (url.contains('/upload/')) {
      return url.replaceFirst('/upload/', '/upload/w_$maxWidth,c_limit,q_95/');
    }
    return url;
  }
}
