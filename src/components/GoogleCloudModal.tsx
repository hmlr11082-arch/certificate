import React from 'react';
import {
  Cloud,
  CheckCircle2,
  HardDrive,
  Download,
  Upload,
  X,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  FolderDown,
} from 'lucide-react';
import { CertificateData } from '../types';

interface GoogleCloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: CertificateData[];
  isOnline: boolean;
  lastSyncTime: Date | null;
  onRefresh: () => void;
  onImportSuccess: (imported: CertificateData[]) => void;
}

export const GoogleCloudModal: React.FC<GoogleCloudModalProps> = ({
  isOpen,
  onClose,
  certificates,
  isOnline,
  lastSyncTime,
  onRefresh,
  onImportSuccess,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Export JSON backup for Google Drive
  const handleExportBackup = () => {
    const backupData = {
      hospitalName: 'โรงพยาบาลท่าคันโท',
      account: 'hmlr11082@gmail.com',
      cloudProject: 'nifty-handbook-pt3g1',
      exportDate: new Date().toISOString(),
      exportDateThai: new Date().toLocaleDateString('th-TH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      totalCount: certificates.length,
      certificates,
    };

    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute(
      'download',
      `ใบประกาศ_รพ_ท่าคันโท_GoogleDrive_Backup_${new Date()
        .toISOString()
        .slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import JSON backup
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const raw = JSON.parse(event.target?.result as string);
        let list: CertificateData[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.certificates)) {
          list = raw.certificates;
        }

        if (list.length > 0) {
          if (
            confirm(
              `พบข้อมูล ${list.length} รายชื่อในไฟล์สำรอง\nต้องการนำเข้าข้อมูลลงระบบและบันทึกลง Google Cloud หรือไม่?`
            )
          ) {
            onImportSuccess(list);
            onClose();
          }
        } else {
          alert('ไม่พบรายการข้อมูลใบประกาศในไฟล์ JSON ที่เลือก');
        }
      } catch (err) {
        alert('เกิดข้อผิดพลาด: ไม่สามารถอ่านไฟล์ JSON ได้ กรุณาตรวจสอบไฟล์');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-sarabun animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-xs">
              <Cloud className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-prompt font-bold text-base leading-snug">
                ศูนย์ข้อมูล Google Cloud & Google Drive
              </h3>
              <p className="text-xs text-emerald-200/90 font-sarabun mt-0.5">
                บัญชีผู้ใช้: <span className="font-semibold text-white">hmlr11082@gmail.com</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Cloud Status Card */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-950 flex items-center gap-1.5 font-prompt">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                สถานะการจัดเก็บบน Google Cloud
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-200 text-emerald-900">
                {isOnline ? 'ออนไลน์ เชื่อมต่อแล้ว' : 'กำลังเชื่อมต่อ'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 text-xs text-slate-700">
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-400 block font-prompt">ผู้ครอบครองระบบ</span>
                <span className="font-semibold text-slate-800 text-[11px] truncate block">
                  hmlr11082@gmail.com
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-400 block font-prompt">GCP Project</span>
                <span className="font-mono text-emerald-800 font-semibold text-[11px] truncate block">
                  nifty-handbook-pt3g1
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-400 block font-prompt">ฐานข้อมูล Google Cloud</span>
                <span className="font-semibold text-slate-800 text-[11px] truncate block">
                  Cloud Firestore
                </span>
              </div>
              <div className="bg-white/80 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[10px] text-slate-400 block font-prompt">การซิงค์ข้อมูล</span>
                <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  เรียลไทม์ (ทุกอุปกรณ์)
                </span>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-emerald-100/60">
              <span>จำนวนรายชื่อบน Cloud: <strong className="text-emerald-800 font-prompt">{certificates.length}</strong> ฉบับ</span>
              <span className="text-slate-400">
                ซิงค์ล่าสุด:{' '}
                {lastSyncTime
                  ? lastSyncTime.toLocaleTimeString('th-TH', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })
                  : 'เริ่มต้น'}
              </span>
            </div>
          </div>

          {/* Explanation Section */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-2">
            <h4 className="font-bold text-slate-800 font-prompt flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              การทำงานร่วมกันผ่านเครือข่ายส่วนกลาง
            </h4>
            <p className="leading-relaxed">
              ข้อมูลรายชื่อและรายละเอียดใบประกาศทั้งหมดถูกจัดเก็บไว้บน{' '}
              <strong className="text-slate-900 font-semibold">Google Cloud Firestore</strong>{' '}
              ที่ผูกไว้กับบัญชีของคุณ เมื่อเจ้าหน้าที่ในโรงพยาบาลเพิ่ม ลบ หรือแก้ไขรายชื่อจากอุปกรณ์เครื่องใดก็ตาม
              ระบบจะอัปเดตและแสดงผลให้ทุกอุปกรณ์เห็นตรงกันแบบเรียลไทม์ทันที
            </p>
          </div>

          {/* Google Drive Backup & Restore Section */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-50 text-blue-700">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-prompt font-bold text-xs text-slate-900">
                  สำรองข้อมูลสำหรับ Google Drive
                </h4>
                <p className="text-[11px] text-slate-500">
                  ดาวน์โหลดชุดข้อมูลเป็นไฟล์ JSON เพื่ออัปโหลดเก็บไว้ใน Google Drive ของท่าน
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-colors shadow-2xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>สำรองข้อมูล JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>นำเข้าไฟล์สำรอง</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onRefresh}
            className="text-xs text-emerald-700 hover:text-emerald-900 font-medium flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>ซิงค์ข้อมูลทันที</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
