/* ===========================
   NAV SCROLL-SPY (ACTIVE STATE)
=========================== */
(function initNavScrollSpy() {
  const navLinks = Array.from(document.querySelectorAll('.nav-link[href^="#"]'));
  if (!navLinks.length || !('IntersectionObserver' in window)) return;
  const map = new Map();
  navLinks.forEach(link => {
    const id = link.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) map.set(section, link);
  });
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const link = map.get(entry.target);
      if (!link) return;
      if (entry.isIntersecting) {
        navLinks.forEach(l => { l.classList.remove('active'); l.removeAttribute('aria-current'); });
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px', threshold: 0 });
  map.forEach((_, section) => observer.observe(section));
})();

/* ===========================
   MOBILE MENU TOGGLE
=========================== */
const mobileToggle = document.getElementById('mobileToggle');
const mobileMenu = document.getElementById('mobileMenu');

if (mobileToggle && mobileMenu) {
  mobileToggle.addEventListener('click', () => {
    const isHidden = mobileMenu.classList.contains('hidden');
    mobileMenu.classList.toggle('hidden');
    mobileToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
    
    // Update icon
    const icon = mobileToggle.querySelector('svg path');
    if (icon) {
      if (isHidden) {
        icon.setAttribute('d', 'M6 18L18 6M6 6l12 12');
      } else {
        icon.setAttribute('d', 'M4 8h16M4 16h16');
      }
    }
  });
  
  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!mobileMenu.contains(e.target) && !mobileToggle.contains(e.target)) {
      if (!mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.add('hidden');
        mobileToggle.setAttribute('aria-expanded', 'false');
        const icon = mobileToggle.querySelector('svg path');
        if (icon) {
          icon.setAttribute('d', 'M4 8h16M4 16h16');
        }
      }
    }
  });
  
  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
      mobileToggle.setAttribute('aria-expanded', 'false');
      mobileToggle.focus();
      const icon = mobileToggle.querySelector('svg path');
      if (icon) {
        icon.setAttribute('d', 'M4 8h16M4 16h16');
      }
    }
  });
}

/* ===========================
   SMOOTH SCROLL
=========================== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;

    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });

    if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
      mobileMenu.classList.add('hidden');
    }
  });
});

/* ===========================
   PARALLAX EFFECT (WITH REDUCE MOTION)
=========================== */
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (!prefersReducedMotion) {
  const layers = document.querySelectorAll('.parallax-layer[data-speed]');
  
  let ticking = false;
  
  function handleParallax() {
    const scrolled = window.scrollY || window.pageYOffset;

    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed) || 0.5;
      const y = -(scrolled * speed * 0.08);
      layer.style.transform = `translate3d(0, ${y}px, 0)`;
    });

    document.querySelectorAll('[data-speed]').forEach(el => {
      if (el.classList.contains('parallax-layer')) return;
      const speed = parseFloat(el.dataset.speed) || 0.7;
      const y = -(scrolled * speed * 0.02);
      el.style.transform = `translate3d(0, ${y}px, 0)`;
    });
    
    ticking = false;
  }
  
  function requestParallax() {
    if (!ticking) {
      window.requestAnimationFrame(handleParallax);
      ticking = true;
    }
  }
  
  window.addEventListener('scroll', requestParallax, { passive: true });
  handleParallax();
}

/* ===========================
   REVEAL ON SCROLL (ANIMATION)
=========================== */
// Using the same prefersReducedMotion variable from above

if (!prefersReducedMotion) {
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in-view');
        // Optional: stop observing after animation
        // obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  document.querySelectorAll('[data-animate]').forEach(el => obs.observe(el));
} else {
  // If reduced motion, show all immediately
  document.querySelectorAll('[data-animate]').forEach(el => el.classList.add('in-view'));
}

/* ===========================
   FAQ ACCORDION  (IMPROVED)
=========================== */
const faqItems = Array.from(document.querySelectorAll('.faq-item'));
faqItems.forEach((item, idx) => {
  const content = item.querySelector('.faq-content');
  const icon = item.querySelector('.faq-icon');

  item.setAttribute('aria-expanded', 'false');
  if (!item.hasAttribute('tabindex')) item.setAttribute('tabindex', '0');
  if (!item.hasAttribute('role')) item.setAttribute('role', 'button');

  item.addEventListener('click', () => {
    const isExpanded = item.getAttribute('aria-expanded') === 'true';
    const newState = !isExpanded;
    item.setAttribute('aria-expanded', newState);
    content.classList.toggle('hidden');
    icon.textContent = newState ? '-' : '+';
    icon.style.transform = newState ? 'rotate(45deg)' : 'rotate(0deg)';
  });

  item.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      item.click();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      (faqItems[idx + 1] || faqItems[0]).focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      (faqItems[idx - 1] || faqItems[faqItems.length - 1]).focus();
    } else if (e.key === 'Home') {
      e.preventDefault();
      faqItems[0].focus();
    } else if (e.key === 'End') {
      e.preventDefault();
      faqItems[faqItems.length - 1].focus();
    }
  });
});


/* ===========================
   SAFE STORAGE (localStorage bisa throw di private mode)
=========================== */
// CATATAN: fungsi top-level otomatis jadi window.storageGet/window.storageSet,
// jadi JANGAN memanggil window.storageGet dari sini (rekursi tak terbatas).
function storageGet(key) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* abaikan: storage tidak tersedia (private mode) */
  }
}

/* ===========================
   DARK - LIGHT TOGGLE
=========================== */

const themeToggle = document.getElementById("themeToggle");
const themeIcon = document.getElementById("themeIcon");

// Force dark theme (light mode tidak didukung)
function applyTheme() {
  document.documentElement.classList.remove("light");
  if (themeIcon) {
    themeIcon.classList.remove("text-blue-600");
    themeIcon.classList.add("text-yellow-300");
  }
  storageSet("theme", "dark");
}
applyTheme();

function showThemeToast(mode) {
  let toast = document.getElementById('themeToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'themeToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    toast.className = 'theme-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = mode === 'light' ? 'Mode terang aktif' : 'Mode gelap aktif';
  toast.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => toast.classList.remove('show'), 2000);
}

// Theme toggle dinonaktifkan - website hanya mendukung dark mode
if (themeToggle) {
  themeToggle.style.display = 'none';
  themeToggle.setAttribute('aria-hidden', 'true');
}

