import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';
import speechService from '../services/speech';

function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    password: '',
    nomorTelepon: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.register(formData);
      
      if (response.success) {
        setAuth(response.data.user, response.data.token);
        toast.success('Registrasi berhasil!');
        speechService.speak('Registrasi berhasil. Selamat datang di Scan Tunai.');
        navigate('/');
      }
    } catch (error) {
      console.error('Register error:', error);
      const message = error.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
      toast.error(message);
      speechService.speak(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">💵</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Scan Tunai
          </h1>
          <p className="text-gray-600 mt-2">
            Daftar akun baru
          </p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="card space-y-6">
          <div>
            <label htmlFor="nama" className="block text-lg font-medium text-gray-700 mb-2">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="nama"
              name="nama"
              value={formData.nama}
              onChange={handleChange}
              required
              className="input"
              placeholder="Masukkan nama lengkap"
              autoComplete="name"
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-lg font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="nama@email.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="nomorTelepon" className="block text-lg font-medium text-gray-700 mb-2">
              Nomor Telepon (Opsional)
            </label>
            <input
              type="tel"
              id="nomorTelepon"
              name="nomorTelepon"
              value={formData.nomorTelepon}
              onChange={handleChange}
              className="input"
              placeholder="08xxxxxxxxxx"
              autoComplete="tel"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-lg font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={6}
                className="input pr-12"
                placeholder="Minimal 6 karakter"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
              >
                {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-large w-full flex items-center justify-center gap-3"
          >
            {isLoading ? (
              <span>Memproses...</span>
            ) : (
              <>
                <UserPlus size={24} aria-hidden="true" />
                <span>Daftar</span>
              </>
            )}
          </button>
        </form>

        {/* Login link */}
        <p className="text-center mt-6 text-lg">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-blue-600 font-bold hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
