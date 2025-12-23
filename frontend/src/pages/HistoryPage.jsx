import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Clock, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { scanAPI } from '../services/api';

function HistoryPage() {
  const [activeTab, setActiveTab] = useState('scan'); // 'scan' or 'calculation'
  const [scanHistory, setScanHistory] = useState([]);
  const [calculationHistory, setCalculationHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanPage, setScanPage] = useState(1);
  const [calcPage, setCalcPage] = useState(1);
  const [hasMoreScans, setHasMoreScans] = useState(true);
  const [hasMoreCalcs, setHasMoreCalcs] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const [scanRes, calcRes] = await Promise.all([
        scanAPI.getScanHistory(1, 20),
        scanAPI.getCalculationHistory(1, 10)
      ]);

      if (scanRes.success) {
        setScanHistory(scanRes.data.scans || []);
        setHasMoreScans(scanRes.data.pagination?.page < scanRes.data.pagination?.totalPages);
      }

      if (calcRes.success) {
        setCalculationHistory(calcRes.data.sessions || []);
        setHasMoreCalcs(calcRes.data.pagination?.page < calcRes.data.pagination?.totalPages);
      }
    } catch (error) {
      console.error('Load history error:', error);
      toast.error('Gagal memuat riwayat');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreScans = async () => {
    try {
      const response = await scanAPI.getScanHistory(scanPage + 1, 20);
      if (response.success) {
        setScanHistory(prev => [...prev, ...(response.data.scans || [])]);
        setScanPage(prev => prev + 1);
        setHasMoreScans(response.data.pagination?.page < response.data.pagination?.totalPages);
      }
    } catch (error) {
      toast.error('Gagal memuat lebih banyak');
    }
  };

  const loadMoreCalcs = async () => {
    try {
      const response = await scanAPI.getCalculationHistory(calcPage + 1, 10);
      if (response.success) {
        setCalculationHistory(prev => [...prev, ...(response.data.sessions || [])]);
        setCalcPage(prev => prev + 1);
        setHasMoreCalcs(response.data.pagination?.page < response.data.pagination?.totalPages);
      }
    } catch (error) {
      toast.error('Gagal memuat lebih banyak');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-600">Memuat riwayat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl font-bold text-gray-900">
          Riwayat
        </h1>
        <p className="text-gray-600 mt-1">
          Lihat riwayat scan dan perhitungan Anda
        </p>
      </header>

      {/* Tabs */}
      <div className="flex gap-2" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'scan'}
          onClick={() => setActiveTab('scan')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium text-lg transition-colors ${
            activeTab === 'scan'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Scan Tunggal
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'calculation'}
          onClick={() => setActiveTab('calculation')}
          className={`flex-1 py-3 px-4 rounded-xl font-medium text-lg transition-colors ${
            activeTab === 'calculation'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Perhitungan
        </button>
      </div>

      {/* Scan History Tab */}
      {activeTab === 'scan' && (
        <section aria-label="Riwayat scan tunggal">
          {scanHistory.length === 0 ? (
            <div className="card text-center py-12">
              <Clock size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                Belum ada riwayat scan
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Riwayat scan akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {scanHistory.map((scan) => (
                <div 
                  key={scan.id}
                  className="card flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <DollarSign size={24} className="text-green-600" />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-green-600">
                        {scan.valueFormatted || `Rp ${scan.value?.toLocaleString('id-ID')}`}
                      </p>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar size={14} />
                        {formatDate(scan.timestamp)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {scan.currency || 'IDR'}
                    </span>
                    {scan.confidence && (
                      <p className="text-xs text-gray-400 mt-1">
                        {Math.round(scan.confidence)}% akurat
                      </p>
                    )}
                  </div>
                </div>
              ))}
              
              {hasMoreScans && (
                <button
                  onClick={loadMoreScans}
                  className="btn btn-secondary w-full"
                >
                  Muat Lebih Banyak
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* Calculation History Tab */}
      {activeTab === 'calculation' && (
        <section aria-label="Riwayat perhitungan">
          {calculationHistory.length === 0 ? (
            <div className="card text-center py-12">
              <TrendingUp size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-600 text-lg">
                Belum ada riwayat perhitungan
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Riwayat perhitungan akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {calculationHistory.map((session) => (
                <div 
                  key={session.id}
                  className="card"
                >
                  <div 
                    className="flex items-center justify-between mb-3 cursor-pointer"
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                        <TrendingUp size={24} className="text-purple-600" />
                      </div>
                      <div>
                        <p className="font-bold text-xl text-green-600">
                          {session.totalFormatted || `Rp ${session.totalMoney?.toLocaleString('id-ID')}`}
                        </p>
                        <p className="text-sm text-gray-500">
                          {session.totalBanknotes} lembar uang
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        session.isCompleted 
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {session.isCompleted ? 'Selesai' : 'Berlangsung'}
                      </span>
                      {expandedSession === session.id ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-500 flex items-center gap-1">
                    <Calendar size={14} />
                    {formatDate(session.completedAt || session.createdAt)}
                  </div>
                  
                  {/* Expanded Details */}
                  {expandedSession === session.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {/* Denomination Breakdown */}
                      {session.denominationBreakdown?.denominations?.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 mb-2">Rincian Pecahan:</h4>
                          <div className="space-y-2 bg-gray-50 rounded-lg p-3">
                            {session.denominationBreakdown.denominations.map((denom, idx) => (
                              <div 
                                key={idx}
                                className="flex justify-between items-center text-sm"
                              >
                                <span className="text-gray-600">
                                  Rp {denom.value?.toLocaleString('id-ID')} × {denom.count}
                                </span>
                                <span className="font-medium text-gray-800">
                                  Rp {(denom.value * denom.count).toLocaleString('id-ID')}
                                </span>
                              </div>
                            ))}
                            <div className="border-t pt-2 mt-2 flex justify-between items-center font-bold">
                              <span className="text-gray-700">Total</span>
                              <span className="text-green-600">
                                Rp {session.denominationBreakdown.totalMoney?.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Summary */}
                      <div className="bg-blue-50 rounded-lg p-3">
                        <h4 className="font-medium text-blue-700 mb-2">Ringkasan:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Total Uang:</span>
                            <p className="font-bold text-green-600">{session.totalFormatted}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Jumlah Lembar:</span>
                            <p className="font-bold text-gray-800">{session.totalBanknotes}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Mata Uang:</span>
                            <p className="font-medium text-gray-800">{session.currency}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Waktu Selesai:</span>
                            <p className="font-medium text-gray-800">
                              {session.completedAt ? formatDate(session.completedAt) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {session.note && (
                    <p className="mt-2 text-gray-600 bg-gray-50 p-2 rounded-lg">
                      📝 {session.note}
                    </p>
                  )}
                </div>
              ))}
              
              {hasMoreCalcs && (
                <button
                  onClick={loadMoreCalcs}
                  className="btn btn-secondary w-full"
                >
                  Muat Lebih Banyak
                </button>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

export default HistoryPage;