/* ===========================
   I18N (ID / EN) LANGUAGE TOGGLE
=========================== */
const I18N = {
  id: {
    'nav.services': 'Layanan',
    'nav.whyus': 'Mengapa Kami',
    'nav.process': 'Proses',
    'nav.career': 'Karir',
    'nav.start': 'Mulai Proyek',
    'nav.contact': 'Hubungi Kami',
    'hero.badge': '🎁 Promo Spesial: Gratis Hosting & Domain + Garansi Selamanya!',
    'hero.title': 'Membangun Masa Depan',
    'hero.subtitle': 'Arsitektur digital yang cerdas dan skalabel. Kami menggabungkan AI, High-Performance Web, dan Design Thinking untuk performa bisnis maksimal.',
    'hero.ctaPrimary': 'Konsultasi Gratis',
    'hero.ctaSecondary': 'Lihat Portfolio',
    'hero.statClients': 'Klien Terbantu',
    'hero.statProducts': 'Produk Digital Live',
    'hero.statWarranty': 'Garansi Error Selamanya',
    'typing.0': 'Website Berkinerja Tinggi',
    'typing.1': 'Aplikasi Bisnis Skalabel',
    'typing.2': 'Integrasi AI Cerdas',
    'typing.3': 'Ekosistem Digital Modern',

    // Services
    'services.title': 'Layanan Inti Kami di Era',
    'services.card1.title': 'Website & E-Commerce',
    'services.card1.desc': 'Landing page berkinerja tinggi hingga solusi e-commerce terintegrasi yang siap skala dan aman.',
    'services.card2.title': 'Aplikasi POS & Mobile',
    'services.card2.desc': 'Aplikasi Kasir (POS), Sistem Informasi, Company Profile, dan SaaS berarsitektur modern.',
    'services.card3.title': 'Integrasi & Solusi AI',
    'services.card3.desc': 'Automasi, analytics, dan fitur cerdas berbasis ML/LLM untuk produk Anda.',

    // Tech stack
    'techstack.title': 'Teknologi Terdepan yang Kami Gunakan',

    // Portfolio
    'portfolio.title': 'Karya Digital',
    'portfolio.titleHighlight': 'Terbaru Kami',
    'portfolio.subtitle': 'Membantu berbagai skala bisnis bertransformasi dengan solusi kustom yang berdampak nyata.',
    'portfolio.viewDetail': 'Lihat Detail Proyek',
    'portfolio.item1.category': 'E-Commerce',
    'portfolio.item1.title': 'Squeen Store V2',
    'portfolio.item1.desc': 'Modernisasi platform jual beli dengan integrasi payment gateway dan manajemen stok otomatis.',
    'portfolio.item2.category': 'SaaS / App',
    'portfolio.item2.title': 'Revox Suite',
    'portfolio.item2.desc': 'Aplikasi manajemen internal studio kreatif dengan monitoring KPI dan sistem penjadwalan cerdas.',
    'portfolio.item3.category': 'AI Integration',
    'portfolio.item3.title': 'Vortex Chat AI',
    'portfolio.item3.desc': 'Integrasi LLM untuk customer service otomatis yang mampu menangani 90% pertanyaan rutin klien.',

    // Why Us
    'whyus.title': 'Vidhara: Jembatan Anda Menuju',
    'whyus.titleHighlight': 'Digitalisasi',
    'whyus.item1.title': 'Uptime & Skalabilitas',
    'whyus.item1.desc': 'Dibangun dengan arsitektur cloud modern.',
    'whyus.item2.stat': 'Bebas Pusing',
    'whyus.item2.title': 'Garansi Selamanya',
    'whyus.item2.desc': 'Fokus pada bisnis Anda, biar kami yang urus semua teknis website dan aplikasinya.',
    'whyus.item3.stat': 'ROI Cepat',
    'whyus.item3.title': 'Fokus Nilai Bisnis',
    'whyus.item3.desc': 'Produk digital yang langsung berdampak.',

    // Process
    'process.title': 'Proses Digital',
    'process.titleHighlight': 'Sirkuit Penuh',
    'process.step1.title': 'Analisis Kebutuhan',
    'process.step1.desc': 'Mendengarkan visi Anda, menganalisis pasar, menentukan teknologi terbaik.',
    'process.step2.title': 'Desain & Prototipe',
    'process.step2.desc': 'Wireframe, UI/UX futuristik, persetujuan prototipe fungsional.',
    'process.step3.title': 'Pengembangan & Integrasi AI',
    'process.step3.desc': 'Coding cepat, pengujian, integrasi modul AI/ML.',
    'process.step4.title': 'Deployment & Scaling',
    'process.step4.desc': 'Peluncuran cloud, monitoring, strategi scaling.',

    // FAQ
    'faq.title': 'Pertanyaan yang Sering Diajukan',
    'faq.q1': 'Berapa lama pengerjaan proyek?',
    'faq.a1': 'Rata-rata pengerjaan 7-21 hari tergantung fitur & kompleksitas. Proyek besar 30-60 hari.',
    'faq.q2': 'Apakah bisa request desain khusus?',
    'faq.a2': 'Tentu - semua desain dibuat custom mengikuti identitas brand dan preferensi Anda.',
    'faq.q3': 'Apakah termasuk hosting & domain?',
    'faq.a3': 'Ya, tersedia paket lengkap domain, hosting, maintenance, dan support.',
    'faq.q4': 'Apakah menyediakan maintenance?',
    'faq.a4': 'Ada - mulai dari paket bulanan hingga kontrak tahunan.',

    // Pricing
    'pricing.title': 'Pilih Paket',
    'pricing.titleHighlight': 'Layanan Kami',
    'pricing.cta': 'Pesan via WhatsApp',
    'pricing.starter.name': 'Starter',
    'pricing.starter.desc': 'Untuk UMKM & bisnis yang baru mulai digitalisasi',
    'pricing.starter.price': 'Rp 1,5 Juta',
    'pricing.starter.feature1': 'Landing Page Profesional',
    'pricing.starter.feature2': 'Desain Modern & Responsif',
    'pricing.starter.feature3': 'Gratis Hosting & Domain 1 Tahun',
    'pricing.starter.feature4': 'Garansi Error Selamanya',
    'pricing.business.badge': 'POPULER',
    'pricing.business.name': 'Business',
    'pricing.business.desc': 'Untuk perusahaan yang butuh fitur lengkap & performa',
    'pricing.business.price': 'Rp 4,5 Juta',
    'pricing.business.feature1': 'Aplikasi POS / Web Custom',
    'pricing.business.feature2': 'Dashboard Admin & Payment',
    'pricing.business.feature3': 'Gratis Hosting & Domain 1 Tahun',
    'pricing.business.feature4': 'Garansi Error Selamanya',
    'pricing.business.feature5': 'Support Prioritas 24/7',
    'pricing.premium.name': 'Premium AI+',
    'pricing.premium.desc': 'Untuk bisnis yang ingin memanfaatkan AI sepenuhnya',
    'pricing.premium.price': 'Rp 9,5 Juta',
    'pricing.premium.feature1': 'Aplikasi + AI Assistant',
    'pricing.premium.feature2': 'Sistem Rekomendasi / Prediction',
    'pricing.premium.feature3': 'Automation Workflow',
    'pricing.premium.feature4': 'Integrasi LLM (GPT/Custom)',

    // Testimonial
    'testimonial.title': 'Apa Kata',
    'testimonial.titleHighlight': 'Klien Kami',
    'testimonial.t1.name': 'Rama Pradipta',
    'testimonial.t1.role': 'CEO - Revox Studio',
    'testimonial.t1.quote': '"Aplikasi kami stabil, cepat, dan UI futuristik. ROI terasa dalam 2 minggu!"',
    'testimonial.t2.name': 'Sintia Lestari',
    'testimonial.t2.role': 'Owner - Squeen Store',
    'testimonial.t2.quote': '"Penjualan naik 300% setelah website baru. Desainnya elegan dan cepat."',
    'testimonial.t3.name': 'Budi Santoso',
    'testimonial.t3.role': 'Owner - Batik Unggul',
    'testimonial.t3.quote': '"Awalnya ragu, tapi setelah audit gratis saya yakin. Hasilnya melebihi ekspektasi!"',

    // Lead Magnet
    'leadmagnet.title': 'Ingin tahu performa web Anda?',
    'leadmagnet.desc': 'Dapatkan Audit Website & Strategi Digital Gratis (Senilai Rp 500k)',
    'leadmagnet.cta': 'Klaim Audit Gratis',

    // Showcase
    'showcase.title': 'Showcase',
    'showcase.subtitle': 'Jelajahi berbagai proyek live yang telah kami kembangkan. Mulai dari sistem informasi organisasi hingga website untuk usaha.',
    'showcase.row1.title': 'Organisasi & Berbagai Usaha',

    // Team
    'team.title': 'Mengenal Tim di Balik',
    'team.desc': 'Kami adalah kumpulan individu yang berdedikasi untuk menghadirkan solusi teknologi mutakhir. Dari ahli cloud hingga spesialis AI, tim kami siap membantu transformasi digital bisnis Anda dengan standar global.',
    'team.skill1': 'Keahlian Teknis Mendalam',
    'team.skill2': 'Fokus pada Kepuasan Klien',
    'team.imgCaption': 'Inovasi Tanpa Batas',
    'team.imgSubCaption': 'Tim Profesional & Berpengalaman',

    // Pricing Maintenance
    'pricing.maintenance.name': 'Maintenance',
    'pricing.maintenance.desc': 'Dukungan teknis berkala agar bisnis Anda tetap online',
    'pricing.maintenance.price': 'Rp 250k',
    'pricing.maintenance.priceUnit': '/bln',
    'pricing.maintenance.feature1': 'Update Konten & Gambar',
    'pricing.maintenance.feature2': 'Security Patch & Backup',
    'pricing.maintenance.feature3': 'Monitoring Performa',
    'pricing.maintenance.feature4': 'Konsultasi Strategi Digital',
    'pricing.maintenance.cta': 'Tanya Detail Maintenance',

    // Pricing Slot & Promo
    'pricing.slot': 'SISA 2 SLOT UNTUK BULAN MEI',
    'pricing.slotNote': 'Kualitas adalah prioritas kami. Kami membatasi jumlah proyek untuk hasil maksimal.',
    'pricing.promoBadge': 'PROMO',
    'pricing.promoUrgency': '🔥 Harga naik besok! Amankan promomu di sini.',

    // Showcase heading
    'showcase.heading': 'Showcase',
    'showcase.headingHighlight': 'Website Publish',

    // Promo Popup
    'promo.badge': 'PROMO SPESIAL',
    'promo.title': 'Dapatkan',
    'promo.titleHighlight': 'Paket Starter',
    'promo.titleSuffix': 'dengan Harga Spesial!',
    'promo.priceOld': 'Rp 1,5 Juta',
    'promo.priceNew': 'Rp 500 Ribu',
    'promo.priceSave': 'Hemat Rp 1 Juta!',
    'promo.feature1': 'Landing Page Profesional',
    'promo.feature2': 'Desain Modern & Mewah',
    'promo.feature3': 'Mobile Responsive (SEO Ready)',
    'promo.feature4': 'Support & Maintenance',
    'promo.desc': 'Promo terbatas! Hanya untuk <strong>10 klien pertama</strong> bulan ini. Jangan lewatkan kesempatan ini!',
    'promo.ctaPrimary': 'Ambil Promo Sekarang',
    'promo.ctaSecondary': 'Lihat Paket Lainnya',

    // WA Widget
    'wa.responseTime': 'Tim kami merespon dalam < 5 menit',
    'wa.greeting': 'Halo! Ingin konsultasi gratis atau butuh informasi paket digital? Tuliskan kebutuhan Anda di bawah.',
    'wa.startChat': 'Mulai Chat WhatsApp',

    // Exit Popup
    'exit.title': 'Tunggu Sebentar!',
    'exit.desc': 'Banyak bisnis menunda digitalisasi dan tertinggal. Mulai sekarang dengan penawaran khusus.',
    'exit.offer': 'Konsultasi strategi digital gratis hari ini (Senilai Rp 500k)',
    'exit.cta': 'Klaim Sekarang',
    'exit.dismiss': 'Tidak, terima kasih',

    // Contact
    'contact.title': 'Siap Meningkatkan Bisnis Anda dengan',
    'contact.titleHighlight': 'Solusi Digital Profesional?',
    'contact.subtitle': 'Kami menawarkan layanan Website, Aplikasi, AI Automation, dan Sistem Digital untuk membantu bisnis Anda berkembang lebih cepat. Dapatkan demo gratis, konsultasi langsung, dan rekomendasi paket terbaik sesuai kebutuhan Anda.',
    'contact.formTitle': 'Kirim Pesan Langsung',
    'contact.namePlaceholder': 'Nama Lengkap',
    'contact.emailPlaceholder': 'Alamat Email',
    'contact.companyPlaceholder': 'Nama Perusahaan (Opsional)',
    'contact.msgPlaceholder': 'Ceritakan kebutuhan digital Anda...',
    'contact.submit': 'Kirim via WhatsApp',
    'contact.successMsg': 'Membuka WhatsApp... Mohon tunggu sebentar.',
    'contact.or': 'ATAU',
    'contact.chatPrefix': 'Chat',
    'contact.waButton': 'Hubungi via WhatsApp',
    'contact.responseNote': '*Tim kami akan merespon dalam waktu 3-5 menit. Siap membantu Anda dari ide hingga launching!',

    // Footer
    'footer.tagline': 'Solusi Digital untuk Transformasi Bisnis Anda',
    'footer.col1.title': 'Layanan',
    'footer.col1.item1': 'Paket Starter',
    'footer.col1.item2': 'Paket Business',
    'footer.col1.item3': 'Paket Premium AI+',
    'footer.col2.title': 'Perusahaan',
    'footer.col2.item1': 'Tentang Kami',
    'footer.col2.item2': 'Proses Kerja',
    'footer.col2.item3': 'Testimoni',
    'footer.col3.title': 'Kontak',
    'footer.col3.item1': 'WhatsApp',
    'footer.col3.item2': 'Email',
    'footer.col3.item3': 'Hubungi Kami',
    'footer.copyright': '© 2026 PT VIDHARA TEKNO SOLUSINDO. Semua Hak Cipta Dilindungi.',
    'footer.legal.privacy': 'Privacy Policy',
    'footer.legal.terms': 'Terms of Service',

    // Bottom Nav
    'bottomNav.home': 'Beranda',
    'bottomNav.services': 'Layanan',
    'bottomNav.process': 'Proses',
    'bottomNav.more': 'Lainnya',
    'bottomNav.whyus': 'Mengapa Kami',
    'bottomNav.pricing': 'Paket & Harga',
    'bottomNav.testimonial': 'Testimoni',
    'bottomNav.faq': 'FAQ',
    'bottomNav.install': 'Install App'
  },
  en: {
    'nav.services': 'Services',
    'nav.whyus': 'Why Us',
    'nav.process': 'Process',
    'nav.career': 'Careers',
    'nav.start': 'Start Project',
    'nav.contact': 'Contact Us',
    'hero.badge': 'Digital Transformation Agency',
    'hero.title': 'Building the Future',
    'hero.subtitle': 'Smart and scalable digital architecture. We combine AI, High-Performance Web, and Design Thinking for maximum business performance.',
    'hero.ctaPrimary': 'Free Consultation',
    'hero.ctaSecondary': 'View Portfolio',
    'hero.statClients': 'Happy Clients',
    'hero.statProducts': 'Live Digital Products',
    'hero.statWarranty': 'Lifetime Bug Warranty',
    'typing.0': 'Professional Website',
    'typing.1': 'Mobile Applications',
    'typing.2': 'AI Integration Systems',
    'typing.3': 'E-Commerce Solutions',

    // Services
    'services.title': 'Our Core Services in the',
    'services.card1.title': 'Website & E-Commerce',
    'services.card1.desc': 'High-performance landing pages to fully integrated e-commerce solutions — scalable and secure.',
    'services.card2.title': 'Web & Mobile Applications',
    'services.card2.desc': 'SaaS, PWA, and mobile apps built with clean architecture your team can easily maintain.',
    'services.card3.title': 'AI Integration & Solutions',
    'services.card3.desc': 'Automation, analytics, and intelligent ML/LLM-powered features for your product.',

    // Tech stack
    'techstack.title': 'Leading Technologies We Use',

    // Portfolio
    'portfolio.title': 'Our Latest',
    'portfolio.titleHighlight': 'Digital Work',
    'portfolio.subtitle': 'Helping businesses of all sizes transform with custom solutions that deliver real impact.',
    'portfolio.viewDetail': 'View Project Details',
    'portfolio.item1.category': 'E-Commerce',
    'portfolio.item1.title': 'Squeen Store V2',
    'portfolio.item1.desc': 'Modernized marketplace platform with payment gateway integration and automated stock management.',
    'portfolio.item2.category': 'SaaS / App',
    'portfolio.item2.title': 'Revox Suite',
    'portfolio.item2.desc': 'Internal management app for a creative studio with KPI monitoring and smart scheduling system.',
    'portfolio.item3.category': 'AI Integration',
    'portfolio.item3.title': 'Vortex Chat AI',
    'portfolio.item3.desc': 'LLM integration for automated customer service capable of handling 90% of routine client queries.',

    // Why Us
    'whyus.title': 'Vidhara: Your Bridge to',
    'whyus.titleHighlight': 'Digitalization',
    'whyus.item1.title': 'Uptime & Scalability',
    'whyus.item1.desc': 'Built on modern cloud architecture.',
    'whyus.item2.stat': 'Worry-Free',
    'whyus.item2.title': 'Lifetime Warranty',
    'whyus.item2.desc': 'Focus on your business — we handle all the technical work for your website and app.',
    'whyus.item3.stat': 'Fast ROI',
    'whyus.item3.title': 'Business Value Focused',
    'whyus.item3.desc': 'Digital products that deliver immediate impact.',

    // Process
    'process.title': 'Our Full-Circuit',
    'process.titleHighlight': 'Digital Process',
    'process.step1.title': 'Needs Analysis',
    'process.step1.desc': 'We listen to your vision, analyze the market, and choose the best technology.',
    'process.step2.title': 'Design & Prototype',
    'process.step2.desc': 'Wireframes, futuristic UI/UX, and functional prototype approval.',
    'process.step3.title': 'Development & AI Integration',
    'process.step3.desc': 'Rapid coding, testing, and AI/ML module integration.',
    'process.step4.title': 'Deployment & Scaling',
    'process.step4.desc': 'Cloud deployment, monitoring, and scaling strategy.',

    // FAQ
    'faq.title': 'Frequently Asked Questions',
    'faq.q1': 'How long does a project take?',
    'faq.a1': 'Typical projects take 7-21 days depending on features and complexity. Larger projects take 30-60 days.',
    'faq.q2': 'Can I request a custom design?',
    'faq.a2': 'Absolutely — every design is custom-built to match your brand identity and preferences.',
    'faq.q3': 'Does it include hosting & domain?',
    'faq.a3': 'Yes, we offer complete packages covering domain, hosting, maintenance, and support.',
    'faq.q4': 'Do you provide maintenance?',
    'faq.a4': 'Yes — from monthly plans to annual contracts.',

    // Pricing
    'pricing.title': 'Choose Your',
    'pricing.titleHighlight': 'Service Package',
    'pricing.cta': 'Order via WhatsApp',
    'pricing.starter.name': 'Starter',
    'pricing.starter.desc': 'For SMEs and businesses just starting their digital journey',
    'pricing.starter.price': 'IDR 1.5M',
    'pricing.starter.feature1': 'Professional Landing Page',
    'pricing.starter.feature2': 'Modern & Responsive Design',
    'pricing.starter.feature3': 'Free Hosting & Domain for 1 Year',
    'pricing.starter.feature4': 'Lifetime Bug Warranty',
    'pricing.business.badge': 'POPULAR',
    'pricing.business.name': 'Business',
    'pricing.business.desc': 'For companies that need full features and performance',
    'pricing.business.price': 'IDR 4.5M',
    'pricing.business.feature1': 'POS / Custom Web App',
    'pricing.business.feature2': 'Admin Dashboard & Payment',
    'pricing.business.feature3': 'Free Hosting & Domain for 1 Year',
    'pricing.business.feature4': 'Lifetime Bug Warranty',
    'pricing.business.feature5': 'Priority 24/7 Support',
    'pricing.premium.name': 'Premium AI+',
    'pricing.premium.desc': 'For businesses ready to fully leverage AI',
    'pricing.premium.price': 'IDR 9.5M',
    'pricing.premium.feature1': 'App + AI Assistant',
    'pricing.premium.feature2': 'Recommendation / Prediction System',
    'pricing.premium.feature3': 'Workflow Automation',
    'pricing.premium.feature4': 'LLM Integration (GPT/Custom)',

    // Testimonial
    'testimonial.title': 'What Our',
    'testimonial.titleHighlight': 'Clients Say',
    'testimonial.t1.name': 'Rama Pradipta',
    'testimonial.t1.role': 'CEO - Revox Studio',
    'testimonial.t1.quote': '"Our app is stable, fast, and the UI is futuristic. ROI felt within 2 weeks!"',
    'testimonial.t2.name': 'Sintia Lestari',
    'testimonial.t2.role': 'Owner - Squeen Store',
    'testimonial.t2.quote': '"Sales increased 300% after the new website. The design is elegant and fast."',
    'testimonial.t3.name': 'Budi Santoso',
    'testimonial.t3.role': 'Owner - Batik Unggul',
    'testimonial.t3.quote': '"I was skeptical at first, but after the free audit I was convinced. The results exceeded expectations!"',

    // Lead Magnet
    'leadmagnet.title': 'Want to know your website performance?',
    'leadmagnet.desc': 'Get a Free Website Audit & Digital Strategy (Worth IDR 500k)',
    'leadmagnet.cta': 'Claim Free Audit',

    // Showcase
    'showcase.title': 'Showcase',
    'showcase.subtitle': 'Explore various live projects we have developed. From organizational information systems to business websites.',
    'showcase.row1.title': 'Organizations & Businesses',

    // Team
    'team.title': 'Meet the Team Behind',
    'team.desc': 'We are a group of individuals dedicated to delivering cutting-edge technology solutions. From cloud experts to AI specialists, our team is ready to help your business\'s digital transformation to global standards.',
    'team.skill1': 'Deep Technical Expertise',
    'team.skill2': 'Focused on Client Satisfaction',
    'team.imgCaption': 'Innovation Without Limits',
    'team.imgSubCaption': 'Professional & Experienced Team',

    // Pricing Maintenance
    'pricing.maintenance.name': 'Maintenance',
    'pricing.maintenance.desc': 'Periodic technical support to keep your business online',
    'pricing.maintenance.price': 'IDR 250k',
    'pricing.maintenance.priceUnit': '/mo',
    'pricing.maintenance.feature1': 'Content & Image Updates',
    'pricing.maintenance.feature2': 'Security Patch & Backup',
    'pricing.maintenance.feature3': 'Performance Monitoring',
    'pricing.maintenance.feature4': 'Digital Strategy Consultation',
    'pricing.maintenance.cta': 'Ask About Maintenance',

    // Pricing Slot & Promo
    'pricing.slot': 'ONLY 2 SLOTS LEFT FOR MAY',
    'pricing.slotNote': 'Quality is our priority. We limit project intake for maximum results.',
    'pricing.promoBadge': 'PROMO',
    'pricing.promoUrgency': '🔥 Price goes up tomorrow! Secure your promo now.',

    // Showcase heading
    'showcase.heading': 'Showcase',
    'showcase.headingHighlight': 'Website Publish',

    // Promo Popup
    'promo.badge': 'SPECIAL PROMO',
    'promo.title': 'Get the',
    'promo.titleHighlight': 'Starter Package',
    'promo.titleSuffix': 'at a Special Price!',
    'promo.priceOld': 'IDR 1.5 Million',
    'promo.priceNew': 'IDR 500 Thousand',
    'promo.priceSave': 'Save IDR 1 Million!',
    'promo.feature1': 'Professional Landing Page',
    'promo.feature2': 'Modern & Luxurious Design',
    'promo.feature3': 'Mobile Responsive (SEO Ready)',
    'promo.feature4': 'Support & Maintenance',
    'promo.desc': 'Limited promo! Only for the <strong>first 10 clients</strong> this month. Don\'t miss this opportunity!',
    'promo.ctaPrimary': 'Claim Promo Now',
    'promo.ctaSecondary': 'See Other Packages',

    // WA Widget
    'wa.responseTime': 'Our team responds in < 5 minutes',
    'wa.greeting': 'Hello! Want a free consultation or need information about digital packages? Write your needs below.',
    'wa.startChat': 'Start WhatsApp Chat',

    // Exit Popup
    'exit.title': 'Wait a Moment!',
    'exit.desc': 'Many businesses delay digitalization and fall behind. Start now with a special offer.',
    'exit.offer': 'Free digital strategy consultation today (Worth IDR 500k)',
    'exit.cta': 'Claim Now',
    'exit.dismiss': 'No, thank you',

    // Contact
    'contact.title': 'Ready to Grow Your Business with',
    'contact.titleHighlight': 'Professional Digital Solutions?',
    'contact.subtitle': 'We offer Website, Application, AI Automation, and Digital System services to help your business grow faster. Get a free demo, direct consultation, and the best package recommendation for your needs.',
    'contact.formTitle': 'Send a Message Directly',
    'contact.namePlaceholder': 'Full Name',
    'contact.emailPlaceholder': 'Email Address',
    'contact.companyPlaceholder': 'Company Name (Optional)',
    'contact.msgPlaceholder': 'Tell us about your digital needs...',
    'contact.submit': 'Send via WhatsApp',
    'contact.successMsg': 'Opening WhatsApp... Please wait a moment.',
    'contact.or': 'OR',
    'contact.chatPrefix': 'Chat',
    'contact.waButton': 'Contact via WhatsApp',
    'contact.responseNote': '*Our team responds within 3-5 minutes. Ready to support you from idea to launch!',

    // Footer
    'footer.tagline': 'Digital Solutions for Your Business Transformation',
    'footer.col1.title': 'Services',
    'footer.col1.item1': 'Starter Package',
    'footer.col1.item2': 'Business Package',
    'footer.col1.item3': 'Premium AI+ Package',
    'footer.col2.title': 'Company',
    'footer.col2.item1': 'About Us',
    'footer.col2.item2': 'Our Process',
    'footer.col2.item3': 'Testimonials',
    'footer.col3.title': 'Contact',
    'footer.col3.item1': 'WhatsApp',
    'footer.col3.item2': 'Email',
    'footer.col3.item3': 'Contact Us',
    'footer.copyright': '© 2026 PT VIDHARA TEKNO SOLUSINDO. All Rights Reserved.',
    'footer.legal.privacy': 'Privacy Policy',
    'footer.legal.terms': 'Terms of Service',

    // Bottom Nav
    'bottomNav.home': 'Home',
    'bottomNav.services': 'Services',
    'bottomNav.process': 'Process',
    'bottomNav.more': 'More',
    'bottomNav.whyus': 'Why Us',
    'bottomNav.pricing': 'Pricing',
    'bottomNav.testimonial': 'Testimonials',
    'bottomNav.faq': 'FAQ',
    'bottomNav.install': 'Install App'
  }
};

