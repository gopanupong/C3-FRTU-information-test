import React, { useState, useEffect } from 'react';
import { FRTU, FRTUStatus } from '../types';
import { X, Save, Users } from 'lucide-react';
import { storageService } from '../services/storageService';

interface DeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (frtu: FRTU) => void;
  initialData?: FRTU | null;
}

const emptyFRTU: FRTU = {
  id: '',
  serialNumber: '',
  substation: '',
  feeder: '',
  location: '',
  ipAddress: '',
  status: FRTUStatus.ONLINE,
  commandCode: '',
  eventDetails: '',
  phosData: '',
  phboData: '',
  lastMaintenance: new Date().toISOString().split('T')[0],
  technician: ''
};

export const DeviceModal: React.FC<DeviceModalProps> = ({ isOpen, onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<FRTU>(emptyFRTU);
  const [employees, setEmployees] = useState<string[]>([]);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || { ...emptyFRTU, id: Date.now().toString() });
      
      // Fetch employees list asynchronously
      const fetchEmployees = async () => {
        setIsLoadingEmployees(true);
        try {
          const empList = await storageService.getEmployees();
          setEmployees(empList);
        } catch (err) {
          console.error("Error loading employees", err);
        } finally {
          setIsLoadingEmployees(false);
        }
      };
      
      fetchEmployees();
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const openEmployeeSheet = () => {
    window.open(storageService.getEmployeeSheetUrl(), '_blank');
  };

  // Base input class with gray background
  const inputClass = "w-full bg-slate-100 border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-pea-purple focus:border-transparent outline-none focus:bg-white transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="bg-pea-purple px-6 py-4 flex justify-between items-center text-white">
          <h2 className="text-lg font-bold">{initialData ? 'แก้ไขข้อมูล FRTU' : 'ลงข้อมูลในการทดสอบอุปกรณ์ทุกครั้ง ที่มีการทดสอบ'}</h2>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Row 1: Remote Unit Name & Command Code */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Remote Unit Name</label>
              <input required type="text" className={inputClass}
                value={formData.serialNumber} onChange={e => setFormData({...formData, serialNumber: e.target.value})} placeholder="เช่น C3-RCS-0313" />
            </div>
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสสั่งการ</label>
              <input type="text" className={inputClass}
                value={formData.commandCode || ''} onChange={e => setFormData({...formData, commandCode: e.target.value})} placeholder="ระบุรหัสสั่งการ" />
            </div>

            {/* Row 2: IP Address & Substation */}
             <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">IP Address</label>
              <input type="text" className={inputClass}
                value={formData.ipAddress} onChange={e => setFormData({...formData, ipAddress: e.target.value})} placeholder="192.168.x.x" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">สถานีไฟฟ้า (Substation)</label>
              <input required type="text" className={inputClass}
                value={formData.substation} onChange={e => setFormData({...formData, substation: e.target.value})} />
            </div>

            {/* Row 3: Feeder & Location */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ฟีดเดอร์ (Feeder)</label>
              <input required type="text" className={inputClass}
                value={formData.feeder} onChange={e => setFormData({...formData, feeder: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">สถานที่ติดตั้ง (Location)</label>
              <input required type="text" className={inputClass}
                value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
            </div>

            {/* Row 4: Event Details (Textarea) */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">เหตุการณ์ที่ดำเนินงาน</label>
              <textarea 
                className={`${inputClass} min-h-[80px]`}
                value={formData.eventDetails || ''} 
                onChange={e => setFormData({...formData, eventDetails: e.target.value})}
                placeholder="ระบุรายละเอียดการปฏิบัติงาน..."
              />
            </div>

            {/* Row 5: PHOS & PHBO (After Event Details) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ข้อมูล ของ ผอส.กสฟ.</label>
              <input type="text" className={inputClass}
                value={formData.phosData || ''} onChange={e => setFormData({...formData, phosData: e.target.value})} placeholder="ระบุข้อมูล..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">ข้อมูล ของ ผบอ.กบษ.</label>
              <input type="text" className={inputClass}
                value={formData.phboData || ''} onChange={e => setFormData({...formData, phboData: e.target.value})} placeholder="ระบุข้อมูล..." />
            </div>

            {/* Row 6: Status & Technician */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ FRTU (หลังจากทดสอบเสร็จ)</label>
              <select className={inputClass}
                value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as FRTUStatus})}>
                {Object.values(FRTUStatus).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            
            {/* Technician Dropdown */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-slate-700">เจ้าหน้าที่ผู้ทดสอบ</label>
                <button 
                  type="button" 
                  onClick={openEmployeeSheet}
                  className="text-[10px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                  title="ไปที่ Google Sheet เพื่อแก้ไขรายชื่อพนักงาน"
                >
                  <Users size={12} /> จัดการรายชื่อ
                </button>
              </div>
              <select 
                required 
                className={inputClass}
                value={formData.technician} 
                onChange={e => setFormData({...formData, technician: e.target.value})}
                disabled={isLoadingEmployees}
              >
                <option value="">{isLoadingEmployees ? 'กำลังโหลดรายชื่อ...' : '-- กรุณาเลือกรายชื่อ --'}</option>
                {employees.map((emp, index) => (
                  <option key={index} value={emp}>{emp}</option>
                ))}
              </select>
            </div>

             {/* Row 7: Last Maintenance */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ทดสอบอุปกรณ์</label>
              <input required type="date" className={inputClass}
                value={formData.lastMaintenance} onChange={e => setFormData({...formData, lastMaintenance: e.target.value})} />
            </div>
          </div>

          <div className="flex justify-end pt-4 gap-3 border-t border-slate-100 mt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition font-medium">ยกเลิก</button>
            <button type="submit" className="px-4 py-2 bg-pea-purple text-white rounded-lg hover:bg-purple-800 transition flex items-center gap-2 shadow-md shadow-purple-200 font-medium">
              <Save size={18} /> บันทึกข้อมูล
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};