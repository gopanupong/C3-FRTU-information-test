
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Server, 
  History, 
  Menu, 
  X, 
  Zap, 
  LogOut,
  Plus,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileSpreadsheet,
  Download,
  ExternalLink,
  Edit2,
  Trash2,
  Activity,
  Calendar,
  RotateCcw,
  Loader,
  Wifi
} from 'lucide-react';
import { Toaster, toast } from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { storageService } from './services/storageService';
import { FRTU, FRTUStatus, ActionType, HistoryLog } from './types';
import { StatCard } from './components/StatCard';
import { DeviceModal } from './components/DeviceModal';

// --- Components ---

const Sidebar = ({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (v: boolean) => void }) => {
  const location = useLocation();
  const menuItems = [
    { path: '/', label: 'ภาพรวมระบบ', icon: LayoutDashboard },
    { path: '/devices', label: 'จัดการอุปกรณ์', icon: Server },
    { path: '/history', label: 'ประวัติการทำงาน', icon: History },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/50 z-20 md:hidden" onClick={() => setIsOpen(false)} />}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 z-30 transform transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
           <Zap className="text-pea-purple w-8 h-8 mr-2 fill-current" />
           <span className="font-bold text-xl text-slate-800 tracking-tight">PEA <span className="text-pea-purple">FRTU</span></span>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.map((item) => {
             const isActive = location.pathname === item.path;
             return (
              <Link 
                key={item.path} 
                to={item.path} 
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${isActive ? 'bg-pea-purple text-white shadow-md shadow-purple-200' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.label}</span>
              </Link>
             );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-100">
           <div className="flex items-center space-x-3 px-4 py-3 text-slate-500">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">JD</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700">จนท. ทดสอบ</p>
                <p className="text-xs">แผนกจัดการศูนย์สั่งการ</p>
              </div>
              <LogOut size={18} className="cursor-pointer hover:text-red-500 transition" />
           </div>
        </div>
      </div>
    </>
  );
};

// --- Pages ---

const DashboardPage = () => {
  const [frtus, setFrtus] = useState<FRTU[]>([]);
  const [logs, setLogs] = useState<HistoryLog[]>([]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  
  useEffect(() => {
    setFrtus(storageService.getFRTUs());
    setLogs(storageService.getLogs());
  }, []);

  // Filter Data Logic
  const getFilteredData = () => {
    if (!startDate && !endDate) {
      return { displayFrtus: frtus, displayLogs: logs };
    }

    const start = startDate ? new Date(startDate) : new Date('2000-01-01');
    const end = endDate ? new Date(endDate) : new Date();
    // Adjust end date to cover the entire day
    end.setHours(23, 59, 59, 999);

    const displayFrtus = frtus.filter(f => {
      const testDate = new Date(f.lastMaintenance);
      return testDate >= start && testDate <= end;
    });

    const displayLogs = logs.filter(l => {
      const logDate = new Date(l.timestamp);
      return logDate >= start && logDate <= end;
    });

    return { displayFrtus, displayLogs };
  };

  const { displayFrtus, displayLogs } = getFilteredData();

  const stats = {
    total: displayFrtus.length,
    online: displayFrtus.filter(f => f.status === FRTUStatus.ONLINE).length,
    offline: displayFrtus.filter(f => f.status === FRTUStatus.OFFLINE).length,
    initializing: displayFrtus.filter(f => f.status === FRTUStatus.INITIALIZING).length,
    connecting: displayFrtus.filter(f => f.status === FRTUStatus.CONNECTING).length,
  };

  const chartData = [
    { name: 'Online', value: stats.online, color: '#10B981' }, 
    { name: 'Offline', value: stats.offline, color: '#EF4444' },
    { name: 'Initializing', value: stats.initializing, color: '#F59E0B' },
    { name: 'Connecting', value: stats.connecting, color: '#3B82F6' },
  ];

  // Helper to get relative time string
  const getRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'เมื่อสักครู่';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} นาทีที่แล้ว`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} ชั่วโมงที่แล้ว`;
    return date.toLocaleDateString('th-TH');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">ภาพรวมระบบ (Dashboard)</h1>
        
        {/* Date Filter */}
        <div className="bg-white p-2 rounded-lg shadow-sm border border-slate-100 flex flex-wrap items-center gap-2">
          <div className="flex items-center space-x-2 px-2">
            <Calendar size={18} className="text-pea-purple" />
            <span className="text-sm font-medium text-slate-700">ช่วงเวลาทดสอบ:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              type="date" 
              value={startDate} 
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-pea-purple outline-none text-slate-600"
            />
            <span className="text-slate-400">-</span>
            <input 
              type="date" 
              value={endDate} 
              onChange={(e) => setEndDate(e.target.value)}
              className="border border-slate-200 rounded px-2 py-1 text-sm focus:ring-2 focus:ring-pea-purple outline-none text-slate-600"
            />
          </div>
          {(startDate || endDate) && (
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              className="p-1 hover:bg-slate-100 rounded-full text-slate-500 transition ml-1"
              title="ล้างตัวกรอง"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="อุปกรณ์ที่ทดสอบ" value={stats.total} icon={Server} colorClass="text-purple-600 bg-purple-600" desc={startDate || endDate ? "ในช่วงเวลาที่เลือก" : "ทั้งหมดในระบบ"} />
        <StatCard title="Online" value={stats.online} icon={CheckCircle} colorClass="text-emerald-500 bg-emerald-500" desc="สถานะปกติ" />
        <StatCard title="Offline" value={stats.offline} icon={XCircle} colorClass="text-red-500 bg-red-500" desc="ขาดการติดต่อ" />
        <StatCard title="Connecting/Init" value={stats.connecting + stats.initializing} icon={Loader} colorClass="text-amber-500 bg-amber-500" desc="กำลังดำเนินการ" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">
            สัดส่วนสถานะอุปกรณ์ {startDate || endDate ? '(ตามช่วงเวลา)' : '(ปัจจุบัน)'}
          </h3>
          {stats.total > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          ) : (
             <div className="h-[300px] flex flex-col items-center justify-center text-slate-400">
               <Server size={48} className="mb-2 opacity-20" />
               <p>ไม่มีข้อมูลในช่วงเวลาที่เลือก</p>
             </div>
          )}
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col">
           <div className="flex items-center justify-between mb-4">
             <h3 className="text-lg font-bold text-slate-800">กิจกรรมล่าสุด</h3>
             <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full">{displayLogs.length} รายการ</span>
           </div>
           
           <div className="space-y-4 overflow-y-auto flex-1 max-h-[320px] pr-2">
             {displayLogs.length === 0 ? (
               <div className="text-center py-8 text-slate-400 text-sm">
                 ไม่มีประวัติการทำงานในช่วงเวลานี้
               </div>
             ) : (
               displayLogs.slice(0, 10).map((log) => (
                 <div key={log.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-lg border border-slate-100 hover:border-pea-purple/30 transition">
                    <div className={`p-2 rounded-full mt-1 shrink-0
                      ${log.action === ActionType.CREATE ? 'bg-blue-100 text-blue-600' :
                        log.action === ActionType.DELETE ? 'bg-red-100 text-red-600' :
                        log.action === ActionType.STATUS_CHANGE ? 'bg-purple-100 text-purple-600' :
                        'bg-slate-200 text-slate-600'}`}>
                      <Activity size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-slate-800 truncate">{log.action}: {log.frtuSerial}</p>
                        <span className="text-xs text-slate-400 whitespace-nowrap ml-2">{getRelativeTime(log.timestamp)}</span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5 truncate">{log.details}</p>
                      <p className="text-[10px] text-slate-400 mt-1">โดย {log.officerName}</p>
                    </div>
                 </div>
               ))
             )}
           </div>
        </div>
      </div>
    </div>
  );
};

const DevicesPage = () => {
  const [frtus, setFrtus] = useState<FRTU[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<FRTU | null>(null);

  const refreshData = () => {
    setFrtus(storageService.getFRTUs());
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSave = (device: FRTU) => {
    const isNew = !frtus.some(f => f.id === device.id);
    storageService.saveFRTU(device, isNew, 'จนท. ทดสอบ');
    setIsModalOpen(false);
    setEditingDevice(null);
    refreshData();
    toast.success(isNew ? 'เพิ่มอุปกรณ์สำเร็จ' : 'แก้ไขข้อมูลสำเร็จ');
  };

  const handleDelete = (id: string, serial: string) => {
    if(window.confirm(`ยืนยันการลบอุปกรณ์ ${serial} ?`)) {
      storageService.deleteFRTU(id, serial, 'จนท. ทดสอบ');
      refreshData();
      toast.success('ลบอุปกรณ์สำเร็จ');
    }
  };

  const handleStatusChange = (id: string, newStatus: FRTUStatus) => {
    storageService.updateStatus(id, newStatus, 'จนท. ทดสอบ');
    refreshData();
    toast.success('อัปเดตสถานะสำเร็จ');
  };

  const filteredFrtus = frtus.filter(f => {
    const matchesSearch = f.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.substation.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = statusFilter === 'ALL' || f.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">จัดการอุปกรณ์ (Device Management)</h1>
        <button onClick={() => { setEditingDevice(null); setIsModalOpen(true); }} 
          className="bg-pea-purple hover:bg-purple-800 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-md shadow-purple-200">
          <Plus size={20} />
          <span>เพิ่มอุปกรณ์ใหม่</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="ค้นหา Remote Unit Name หรือ สถานีไฟฟ้า..." 
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pea-purple focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={20} />
          <select 
            className="border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-pea-purple"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">ทุกสถานะ</option>
            {Object.values(FRTUStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-medium">Remote Unit Name</th>
                <th className="p-4 font-medium">สถานีไฟฟ้า/Location</th>
                <th className="p-4 font-medium">เหตุการณ์ที่ดำเนินงาน</th>
                <th className="p-4 font-medium">สถานะ</th>
                <th className="p-4 font-medium">วันที่ทดสอบอุปกรณ์</th>
                <th className="p-4 font-medium text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredFrtus.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-400">ไม่พบข้อมูลอุปกรณ์</td></tr>
              ) : (
                filteredFrtus.map(device => (
                  <tr key={device.id} className="hover:bg-slate-50/50 group">
                    <td className="p-4">
                      <div className="font-medium text-slate-800">{device.serialNumber}</div>
                      <div className="text-xs text-slate-500">{device.feeder}</div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      <div>{device.substation}</div>
                      <div className="text-xs text-slate-400">{device.location}</div>
                    </td>
                    <td className="p-4 text-slate-600 text-sm max-w-[250px]">
                      <div className="truncate" title={device.eventDetails}>{device.eventDetails || '-'}</div>
                    </td>
                    <td className="p-4">
                       <select 
                         value={device.status}
                         onChange={(e) => handleStatusChange(device.id, e.target.value as FRTUStatus)}
                         className={`text-xs font-semibold px-2 py-1 rounded-full border-none focus:ring-2 cursor-pointer outline-none
                           ${device.status === FRTUStatus.ONLINE ? 'bg-green-100 text-green-700 focus:ring-green-500' : 
                             device.status === FRTUStatus.OFFLINE ? 'bg-red-100 text-red-700 focus:ring-red-500' : 
                             device.status === FRTUStatus.INITIALIZING ? 'bg-amber-100 text-amber-700 focus:ring-amber-500' :
                             'bg-blue-100 text-blue-700 focus:ring-blue-500'}`}
                       >
                         {Object.values(FRTUStatus).map(s => <option key={s} value={s}>{s}</option>)}
                       </select>
                    </td>
                    <td className="p-4 text-slate-600 text-sm">{device.lastMaintenance}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => { setEditingDevice(device); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(device.id, device.serialNumber)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DeviceModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setEditingDevice(null); }} 
        onSave={handleSave}
        initialData={editingDevice}
      />
    </div>
  );
};

const HistoryPage = () => {
  const [logs, setLogs] = useState<HistoryLog[]>([]);

  useEffect(() => {
    setLogs(storageService.getLogs());
  }, []);

  const handleExport = async () => {
    const url = await storageService.exportToCSV();
    if (url) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `frtu_logs_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.success('ดาวน์โหลดรายงานสำเร็จ');
    } else {
        toast.error('ไม่พบข้อมูลสำหรับออกรายงาน');
    }
  };

  const handleOpenSheet = () => {
    window.open(storageService.getGoogleSheetUrl(), '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-800">ประวัติการทำงาน</h1>
        <div className="flex gap-2">
            <button onClick={handleOpenSheet} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
                <FileSpreadsheet size={18} />
                <span>เปิด Google Sheet</span>
            </button>
            <button onClick={handleExport} className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-lg flex items-center gap-2 transition shadow-sm">
                <Download size={18} />
                <span>Export CSV</span>
            </button>
        </div>
      </div>
      
      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-medium">วัน-เวลา</th>
                <th className="p-4 font-medium">เจ้าหน้าที่</th>
                <th className="p-4 font-medium">อุปกรณ์ (Serial)</th>
                <th className="p-4 font-medium">การกระทำ</th>
                <th className="p-4 font-medium">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {logs.length === 0 ? (
                  <tr><td colSpan={5} className="p-8 text-center text-slate-400">ยังไม่มีประวัติการทำงาน</td></tr>
               ) : (
                 logs.map(log => (
                   <tr key={log.id} className="hover:bg-slate-50/50">
                     <td className="p-4 text-slate-600 text-sm whitespace-nowrap">{new Date(log.timestamp).toLocaleString('th-TH')}</td>
                     <td className="p-4 text-slate-800 font-medium text-sm">{log.officerName}</td>
                     <td className="p-4 text-slate-600 text-sm font-mono">{log.frtuSerial}</td>
                     <td className="p-4">
                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                         ${log.action === ActionType.CREATE ? 'bg-blue-100 text-blue-800' :
                           log.action === ActionType.DELETE ? 'bg-red-100 text-red-800' :
                           log.action === ActionType.STATUS_CHANGE ? 'bg-purple-100 text-purple-800' :
                           'bg-slate-100 text-slate-800'}`}>
                         {log.action}
                       </span>
                     </td>
                     <td className="p-4 text-slate-600 text-sm">{log.details}</td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const Layout = ({ children }: { children?: React.ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:hidden shrink-0">
             <div className="flex items-center">
                <Zap className="text-pea-purple w-6 h-6 mr-2 fill-current" />
                <span className="font-bold text-lg text-slate-800">PEA FRTU</span>
             </div>
             <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600">
                <Menu />
             </button>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 md:p-6">
           {children}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/devices" element={<DevicesPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}
