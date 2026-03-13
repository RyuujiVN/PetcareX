import { useNavigate } from "react-router-dom";
import { TbCircleCheck } from "react-icons/tb";
import { IoCloseCircle } from "react-icons/io5";
import { MdPets } from "react-icons/md";
import { FcDepartment, FcManager } from "react-icons/fc";
import { MdSecurity } from "react-icons/md";
import { TbLockAccess } from "react-icons/tb";
import { FcStatistics } from "react-icons/fc";
import { FcLock } from "react-icons/fc";
import { AiOutlineRise } from "react-icons/ai";
import Header from "../../default/header";
import Footer from "../../default/footer";




export default function HomePage() {
  const navigate = useNavigate();

  const stats = [
     { number: '30+', label: 'PHÒNG KHÁM TẠI VIỆT NAM' },
     { number: '50,000+', label: 'NGƯỜI DÙNG HỆ THỐNG' },
     { number: '999+', label: 'NGUỒN DỮ LIỆU THÚ CƯNG ĐA DẠNG' },
     { number: '24/7', label: 'HỔ TRỢ CHỦ NUÔI LIÊN TỤC' }
  ];

  const technologies = [
    {
      id: 1,
      title: "Đặt lịch khám trực tuyến",
      icon: "📱",
      description:
        "Kết nối chủ nuôi và bác sĩ nhanh chóng, giảm thời gian chờ đợi tại phòng khám."
    },
    {
      id: 2,
      title: "Sổ y tế điện tử",
      icon: "📖",
      description:
        "Lưu trữ lịch sử khám, phẫu thuật, tiêm phòng trọn đời cho từng thú cưng."
    },
    {
      id: 3,
      title: "Hổ trợ ChatBot AI",
      icon: "🤖",
      description:
        "Tư vấn sức khỏe sơ bộ 24/7, nhắc lịch tiêm chủng thông minh."
    },
    {
      id: 4,
      title: "Diễn đàn cộng cồng",
      icon: "👥",
      description:
        "Nơi chia sẻ kinh nghiệm chăm sóc, tìm kiếm thú cưng lạc và kết nối yêu thương."
    }
  ];
  const challenges = [
    {
      id: 1,
      title: 'Hỗ sợ bệnh án thủ công',
      description: 'Dễ mất lạc, khó tra cứu lịch sử khám chữa từ các cơ sở khác nhau'
    },
    {
      id: 2,
      title: 'Đặt lịch khám khó khăn',
      description: 'Phải gọi điện thoại, dễ sai lịch hoặc quên lịch khám'
    },
    {
      id: 3,
      title: 'Quản lý rời rạc',
      description: 'Khó theo dõi được doanh thu, từ sổ thuộc và nhân sự bị rối rạc'
    }
  ];

  const solutions = [
    {
      id: 1,
      title: 'Số hóa hồ sơ toàn diện',
      description: 'Lưu trữ đầm mây an toàn, truy cập mọi lúc mọi nơi, lịch sử minh bạch'
    },
    {
      id: 2,
      title: 'Đặt lịch Online 24/7',
      description: 'Thao tác nhanh trên App/Web, nhắc lịch tự động qua Zalo/SMS'
    },
    {
      id: 3,
      title: 'Báo cáo & Phân tích',
      description: 'Dashboard quản trị trực quan, tối ưu hóa vận hành phòng khám'
    }
  ];
  const features = [
    {
      id: 1,
      title: (
        <>
            <FcDepartment size={40}/> Phòng khám thú y
        </>),
      description: "Hệ thống quản lý phòng khám chuyên nghiệp. Tối ưu quy trình, quản lý nhân sự, kho thuốc và chăm sóc khách hàng tự động.",
      actionText: "Đăng ký Phòng khám",
      color: "green",
      items: [
        "Quản lý lịch hẹn & tiếp đón",
        "Quản lý kho được & bán hàng POS",
        "Báo cáo doanh thu chi tiết"
      ]
    },
    {
      id: 2,
      title: (
        <>
            <FcManager size={40}/>Người nuôi thú cưng
        </>),
      description:
        "Sổ sức khỏe điện tử cho thú cưng ngay trên điện thoại. Đặt lịch khám, mua sắm và nhận tư vấn từ chuyên gia dễ dàng.",
      actionText: "Tải App ngay",
      color: "orange",
      items: [
        "Lưu trữ hồ sơ sức khỏe trong đời",
        "Đặt lịch bác sĩ uy tín gần nhất",
        "Nhắc lịch tiêm & tẩy giun"
      ]
    }
  ];

  const handleLogin = () => navigate("/login");
  const handleRegister = () => navigate("/choose-clinic");

  return (
    <div className="bg-slate-50 text-slate-900">
      <Header />

      <section
        className="relative overflow-hidden py-24 text-white"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(60,85,96,0.72) 0%, rgba(39,70,81,0.78) 100%), url('/pagemain.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 opacity-25 [background:radial-gradient(circle_at_top_right,#4fd1c5,transparent_45%)]" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-100">
              <span className="h-2 w-2 rounded-full bg-cyan-300" />
              Giải pháp #1 tại Việt Nam
            </div>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              PetcareX - Hệ thống chăm sóc và quản lý thú cưng toàn diện
            </h1>

            <p className="mt-6 max-w-2xl text-base leading-7 text-slate-200 sm:text-lg">
              Chuyển đổi số toàn diện cho phòng khám thú y và mang lại trải nghiệm chăm sóc
              y tế tốt nhất, hiện đại nhất cho thú cưng của bạn.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 rounded-xl bg-[#1abc9c] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-800/20 transition hover:-translate-y-0.5 hover:bg-[#16a085]" onClick={handleLogin}>
                <MdPets size={20}/> 
                Dành cho Chủ nuôi
              </button>

              <button className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-800 shadow-lg shadow-black/20 transition hover:-translate-y-0.5 hover:bg-slate-100" onClick={handleRegister}>
                <FcDepartment size={20}/> 
                Chọn phòng khám
              </button>
            </div>
          </div>
        </div>
      </section>


      <section className="py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="flex items-center gap-2 text-2xl font-bold text-slate-900"> <AiOutlineRise size={30} color="#eb524d"/> Cung cấp công cụ chăm sóc thú cưng toàn diện</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => (
              <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="text-3xl font-bold text-cyan-600">{stat.number}</div>
                <div className="mt-2 text-sm font-medium tracking-wide text-slate-500">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-900">Thách thức & Giải pháp</h2>
          <p className="mx-auto mt-3 max-w-3xl text-center text-slate-500">
            Chúng tôi hiểu những khó khăn trong việc quản lý truyền thống và mang đến công nghệ để giải quyết triệt để
          </p>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-red-100 bg-red-50/40 p-6">
              <div className="mb-4">
                <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-red-600">THỰC TRẠNG</span>
              </div>

              <div className="space-y-4">
                {challenges.map((challenge) => (
                  <div key={challenge.id} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-red-500"><IoCloseCircle size={34}/></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{challenge.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{challenge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-6">
              <div className="mb-4">
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-600">GIẢI PHÁP PETCAREX</span>
              </div>

              <div className="space-y-4">
                {solutions.map((solution) => (
                  <div key={solution.id} className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
                    <div className="text-emerald-500"><TbCircleCheck size={28} /></div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{solution.title}</h4>
                      <p className="mt-1 text-sm text-slate-600">{solution.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

    
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-bold text-slate-900">Công Nghệ Phục Vụ Thú Cưng</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {technologies.map((tech) => (
              <div key={tech.id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <div className="text-3xl">{tech.icon}</div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">{tech.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">{tech.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            {features.map((feature) => (
              <div
                key={feature.id}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <h3 className="flex items-center gap-2 text-2xl font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
                
                <div className="mt-5 space-y-2">
                  {feature.items.map((item, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="font-bold text-emerald-500">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <button className="mt-6 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-600">
                  {feature.actionText}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl border border-blue-100 bg-blue-50/60 p-8 text-center">
            <div className="mb-2 flex justify-center">
              <MdSecurity size={50} color="#2563EB"/>
            </div>

            <h2 className="text-3xl font-bold text-slate-900">Cam kết An toàn & Bảo mật</h2>

            <p className="mx-auto mt-3 max-w-3xl text-slate-600">
              Chúng tôi xây dựng hệ sinh thái PetcareX dựa trên sự tin cậy. Dữ liệu của bạn được bảo về bằng các tiêu chuẩn bảo mật cao nhất, phân quyền chi tiết (RBAC) đảm bảo chỉ những người được ủy quyền mới có thể truy cập thông tin nhạy cảm.
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <FcLock size={40}/>
                <h4 className="mt-2 font-semibold text-slate-900">Mã hóa dữ liệu</h4>
                <p className="mt-1 text-sm text-slate-600">Bảo vệ toàn bộ thông tin bằng tiêu chuẩn SSL/TLS</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <TbLockAccess size={40}/>
                <h4 className="mt-2 font-semibold text-slate-900">Quản lý quyền truy cập</h4>
                <p className="mt-1 text-sm text-slate-600">Phân quyền chi tiết RBAC cho mỗi người dùng</p>
              </div>
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <FcStatistics size={40}/>
                <h4 className="mt-2 font-semibold text-slate-900">Kiểm toán hoạt động</h4>
                <p className="mt-1 text-sm text-slate-600">Ghi lại mọi thao tác cho mục đích quản lý</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900 py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold">Sẵn sàng chăm sóc thú cưng tốt hơn?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Tham gia cùng cộng đồng hơn 30+ phòng khám và 50.000+ chủ nuôi tin dùng PetcareX.
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button className="rounded-lg bg-cyan-500 px-5 py-3 text-sm font-semibold text-white hover:bg-cyan-600" onClick={handleRegister}>
              Đăng ký miễn phí
            </button>
            <button className="rounded-lg border border-slate-500 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800">
              Liên hệ tư vấn
            </button>
          </div>
        </div>
      </section>


      {/* old static footer removed; using reusable component instead */}
      <Footer />
    </div>
  );
}