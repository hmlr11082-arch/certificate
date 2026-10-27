import React, { useState } from 'react';
import { CertificateData } from '../types';
import { UserPlus, X, Check, Award, Calendar } from 'lucide-react';
import { formatThaiCertificateDate } from '../utils/dateUtils';

interface AddRecipientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (newCert: CertificateData) => void;
  existingCount: number;
}

export const AddRecipientModal: React.FC<AddRecipientModalProps> = ({
  isOpen,
  onClose,
  onAdd,
  existingCount,
}) => {
  const nextOrder = existingCount + 1;
  const thaiNumber = String(nextOrder).replace(/\d/g, (d) => '๐๑๒๓๔๕๖๗๘๙'[parseInt(d, 10)]);

  const [recipientName, setRecipientName] = useState('');
  const [recipientPosition, setRecipientPosition] = useState('');
  const [department, setDepartment] = useState('กลุ่มงานการพยาบาล');
  const [awardTitle, setAwardTitle] = useState('รางวัลบุคลากรสาธารณสุขปฏิบัติงานดีเด่น');
  const [awardCategorySubtitle, setAwardCategorySubtitle] = useState('');
  const [certNumber, setCertNumber] = useState(`ทคท. ${thaiNumber}/๒๕๖๙`);
  const [issuedDateIso, setIssuedDateIso] = useState('2026-10-27');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) {
      setError('กรุณาระบุชื่อ-นามสกุลของผู้ได้รับรางวัล');
      return;
    }

    const newCert: CertificateData = {
      id: `cert-${Date.now()}`,
      orderNumber: nextOrder,
      certNumber: certNumber.trim() || `ทคท. ${thaiNumber}/๒๕๖๙`,
      awardTitle: awardTitle.trim() || 'รางวัลบุคลากรสาธารณสุขปฏิบัติงานดีเด่น',
      awardCategorySubtitle: awardCategorySubtitle.trim() || 'สาขาปฏิบัติงานทั่วไป',
      recipientName: recipientName.trim(),
      recipientPosition: recipientPosition.trim() || 'บุคลากรสาธารณสุข',
      department: department.trim(),
      hospitalName: 'โรงพยาบาลท่าคันโท',
      provinceText: 'อำเภอท่าคันโท จังหวัดกาฬสินธุ์',
      fiscalYear: '๒๕๖๙',
      descriptionText: 'เป็นผู้มีความวิริยะอุตสาหะ อุทิศตน ปฏิบัติหน้าที่ด้วยความเสียสละ และมีผลการปฏิบัติงานดีเด่นเป็นที่ประจักษ์ สมควรได้รับการยกย่องเชิดชูเกียรติสืบไป',
      issuedDateText: formatThaiCertificateDate(issuedDateIso, true),
      issuedDateIso: issuedDateIso,
      useThaiDigits: true,
      leftSignatoryName: 'พนมพร พลเสนา',
      leftSignatoryPosition: 'พยาบาลชำนาญการพิเศษ',
      rightSignatoryName: 'นพ.พุทธรักษ์ ดีสิน',
      rightSignatoryPosition: 'ผู้อำนวยการ โรงพยาบาลท่าคันโท',
      theme: 'pastel-green-blue',
      orientation: 'landscape',
      showSeal: true,
      showWatermark: true,
      signatureStyle: 'line-only', // Blank space for real pen signing
    };

    onAdd(newCert);
    // Reset form
    setRecipientName('');
    setRecipientPosition('');
    setAwardCategorySubtitle('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-blue-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 text-white rounded-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-prompt font-semibold text-slate-800 text-base">
                เพิ่มรายชื่อผู้ได้รับรางวัลใหม่
              </h3>
              <p className="text-xs text-slate-500 font-sarabun">
                ลำดับที่ #{nextOrder} • โรงพยาบาลท่าคันโท
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg font-sarabun">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ชื่อ - สกุล ผู้ได้รับรางวัล <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="เช่น นางสาวพรสิริ บุญรักษา"
              value={recipientName}
              onChange={(e) => {
                setRecipientName(e.target.value);
                if (error) setError('');
              }}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ตำแหน่ง
              </label>
              <input
                type="text"
                placeholder="เช่น พยาบาลวิชาชีพปฏิบัติการ"
                value={recipientPosition}
                onChange={(e) => setRecipientPosition(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                กลุ่มงาน / แผนก
              </label>
              <input
                type="text"
                placeholder="เช่น กลุ่มงานการพยาบาล"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              ด้าน / สาขารางวัล
            </label>
            <input
              type="text"
              placeholder="เช่น ด้านการพยาบาลผู้ป่วยพิเศษ หรือ หน่วยงานยานพาหนะ"
              value={awardCategorySubtitle}
              onChange={(e) => setAwardCategorySubtitle(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                ชื่อรางวัลหลัก
              </label>
              <input
                type="text"
                value={awardTitle}
                onChange={(e) => setAwardTitle(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                เลขที่ใบประกาศ
              </label>
              <input
                type="text"
                value={certNumber}
                onChange={(e) => setCertNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                <span>วันที่มอบ (ระบบปฏิทินสากล)</span>
              </span>
              <span className="text-[11px] font-normal text-emerald-700">
                {formatThaiCertificateDate(issuedDateIso, true)}
              </span>
            </label>
            <input
              type="date"
              value={issuedDateIso}
              onChange={(e) => setIssuedDateIso(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-sm cursor-pointer"
            />
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/60 text-xs text-emerald-900 flex items-start gap-2 font-sarabun">
            <Award className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              ใบประกาศใหม่จะถูกสร้างในโทนสีเขียว-ขาว-น้ำเงิน พาสเทล ขนาด A4 พร้อมโลโก้โรงพยาบาลท่าคันโท และเว้นช่องลงนามจริงด้วยปากกาให้อัตโนมัติ
            </span>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>บันทึกและสร้างใบประกาศ</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