// Dynamically set current month for pricing slot
const monthNamesID = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
const monthNamesEN = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
const currentMonthIdx = new Date().getMonth();
I18N.id['pricing.slot'] = `SISA 2 SLOT UNTUK BULAN ${monthNamesID[currentMonthIdx]}`;
I18N.en['pricing.slot'] = `ONLY 2 SLOTS LEFT FOR ${monthNamesEN[currentMonthIdx]}`;

let currentLang = storageGet('lang') || 'id';

function applyLanguage(lang) {
  if (!I18N[lang]) lang = 'id';
  currentLang = lang;
  storageSet('lang', lang);
  document.documentElement.lang = lang === 'en' ? 'en' : 'id';

  // Translate text content
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = I18N[lang][key];
    if (val != null) el.textContent = val;
  });

  // Translate innerHTML (for elements with HTML markup)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    const val = I18N[lang][key];
    if (val != null) el.innerHTML = val;
  });

  // Translate placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = I18N[lang][key];
    if (val != null) el.setAttribute('placeholder', val);
  });

  const label = document.getElementById('langLabel');
  if (label) label.textContent = lang.toUpperCase();
  const btn = document.getElementById('langToggle');
  if (btn) {
    btn.setAttribute('aria-label', lang === 'id' ? 'Bahasa: ID - ganti ke English' : 'Language: EN - switch to Indonesian');
    btn.setAttribute('title', btn.getAttribute('aria-label'));
    btn.title = btn.getAttribute('aria-label');
  }
  // Update typing words if typing already initialized
  if (window.__updateTypingWords) window.__updateTypingWords();
}

