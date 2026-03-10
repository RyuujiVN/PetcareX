class ImageHelper {
  /// Tối ưu URL ảnh Cloudinary để giảm tải cho server và ứng dụng.
  /// Bằng cách chèn chuỗi params (ví dụ: w_200,h_200,c_fill,q_auto) 
  /// Hệ thống sẽ chỉ tải về ảnh thumbnail size nhỏ dung lượng vài KB thay vì ảnh gốc vài MB.
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
