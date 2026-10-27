import React, { useState } from 'react';
import { CertificateData } from '../types';
import { CertificateCanvas } from './CertificateCanvas';
import { captureCertificateDataUrl, sanitizeFilename } from '../utils/exportUtils';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { FileText, Archive, Check, Loader2, X, Download } from 'lucide-react';

interface BatchExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  certificates: CertificateData[];
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({
  isOpen,
  onClose,
  certificates,
}) => {
  const [exportingIndex, setExportingIndex] = useState<number>(-1);
  const [progress, setProgress] = useState({ current: 0, total: certificates.length });
  const [statusMessage, setStatusMessage] = useState('');
  const [exportSuccess, setExportSuccess] = useState(false);

  if (!isOpen) return null;

  const isExporting = exportingIndex >= 0;
  const currentCert = isExporting ? certificates[exportingIndex] : null;

  const handleExportPDF = async () => {
    setExportSuccess(false);
    setStatusMessage('กำลังเตรียมเรนเดอร์ใบประกาศขนาด A4...');

    const pdf = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    try {
      for (let i = 0; i < certificates.length; i++) {
        setExportingIndex(i);
        const cert = certificates[i];
        setProgress({ current: i + 1, total: certificates.length });
        setStatusMessage(`กำลังจัดทำใบประกาศของ: ${cert.recipientName} (${i + 1}/${certificates.length})`);

        // Wait for React to update DOM and fonts to settle
        await new Promise((resolve) => setTimeout(resolve, 160));
        if (document.fonts) {
          await document.fonts.ready;
        }

        const stageEl = document.getElementById('batch-render-canvas');
        if (stageEl) {
          const imgData = await captureCertificateDataUrl(stageEl, 'jpeg', 2.4);
          if (imgData) {
            if (i > 0) pdf.addPage('a4', 'l');
            pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
          }
        }
      }

      pdf.save('รวมใบประกาศ_บุคลากรดีเด่น_รพ_ท่าคันโท_๒๕๖๙.pdf');
      setExportSuccess(true);
      setStatusMessage('สร้างไฟล์ PDF รวมทุกรายชื่อสำเร็จเรียบร้อยแล้ว!');
    } catch (err) {
      console.error('Error in batch PDF export:', err);
      setStatusMessage('เกิดข้อผิดพลาดในการสร้างไฟล์ PDF โปรดลองใหม่อีกครั้ง');
    } finally {
      setExportingIndex(-1);
    }
  };

  const handleExportZip = async () => {
    setExportSuccess(false);
    setStatusMessage('กำลังเตรียมเรนเดอร์ภาพความละเอียดสูง...');

    const zip = new JSZip();
    const folder = zip.folder('ใบประกาศ_รพ_ท่าคันโท_2569');

    try {
      for (let i = 0; i < certificates.length; i++) {
        setExportingIndex(i);
        const cert = certificates[i];
        setProgress({ current: i + 1, total: certificates.length });
        setStatusMessage(`กำลังเรนเดอร์ภาพของ: ${cert.recipientName} (${i + 1}/${certificates.length})`);

        // Wait for React to update DOM and fonts to settle
        await new Promise((resolve) => setTimeout(resolve, 160));
        if (document.fonts) {
          await document.fonts.ready;
        }

        const stageEl = document.getElementById('batch-render-canvas');
        if (stageEl) {
          const dataUrl = await captureCertificateDataUrl(stageEl, 'png', 2.4);
          if (dataUrl) {
            const base64Data = dataUrl.split(',')[1];
            const filename = `${String(cert.orderNumber).padStart(2, '0')}_${sanitizeFilename(cert.awardCategorySubtitle || cert.awardTitle)}_${sanitizeFilename(cert.recipientName)}.png`;
            folder?.file(filename, base64Data, { base64: true });
          }
        }
      }

      setStatusMessage('กำลังรวบรวมและบีบอัดไฟล์ ZIP...');
      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = 'ชุดใบประกาศเกียรติคุณ_รพ_ท่าคันโท_๒๕๖๙.zip';
      link.click();

      setExportSuccess(true);
      setStatusMessage('บีบอัดและดาวน์โหลดไฟล์ ZIP แยกรายบุคคลสำเร็จแล้ว!');
    } catch (err) {
      console.error('Error in batch ZIP export:', err);
      setStatusMessage('เกิดข้อผิดพลาดในการสร้างไฟล์ ZIP โปรดลองใหม่อีกครั้ง');
    } finally {
      setExportingIndex(-1);
    }
  };

  return (
    <>
      {/* 1. REAL-VIEWPORT RENDERING STAGE DURING BATCH EXPORT (Behind modal backdrop) */}
      {isExporting && currentCert && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '1123px',
            height: '794px',
            minWidth: '1123px',
            maxWidth: '1123px',
            minHeight: '794px',
            maxHeight: '794px',
            zIndex: 40,
            pointerEvents: 'none',
            overflow: 'hidden',
          }}
        >
          <CertificateCanvas
            cert={currentCert}
            scale={1}
            id="batch-render-canvas"
          />
        </div>
      )}

      {/* 2. PROGRESS & CONTROLS MODAL */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <Download className="w-5 h-5 text-emerald-700" />
              <h3 className="font-prompt font-semibold text-slate-800 text-base">
                ดาวน์โหลดใบประกาศทั้งหมด ({certificates.length} ฉบับ)
              </h3>
            </div>
            {!isExporting && (
              <button
                onClick={onClose}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-600 leading-relaxed font-sarabun">
              เลือกรูปแบบไฟล์ที่ต้องการพิมพ์หรือส่งมอบ รางวัลบุคลากรสาธารณสุขปฏิบัติงานดีเด่น ประจำปีงบประมาณ ๒๕๖๙ โรงพยาบาลท่าคันโท
            </p>

            {isExporting ? (
              <div className="py-6 flex flex-col items-center justify-center text-center space-y-3">
                <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
                <div className="space-y-1">
                  <p className="font-prompt font-semibold text-slate-800 text-sm">
                    {statusMessage}
                  </p>
                  <p className="text-xs text-slate-500 font-sarabun font-medium">
                    กำลังประมวลผลฉบับที่ {progress.current} จากทั้งหมด {progress.total} ฉบับ
                  </p>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden max-w-xs mt-2 border border-slate-200">
                  <div
                    className="bg-emerald-600 h-full transition-all duration-200 rounded-full"
                    style={{
                      width: `${(progress.current / progress.total) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {/* Option 1: PDF Multi-page */}
                <button
                  onClick={handleExportPDF}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-left group"
                >
                  <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-800 group-hover:bg-emerald-700 group-hover:text-white transition-colors shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-prompt font-semibold text-slate-900 text-sm group-hover:text-emerald-900">
                      ไฟล์ PDF รวมทุกฉบับ (A4 แนวนอน พร้อมพิมพ์)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sarabun">
                      รวมทั้ง {certificates.length} ฉบับไว้ในไฟล์เดียว จัดหน้าตามแบบมาตรฐาน A4 สมบูรณ์ 100% ตรงตามฟอร์ม
                    </p>
                  </div>
                </button>

                {/* Option 2: ZIP containing separate PNGs */}
                <button
                  onClick={handleExportZip}
                  className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50/30 transition-all text-left group"
                >
                  <div className="p-2.5 rounded-lg bg-blue-100 text-blue-800 group-hover:bg-blue-700 group-hover:text-white transition-colors shrink-0">
                    <Archive className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-prompt font-semibold text-slate-900 text-sm group-hover:text-blue-900">
                      ไฟล์ ZIP ภาพแยกรายบุคคล (PNG 300 DPI คมชัดสูง)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed font-sarabun">
                      แยกไฟล์รูปภาพขนาด A4 คมชัดสูงของแต่ละบุคคล ตั้งชื่อไฟล์ตามลำดับและชื่อ-สกุล ตรงตามฟอร์มเดิมทุกประการ
                    </p>
                  </div>
                </button>
              </div>
            )}

            {exportSuccess && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-emerald-900 text-xs font-sarabun font-medium">
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex justify-end">
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
            >
              ปิดหน้าต่าง
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