document.addEventListener('DOMContentLoaded', () => {
  applyLanguage(currentLang);
  const btn = document.getElementById('langToggle');
  if (btn) {
    btn.addEventListener('click', () => {
      applyLanguage(currentLang === 'id' ? 'en' : 'id');
    });
  }
});

/* ===========================
   TESTIMONIAL SLIDER
=========================== */
function initTestimonialSlider() {
  let currentTestimonial = 0;
  const testimonialSlider = document.getElementById('testimonialSlider');
  const testimonialDots = document.querySelectorAll('.dot[role="tab"]');
  const totalTestimonials = testimonialDots.length;

  if (!testimonialSlider || totalTestimonials === 0) {
    console.warn('Testimonial slider elements not found');
    return;
  }

  let autoPlayInterval = null;
  let isPaused = false;

  function showTestimonial(index) {
    // Normalize index
    if (index < 0) index = totalTestimonials - 1;
    if (index >= totalTestimonials) index = 0;
    
    currentTestimonial = index;
    const translateX = -index * 100;
    
    // Ensure smooth transition
    testimonialSlider.style.transition = 'transform 0.5s ease-out';
    testimonialSlider.style.transform = `translateX(${translateX}%)`;

    testimonialDots.forEach((dot, i) => {
      const dotIndex = dot.dataset.index !== undefined ? parseInt(dot.dataset.index) : i;
      const selected = dotIndex === index;
      dot.setAttribute('aria-selected', selected ? 'true' : 'false');
      dot.setAttribute('aria-label', `Slide ${dotIndex + 1} dari ${totalTestimonials}`);
      dot.classList.toggle('active', selected);
      dot.tabIndex = selected ? 0 : -1;
    });
  }
  
  // Dot click handlers
  testimonialDots.forEach((dot, index) => {
    // Use data-index if available, otherwise use index
    const dotIndex = dot.dataset.index !== undefined ? parseInt(dot.dataset.index) : index;
    
    dot.addEventListener('click', (e) => {
      e.preventDefault();
      stopAutoPlay();
      showTestimonial(dotIndex);
      // Resume after 3 seconds
      setTimeout(() => {
        if (!isPaused) startAutoPlay();
      }, 3000);
    });
    
    dot.addEventListener('keydown', (e) => {
      let target = null;
      if (e.key === 'Enter' || e.key === ' ') {
        target = dotIndex;
      } else if (e.key === 'ArrowRight') {
        target = (dotIndex + 1) % totalTestimonials;
      } else if (e.key === 'ArrowLeft') {
        target = (dotIndex - 1 + totalTestimonials) % totalTestimonials;
      } else if (e.key === 'Home') {
        target = 0;
      } else if (e.key === 'End') {
        target = totalTestimonials - 1;
      }
      if (target !== null) {
        e.preventDefault();
        stopAutoPlay();
        showTestimonial(target);
        const next = testimonialDots[target];
        if (next) next.focus();
        setTimeout(() => { if (!isPaused) startAutoPlay(); }, 3000);
      }
    });
  });
  
  // Auto-play functions
  function startAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
    }
    
    isPaused = false;
    autoPlayInterval = setInterval(() => {
      if (!isPaused) {
        showTestimonial(currentTestimonial + 1);
      }
    }, 5000);
  }
  
  function stopAutoPlay() {
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      autoPlayInterval = null;
    }
    isPaused = true;
  }
  
  // Pause on hover/focus
  const testimonialSection = document.getElementById('testimonial');
  if (testimonialSection) {
    testimonialSection.addEventListener('mouseenter', stopAutoPlay);
    testimonialSection.addEventListener('mouseleave', () => {
      isPaused = false;
      startAutoPlay();
    });
    testimonialSection.addEventListener('focusin', stopAutoPlay);
    testimonialSection.addEventListener('focusout', () => {
      isPaused = false;
      startAutoPlay();
    });
  }
  
  // Initialize
  showTestimonial(0);
  startAutoPlay();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initTestimonialSlider);
} else {
  // DOM is already ready
  initTestimonialSlider();
}

