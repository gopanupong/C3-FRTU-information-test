
export enum FRTUStatus {
  ONLINE = 'Online',
  INITIALIZING = 'Initializing',
  CONNECTING = 'Connecting',
  OFFLINE = 'Offline'
}

export enum ActionType {
  CREATE = 'เพิ่มอุปกรณ์',
  UPDATE = 'แก้ไขข้อมูล',
  DELETE = 'ลบอุปกรณ์',
  STATUS_CHANGE = 'เปลี่ยนสถานะ',
  TEST = 'ทดสอบสัญญาณ'
}

export interface FRTU {
  id: string;
  serialNumber: string;
  substation: string; // สถานีไฟฟ้า
  feeder: string; // ฟีดเดอร์
  location: string; // พิกัดหรือสถานที่ติดตั้ง
  ipAddress: string;
  status: FRTUStatus;
  commandCode: string; // รหัสสั่งการ
  eventDetails?: string; // เหตุการณ์ที่ดำเนินงาน (Free text)
  phosData?: string; // ข้อมูล ของ ผอส.กสฟ.
  phboData?: string; // ข้อมูล ของ ผบอ.กบษ.
  lastMaintenance: string;
  technician: string; // เจ้าหน้าที่รับผิดชอบ
}

export interface HistoryLog {
  id: string;
  frtuId: string;
  frtuSerial: string;
  action: ActionType;
  details: string;
  officerName: string; // ชื่อเจ้าหน้าที่ผู้บันทึก
  timestamp: string;
}

// Mock Data for initial setup
export const INITIAL_FRTUS: FRTU[] = [
  {
    id: '1',
    serialNumber: 'FRTU-PEA-001',
    substation: 'สถานีไฟฟ้าเชียงใหม่ 1',
    feeder: 'F01',
    location: 'หน้า รร. ยุพราช',
    ipAddress: '192.168.1.101',
    status: FRTUStatus.ONLINE,
    commandCode: 'CMD-001',
    eventDetails: 'ตรวจสอบประจำปี แบตเตอรี่ปกติ',
    phosData: '-',
    phboData: '-',
    lastMaintenance: '2023-10-20',
    technician: 'นายสมชาย ใจดี'
  },
  {
    id: '2',
    serialNumber: 'FRTU-PEA-002',
    substation: 'สถานีไฟฟ้าเชียงใหม่ 1',
    feeder: 'F02',
    location: 'แยกภูคำ',
    ipAddress: '192.168.1.102',
    status: FRTUStatus.OFFLINE,
    commandCode: 'CMD-002',
    eventDetails: 'รอเปลี่ยนอุปกรณ์สื่อสาร',
    phosData: 'แจ้งซ่อมแล้ว',
    phboData: '-',
    lastMaintenance: '2023-11-05',
    technician: 'นายวิชัย รักงาน'
  },
  {
    id: '3',
    serialNumber: 'FRTU-PEA-003',
    substation: 'สถานีไฟฟ้าแม่ริม',
    feeder: 'F05',
    location: 'หน้า อบต. ดอนแก้ว',
    ipAddress: '192.168.2.15',
    status: FRTUStatus.INITIALIZING,
    commandCode: 'CMD-003',
    eventDetails: 'กำลังปรับปรุงเฟิร์มแวร์',
    phosData: '-',
    phboData: 'รออนุมัติ',
    lastMaintenance: '2024-05-20',
    technician: 'นายสมศักดิ์ ช่างไฟ'
  }
];
