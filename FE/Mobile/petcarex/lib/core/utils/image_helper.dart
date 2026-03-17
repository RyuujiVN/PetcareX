class ImageHelper {
  static String getThumbnailUrl(String? url, {int width = 200, int height = 200}) {
    if (url == null || url.isEmpty) return '';
    
    // Nếu không phải là link từ Cloudinary thì trả nguyên gốc
    if (!url.contains('res.cloudinary.com')) return url;
    
    // Gắn thêm params tối ưu trước thư mục upload
    if (url.contains('/upload/')) {
      return url.replaceFirst('/upload/', '/upload/w_$width,h_$height,c_fill,q_auto/');
    }
    
    return url;
  }
}
