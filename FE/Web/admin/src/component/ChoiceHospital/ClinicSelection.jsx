import { useState } from "react";
import Header from "../../default/header";
import Footer from "../../default/footer";
import { FaSearch, FaMapMarkerAlt, FaClipboardList } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const sampleClinics = [
  {
    id: 1,
    name: "PetCare Clinic",
    address: "34 Phạm Nhữ Tăng, Hòa Khê, Thanh Khê, Đà Nẵng, Việt Nam, Da Nang, Vietnam, 550000",
    time: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
    image: "./public/miniPet.png",
    rating: 4.8,
    reviews: 24,
  },
  {
    id: 2,
    name: "Bệnh Viện Thú Y Alpha",
    address: "456 Lê Văn Lương, Quận 3, TP.HCM",
    time: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
    image: "./public/36Pet.png",
    rating: 4.5,
    reviews: 17,
  },
  {
    id: 3,
    name: "PetCare Clinic - Chi nhánh 1",
    address: "789 Nguyễn Trãi, Quận 5, TP.HCM",
    time: "8:00 - 20:00 (Thứ 2 - Chủ nhật)",
    image: "./public/thanhThuy.png",
    rating: 4.2,
    reviews: 32,
  },
];

export default function ClinicSelection() {
  const [clinics] = useState(sampleClinics);
  const [searchText, setSearchText] = useState("");
  const [selectedClinic, setSelectedClinic] = useState(null);
  const navigate = useNavigate();

  const filtered = clinics.filter((c) =>
    c.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleChoose = (clinic) => {
    navigate("/clinic");
  };

  const closeModal = () => setSelectedClinic(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-cyan-50/30">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-slate-900">Danh sách phòng khám đối tác</h2>
        <p className="mt-2 text-sm text-slate-500">Chọn phòng khám phù hợp để bắt đầu trải nghiệm chăm sóc thú cưng chuyên nghiệp.</p>
        <div className="mt-5 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="relative min-w-[260px] flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="h-11 w-full rounded-lg border border-slate-200 pl-10 pr-3 text-sm outline-none ring-cyan-300 transition focus:border-cyan-400 focus:ring"
              placeholder="Tìm kiếm theo tên hoặc vị trí..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <FaClipboardList className="text-slate-500" />
            <span>Dịch vụ</span>
          </button>
          <button type="button" className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-700 hover:bg-slate-50">
            <FaMapMarkerAlt className="text-slate-500" />
            <span>Khu vực</span>
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 pb-10 sm:px-6 lg:grid-cols-3 lg:px-8">
        {filtered.map((clinic) => (
          <div key={clinic.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
            <img src={clinic.image} alt={clinic.name} className="h-52 w-full object-cover" />
            <div className="space-y-2 p-5">
              <h3 className="text-lg font-semibold text-slate-900">{clinic.name}</h3>
              <p className="text-sm text-slate-600">{clinic.address}</p>
              <p className="text-sm text-slate-500">{clinic.time}</p>
            </div>
            <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4">
              <span className="text-sm font-medium text-amber-600">{clinic.rating} ⭐ ({clinic.reviews})</span>
              <button
                className="rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-600"
                onClick={() => handleChoose(clinic)}
              >
                Chọn
              </button>
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
