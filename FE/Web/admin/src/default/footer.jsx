import React from "react";
import { FaGlobe, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";
import "./footer.css";

function Footer() {
  return (
    <footer className="petcare-footer">
      <div className="footer-top">
        <div className="footer-col about">
          <h4>PetCareX</h4>
          <p>
            Nền tảng công nghệ toàn diện kết nối hệ sinh thái thú cưng tại Việt
            Nam. Vì sức khỏe của những người bạn bốn chân.
          </p>
          <div className="social-icons">
            <a href="#" aria-label="Website">
              <FaGlobe />
            </a>
            <a href="#" aria-label="Email">
              <FaEnvelope />
            </a>
            <a href="#" aria-label="Phone">
              <FaPhone />
            </a>
          </div>
        </div>

        <div className="footer-col products">
          <h4>Sản phẩm</h4>
          <ul>
            <li>
              <a href="#">Phần mềm Quản lý</a>
            </li>
            <li>
              <a href="#">Ứng dụng Chủ nuôi</a>
            </li>
            <li>
              <a href="#">Đặt lịch Online</a>
            </li>
            <li>
              <a href="#">Bảng giá</a>
            </li>
          </ul>
        </div>

        <div className="footer-col company">
          <h4>Công ty</h4>
          <ul>
            <li>
              <a href="#">Về chúng tôi</a>
            </li>
            <li>
              <a href="#">Tuyển dụng</a>
            </li>
            <li>
              <a href="#">Tin tức</a>
            </li>
            <li>
              <a href="#">Đối tác</a>
            </li>
          </ul>
        </div>

        <div className="footer-col contact">
          <h4>Liên hệ</h4>
          <p>
            <FaMapMarkerAlt /> Tòa G 102 Hoàng Minh Thảo, Thành Phố Đà Nẵng
          </p>
          <p>
            <FaPhone /> 1900 123 456
          </p>
          <p>
            <FaEnvelope /> support@petcarex.vn
          </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 PetCareX. All rights reserved.</p>
        <div className="footer-links">
          <a href="#">Điều khoản sử dụng</a>
          <a href="#">Chính sách bảo mật</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
