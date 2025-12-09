import { FRTU, HistoryLog, INITIAL_FRTUS, FRTUStatus, ActionType } from '../types';

const STORAGE_KEY_FRTU = 'pea_frtu_data';
const STORAGE_KEY_LOGS = 'pea_frtu_logs';
const STORAGE_KEY_EMPLOYEES = 'pea_frtu_employees';

// Updated URL based on user request
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1rI_yoyNOLKhzmxt2jCWT-bKkcn14TPylfATAifKlIYI/edit?gid=0#gid=0'; 

// Mock Data for Employees (In real app, this comes from the Google Sheet)
const INITIAL_EMPLOYEES = [
  'นายสมชาย ใจดี',
  'นายวิชัย รักงาน',
  'นายสมศักดิ์ ช่างไฟ',
  'นางสาวมานี มีใจ',
  'นายชูใจ ใฝ่ดี'
];

// Helper to save logs
const saveLog = (log: HistoryLog) => {
  const currentLogs = storageService.getLogs();
  const newLogs = [log, ...currentLogs];
  localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(newLogs));
};

export const storageService = {
  getFRTUs: (): FRTU[] => {
    const data = localStorage.getItem(STORAGE_KEY_FRTU);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_FRTU, JSON.stringify(INITIAL_FRTUS));
      return INITIAL_FRTUS;
    }
    return JSON.parse(data);
  },

  getLogs: (): HistoryLog[] => {
    const data = localStorage.getItem(STORAGE_KEY_LOGS);
    return data ? JSON.parse(data) : [];
  },

  getEmployees: (): string[] => {
    const data = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
    if (!data) {
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(INITIAL_EMPLOYEES));
      return INITIAL_EMPLOYEES;
    }
    return JSON.parse(data);
  },

  saveFRTU: (frtu: FRTU, isNew: boolean, technicianName: string) => {
    const frtus = storageService.getFRTUs();
    let updatedFrtus;
    
    if (isNew) {
      updatedFrtus = [...frtus, frtu];
    } else {
      updatedFrtus = frtus.map(f => f.id === frtu.id ? frtu : f);
    }
    
    localStorage.setItem(STORAGE_KEY_FRTU, JSON.stringify(updatedFrtus));

    const log: HistoryLog = {
      id: Date.now().toString(),
      frtuId: frtu.id,
      frtuSerial: frtu.serialNumber,
      action: isNew ? ActionType.CREATE : ActionType.UPDATE,
      details: isNew ? `เพิ่มอุปกรณ์ใหม่ ${frtu.serialNumber}` : `แก้ไขข้อมูล ${frtu.serialNumber}`,
      officerName: technicianName,
      timestamp: new Date().toISOString()
    };
    saveLog(log);
  },

  deleteFRTU: (id: string, serial: string, technicianName: string) => {
    const frtus = storageService.getFRTUs();
    const updatedFrtus = frtus.filter(f => f.id !== id);
    localStorage.setItem(STORAGE_KEY_FRTU, JSON.stringify(updatedFrtus));

    const log: HistoryLog = {
      id: Date.now().toString(),
      frtuId: id,
      frtuSerial: serial,
      action: ActionType.DELETE,
      details: `ลบอุปกรณ์ ${serial}`,
      officerName: technicianName,
      timestamp: new Date().toISOString()
    };
    saveLog(log);
  },

  updateStatus: (id: string, status: FRTUStatus, technicianName: string) => {
    const frtus = storageService.getFRTUs();
    const target = frtus.find(f => f.id === id);
    if (!target) return;

    const oldStatus = target.status;
    const updatedFrtus = frtus.map(f => f.id === id ? { ...f, status } : f);
    localStorage.setItem(STORAGE_KEY_FRTU, JSON.stringify(updatedFrtus));

    const log: HistoryLog = {
      id: Date.now().toString(),
      frtuId: id,
      frtuSerial: target.serialNumber,
      action: ActionType.STATUS_CHANGE,
      details: `เปลี่ยนสถานะจาก ${oldStatus} เป็น ${status}`,
      officerName: technicianName,
      timestamp: new Date().toISOString()
    };
    saveLog(log);
  },

  getGoogleSheetUrl: () => GOOGLE_SHEET_URL,

  exportToCSV: async (): Promise<string | null> => {
    const logs = storageService.getLogs();
    if (logs.length === 0) return null;

    const headers = ['Date', 'Officer', 'Serial', 'Action', 'Details'];
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        const date = new Date(log.timestamp).toLocaleString('th-TH').replace(',', '');
        // Escape quotes to prevent CSV breakage
        const details = log.details.replace(/"/g, '""'); 
        return `"${date}","${log.officerName}","${log.frtuSerial}","${log.action}","${details}"`;
      })
    ].join('\n');

    // Add BOM for Excel compatibility with UTF-8
    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  }
};