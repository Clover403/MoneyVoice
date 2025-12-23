import { useState, useEffect } from 'react';
import { Check, Crown, Star, Zap } from 'lucide-react';
import toast from 'react-hot-toast';
import { subscriptionAPI } from '../services/api';
import { useAuthStore } from '../store';

function SubscriptionPage() {
  const { subscription, updateSubscription } = useAuthStore();
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, currentRes] = await Promise.all([
        subscriptionAPI.getPlans(),
        subscriptionAPI.getCurrentSubscription()
      ]);

      if (plansRes.success) {
        setPlans(plansRes.data.plans);
      }

      if (currentRes.success) {
        setCurrentPlan(currentRes.data.subscription);
        updateSubscription(currentRes.data.subscription);
      }
    } catch (error) {
      console.error('Load subscription data error:', error);
      toast.error('Gagal memuat data langganan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (tipePaket) => {
    setIsProcessing(true);
    
    try {
      const response = await subscriptionAPI.subscribe(tipePaket);
      
      if (response.success) {
        toast.success(response.message);
        loadData(); // Refresh data
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal memproses langganan');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Yakin ingin membatalkan langganan?')) return;
    
    setIsProcessing(true);
    
    try {
      const response = await subscriptionAPI.cancelSubscription();
      
      if (response.success) {
        toast.success(response.message);
        loadData();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Gagal membatalkan langganan');
    } finally {
      setIsProcessing(false);
    }
  };

  const getPlanIcon = (planId) => {
    switch (planId) {
      case 'gratis': return Star;
      case 'bulanan': return Zap;
      case 'tahunan': return Crown;
      default: return Star;
    }
  };

  const getPlanColor = (planId) => {
    switch (planId) {
      case 'gratis': return 'bg-gray-100 border-gray-300';
      case 'bulanan': return 'bg-blue-50 border-blue-300';
      case 'tahunan': return 'bg-yellow-50 border-yellow-400';
      default: return 'bg-gray-100 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Langganan
        </h1>
        <p className="text-gray-600 mt-1">
          Pilih paket yang sesuai dengan kebutuhan Anda
        </p>
      </header>

      {/* Current subscription status */}
      {currentPlan && (
        <section 
          className={`card ${currentPlan.tipePaket === 'gratis' ? 'bg-gray-50' : 'bg-green-50 border-green-200'}`}
          aria-label="Status langganan saat ini"
        >
          <h2 className="font-bold text-lg mb-2">Paket Anda Saat Ini</h2>
          <div className="flex items-center gap-3 mb-3">
            {(() => {
              const Icon = getPlanIcon(currentPlan.tipePaket);
              return <Icon size={28} className="text-blue-600" />;
            })()}
            <span className="text-xl font-bold">{currentPlan.namaPaket}</span>
          </div>
          
          <div className="space-y-2 text-gray-700">
            <p>
              <strong>Batas scan harian:</strong> {currentPlan.batasScanHarian}
            </p>
            <p>
              <strong>Scan hari ini:</strong> {currentPlan.jumlahScanHariIni}
            </p>
            <p>
              <strong>Sisa scan:</strong> {currentPlan.sisaScan}
            </p>
            {currentPlan.tanggalBerakhir && (
              <p>
                <strong>Berlaku sampai:</strong>{' '}
                {new Date(currentPlan.tanggalBerakhir).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            )}
          </div>

          {currentPlan.tipePaket !== 'gratis' && (
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="btn btn-danger mt-4"
            >
              Batalkan Langganan
            </button>
          )}
        </section>
      )}

      {/* Available plans */}
      <section aria-label="Pilihan paket">
        <h2 className="font-bold text-xl mb-4">Pilih Paket</h2>
        
        <div className="space-y-4">
          {plans.map((plan) => {
            const Icon = getPlanIcon(plan.id);
            const isCurrentPlan = currentPlan?.tipePaket === plan.id;
            
            return (
              <div
                key={plan.id}
                className={`card ${getPlanColor(plan.id)} ${isCurrentPlan ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${plan.id === 'tahunan' ? 'bg-yellow-400' : plan.id === 'bulanan' ? 'bg-blue-500' : 'bg-gray-400'} text-white`}>
                      <Icon size={28} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{plan.nama}</h3>
                      <p className="text-2xl font-bold text-gray-900">
                        {plan.hargaFormatted}
                        {plan.id !== 'gratis' && (
                          <span className="text-sm font-normal text-gray-500">
                            /{plan.id === 'bulanan' ? 'bulan' : 'tahun'}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {isCurrentPlan && (
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Aktif
                    </span>
                  )}
                </div>

                <ul className="space-y-2 mb-4">
                  {plan.fitur.map((fitur, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check size={20} className="text-green-600 flex-shrink-0" />
                      <span>{fitur}</span>
                    </li>
                  ))}
                </ul>

                {!isCurrentPlan && plan.id !== 'gratis' && (
                  <button
                    onClick={() => handleSubscribe(plan.id)}
                    disabled={isProcessing}
                    className={`btn w-full ${plan.id === 'tahunan' ? 'btn-success' : 'btn-primary'}`}
                  >
                    {isProcessing ? 'Memproses...' : `Pilih ${plan.nama}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Info */}
      <section className="card bg-blue-50 border-blue-200">
        <h3 className="font-bold text-lg text-blue-900 mb-2">
          ℹ️ Informasi Pembayaran
        </h3>
        <p className="text-blue-800">
          Saat ini pembayaran masih dalam mode simulasi. Pada versi production, 
          Anda akan diarahkan ke payment gateway untuk menyelesaikan pembayaran.
        </p>
      </section>
    </div>
  );
}

export default SubscriptionPage;