/* ===========================
   LAZY LOADING IMAGES
=========================== */
if ('loading' in HTMLImageElement.prototype) {
  // Native lazy loading supported
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    img.addEventListener('load', function() {
      this.classList.add('loaded');
    });
    // If already loaded
    if (img.complete) {
      img.classList.add('loaded');
    }
  });
} else {
  // Fallback for browsers without native lazy loading
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src || img.src;
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  });
  
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
    imageObserver.observe(img);
  });
}

/* ===========================
   SMOOTH SCROLL POLYFILL FOR OLDER BROWSERS
=========================== */
if (!('scrollBehavior' in document.documentElement.style)) {
  const smoothScrollPolyfill = () => {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#' || href === '') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
        }
      });
    });
  };
  
  smoothScrollPolyfill();
}

/* ===========================
   PERFORMANCE MONITORING
=========================== */
// Track Web Vitals (optional - uncomment if using analytics)
/*
function trackWebVitals() {
  if ('PerformanceObserver' in window) {
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
      // Send to analytics: gtag('event', 'web_vitals', { lcp: lastEntry.renderTime });
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // First Input Delay (FID)
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry) => {
        console.log('FID:', entry.processingStart - entry.startTime);
        // Send to analytics: gtag('event', 'web_vitals', { fid: entry.processingStart - entry.startTime });
      });
    }).observe({ entryTypes: ['first-input'] });
  }
}

// Uncomment to enable:
// trackWebVitals();
*/

/* ===========================
   WA WIDGET AUTO-TRIGGER
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  const waCard = document.getElementById('waCard');
  if (waCard) {
    // Show after 15 seconds if not dismissed
    setTimeout(() => {
      if (!waCard.classList.contains('active') && !storageGet('wa_dismissed')) {
        waCard.classList.add('active');
      }
    }, 15000);
  }
});

/* ===========================
   ERROR HANDLING
=========================== */
window.addEventListener('error', (e) => {
  console.error('Error:', e.error);
  // Optional: Send to error tracking service
});

window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled Promise Rejection:', e.reason);
  // Optional: Send to error tracking service
});

/* ===========================
   LOADING STATE MANAGEMENT
=========================== */
document.addEventListener('DOMContentLoaded', () => {
  // Remove loading class if exists
  document.body.classList.remove('loading');
  document.body.classList.add('loaded');
});

// Show loading state initially
if (document.readyState === 'loading') {
  document.body.classList.add('loading');
}

/* ===========================
   BOTTOM NAVIGATION (MOBILE)
=========================== */
let bottomNavInitDone = false;

