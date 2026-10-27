import React from 'react';
import { CertificateData } from '../types';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  cert: CertificateData | null;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  cert,
}) => {
  if (!isOpen || !cert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 flex items-start gap-3.5 bg-red-50/50 border-b border-red-100">
          <div className="p-2.5 bg-red-100 text-red-600 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <h3 className="font-prompt font-semibold text-slate-900 text-base">
              ยืนยันการลบรายชื่อผู้ได้รับรางวัล
            </h3>
            <p className="text-xs text-slate-500 font-sarabun mt-0.5">
              คุณต้องการลบใบประกาศฉบับนี้ออกจากระบบใช่หรือไม่?
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="p-5 space-y-3 font-sarabun">
          <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
            <div className="flex items-center justify-between text-slate-500">
              <span>ลำดับที่ #{cert.orderNumber}</span>
              <span className="font-semibold text-emerald-800">{cert.certNumber}</span>
            </div>
            <div className="font-bold text-sm text-slate-900">
              {cert.recipientName}
            </div>
            <div className="text-slate-600">
              ตำแหน่ง: {cert.recipientPosition}
            </div>
            <div className="text-emerald-700 font-medium">
              รางวัล: {cert.awardCategorySubtitle || cert.awardTitle}
            </div>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed">
            * หลังจากลบแล้ว ใบประกาศฉบับนี้จะถูกนำออกจากรายการดาวน์โหลดทั้งหมด
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-xs transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>ยืนยันการลบ</span>
          </button>
        </div>
      </div>
    </div>
  );
};
