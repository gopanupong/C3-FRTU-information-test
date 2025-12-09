import { FRTU, HistoryLog, INITIAL_FRTUS, FRTUStatus, ActionType } from '../types';

const STORAGE_KEY_FRTU = 'pea_frtu_data';
const STORAGE_KEY_LOGS = 'pea_frtu_logs';
const STORAGE_KEY_EMPLOYEES = 'pea_frtu_employees';

// Main Database Sheet
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1rI_yoyNOLKhzmxt2jCWT-bKkcn14TPylfATAifKlIYI/edit?gid=0#gid=0'; 

// Employee List Sheet (GID: 277093410)
const GOOGLE_SHEET_EMPLOYEES_URL = 'https://docs.google.com/spreadsheets/d/1rI_yoyNOLKhzmxt2jCWT-bKkcn14TPylfATAifKlIYI/edit?gid=277093410#gid=277093410';

// Mock Data for Employees (Fallback)
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
  
  // Fire and forget: Log to Google Sheet via API
  fetch('/api/log-to-sheet', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(log)
  }).catch(err => console.error('Failed to log to sheet:', err));
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

  getEmployees: async (): Promise<string[]> => {
    try {
      // Try to fetch from API
      const response = await fetch('/api/get-employees');
      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data) && data.length > 0) {
          // Cache the result in local storage
          localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(data));
          return data;
        }
      }
    } catch (error) {
      console.warn('Failed to fetch employees from API, using cached/mock data', error);
    }

    // Fallback to local storage or initial data
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

    // Construct log with extra data for sheet
    const logDetails: any = {
      id: Date.now().toString(),
      frtuId: frtu.id,
      frtuSerial: frtu.serialNumber,
      action: isNew ? ActionType.CREATE : ActionType.UPDATE,
      details: isNew ? `เพิ่มอุปกรณ์ใหม่ ${frtu.serialNumber}` : `แก้ไขข้อมูล ${frtu.serialNumber}`,
      officerName: technicianName,
      timestamp: new Date().toISOString(),
      // Extra fields for full logging
      substation: frtu.substation,
      feeder: frtu.feeder,
      location: frtu.location,
      eventDetails: frtu.eventDetails,
      status: frtu.status,
      phosData: frtu.phosData,
      phboData: frtu.phboData
    };
    
    saveLog(logDetails);
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
  getEmployeeSheetUrl: () => GOOGLE_SHEET_EMPLOYEES_URL,

  exportToCSV: async (): Promise<string | null> => {
    const logs = storageService.getLogs();
    if (logs.length === 0) return null;

    // Updated headers to include PHOS and PHBO
    const headers = ['Date', 'Officer', 'Serial', 'Action', 'Details', 'PHOS Data', 'PHBO Data'];
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => {
        // Type assertion for potential extra fields in logs stored in local storage
        const l = log as any;
        const date = new Date(l.timestamp).toLocaleString('th-TH').replace(',', '');
        const details = (l.details || '').replace(/"/g, '""'); 
        const phos = (l.phosData || '').replace(/"/g, '""');
        const phbo = (l.phboData || '').replace(/"/g, '""');
        return `"${date}","${l.officerName}","${l.frtuSerial}","${l.action}","${details}","${phos}","${phbo}"`;
      })
    ].join('\n');

    const bom = '\uFEFF';
    const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
    return URL.createObjectURL(blob);
  }
};