function initBottomNavigation() {
  if (bottomNavInitDone) return; // cegah double-binding saat resize
  bottomNavInitDone = true;

  const bottomNavItems = document.querySelectorAll('.bottom-nav-item[data-nav]');
  const bottomNavMenu = document.getElementById('bottomNavMenu');
  const bottomNavDropdown = document.getElementById('bottomNavDropdown');

  // Handle bottom nav menu toggle
  if (bottomNavMenu && bottomNavDropdown) {
    bottomNavMenu.addEventListener('click', (e) => {
      e.preventDefault();
      const isExpanded = bottomNavMenu.getAttribute('aria-expanded') === 'true';
      bottomNavDropdown.classList.toggle('hidden');
      bottomNavMenu.setAttribute('aria-expanded', !isExpanded);
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!bottomNavMenu.contains(e.target) && !bottomNavDropdown.contains(e.target)) {
        if (!bottomNavDropdown.classList.contains('hidden')) {
          bottomNavDropdown.classList.add('hidden');
          bottomNavMenu.setAttribute('aria-expanded', 'false');
        }
      }
    });
  }

  // Update active state based on scroll position
  function updateActiveNav() {
    const sections = ['hero', 'services', 'process'];
    const scrollPos = window.scrollY + 100;

    sections.forEach((sectionId, index) => {
      const section = document.getElementById(sectionId);
      const navItem = document.querySelector(`[data-nav="${sectionId}"]`);
      
      if (section && navItem) {
        const sectionTop = section.offsetTop;
        const sectionBottom = sectionTop + section.offsetHeight;

        if (scrollPos >= sectionTop && scrollPos < sectionBottom) {
          // Remove active from all
          bottomNavItems.forEach(item => item.classList.remove('active'));
          // Add active to current
          navItem.classList.add('active');
        }
      }
    });

    // Check if at top (home)
    if (scrollPos < 200) {
      bottomNavItems.forEach(item => item.classList.remove('active'));
      const homeNav = document.querySelector('[data-nav="home"]');
      if (homeNav) homeNav.classList.add('active');
    }
  }

  // Update on scroll
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(updateActiveNav, 100);
  }, { passive: true });

  // Initial update
  updateActiveNav();

  // Handle smooth scroll for bottom nav items
  bottomNavItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const href = item.getAttribute('href');
      if (href && href.startsWith('#')) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({
            top: targetPosition,
            behavior: 'smooth'
          });
          
          // Update active state
          bottomNavItems.forEach(nav => nav.classList.remove('active'));
          item.classList.add('active');
        }
      }
    });
  });
}

// Initialize bottom navigation
if (window.innerWidth < 768) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBottomNavigation);
  } else {
    initBottomNavigation();
  }
}

// Re-initialize on resize
let resizeTimeout;
window.addEventListener('resize', () => {
  if (resizeTimeout) clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    if (window.innerWidth < 768) {
      initBottomNavigation();
    }
  }, 250);
});

/* ===========================
   PROMO POPUP MODAL
=========================== */
const promoPopup = document.getElementById('promoPopup');
const closePromoBtn = document.getElementById('closePromoPopup');

// Function to show popup
function showPromoPopup() {
  if (promoPopup) {
    promoPopup.classList.remove('hidden');
    document.body.classList.add('popup-open');
    // Focus trap
    closePromoBtn?.focus();
  }
}

// Function to close popup
function closePromoPopup() {
  if (promoPopup) {
    promoPopup.classList.add('hidden');
    document.body.classList.remove('popup-open');
    // Save to localStorage that user has seen/dismissed popup
    storageSet('promoPopupDismissed', 'true');
    storageSet('promoPopupDismissedTime', Date.now().toString());
  }
}

// Close on escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && promoPopup && !promoPopup.classList.contains('hidden')) {
    closePromoPopup();
  }
});

// Close on overlay click
if (promoPopup) {
  promoPopup.addEventListener('click', (e) => {
    if (e.target === promoPopup) {
      closePromoPopup();
    }
  });
}

// Close button handler
if (closePromoBtn) {
  closePromoBtn.addEventListener('click', closePromoPopup);
}

// Show popup after delay (if not dismissed recently)
function initPromoPopup() {
  // Check if popup was dismissed in last 24 hours
  const dismissed = storageGet('promoPopupDismissed');
  const dismissedTime = storageGet('promoPopupDismissedTime');
  
  if (dismissed === 'true' && dismissedTime) {
    const hoursSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60);
    // Don't show if dismissed within last 24 hours
    if (hoursSinceDismissed < 24) {
      return;
    }
  }

  // Show popup after 3 seconds
  setTimeout(() => {
    showPromoPopup();
  }, 3000);
}

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPromoPopup);
} else {
  initPromoPopup();
}

// Make function globally available for onclick handlers
window.closePromoPopup = closePromoPopup;

/* ====================================
   TYPING ANIMATION
==================================== */
function initTyping() {
  const element = document.getElementById('typing-text');
  if (!element) return;

  function getWords() {
    const lang = (I18N && I18N[currentLang]) ? currentLang : 'id';
    return [
      I18N[lang]['typing.0'],
      I18N[lang]['typing.1'],
      I18N[lang]['typing.2'],
      I18N[lang]['typing.3']
    ];
  }
  let words = getWords();

  window.__updateTypingWords = () => {
    words = getWords();
    charIndex = 0;
    isDeleting = false;
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    element.textContent = words[0];
    return;
  }
  let wordIndex = 0;
  let charIndex = 0;
  let isDeleting = false;
  let typeSpeed = 100;

  function type() {
    const currentWord = words[wordIndex];
    if (isDeleting) {
      element.textContent = currentWord.substring(0, charIndex - 1);
      charIndex--;
      typeSpeed = 50;
    } else {
      element.textContent = currentWord.substring(0, charIndex + 1);
      charIndex++;
      typeSpeed = 100;
    }

    if (!isDeleting && charIndex === currentWord.length) {
      isDeleting = true;
      typeSpeed = 2000; // Pause at end
    } else if (isDeleting && charIndex === 0) {
      isDeleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      typeSpeed = 500;
    }

    setTimeout(type, typeSpeed);
  }

  type();
}

/* ====================================
   SCROLL PROGRESS BAR
==================================== */
function initScrollProgress() {
  const progressBar = document.getElementById('scrollProgress');
  if (!progressBar) return;

  window.addEventListener('scroll', () => {
    const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
    const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const scrolled = (winScroll / height) * 100;
    progressBar.style.width = scrolled + "%";
  }, { passive: true });
}

/* ====================================
   WA CHAT WIDGET LOGIC
==================================== */
function initWAWidget() {
  const waBubble = document.getElementById('waBubble');
  const waCard = document.getElementById('waCard');
  if (!waBubble || !waCard) return;

  waBubble.addEventListener('click', (e) => {
    e.stopPropagation();
    waCard.classList.toggle('active');
  });

  document.addEventListener('click', (e) => {
    if (!waCard.contains(e.target) && !waBubble.contains(e.target)) {
      waCard.classList.remove('active');
    }
  });

  // Auto show bubble hint after 5 seconds
  setTimeout(() => {
    if (!waCard.classList.contains('active')) {
      // You could add a small toast here if desired
    }
  }, 5000);
}

/* ====================================
   EXIT INTENT POPUP
==================================== */
function initExitIntent() {
  const exitPopup = document.getElementById('exitPopup');
  const closeExit = document.getElementById('closeExitPopup');
  if (!exitPopup) return;

  let hasShown = storageGet('exitPopupShown');

  const showExit = (e) => {
    if (e.clientY <= 0 && !hasShown) {
      exitPopup.style.display = 'flex';
      hasShown = true;
      storageSet('exitPopupShown', 'true');
      document.removeEventListener('mouseleave', showExit);
    }
  };

  document.addEventListener('mouseleave', showExit);

  closeExit.addEventListener('click', () => {
    exitPopup.style.display = 'none';
  });

  exitPopup.addEventListener('click', (e) => {
    if (e.target === exitPopup) {
      exitPopup.style.display = 'none';
    }
  });
}

/* ====================================
   SECTION HIGHLIGHTING (NAV)
   Removed: superseded by the IntersectionObserver-based
   initNavScrollSpy() at the top of this file.
==================================== */

/* ====================================
   AOS + SECTION PARALLAX
==================================== */
function initAOSSections() {
  const sections = document.querySelectorAll('section[id]');
  const patterns = ['fade-up', 'fade-right', 'fade-left'];

  sections.forEach((section, index) => {
    section.classList.add('section-parallax');

    if (!section.hasAttribute('data-aos')) {
      section.setAttribute('data-aos', patterns[index % patterns.length]);
    }
    section.setAttribute('data-aos-duration', '750');
    section.setAttribute('data-aos-offset', '100');
    section.setAttribute('data-aos-once', 'true');
  });

  const startAOS = () => {
    if (!window.AOS) return;
    window.AOS.init({
      duration: prefersReducedMotion ? 0 : 750,
      once: true,
      offset: 100,
      easing: 'ease-out-cubic',
      disable: () => prefersReducedMotion
    });
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(startAOS, { timeout: 1500 });
  } else {
    setTimeout(startAOS, 300);
  }
}

