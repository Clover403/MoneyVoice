import { useNavigate } from 'react-router-dom';
import { Camera, Calculator, History, CreditCard, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store';

function HomePage() {
  const navigate = useNavigate();
  const { user, subscription } = useAuthStore();

  const features = [
    {
      title: 'Scan Uang',
      description: 'Kenali nilai uang dengan cepat',
      icon: Camera,
      color: 'bg-blue-500',
      path: '/scan',
    },
    {
      title: 'Hitung Uang',
      description: 'Jumlahkan beberapa lembar uang',
      icon: Calculator,
      color: 'bg-green-500',
      path: '/calculate',
    },
    {
      title: 'Riwayat',
      description: 'Lihat riwayat scan Anda',
      icon: History,
      color: 'bg-purple-500',
      path: '/history',
    },
    {
      title: 'Berlangganan',
      description: 'Upgrade untuk unlimited scan',
      icon: CreditCard,
      color: 'bg-orange-500',
      path: '/subscription',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <section aria-labelledby="welcome-heading">
        <div className="card bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <h2 id="welcome-heading" className="text-2xl font-bold mb-2">
            Selamat Datang, {user?.nama?.split(' ')[0] || 'Pengguna'}! 👋
          </h2>
          <p className="text-blue-100 text-lg">
            Siap mengenali dan menghitung uang Anda?
          </p>
          
          {subscription && (
            <div className="mt-4 p-3 bg-white/20 rounded-xl">
              <p className="text-sm">
                Paket: <strong>{subscription.tipePaket === 'gratis' ? 'Gratis' : subscription.tipePaket}</strong>
              </p>
              {subscription.tipePaket === 'gratis' && (
                <p className="text-sm mt-1">
                  Sisa scan hari ini: <strong>{subscription.sisaScan || '...'}</strong>
                </p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Quick actions */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-xl font-bold mb-4">
          Menu Utama
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feature) => (
            <button
              key={feature.path}
              onClick={() => navigate(feature.path)}
              className="card hover:shadow-xl transition-all duration-200 text-left group"
              aria-label={`${feature.title}: ${feature.description}`}
            >
              <div className="flex items-start gap-4">
                <div className={`${feature.color} p-4 rounded-xl text-white`}>
                  <feature.icon size={32} aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mt-1">
                    {feature.description}
                  </p>
                </div>
                <ArrowRight 
                  className="text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" 
                  size={24}
                  aria-hidden="true" 
                />
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Main action buttons */}
      <section aria-labelledby="main-actions-heading" className="space-y-4">
        <h2 id="main-actions-heading" className="sr-only">
          Aksi Utama
        </h2>
        
        <button
          onClick={() => navigate('/scan')}
          className="btn btn-primary btn-large w-full flex items-center justify-center gap-3"
        >
          <Camera size={28} aria-hidden="true" />
          <span>Mulai Scan Uang</span>
        </button>
        
        <button
          onClick={() => navigate('/calculate')}
          className="btn btn-success btn-large w-full flex items-center justify-center gap-3"
        >
          <Calculator size={28} aria-hidden="true" />
          <span>Hitung Total Uang</span>
        </button>
      </section>

      {/* Help info */}
      <section aria-labelledby="help-heading" className="card bg-gray-100">
        <h2 id="help-heading" className="font-bold text-lg mb-2">
          💡 Cara Penggunaan
        </h2>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">1.</span>
            <span>Pilih menu <strong>Scan Uang</strong> untuk mengenali satu lembar uang</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">2.</span>
            <span>Pilih menu <strong>Hitung Uang</strong> untuk menjumlahkan beberapa lembar</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">3.</span>
            <span>Arahkan kamera ke uang dan tekan tombol untuk scan</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="font-bold text-blue-600">4.</span>
            <span>Aplikasi akan membacakan nilai uang dengan suara</span>
          </li>
        </ul>
      </section>
    </div>
  );
}

export default HomePage;
