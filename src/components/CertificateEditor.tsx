import React, { useState } from 'react';
import { CertificateData } from '../types';
import { X, Sliders, CheckCircle2, RotateCcw, Calendar, Check } from 'lucide-react';
import { formatThaiCertificateDate, parseThaiDateToIso } from '../utils/dateUtils';

interface CertificateEditorProps {
  cert: CertificateData;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updated: CertificateData) => void;
  onReset: () => void;
  onApplyDateToAll?: (dateText: string, isoDate: string) => void;
}

export const CertificateEditor: React.FC<CertificateEditorProps> = ({
  cert,
  isOpen,
  onClose,
  onUpdate,
  onReset,
  onApplyDateToAll,
}) => {
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(
    cert.issuedDateIso || parseThaiDateToIso(cert.issuedDateText)
  );
  const [useThaiDigits, setUseThaiDigits] = useState<boolean>(cert.useThaiDigits ?? true);
  const [appliedAllSuccess, setAppliedAllSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (field: keyof CertificateData, value: any) => {
    onUpdate({
      ...cert,
      [field]: value,
    });
  };

  const handleDateChange = (newIso: string, thaiDigits = useThaiDigits) => {
    setSelectedIsoDate(newIso);
    const newFormattedDate = formatThaiCertificateDate(newIso, thaiDigits);
    onUpdate({
      ...cert,
      issuedDateIso: newIso,
      useThaiDigits: thaiDigits,
      issuedDateText: newFormattedDate,
    });
  };

  const handleToggleDigits = (thaiDigits: boolean) => {
    setUseThaiDigits(thaiDigits);
    handleDateChange(selectedIsoDate, thaiDigits);
  };

  const handleApplyToAllCertificates = () => {
    const formatted = formatThaiCertificateDate(selectedIsoDate, useThaiDigits);
    if (onApplyDateToAll) {
      onApplyDateToAll(formatted, selectedIsoDate);
      setAppliedAllSuccess(true);
      setTimeout(() => setAppliedAllSuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col border-l border-slate-200">
      {/* Drawer Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-emerald-700" />
          <h3 className="font-prompt font-semibold text-slate-800 text-base">
            ปรับแต่งข้อมูลใบประกาศ
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          title="ปิดหน้าต่าง"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Form Body */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5 text-sm">
        {/* Recipient Information */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            ข้อมูลผู้ได้รับรางวัล
          </label>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ชื่อ - สกุล ผู้ได้รับรางวัล
            </label>
            <input
              type="text"
              value={cert.recipientName}
              onChange={(e) => handleChange('recipientName', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun text-base font-semibold"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ตำแหน่ง
            </label>
            <input
              type="text"
              value={cert.recipientPosition}
              onChange={(e) => handleChange('recipientPosition', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              กลุ่มงาน / หน่วยงาน
            </label>
            <input
              type="text"
              value={cert.department || ''}
              onChange={(e) => handleChange('department', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun"
            />
          </div>
        </div>

        {/* Award Details */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            รายละเอียดรางวัล & เลขที่ใบประกาศ
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                เลขที่ใบประกาศ
              </label>
              <input
                type="text"
                value={cert.certNumber}
                onChange={(e) => handleChange('certNumber', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                ปีงบประมาณ (พ.ศ.)
              </label>
              <input
                type="text"
                value={cert.fiscalYear}
                onChange={(e) => handleChange('fiscalYear', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ชื่อรางวัลหลัก
            </label>
            <input
              type="text"
              value={cert.awardTitle}
              onChange={(e) => handleChange('awardTitle', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              สาขา / ด้าน / หน่วยงาน
            </label>
            <input
              type="text"
              value={cert.awardCategorySubtitle || ''}
              onChange={(e) => handleChange('awardCategorySubtitle', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              ข้อความยกย่องเชิดชูเกียรติ
            </label>
            <textarea
              rows={3}
              value={cert.descriptionText}
              onChange={(e) => handleChange('descriptionText', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 font-sarabun text-xs leading-relaxed"
            />
          </div>

          {/* International Calendar Date Picker Section */}
          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-emerald-900 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-emerald-700" />
                <span>เลือกวันที่มอบ (ระบบปฏิทินสากล)</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-sarabun bg-emerald-100/70 px-2 py-0.5 rounded-full">
                แปลงเป็น พ.ศ. อัตโนมัติ
              </span>
            </div>

            {/* Standard Calendar Date Picker (YYYY-MM-DD) */}
            <div>
              <input
                type="date"
                value={selectedIsoDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun text-sm shadow-2xs cursor-pointer"
              />
            </div>

            {/* Number Style Toggle */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-600 font-medium">รูปแบบตัวเลข:</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleToggleDigits(true)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    useThaiDigits
                      ? 'bg-emerald-700 text-white font-medium shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  เลขไทย (๒๕๖๙)
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleDigits(false)}
                  className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                    !useThaiDigits
                      ? 'bg-emerald-700 text-white font-medium shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  เลขอารบิก (2569)
                </button>
              </div>
            </div>

            {/* Formatted Date Output Preview */}
            <div className="pt-1">
              <label className="block text-[11px] text-slate-600 mb-1">
                ข้อความวันที่ที่จะพิมพ์บนใบประกาศ:
              </label>
              <input
                type="text"
                value={cert.issuedDateText}
                onChange={(e) => handleChange('issuedDateText', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 text-xs font-sarabun font-medium"
              />
            </div>

            {/* Apply to All Certificates Button */}
            {onApplyDateToAll && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleApplyToAllCertificates}
                  className="w-full py-1.5 px-3 text-xs font-medium text-emerald-800 bg-white border border-emerald-300 rounded-lg hover:bg-emerald-100/50 transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  {appliedAllSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-semibold">อัปเดตทุกใบประกาศสำเร็จแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      <span>นำวันที่นี้ไปใช้กับทุกใบประกาศ</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Signatures Settings */}
        <div className="pt-3 border-t border-slate-200 space-y-4">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            ผู้ลงนาม (๒ ลายเซ็นตามที่กำหนด)
          </label>

          {/* Left Signatory */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-emerald-800 block">
              ผู้ลงนามฝั่งซ้าย
            </span>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={cert.leftSignatoryName}
                onChange={(e) => handleChange('leftSignatoryName', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 text-xs font-sarabun"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">ตำแหน่ง</label>
              <input
                type="text"
                value={cert.leftSignatoryPosition}
                onChange={(e) => handleChange('leftSignatoryPosition', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 text-xs font-sarabun"
              />
            </div>
          </div>

          {/* Right Signatory */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
            <span className="text-xs font-semibold text-blue-900 block">
              ผู้ลงนามฝั่งขวา
            </span>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={cert.rightSignatoryName}
                onChange={(e) => handleChange('rightSignatoryName', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 text-xs font-sarabun"
              />
            </div>
            <div>
              <label className="block text-[11px] text-slate-600 mb-0.5">ตำแหน่ง</label>
              <input
                type="text"
                value={cert.rightSignatoryPosition}
                onChange={(e) => handleChange('rightSignatoryPosition', e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white text-slate-900 text-xs font-sarabun"
              />
            </div>
          </div>

          {/* Signature Rendering Option */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">
              รูปแบบพื้นที่ลงนาม
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange('signatureStyle', 'line-only')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-center ${
                  cert.signatureStyle === 'line-only'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500/30'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                ✍️ ว่างไว้เซ็นจริงด้วยปากกา
              </button>
              <button
                type="button"
                onClick={() => handleChange('signatureStyle', 'digital')}
                className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors text-center ${
                  cert.signatureStyle === 'digital'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold ring-1 ring-emerald-500/30'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                มีลายเซ็นจำลองดิจิทัล
              </button>
            </div>
          </div>
        </div>

        {/* Visual Theme and Accents */}
        <div className="pt-3 border-t border-slate-200 space-y-3">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            เฉดสีพาสเทล & องค์ประกอบ
          </label>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleChange('theme', 'pastel-green-blue')}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                cert.theme === 'pastel-green-blue'
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="h-4 rounded bg-gradient-to-r from-emerald-200 via-white to-blue-200 mb-1" />
              <span className="text-[11px] font-medium text-slate-700 block">
                เขียว-น้ำเงิน
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleChange('theme', 'pastel-emerald-navy')}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                cert.theme === 'pastel-emerald-navy'
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="h-4 rounded bg-gradient-to-r from-emerald-300 via-white to-sky-300 mb-1" />
              <span className="text-[11px] font-medium text-slate-700 block">
                เอเมอรัลด์-เนวี่
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleChange('theme', 'pastel-mint-cyan')}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                cert.theme === 'pastel-mint-cyan'
                  ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/50'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="h-4 rounded bg-gradient-to-r from-teal-200 via-white to-blue-300 mb-1" />
              <span className="text-[11px] font-medium text-slate-700 block">
                มิ้นต์-มารีน
              </span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="text-xs text-slate-700 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={cert.showSeal}
                onChange={(e) => handleChange('showSeal', e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>แสดงตราประทับเกียรติยศ (Seal)</span>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-700 cursor-pointer flex items-center gap-2">
              <input
                type="checkbox"
                checked={cert.showWatermark}
                onChange={(e) => handleChange('showWatermark', e.target.checked)}
                className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4"
              />
              <span>แสดงลายน้ำโลโก้โปร่งแสงกลางใบประกาศ</span>
            </label>
          </div>
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onReset}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>รีเซ็ตค่าเดิม</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-xs"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>บันทึกและปิด</span>
        </button>
      </div>
    </div>
  );
};
