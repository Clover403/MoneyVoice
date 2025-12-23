import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Phone, Lock, LogOut, Save, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authAPI } from '../services/api';
import { useAuthStore } from '../store';

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout, updateUser } = useAuthStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    nama: user?.nama || '',
    nomorTelepon: user?.nomorTelepon || '',
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authAPI.updateProfile(formData);
      
      if (response.success) {
        updateUser(response.data.user);
        setIsEditing(false);
        toast.success('Profil berhasil diperbarui');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memperbarui profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Password baru tidak sama');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      if (response.success) {
        setIsChangingPassword(false);
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        toast.success('Password berhasil diubah');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal mengubah password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success('Berhasil keluar');
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Profil Saya
        </h1>
      </header>

      {/* Profile Info Card */}
      <section className="card">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={40} className="text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user?.nama}</h2>
            <p className="text-gray-600">{user?.email}</p>
          </div>
        </div>

        {!isEditing ? (
          <>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Mail className="text-gray-400" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{user?.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <Phone className="text-gray-400" size={24} />
                <div>
                  <p className="text-sm text-gray-500">Nomor Telepon</p>
                  <p className="font-medium">{user?.nomorTelepon || '-'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(true)}
              className="btn btn-primary w-full mt-6"
            >
              Edit Profil
            </button>
          </>
        ) : (
          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label htmlFor="nama" className="block text-sm font-medium text-gray-700 mb-1">
                Nama
              </label>
              <input
                type="text"
                id="nama"
                name="nama"
                value={formData.nama}
                onChange={handleChange}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="nomorTelepon" className="block text-sm font-medium text-gray-700 mb-1">
                Nomor Telepon
              </label>
              <input
                type="tel"
                id="nomorTelepon"
                name="nomorTelepon"
                value={formData.nomorTelepon}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Save size={20} />
                <span>{isLoading ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Change Password Section */}
      <section className="card">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Lock size={24} className="text-gray-600" />
          Ubah Password
        </h3>

        {!isChangingPassword ? (
          <button
            onClick={() => setIsChangingPassword(true)}
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <span>Ubah Password</span>
            <ChevronRight size={20} />
          </button>
        ) : (
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password Lama
              </label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="input"
                required
              />
            </div>
            
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Password Baru
              </label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="input"
                required
                minLength={6}
              />
            </div>
            
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Konfirmasi Password Baru
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="input"
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsChangingPassword(false)}
                className="btn btn-secondary flex-1"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary flex-1"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* Subscription link */}
      <button
        onClick={() => navigate('/subscription')}
        className="card w-full text-left hover:shadow-lg transition-shadow flex items-center justify-between"
      >
        <div>
          <h3 className="font-bold text-lg">Langganan</h3>
          <p className="text-gray-600">Kelola paket langganan Anda</p>
        </div>
        <ChevronRight size={24} className="text-gray-400" />
      </button>

      {/* Logout button */}
      <button
        onClick={handleLogout}
        className="btn btn-danger w-full flex items-center justify-center gap-2"
      >
        <LogOut size={24} />
        <span>Keluar</span>
      </button>
    </div>
  );
}

export default ProfilePage;