function initSectionParallaxGradient() {
  if (prefersReducedMotion) return;

  let ticking = false;
  const updateParallaxVar = () => {
    const scrollY = window.scrollY || window.pageYOffset;
    const shift = Math.min(scrollY, 1200);
    document.documentElement.style.setProperty('--section-parallax-shift', `${shift}px`);
    ticking = false;
  };

  const onScroll = () => {
    if (!ticking) {
      window.requestAnimationFrame(updateParallaxVar);
      ticking = true;
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  updateParallaxVar();
}

/* ====================================
   BACK TO TOP BUTTON
==================================== */
function initBackToTopButton() {
  const backToTopButton = document.getElementById('backToTopButton');
  if (!backToTopButton) return;

  const toggleVisibility = () => {
    if (window.scrollY > 420) {
      backToTopButton.classList.add('is-visible');
    } else {
      backToTopButton.classList.remove('is-visible');
    }
  };

  backToTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', toggleVisibility, { passive: true });
  toggleVisibility();
}

/* ====================================
   GOOGLE ONE TAP + AUTO SIGN-IN
==================================== */
const GOOGLE_AUTH_AUTO_ONLY = true;

function setGoogleUserSignedOut() {
  const authWidget = document.getElementById('googleAuthWidget');
  const signInContainer = document.getElementById('googleSignInContainer');
  const userInfo = document.getElementById('googleUserInfo');
  if (!signInContainer || !userInfo || !authWidget) return;

  userInfo.classList.add('hidden');
  signInContainer.classList.add('hidden');
  if (GOOGLE_AUTH_AUTO_ONLY) {
    authWidget.classList.add('hidden');
  }
}

function setGoogleUserSignedIn(user) {
  const authWidget = document.getElementById('googleAuthWidget');
  const signInContainer = document.getElementById('googleSignInContainer');
  const userInfo = document.getElementById('googleUserInfo');
  const userAvatar = document.getElementById('googleUserAvatar');
  const userName = document.getElementById('googleUserName');
  const userEmail = document.getElementById('googleUserEmail');
  if (!signInContainer || !userInfo || !userAvatar || !userName || !userEmail || !authWidget) return;

  userAvatar.src = user.picture || 'https://i.pravatar.cc/80?img=12';
  userName.textContent = user.name || 'Google User';
  userEmail.textContent = user.email || '';
  userName.title = user.name || 'Google User';
  userEmail.title = user.email || '';
  authWidget.classList.remove('hidden');
  signInContainer.classList.add('hidden');
  userInfo.classList.remove('hidden');
}

async function syncGoogleCredentialToServer(idToken) {
  const response = await fetch('/api/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: idToken })
  });

  const data = await response.json();
  if (!response.ok || !data.ok) {
    throw new Error(data.message || 'Google login gagal diproses server.');
  }

  return data.user;
}

async function loadCurrentGoogleSession() {
  const response = await fetch('/api/auth/me');
  if (!response.ok) return null;
  const data = await response.json();
  if (!data.ok) return null;
  return data.user;
}

function initGoogleAuth() {
  const authWidget = document.getElementById('googleAuthWidget');
  const signInContainer = document.getElementById('googleSignInContainer');
  const logoutBtn = document.getElementById('googleLogoutBtn');
  const clientIdMeta = document.querySelector('meta[name=\"google-signin-client_id\"]');

  if (!authWidget || !signInContainer || !logoutBtn) return;
  if (!GOOGLE_AUTH_AUTO_ONLY) {
    authWidget.classList.remove('hidden');
  }

  const resolveClientId = async () => {
    // Meta tag adalah sumber utama (selalu ada, tanpa request jaringan).
    const metaClientId = clientIdMeta ? clientIdMeta.content.trim() : '';
    if (metaClientId && !metaClientId.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
      return metaClientId;
    }

    // Fallback server hanya dipakai bila meta tidak tersedia/belum diisi,
    // sehingga tidak ada request /api/config di kondisi normal.
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const data = await response.json();
        if (data.googleClientId) {
          return data.googleClientId;
        }
      }
    } catch (error) {
      console.warn('Gagal mengambil konfigurasi server:', error);
    }

    return metaClientId;
  };

  const waitForGoogleIdentityServices = (timeoutMs = 8000, stepMs = 150) => {
    return new Promise((resolve) => {
      const startedAt = Date.now();
      const timer = setInterval(() => {
        const ready = Boolean(window.google && window.google.accounts && window.google.accounts.id);
        if (ready) {
          clearInterval(timer);
          resolve(true);
          return;
        }

        if (Date.now() - startedAt >= timeoutMs) {
          clearInterval(timer);
          resolve(false);
        }
      }, stepMs);
    });
  };

  const bootstrap = async () => {
    const clientId = await resolveClientId();

    if (!clientId || clientId.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
      console.warn('Google Sign-In belum aktif: isi GOOGLE_CLIENT_ID di server atau meta fallback.');
      setGoogleUserSignedOut();
      return;
    }

    const gisReady = await waitForGoogleIdentityServices();
    if (!gisReady) {
      console.warn('Google Identity Services belum siap. Cek koneksi / extension browser.');
      setGoogleUserSignedOut();
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      auto_select: true,
      cancel_on_tap_outside: false,
      callback: async (response) => {
        try {
          const user = await syncGoogleCredentialToServer(response.credential);
          setGoogleUserSignedIn(user);
        } catch (error) {
          console.error(error);
          setGoogleUserSignedOut();
        }
      }
    });

    signInContainer.innerHTML = '';
    signInContainer.classList.add('hidden');
    if (!GOOGLE_AUTH_AUTO_ONLY) {
      window.google.accounts.id.renderButton(signInContainer, {
        theme: 'outline',
        size: 'medium',
        shape: 'pill',
        width: 210,
        text: 'signin_with'
      });
    }

    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        console.info('Google One Tap belum tampil:', notification.getNotDisplayedReason() || notification.getSkippedReason());
      }
    });

    logoutBtn.onclick = async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.error(error);
      }

      window.google.accounts.id.disableAutoSelect();
      setGoogleUserSignedOut();
    };

    loadCurrentGoogleSession()
      .then((user) => {
        if (user) {
          setGoogleUserSignedIn(user);
        } else {
          setGoogleUserSignedOut();
        }
      })
      .catch((error) => {
        console.error(error);
        setGoogleUserSignedOut();
      });
  };

  bootstrap();
}

/* ===========================
   MARQUEE LOOP: clone konten marquee sebagai duplikat non-interaktif
   (aria-hidden + inert, link diganti div agar tak masuk urutan tab/a11y tree)
=========================== */
function initMarqueeLoop() {
  document.querySelectorAll('.marquee-container').forEach((container) => {
    const original = container.querySelector('.marquee-content');
    if (!original || container.querySelectorAll('.marquee-content').length > 1) return;
    const clone = original.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    clone.setAttribute('inert', '');
    clone.querySelectorAll('a').forEach((a) => {
      const div = document.createElement('div');
      div.className = a.className;
      div.innerHTML = a.innerHTML;
      a.replaceWith(div);
    });
    clone.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    container.appendChild(clone);
  });
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
  initMarqueeLoop();
  initTyping();
  initScrollProgress();
  initWAWidget();
  initExitIntent();
  initAOSSections();
  initSectionParallaxGradient();
  initBackToTopButton();
  initGoogleAuth();
});

/* ====================================
   PORTFOLIO MODAL LOGIC
==================================== */
const projectData = {
  project1: {
    title: "Squeen Store V2",
    category: "E-Commerce Solution",
    image: "/assets/images/portfolio/squeen.jpg",
    description: "Modernisasi platform retail dengan sistem stok real-time, integrasi Midtrans untuk pembayaran, dan dashboard analitik penjualan.",
    problem: "Klien kesulitan mengelola stok yang sinkron antara offline dan online, serta proses checkout yang lambat.",
    solution: "Membangun sistem headless commerce dengan Next.js untuk kecepatan maksimal dan integrasi API stok terpusat.",
    result: "Peningkatan konversi sebesar 40% dan efisiensi operasional manajemen stok hingga 60%.",
    tech: ["Next.js", "Tailwind", "Node.js", "PostgreSQL"]
  },
  project2: {
    title: "Revox Suite",
    category: "SaaS / Business App",
    image: "/assets/images/portfolio/revox.jpg",
    description: "Sistem Manajemen Perusahaan (ERP Ringan) untuk studio kreatif yang mencakup manajemen proyek, absensi, dan KPI.",
    problem: "Tim tersebar di berbagai lokasi tanpa alat monitoring progres yang terintegrasi, menyebabkan deadline sering terlewat.",
    solution: "Aplikasi Progressive Web App (PWA) dengan notifikasi real-time dan dashboard visualisasi data.",
    result: "Produktivitas tim meningkat 25% dan transparansi progres proyek mencapai 100% bagi manajemen.",
    tech: ["React", "Firebase", "Chart.js", "Cloud Functions"]
  },
  project3: {
    title: "Vortex Chat AI",
    category: "AI Integration",
    image: "/assets/images/portfolio/vortex.jpg",
    description: "Asisten Customer Service berbasis kecerdasan buatan yang mampu memahami konteks dokumen perusahaan.",
    problem: "Biaya operasional CS yang tinggi untuk menjawab pertanyaan berulang (FAQ) sepanjang waktu.",
    solution: "Integrasi RAG (Retrieval-Augmented Generation) menggunakan OpenAI API dan Vector Database.",
    result: "90% pertanyaan rutin terjawab otomatis, mengurangi beban tim CS manusia secara signifikan.",
    tech: ["Python", "LangChain", "OpenAI", "Pinecone"]
  }
};

