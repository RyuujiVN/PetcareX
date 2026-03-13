import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../default/header";
import Footer from "../../default/footer";
import { FaMobileAlt, FaRobot, FaStethoscope, FaHeartbeat, FaFire } from "react-icons/fa";

export default function HomePageClinic() {
  const navigate = useNavigate();

  const features = [
    {
      id: 1,
      icon: <FaMobileAlt className="feature-icon" />,
      title: "Đặt lịch Online",
      description: "Giúp bạn đặt lịch khám, chọn bác sĩ mong muốn nhanh chóng và tiện lợi hơn.",
      colorClass: "blue-bg"
    },
    {
      id: 2,
      icon: <FaRobot className="feature-icon" />,
      title: "Hồ sơ Y tế",
      description: "Cho bạn xem được chi tiết hồ sơ của thú cưng của bạn khi khám xong.",
      colorClass: "purple-bg"
    },
    {
      id: 3,
      icon: <FaStethoscope className="feature-icon" />,
      title: "AI ChatBot",
      description: "Hỗ trợ tư vấn kịp thời các vấn đề liên quan đến thú cưng của bạn nhanh và chính xác nhất.",
      colorClass: "yellow-bg"
    },
    {
      id: 4,
      icon: <FaHeartbeat className="feature-icon" />,
      title: "Diễn đàn Cộng đồng",
      description: "Trao đổi thêm các thông tin về thú cưng giữa cộng đồng và bác sĩ.",
      colorClass: "green-bg"
    }
  ];

  const doctors = [
    {
      id: 1,
      name: "ThS. Nguyễn Văn A - Bác sĩ Nội khoa",
      image: "./public/bs1.png"
    },
    {
      id: 2,
      name: "ThS. Lê Thị B - Bác sĩ Ngoại khoa",
      image: "./public/bs2.png"
    },
    {
      id: 3,
      name: "ThS. Trần Tiến C - Bác sĩ Thú y",
      image: "./public/bs3.png"
    },
    {
      id: 4,
      name: "ThS. Phạm Kim D - Bác sĩ Chẩn đoán hình ảnh",
      image: "./public/bs4.png"
    }
  ];

  const servicesLeft = [
    { id: 1, title: 'CẤP CỨU 24/7',
      description: 'PetCareX Phòng khám thú cưng luôn cấp cứu 24/7, sẵn sàng bên bé mọi lúc, mọi nơi. Vì mỗi nhịp tim nhỏ bé đều xứng đáng được bảo vệ và yêu thương.'
    },
    { id: 3, title: 'ĐỘI NGŨ BÁC SĨ',
      description: 'Đội ngũ bác sĩ giàu kinh nghiệm, tận tâm và yêu thương thú cưng, luôn đặt sức khỏe và sự an toàn của bé lên hàng đầu.'
    },
    { id: 5, title: 'KHÁM CHỮA BỆNH TẠI NHÀ',
      description: 'Dịch vụ khám và điều trị thú cưng tại nhà – tiện lợi, an toàn, giúp bé được chăm sóc y tế tận nơi trong không gian quen thuộc.'
    }
  ];

  const servicesRight = [
    { id: 4, title: 'THẨM MỸ',
      description: 'Phòng khám cung cấp dịch vụ thẩm mỹ thú cưng chuyên nghiệp, giúp bé luôn sạch sẽ, thơm tho và rạng rỡ. Chăm sóc nhẹ nhàng – tạo kiểu tinh tế – nâng tầm vẻ đẹp và sự tự tin cho từng “boss”.'
    },
    { id: 2, title: 'TƯ VẤN DINH DƯỠNG',
      description: 'Dịch vụ tư vấn dinh dưỡng thú cưng – xây dựng khẩu phần ăn khoa học theo từng độ tuổi và tình trạng sức khỏe, giúp bé phát triển khỏe mạnh và phòng ngừa bệnh tật.'
    },
    { id: 6, title: 'TRANG THIẾT BỊ KHÁM',
      description: 'Phòng khám được trang bị thiết bị y tế hiện đại, hỗ trợ chẩn đoán nhanh và chính xác như máy xét nghiệm, siêu âm, X-quang,...'
    }
  ];

  const posts = [
    { id: 1, image: "./public/forum1.png", title: 'Thảo luận sốt mũi ở chó' },
    { id: 2, image: "./public/forum2.png", title: 'Cách chăm sóc mèo mới sinh' },
    { id: 3, image: "./public/forum3.png", title: 'Làm sao khi mèo bỏ ăn?' }
  ];

  const avatars = [
    { id: 1, image: './public/bs1.png', name: 'BS. Tuấn Minh' },
    { id: 2, image: './public/bs2.png', name: 'BS. Phương Lan' },
    { id: 3, image: './public/bs3.png', name: 'BS. Huy Hoàng' },
    { id: 4, image: './public/bs4.png', name: 'BS. Tuyết Mai' }
  ];

  const goTodownLoadApp = () => {
    navigate("/downloadApp");
  };

  const goToforYou = () => {
    navigate("/forYou");
  };

  return (
    <div className="bg-slate-50 text-slate-900">
      <Header />

      <section
        className="relative overflow-hidden py-24 text-white"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(16,92,117,0.75) 0%, rgba(15,105,99,0.72) 100%), url('./public/pageMainClinic.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 opacity-20 [background:radial-gradient(circle_at_top_right,#5eead4,transparent_45%)]" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
            PetCar - Khởi đầu cuộc sống tốt đẹp nhất cho thú cưng của bạn tại đây
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-cyan-100">
            Vươn thương hiệu chăm sóc thú cưng số 1 Việt Nam, luôn đặt lợi ích của 
            thú cưng và chủ nuôi lên hàng đầu.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button className="rounded-xl bg-[#1abc9c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-900/30 transition hover:-translate-y-0.5 hover:bg-[#16a085]" onClick={goTodownLoadApp}>
              Tải ứng dụng ngay
            </button>
            <button className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-slate-100" onClick={goToforYou}>
              Dành cho bạn
            </button>
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-cyan-600">Giới thiệu</span>
            <h2 className="mt-2 text-3xl font-bold">Bệnh viện thú y PetCar</h2>
          </div>
          <div className="lg:col-span-2">
            <p className="text-slate-600">
              Được thành lập vào năm 2021 với cái tên phòng khám thú y PetCar luôn tự hào là
              một trong những bệnh viện thú y hàng đầu Việt Nam. Nhiều năm qua, PetCar đã
              được khách hàng tin tưởng và luôn đồng hành. Cùng với những dịch vụ đa dạng,
              PetCar luôn mang đến những trải nghiệm tốt và đáng nhớ nhất cho quý khách.
            </p>
            <button className="mt-5 rounded-lg border border-cyan-500 px-4 py-2 text-sm font-semibold text-cyan-600 hover:bg-cyan-50">ĐỌC THÊM -</button>
          </div>
          <div className="rounded-2xl bg-cyan-50 p-6 text-center">
            <div className="text-3xl font-bold text-cyan-700">20 NĂM</div>
            <div className="mt-1 text-sm font-medium text-slate-600">5 CHI NHÁNH</div>
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">Mọi thứ mà người bạn nhỏ của bạn cần</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-slate-500">
            Bộ công cụ toàn diện để quản lý sức khỏe và hạnh phúc cho thú cưng của bạn.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {features.map((f) => (
              <div key={f.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-cyan-50 p-3 text-cyan-600">{f.icon}</div>
                  <div>
                    <h4 className="text-lg font-semibold">{f.title}</h4>
                    <p className="mt-1 text-sm text-slate-600">{f.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold">ĐỘI NGŨ PHÒNG KHÁM</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {doctors.map((doc) => (
              <div key={doc.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <img src={doc.image} alt={doc.name} className="h-56 w-full object-cover" />
                <div className="p-4 text-sm font-semibold text-slate-800">{doc.name}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-14">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
          <div className="space-y-4">
            {servicesLeft.map(s => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <h4 className="text-sm font-bold text-cyan-700">{s.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{s.description}</p>
              </div>
            ))}
          </div>

          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <img src="./public/pageMainClinic.png" alt="pet" className="h-full w-full object-cover" />
          </div>

          <div className="space-y-4">
            {servicesRight.map(s => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <h4 className="text-sm font-bold text-cyan-700">{s.title}</h4>
                <p className="mt-2 text-sm text-slate-600">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wide text-cyan-600">CỘNG ĐỒNG KẾT NỐI</span>
            <h2 className="mt-2 text-3xl font-bold">Diễn đàn cộng đồng PetCareX</h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1 text-sm font-medium text-red-500">
              <FaFire /> <span>Thảo luận sôi nổi</span>
            </div>
          </div>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {posts.map((p) => (
              <div key={p.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <img src={p.image} alt={p.title} className="h-48 w-full object-cover" />
                <p className="p-4 text-sm font-semibold text-slate-800">{p.title}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <h3 className="text-center text-xl font-bold">Bác sĩ tiêu biểu trong cộng đồng</h3>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {avatars.map((a) => (
                <div key={a.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center">
                  <img src={a.image} alt={a.name} className="mx-auto h-16 w-16 rounded-full object-cover" />
                  <span className="mt-2 block font-semibold text-slate-800">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
