import React from "react";
import { FaGlobe, FaEnvelope, FaPhone, FaMapMarkerAlt } from "react-icons/fa";

function Footer() {
  return (
    <footer className="mt-16 bg-gradient-to-b from-slate-900 to-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-4 lg:px-8">
        <div>
          <h4 className="text-lg font-semibold text-white">PetCareX</h4>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Nền tảng công nghệ toàn diện kết nối hệ sinh thái thú cưng tại Việt
            Nam. Vì sức khỏe của những người bạn bốn chân.
          </p>
          <div className="mt-4 flex items-center gap-3 text-slate-300">
            <a href="#" aria-label="Website" className="rounded-md bg-slate-800 p-2 transition hover:-translate-y-0.5 hover:bg-slate-700">
              <FaGlobe />
            </a>
            <a href="#" aria-label="Email" className="rounded-md bg-slate-800 p-2 transition hover:-translate-y-0.5 hover:bg-slate-700">
              <FaEnvelope />
            </a>
            <a href="#" aria-label="Phone" className="rounded-md bg-slate-800 p-2 transition hover:-translate-y-0.5 hover:bg-slate-700">
              <FaPhone />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Sản phẩm</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <a href="#" className="hover:text-white">Phần mềm Quản lý</a>
            </li>
            <li>
              <a href="#" className="hover:text-white">Ứng dụng Chủ nuôi</a>
            </li>
            <li>
              <a href="#" className="hover:text-white">Đặt lịch Online</a>
            </li>
            <li>
              <a href="#" className="hover:text-white">Bảng giá</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Công ty</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-400">
            <li>
              <a href="#" className="hover:text-white">Về chúng tôi</a>
            </li>
            <li>
              <a href="#" className="hover:text-white">Tuyển dụng</a>
            </li>
            <li>
              <a href="#" className="hover:text-white">Tin tức</a>
            </li>
            <li>
              <a href="#" className="hover:text-white">Đối tác</a>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-sm font-semibold uppercase tracking-wide text-white">Liên hệ</h4>
          <p className="mt-3 flex items-start gap-2 text-sm text-slate-400">
            <FaMapMarkerAlt /> Tòa G 102 Hoàng Minh Thảo, Thành Phố Đà Nẵng
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <FaPhone /> 1900 123 456
          </p>
          <p className="mt-2 flex items-center gap-2 text-sm text-slate-400">
            <FaEnvelope /> support@petcarex.vn
          </p>
        </div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <p>© 2026 PetCareX. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white">Điều khoản sử dụng</a>
            <a href="#" className="hover:text-white">Chính sách bảo mật</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
