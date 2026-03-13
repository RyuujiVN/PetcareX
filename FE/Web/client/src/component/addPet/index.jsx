import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { FaPaw } from "react-icons/fa";
import { FiCamera } from "react-icons/fi";
import Header from '../../default/header';

export default function AddPet() {
  const navigate = useNavigate();

  const [avatar, setAvatar] = useState(null);
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const [breed, setBreed] = useState('');
  const [gender, setGender] = useState('');
  const [birthday, setBirthday] = useState('');
  const [weight, setWeight] = useState('');
  const [color, setColor] = useState('');
  const [owner, setOwner] = useState('');

  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatar(URL.createObjectURL(file));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ avatar, name, species, breed, gender, birthday, weight, color, owner });
  };

  return (
    <div className="relative flex flex-col items-center justify-start bg-white pt-[60px]">
      <div className="fixed top-0 right-0 left-0 z-[1000] flex h-[60px] items-center border-b border-white bg-white px-[50px] max-[900px]:px-[30px]">
        <Header/>
        <div className="flex items-center gap-[10px]">
          <FaPaw size={28} color="#13ECDA" />
          <h2 className="m-0 text-[16px] font-semibold text-[#333333]">PetcareX</h2>
        </div>
      </div>

      <div className="flex w-[200%] max-w-[800px] flex-col items-center border-t border-white bg-white px-[50px] py-[30px] [animation:fadeIn_0.5s_ease-out] max-[900px]:max-w-full max-[900px]:px-[40px] max-[900px]:py-[60px]">
        <div className="mb-[20px] w-full text-center">
          <h1 className="mb-[8px] text-[28px] font-semibold text-[#333333]">Thêm thú cưng mới</h1>
          <p className="text-[14px] text-[#666666]">
            Vui lòng nhập đầy đủ thông tin để khởi tạo hồ sơ y tế cho thú cưng của bạn.
          </p>
        </div>

        <form className="w-full max-w-[750px]" onSubmit={handleSubmit}>

          <div className="mb-[30px]">
            <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Ảnh đại diện thú cưng</label>
            <div
              className="relative flex h-[180px] cursor-pointer flex-col items-center justify-center rounded-[6px] border-2 border-dashed border-[#CBD5E1] text-center hover:bg-[#f9f9f9]"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
            >
              {avatar ? (
                <img src={avatar} className="max-h-full max-w-full rounded-[6px] object-cover" alt="preview" />
              ) : (
                <>
                  <FiCamera size={36} color="#13ECDA" />
                  <p className="mt-[8px] text-[14px] text-[#666666]">Tải lên hình ảnh thú cưng của bạn</p>
                  <button
                    type="button"
                    className="mt-[12px] cursor-pointer rounded-[4px] border-none bg-[#13ECDA] px-[16px] py-[8px] text-[13px] text-white"
                  >
                    Chọn tệp tin
                  </button>
                </>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          <div className="mb-[20px] rounded-[8px] bg-[#fafafa] px-[25px] py-[20px]">
            <h2 className="mb-[15px] text-[16px] font-semibold text-[#333333]">Thông tin cơ bản</h2>
            <div className="grid grid-cols-2 gap-y-[30px] gap-x-[40px] max-[900px]:grid-cols-1">
            <div>
              <div className="mb-[20px]">
                <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Tên thú cưng</label>
                <input
                  type="text"
                  className="w-full rounded-[6px] border border-[#CBD5E1] px-[14px] py-[12px] text-[14px] text-[#0F172A] transition-all duration-300 ease-in-out placeholder:text-[#CBD5E1] focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,197,206,0.1)]"
                  placeholder="VD: Buddy"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-[20px]">
                <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Giống</label>
                <input
                  type="text"
                  className="w-full rounded-[6px] border border-[#CBD5E1] px-[14px] py-[12px] text-[14px] text-[#0F172A] transition-all duration-300 ease-in-out placeholder:text-[#CBD5E1] focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,197,206,0.1)]"
                  placeholder="VD: Poodle, Golden Retriever"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                />
              </div>

              <div className="mb-[20px]">
                <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Ngày sinh / Tuổi</label>
                <input
                  type="date"
                  className="w-full rounded-[6px] border border-[#CBD5E1] px-[14px] py-[12px] text-[14px] text-[#0F172A] transition-all duration-300 ease-in-out focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,197,206,0.1)]"
                  value={birthday}
                  onChange={(e) => setBirthday(e.target.value)}
                />
              </div>

              <div className="mb-[20px]">
                <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Màu lông / Đặc điểm nhận dạng</label>
                <input
                  type="text"
                  className="w-full rounded-[6px] border border-[#CBD5E1] px-[14px] py-[12px] text-[14px] text-[#0F172A] transition-all duration-300 ease-in-out placeholder:text-[#CBD5E1] focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,197,206,0.1)]"
                  placeholder="VD: Có đốm đen ở tai"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                />
              </div>
            </div>

            {/* right column */}
            <div>
              <div className="mb-[20px]">
                <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Loài</label>
                <select
                  className="w-full rounded-[6px] border border-[#CBD5E1] px-[14px] py-[12px] text-[14px] text-[#0F172A] transition-all duration-300 ease-in-out focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,197,206,0.1)]"
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                >
                  <option value="">Chọn loài</option>
                  <option value="dog">Chó</option>
                  <option value="cat">Mèo</option>
                  <option value="bird">Chim</option>
                  <option value="other">Khác</option>
                </select>
              </div>

              <div className="mb-[20px]">
                <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Giới tính</label>
                <div className="flex items-center gap-[20px]">
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="male"
                      checked={gender === 'male'}
                      onChange={(e) => setGender(e.target.value)}
                    /> Đực
                  </label>
                  <label>
                    <input
                      type="radio"
                      name="gender"
                      value="female"
                      checked={gender === 'female'}
                      onChange={(e) => setGender(e.target.value)}
                    /> Cái
                  </label>
                </div>
              </div>

              <div className="mb-[20px]">
                <label className="mb-[8px] block text-[13px] font-semibold text-[#0F172A]">Cân nặng (kg)</label>
                <input
                  type="number"
                  className="w-full rounded-[6px] border border-[#CBD5E1] px-[14px] py-[12px] text-[14px] text-[#0F172A] transition-all duration-300 ease-in-out placeholder:text-[#CBD5E1] focus:outline-none focus:shadow-[0_0_0_3px_rgba(131,197,206,0.1)]"
                  step="0.1"
                  placeholder="0.0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
              </div>
            </div>
            </div>
          </div>

          <div className="mt-[30px] flex w-full max-w-[750px] justify-between">
            <button
              type="button"
              className="ml-[60%] cursor-pointer rounded-[6px] border border-[#475569] bg-transparent px-[20px] py-[12px] text-[14px] text-[#475569]"
              onClick={() => navigate(-1)}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-[6px] border-none bg-[#13ECDA] px-[20px] py-[12px] text-[14px] text-white"
            >
              Thêm thú cưng mới
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}