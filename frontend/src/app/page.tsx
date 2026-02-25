'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  useEffect(() => {
    // Add smooth scrolling specifically to the html element
    document.documentElement.classList.add('scroll-smooth');
    return () => document.documentElement.classList.remove('scroll-smooth');
  }, []);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <>
      <nav className="fixed w-full bg-white/40 backdrop-blur-md z-50 border-b-4 border-white transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center gap-3 text-2xl font-black text-brand-shadow">
              <div className="w-10 h-10 bg-brand-btn rounded-full flex items-center justify-center text-white shadow-[0_4px_0_var(--color-brand-shadow)] border-2 border-white">
                <i className="fas fa-moon"></i>
              </div>
              Ramadhan Ceria
            </Link>

            <div className="hidden md:flex space-x-8 items-center">
              <a href="#fitur" className="text-brand-heading hover:text-brand-shadow font-bold transition">Fitur Utama</a>
              <a href="#cara-kerja" className="text-brand-heading hover:text-brand-shadow font-bold transition">Cara Kerja</a>
              <a href="#testimoni" className="text-brand-heading hover:text-brand-shadow font-bold transition">Testimoni</a>
              <a href="#harga" className="text-brand-heading hover:text-brand-shadow font-bold transition">Harga</a>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-brand-shadow font-bold hover:bg-white/50 px-5 py-2 rounded-full transition">Masuk</Link>
              <Link href="/register" className="btn-gemoy px-6 py-2.5 rounded-full font-black text-lg">Daftar Gratis</Link>
            </div>

            <button
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden text-brand-shadow text-2xl w-12 h-12 rounded-full bg-white border-2 border-brand-border flex items-center justify-center shadow-[0_4px_0_var(--color-brand-card-shadow)] active:translate-y-1 active:shadow-none transition-all"
            >
              <i className="fas fa-bars"></i>
            </button>
          </div>
        </div>
      </nav>

      {/* MOBILE SIDEBAR */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-brand-text/50 backdrop-blur-sm z-[55] transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 w-64 bg-brand-bg1 shadow-2xl z-[60] transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 border-r-4 border-white`}>
        <div className="p-6 border-b-2 border-brand-border flex justify-between items-center">
          <span className="font-black text-xl text-brand-heading">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)} className="text-brand-shadow text-2xl">
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="p-4 flex flex-col gap-4 font-bold text-brand-text">
          <a href="#fitur" onClick={() => setIsSidebarOpen(false)} className="hover:bg-white p-3 rounded-xl transition">Fitur Utama</a>
          <a href="#cara-kerja" onClick={() => setIsSidebarOpen(false)} className="hover:bg-white p-3 rounded-xl transition">Cara Kerja</a>
          <a href="#harga" onClick={() => setIsSidebarOpen(false)} className="hover:bg-white p-3 rounded-xl transition">Harga Paket</a>
          <hr className="border-brand-border my-2" />
          <Link href="/login" onClick={() => setIsSidebarOpen(false)} className="text-center bg-white text-brand-shadow py-3 rounded-full border-2 border-brand-border shadow-sm">Masuk</Link>
          <Link href="/register" onClick={() => setIsSidebarOpen(false)} className="text-center btn-gemoy py-3 rounded-full">Daftar Gratis</Link>
        </div>
      </div>

      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block bg-white text-brand-shadow font-bold px-5 py-2 rounded-full text-sm mb-6 border-2 border-brand-border shadow-sm">
                ⭐ Platform Gamifikasi Ibadah No.1
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-brand-heading leading-tight mb-6 drop-shadow-md">
                Buat Ramadhan Keluarga Makin Ceria dengan <span className="text-brand-btn" style={{ textShadow: '2px 2px 0px white' }}>Poin & Reward</span>
              </h1>
              <p className="text-lg md:text-xl text-brand-text font-semibold mb-10 max-w-2xl mx-auto lg:mx-0">
                Ajak anak-anak berlomba dalam kebaikan. Catat ibadah, tugas rumah, dan berikan reward spesial setiap hari tanpa harus marah-marah.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-5">
                <Link href="/register" className="w-full sm:w-auto btn-gemoy px-8 py-4 rounded-full font-black text-lg text-center">
                  Coba Gratis 30 Hari
                </Link>
                <a href="#cara-kerja" className="w-full sm:w-auto btn-outline-gemoy px-8 py-4 rounded-full font-bold text-lg text-center flex items-center justify-center gap-2">
                  <i className="fas fa-play-circle text-brand-shadow"></i> Lihat Cara Kerja
                </a>
              </div>
            </div>
            <div className="flex-1 w-full max-w-lg lg:max-w-none relative">
              <div className="bg-white p-4 rounded-[40px] shadow-2xl border-8 border-white transform rotate-2 hover:rotate-0 transition duration-500">
                <img src="/hero.webp" alt="Dashboard SaaS Ramadhan Ceria" className="rounded-[30px] w-full object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fitur" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-brand-heading mb-4 drop-shadow-sm">💡 Mengapa Ramadhan Ceria?</h2>
            <p className="text-brand-text font-semibold text-lg">Didesain dengan pendekatan psikologi anak agar ibadah terasa seperti bermain game.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card-gemoy p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_6px_0_var(--color-brand-border)] border-4 border-brand-bg1">👦</div>
              <h3 className="text-xl font-bold text-brand-heading mb-3">Login Avatar Anak</h3>
              <p className="text-brand-text font-medium">Anak masuk ke aplikasi cukup dengan klik Avatar wajah mereka dan ketik PIN 4 digit. Aman & mudah!</p>
            </div>
            <div className="card-gemoy p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_6px_0_var(--color-brand-border)] border-4 border-brand-bg1">✨</div>
              <h3 className="text-xl font-bold text-brand-heading mb-3">Magic Template Tugas</h3>
              <p className="text-brand-text font-medium">Tak perlu repot ngetik. Pilih template tugas sesuai usia anak, tugas harian langsung terisi otomatis.</p>
            </div>
            <div className="card-gemoy p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_6px_0_var(--color-brand-border)] border-4 border-brand-bg1">🎁</div>
              <h3 className="text-xl font-bold text-brand-heading mb-3">Toko Reward Custom</h3>
              <p className="text-brand-text font-medium">Buat toko hadiah sesuai budget keluarga. Anak bisa request menukar hadiah langsung dari panel mereka.</p>
            </div>
            <div className="card-gemoy p-8 text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center text-4xl mb-6 shadow-[0_6px_0_var(--color-brand-border)] border-4 border-brand-bg1">🏆</div>
              <h3 className="text-xl font-bold text-brand-heading mb-3">Papan Peringkat</h3>
              <p className="text-brand-text font-medium">Bangkitkan jiwa kompetitif yang sehat antar saudara dengan Juara Mingguan (Bisa di ON/OFF).</p>
            </div>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="py-24 bg-white/40 border-y-8 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-black text-center text-brand-heading mb-16 drop-shadow-sm">⚙️ Cara Kerjanya Gampang Banget!</h2>

          <div className="grid md:grid-cols-4 gap-8">
            <div className="card-gemoy p-8 text-center relative mt-6 md:mt-0">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-brand-btn text-white rounded-full flex items-center justify-center font-black text-2xl border-4 border-white shadow-[0_6px_0_var(--color-brand-shadow)]">1</div>
              <h4 className="text-xl font-bold text-brand-heading mb-2 mt-4">Daftar Akun</h4>
              <p className="text-brand-text font-medium">Buat akun Orang Tua dan tambahkan avatar profil anak-anak.</p>
            </div>
            <div className="card-gemoy p-8 text-center relative mt-6 md:mt-0">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-brand-btn text-white rounded-full flex items-center justify-center font-black text-2xl border-4 border-white shadow-[0_6px_0_var(--color-brand-shadow)]">2</div>
              <h4 className="text-xl font-bold text-brand-heading mb-2 mt-4">Pilih Template</h4>
              <p className="text-brand-text font-medium">Set tugas harian dan reward yang menarik (Bisa pakai Magic Template).</p>
            </div>
            <div className="card-gemoy p-8 text-center relative mt-6 md:mt-0">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-brand-btn text-white rounded-full flex items-center justify-center font-black text-2xl border-4 border-white shadow-[0_6px_0_var(--color-brand-shadow)]">3</div>
              <h4 className="text-xl font-bold text-brand-heading mb-2 mt-4">Anak Beraksi</h4>
              <p className="text-brand-text font-medium">Anak login dengan PIN, centang tugas, dan kumpulkan poin setiap hari.</p>
            </div>
            <div className="card-gemoy p-8 text-center relative mt-6 md:mt-0">
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-brand-btn text-white rounded-full flex items-center justify-center font-black text-2xl border-4 border-white shadow-[0_6px_0_var(--color-brand-shadow)]">4</div>
              <h4 className="text-xl font-bold text-brand-heading mb-2 mt-4">Tukar Hadiah</h4>
              <p className="text-brand-text font-medium">Anak request tukar poin, ortu approve, dan wujudkan rewardnya!</p>
            </div>
          </div>
        </div>
      </section>

      <section id="testimoni" className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-4xl md:text-5xl font-black text-center text-brand-heading mb-16 drop-shadow-sm">❤️ Kata Mereka yang Sudah Pakai</h2>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="card-gemoy p-8 relative">
              <div className="absolute -top-6 -right-4 text-6xl text-brand-btn opacity-50"><i className="fas fa-quote-right"></i></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-brand-bg2 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm">👨‍👩‍👧</div>
                <div>
                  <h4 className="font-bold text-brand-heading">Bunda Aisyah</h4>
                  <p className="text-brand-text text-sm">Ibu 3 Anak</p>
                </div>
              </div>
              <p className="text-brand-text font-semibold italic">"Ajaib! Biasanya susah banget nyuruh anak sholat Dhuha. Sejak pakai aplikasi ini, mereka malah yang ngajakin karena kejar poin buat tuker es krim."</p>
            </div>

            <div className="card-gemoy p-8 relative">
              <div className="absolute -top-6 -right-4 text-6xl text-brand-btn opacity-50"><i className="fas fa-quote-right"></i></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-brand-bg2 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm">👨‍👦</div>
                <div>
                  <h4 className="font-bold text-brand-heading">Ayah Bima</h4>
                  <p className="text-brand-text text-sm">Pegawai Swasta</p>
                </div>
              </div>
              <p className="text-brand-text font-semibold italic">"Fitur Papan Peringkatnya bikin seru. Kakak sama Adik jadi balapan nyelesain tugas rumah sakit bantuin ibunya. Mantap Ramadhan Ceria!"</p>
            </div>

            <div className="card-gemoy p-8 relative">
              <div className="absolute -top-6 -right-4 text-6xl text-brand-btn opacity-50"><i className="fas fa-quote-right"></i></div>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-brand-bg2 rounded-full flex items-center justify-center text-2xl border-2 border-white shadow-sm">👩‍👧‍👦</div>
                <div>
                  <h4 className="font-bold text-brand-heading">Bunda Sarah</h4>
                  <p className="text-brand-text text-sm">Wirausaha</p>
                </div>
              </div>
              <p className="text-brand-text font-semibold italic">"Suka banget sama login anaknya. Gak perlu hafal password, cuma klik muka mereka terus masukin PIN. Gampang banget dipakai anak TK sekalipun."</p>
            </div>
          </div>
        </div>
      </section>

      <section id="harga" className="py-24 bg-white/40 border-y-8 border-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-brand-heading mb-4 drop-shadow-sm">💎 Investasi Amal Jariyah Keluarga</h2>
            <p className="text-brand-text font-semibold text-lg">Pilih paket yang pas untuk jagoan di rumah.</p>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-10 max-w-5xl mx-auto">
            {/* Paket Sabar */}
            <div className="flex-1 bg-white rounded-[50px] p-10 border-8 border-white shadow-[0_15px_0_var(--color-brand-card-shadow)] flex flex-col">
              <h3 className="text-3xl font-black text-brand-heading mb-2 text-center">Paket Sabar</h3>
              <div className="flex items-baseline justify-center gap-2 mb-8 border-b-2 border-brand-bg1 pb-6">
                <span className="text-6xl font-black text-brand-shadow">Rp0</span>
                <span className="text-brand-text font-bold">/ selamanya</span>
              </div>
              <ul className="space-y-4 mb-10 font-bold text-brand-text flex-1">
                <li className="flex items-center gap-3"><div className="text-green-500 text-xl"><i className="fas fa-check-circle"></i></div> Maksimal 2 Anak</li>
                <li className="flex items-center gap-3"><div className="text-green-500 text-xl"><i className="fas fa-check-circle"></i></div> 10 Template Tugas Harian</li>
                <li className="flex items-center gap-3"><div className="text-green-500 text-xl"><i className="fas fa-check-circle"></i></div> 5 Katalog Hadiah</li>
                <li className="flex items-center gap-3 opacity-50"><div className="text-red-400 text-xl"><i className="fas fa-times-circle"></i></div> Akses Papan Peringkat</li>
                <li className="flex items-center gap-3 opacity-50"><div className="text-red-400 text-xl"><i className="fas fa-times-circle"></i></div> Laporan Evaluasi Anak</li>
              </ul>
              <Link href="/register" className="block w-full text-center btn-outline-gemoy py-4 rounded-full font-black text-xl">Mulai Gratis</Link>
            </div>

            {/* Paket Berkah */}
            <div className="flex-1 bg-brand-btn rounded-[50px] p-10 border-8 border-white shadow-[0_20px_0_var(--color-brand-shadow)] relative transform md:-translate-y-4 flex flex-col z-10">
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white text-brand-shadow text-sm font-black px-6 py-2 rounded-full uppercase tracking-wider border-4 border-brand-border shadow-sm">
                Paling Laris 🔥
              </div>
              <h3 className="text-3xl font-black text-white mb-2 text-center mt-4">Paket Berkah</h3>
              <div className="flex items-baseline justify-center gap-2 mb-8 border-b-2 border-white/30 pb-6 text-white">
                <span className="text-6xl font-black">49rb</span>
                <span className="text-brand-heading font-bold">/ ramadhan</span>
              </div>
              <ul className="space-y-4 mb-10 font-bold text-white flex-1">
                <li className="flex items-center gap-3"><div className="text-white text-xl"><i className="fas fa-check-circle"></i></div> Anak Tidak Terbatas</li>
                <li className="flex items-center gap-3"><div className="text-white text-xl"><i className="fas fa-check-circle"></i></div> Tugas & Hadiah Custom Bebas</li>
                <li className="flex items-center gap-3"><div className="text-white text-xl"><i className="fas fa-check-circle"></i></div> Akses Papan Peringkat Anak</li>
                <li className="flex items-center gap-3"><div className="text-white text-xl"><i className="fas fa-check-circle"></i></div> Ekspor Laporan Evaluasi PDF</li>
                <li className="flex items-center gap-3"><div className="text-white text-xl"><i className="fas fa-check-circle"></i></div> Bebas Iklan</li>
              </ul>
              <Link href="/register" className="block w-full text-center bg-white text-brand-shadow py-4 rounded-full font-black text-xl shadow-[0_6px_0_var(--color-brand-border)] active:translate-y-1 active:shadow-none transition">Upgrade Sekarang</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 text-center px-4">
        <div className="max-w-4xl mx-auto card-gemoy p-12 bg-white/80">
          <h2 className="text-4xl md:text-5xl font-black text-brand-heading mb-6 drop-shadow-sm">Siap Mencetak Ramadhan Ceria?</h2>
          <p className="text-xl font-bold text-brand-text mb-10">Daftar sekarang dan lihat senyum anak-anakmu saat mengerjakan ibadah.</p>
          <Link href="/register" className="btn-gemoy inline-block text-xl py-4 px-12 rounded-full font-black">Daftar Gratis Sekarang</Link>
        </div>
      </section>

      <footer className="bg-white/60 backdrop-blur-md pt-20 pb-10 border-t-8 border-white rounded-t-[60px]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-3 text-2xl font-black text-brand-shadow mb-6">
                <div className="w-10 h-10 bg-brand-btn rounded-full flex items-center justify-center text-white">
                  <i className="fas fa-moon"></i>
                </div>
                Ramadhan Ceria
              </Link>
              <p className="text-brand-text font-bold mb-6">Membantu jutaan keluarga muslim mendidik anak beribadah dengan cara yang ceria dan tanpa marah-marah.</p>
            </div>
            <div>
              <h4 className="text-brand-heading font-black mb-6 text-xl">Fitur Pintar</h4>
              <ul className="space-y-4 font-bold text-brand-text">
                <li><a href="#fitur" className="hover:text-brand-shadow transition">Avatar Anak</a></li>
                <li><a href="#fitur" className="hover:text-brand-shadow transition">Magic Template</a></li>
                <li><a href="#fitur" className="hover:text-brand-shadow transition">Reward Custom</a></li>
                <li><a href="#fitur" className="hover:text-brand-shadow transition">Validasi Ortu</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-brand-heading font-black mb-6 text-xl">Perusahaan</h4>
              <ul className="space-y-4 font-bold text-brand-text">
                <li><a href="#" className="hover:text-brand-shadow transition">Tentang Kami</a></li>
                <li><a href="#" className="hover:text-brand-shadow transition">Blog Parenting</a></li>
                <li><a href="#" className="hover:text-brand-shadow transition">Privasi</a></li>
                <li><a href="#" className="hover:text-brand-shadow transition">Syarat Ketentuan</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-brand-heading font-black mb-6 text-xl">Hubungi Kami</h4>
              <ul className="space-y-4 font-bold text-brand-text mb-6">
                <li><i className="fas fa-envelope"></i> halo@ramadhanceria.com</li>
                <li><i className="fab fa-whatsapp"></i> +62 812-3456-7890</li>
              </ul>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-brand-bg2 text-brand-shadow rounded-full flex items-center justify-center text-lg hover:bg-brand-btn hover:text-white transition"><i className="fab fa-instagram"></i></a>
                <a href="#" className="w-10 h-10 bg-brand-bg2 text-brand-shadow rounded-full flex items-center justify-center text-lg hover:bg-brand-btn hover:text-white transition"><i className="fab fa-facebook-f"></i></a>
              </div>
            </div>
          </div>
          <div className="border-t-4 border-white pt-8 text-center text-brand-text font-bold">
            © 2026 Ramadhan Ceria. Hak Cipta Dilindungi. Dibuat di Tasikmalaya.
          </div>
        </div>
      </footer>
    </>
  );
}