function openPortfolioModal(id) {
  const data = projectData[id];
  const modal = document.getElementById('portfolioModal');
  const content = document.getElementById('modalContent');
  
  if (!data || !modal || !content) return;

  content.innerHTML = `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
      <div class="rounded-2xl overflow-hidden shadow-2xl">
        <img src="${data.image}" alt="${data.title}" class="w-full h-full object-cover">
      </div>
      <div>
        <span class="text-violet-400 font-bold uppercase tracking-widest text-sm">${data.category}</span>
        <h3 class="text-3xl md:text-4xl font-extrabold mt-2 mb-6">${data.title}</h3>
        
        <div class="space-y-6">
          <div>
            <h4 class="text-slate-100 font-bold mb-2">Ringkasan Proyek</h4>
            <p class="text-slate-400 leading-relaxed">${data.description}</p>
          </div>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div class="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <h5 class="text-red-400 text-xs font-bold uppercase mb-1">Masalah</h5>
              <p class="text-slate-300 text-sm">${data.problem}</p>
            </div>
            <div class="p-4 bg-slate-900/50 rounded-xl border border-slate-800">
              <h5 class="text-green-400 text-xs font-bold uppercase mb-1">Solusi</h5>
              <p class="text-slate-300 text-sm">${data.solution}</p>
            </div>
          </div>

          <div>
            <h4 class="text-slate-100 font-bold mb-2">Hasil Akhir</h4>
            <p class="text-slate-400 leading-relaxed">${data.result}</p>
          </div>

          <div>
            <h4 class="text-slate-100 font-bold mb-3">Teknologi</h4>
            <div class="flex flex-wrap gap-2">
              ${data.tech.map(t => `<span class="px-3 py-1 bg-slate-800 text-slate-300 rounded-full text-xs border border-slate-700">${t}</span>`).join('')}
            </div>
          </div>

          <div class="pt-6">
            <a href="https://wa.me/6285111408114?text=Halo,%20saya%20tertarik%20dengan%20solusi%20seperti%20${data.title}." 
               class="inline-block px-8 py-3 bg-violet-600 rounded-full font-bold shadow-lg hover:scale-105 transition-transform">
               Konsultasi Proyek Serupa
            </a>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  document.body.style.overflow = 'hidden';
}

function closePortfolioModal() {
  const modal = document.getElementById('portfolioModal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
  document.body.style.overflow = '';
}

/* ====================================
   LEGAL — konten legal kini berada di halaman khusus
   (/privacy-policy dan /terms-of-service), bukan modal.
==================================== */

/* ====================================
   CONTACT FORM SUBMISSION
==================================== */
const contactFormAlt = document.getElementById('contact-form');
const successMsg = document.getElementById('form-success');

if (contactFormAlt) {
  contactFormAlt.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactFormAlt.querySelector('button');
    const originalText = btn.innerHTML;

    // Get form values
    const name = document.getElementById('contact-name').value;
    const email = document.getElementById('contact-email').value;
    const company = document.getElementById('contact-company').value || '-';
    const message = document.getElementById('contact-message').value;

    // Format professional message
    const waText = `Halo Vidhara,\n\nSaya ingin berkonsultasi mengenai proyek digital.\n\n*Detail Kontak:* \n- Nama: ${name}\n- Email: ${email}\n- Perusahaan: ${company}\n\n*Kebutuhan Projek:* \n${message}\n\nTerima kasih.`;
    const encodedText = encodeURIComponent(waText);
    const waUrl = `https://wa.me/6285111408114?text=${encodedText}`;

    // Buka WhatsApp langsung dari gesture user — window.open di dalam
    // setTimeout akan kehilangan user activation dan diblokir popup blocker (Safari/strict).
    window.open(waUrl, '_blank', 'noopener');

    btn.disabled = true;
    btn.innerHTML = '<span>Menyiapkan WhatsApp...</span>';
    successMsg.classList.remove('hidden');

    setTimeout(() => {
      btn.innerHTML = originalText;
      btn.disabled = false;
      successMsg.classList.add('hidden');
      contactFormAlt.reset();
    }, 3000);
  });
}

// Close modals on outside click
window.addEventListener('click', (e) => {
  const pModal = document.getElementById('portfolioModal');
  if (e.target === pModal) closePortfolioModal();
});

/* ====================================
   MODAL FOCUS TRAP + ESC
==================================== */
(function initModalA11y() {
  const focusableSelector = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
  let lastFocused = null;

  function getOpenModal() {
    const ids = ['portfolioModal'];
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && !el.classList.contains('hidden')) return el;
    }
    return null;
  }

  function trap(e) {
    const modal = getOpenModal();
    if (!modal) return;
    if (e.key === 'Escape') {
      e.preventDefault();
      if (modal.id === 'portfolioModal') closePortfolioModal();
      if (lastFocused) lastFocused.focus();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusables = Array.from(modal.querySelectorAll(focusableSelector))
      .filter(el => el.offsetParent !== null);
    if (!focusables.length) return;
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  document.addEventListener('keydown', trap);

  const observer = new MutationObserver(() => {
    const modal = getOpenModal();
    if (modal && document.activeElement && !modal.contains(document.activeElement)) {
      lastFocused = document.activeElement;
      const focusables = modal.querySelectorAll(focusableSelector);
      if (focusables.length) focusables[0].focus();
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
    }
  });
  ['portfolioModal'].forEach(id => {
    const el = document.getElementById(id);
    if (el) observer.observe(el, { attributes: true, attributeFilter: ['class'] });
  });
})();

/* ====================================
   PREMIUM INTERACTIONS (NEW)
==================================== */

// Custom Cursor Logic
const cursor = document.getElementById('custom-cursor');
if (cursor) {
  document.addEventListener('mousemove', (e) => {
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });

  document.querySelectorAll('a, button, .cursor-pointer').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// Premium interactions hanya untuk pointer presisi (mouse) & tanpa reduced-motion.
// Di layar sentuh efek ini membuat scroll berat dan transform bentrok dengan hover Tailwind.
const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && canHover) {
document.querySelectorAll('.magnetic-wrap').forEach(wrap => {
  const content = wrap.querySelector('.magnetic-content') || wrap.querySelector('a, button');
  if (!content) return;

  wrap.addEventListener('mousemove', (e) => {
    const rect = wrap.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    content.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
  });

  wrap.addEventListener('mouseleave', () => {
    content.style.transform = 'translate(0, 0)';
  });
});

// 3D Tilt for Hero Visual
const heroVisual = document.getElementById('hero-visual-tilt');
if (heroVisual) {
  heroVisual.addEventListener('mousemove', (e) => {
    const rect = heroVisual.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = (centerY - y) / 10;
    const rotateY = (x - centerX) / 10;
    
    heroVisual.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  heroVisual.addEventListener('mouseleave', () => {
    heroVisual.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg)';
  });
}

// Tilt hanya untuk kartu showcase utama (bukan FAQ/menu/popup) agar
// tidak bentrok dengan hover:scale Tailwind dan tidak menambah ratusan listener.
document.querySelectorAll('#services .glass-card, #portfolio .glass-card-premium, #paket .glass-card, #whyus .glass-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = (centerY - y) / 25;
    const rotateY = (x - centerX) / 25;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-8px) scale(1.02)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0) scale(1)';
  });
});
} // end reduced-motion guard

// Header Scroll state
const headerElement = document.querySelector('header');
if (headerElement) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      headerElement.classList.add('scrolled');
    } else {
      headerElement.classList.remove('scrolled');
    }
  }, { passive: true });
}
