import React, { useState, useRef, useEffect } from 'react';
import { CertificateData } from './types';
import { INITIAL_CERTIFICATES } from './data/initialCertificates';
import { CertificateCanvas } from './components/CertificateCanvas';
import { CertificateEditor } from './components/CertificateEditor';
import { BatchExportModal } from './components/BatchExportModal';
import { AddRecipientModal } from './components/AddRecipientModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import {
  downloadCertificateAsPDF,
  downloadCertificateAsPNG,
} from './utils/exportUtils';
import {
  Download,
  FileDown,
  Printer,
  Edit3,
  Search,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Users,
  Award,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Copy,
  Sparkles,
  PenTool,
  RotateCcw,
  Calendar,
} from 'lucide-react';
import { formatThaiCertificateDate, parseThaiDateToIso } from './utils/dateUtils';

export default function App() {
  const [certificates, setCertificates] = useState<CertificateData[]>(INITIAL_CERTIFICATES);
  const [selectedCertId, setSelectedCertId] = useState<string>(INITIAL_CERTIFICATES[0].id);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomScale, setZoomScale] = useState(0.85);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isExportingSingle, setIsExportingSingle] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Active certificate object
  const activeCert = certificates.find((c) => c.id === selectedCertId) || certificates[0];
  const activeIndex = certificates.findIndex((c) => c.id === selectedCertId);

  // Filtered list based on search
  const filteredCerts = certificates.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.recipientName.toLowerCase().includes(q) ||
      c.awardTitle.toLowerCase().includes(q) ||
      (c.awardCategorySubtitle && c.awardCategorySubtitle.toLowerCase().includes(q)) ||
      c.recipientPosition.toLowerCase().includes(q) ||
      c.certNumber.toLowerCase().includes(q)
    );
  });

  // Responsive zoom fit on initial load
  useEffect(() => {
    const updateOptimalZoom = () => {
      if (previewContainerRef.current) {
        const containerWidth = previewContainerRef.current.clientWidth;
        // Default landscape width is 1123px, leave 48px padding
        const calculatedScale = Math.min(Math.max((containerWidth - 64) / 1123, 0.45), 1.0);
        setZoomScale(calculatedScale);
      }
    };

    updateOptimalZoom();
    window.addEventListener('resize', updateOptimalZoom);
    return () => window.removeEventListener('resize', updateOptimalZoom);
  }, [sidebarOpen]);

  // Navigate to previous / next certificate
  const handlePrevCert = () => {
    if (activeIndex > 0) {
      setSelectedCertId(certificates[activeIndex - 1].id);
    }
  };

  const handleNextCert = () => {
    if (activeIndex < certificates.length - 1) {
      setSelectedCertId(certificates[activeIndex + 1].id);
    }
  };

  // Update current certificate
  const handleUpdateCertificate = (updated: CertificateData) => {
    setCertificates((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
  };

  // Reset to default
  const handleResetCertificate = () => {
    const original = INITIAL_CERTIFICATES.find((c) => c.id === activeCert.id);
    if (original) {
      handleUpdateCertificate(original);
    }
  };

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [certToDelete, setCertToDelete] = useState<CertificateData | null>(null);

  // Add new certificate recipient from modal
  const handleAddRecipient = (newCert: CertificateData) => {
    const updated = [...certificates, newCert];
    setCertificates(updated);
    setSelectedCertId(newCert.id);
  };

  // Duplicate current certificate
  const handleDuplicateCurrent = () => {
    const newId = `cert-${Date.now()}`;
    const newOrder = certificates.length + 1;
    const duplicated: CertificateData = {
      ...activeCert,
      id: newId,
      orderNumber: newOrder,
      recipientName: `${activeCert.recipientName} (สำเนา)`,
    };
    setCertificates([...certificates, duplicated]);
    setSelectedCertId(newId);
  };

  // Confirmed Delete of certificate
  const handleConfirmDelete = () => {
    if (!certToDelete) return;
    if (certificates.length <= 1) {
      alert('ต้องมีใบประกาศอย่างน้อย 1 ฉบับในระบบ');
      setCertToDelete(null);
      return;
    }

    const filtered = certificates.filter((c) => c.id !== certToDelete.id);
    // Re-index order numbers sequentially
    const reordered = filtered.map((c, idx) => ({
      ...c,
      orderNumber: idx + 1,
    }));
    setCertificates(reordered);

    // If the active cert was deleted, select the first remaining
    if (selectedCertId === certToDelete.id) {
      setSelectedCertId(reordered[0].id);
    }
    setCertToDelete(null);
  };

  // Download Single PDF
  const handleDownloadSinglePDF = async () => {
    setIsExportingSingle(true);
    await downloadCertificateAsPDF('certificate-canvas', activeCert);
    setIsExportingSingle(false);
  };

  // Download Single PNG
  const handleDownloadSinglePNG = async () => {
    setIsExportingSingle(true);
    await downloadCertificateAsPNG('certificate-canvas', activeCert);
    setIsExportingSingle(false);
  };

  // Trigger Browser Print
  const handlePrint = () => {
    window.print();
  };

  // Apply international calendar date to all certificates
  const handleApplyDateToAll = (newDateText: string, isoDate: string) => {
    setCertificates((prev) =>
      prev.map((c) => ({
        ...c,
        issuedDateText: newDateText,
        issuedDateIso: isoDate,
      }))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/80 text-slate-800">
      {/* 1. TOP BAR (Strict 3-Zone Contract) */}
      <header className="no-print h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between gap-8 z-30 shrink-0">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
          <img
            src="/assets/aistudio/image_ce36f912.png"
            alt="โลโก้โรงพยาบาลท่าคันโท"
            className="w-9 h-9 object-contain"
          />
          <div className="flex flex-col">
            <span className="font-prompt font-bold text-slate-900 text-base leading-tight">
              โรงพยาบาลท่าคันโท
            </span>
            <span className="text-[11px] text-slate-500 font-sarabun">
              ระบบจัดทำใบประกาศเกียรติคุณบุคลากรดีเด่น ประจำปีงบประมาณ ๒๕๖๙
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation and Contextual links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
          <span className="text-emerald-800 font-semibold flex items-center gap-1.5 whitespace-nowrap shrink-0">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>รางวัลปฏิบัติงานดีเด่น ๑๑ หมวด ({certificates.length} ฉบับ)</span>
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 whitespace-nowrap shrink-0">
            มาตรฐาน A4 แนวนอน
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600 whitespace-nowrap shrink-0">
            โทนสีเขียว ขาว น้ำเงิน พาสเทล
          </span>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsBatchModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>ดาวน์โหลดทั้งหมด ({certificates.length} รายการ)</span>
          </button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* LEFT SIDEBAR: RECIPIENTS LIST */}
        <aside
          className={`no-print bg-white border-r border-slate-200 flex flex-col transition-all duration-300 z-20 shrink-0 ${
            sidebarOpen ? 'w-80' : 'w-0 -translate-x-full lg:translate-x-0 lg:w-14'
          }`}
        >
          {sidebarOpen ? (
            <>
              {/* Sidebar Header & Search */}
              <div className="p-4 border-b border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-900 font-prompt font-semibold text-sm">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>รายชื่อผู้ได้รับรางวัล</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-sarabun font-bold">
                      {certificates.length}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="p-1.5 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white transition-colors flex items-center gap-1.5 text-xs font-medium shadow-2xs"
                    title="เพิ่มรายชื่อผู้ได้รับรางวัลใหม่"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>เพิ่มชื่อ</span>
                  </button>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่อ หรือ สาขารางวัล..."
                    className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sarabun bg-slate-50 focus:bg-white transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              {/* Recipient Item Cards */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredCerts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 font-sarabun">
                    ไม่พบรายชื่อที่ตรงกับการค้นหา
                  </div>
                ) : (
                  filteredCerts.map((cert) => {
                    const isSelected = cert.id === selectedCertId;
                    return (
                      <div
                        key={cert.id}
                        onClick={() => setSelectedCertId(cert.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all border text-left group relative ${
                          isSelected
                            ? 'bg-gradient-to-r from-emerald-50 to-blue-50/50 border-emerald-500 shadow-xs ring-1 ring-emerald-500/20'
                            : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className="text-[11px] font-sarabun font-bold text-slate-400">
                            #{cert.orderNumber}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-prompt truncate flex-1 text-right">
                            {cert.awardCategorySubtitle || cert.awardTitle}
                          </span>
                          {/* Quick delete button on hover */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCertToDelete(cert);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all shrink-0"
                            title={`ลบรายชื่อ ${cert.recipientName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="mt-1">
                          <h4 className="font-sarabun font-bold text-sm text-slate-900 truncate">
                            {cert.recipientName}
                          </h4>
                          <p className="text-xs text-slate-500 font-sarabun truncate mt-0.5">
                            {cert.recipientPosition}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer Info & Add/Reset */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex flex-col gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>เพิ่มรายชื่อผู้ได้รับรางวัล</span>
                </button>
                <button
                  onClick={() => {
                    if (confirm('ต้องการรีเซ็ตรายชื่อกลับเป็นชุดเริ่มต้น ๑๒ รายชื่อเดิมของโรงพยาบาลใช่หรือไม่?')) {
                      setCertificates(INITIAL_CERTIFICATES);
                      setSelectedCertId(INITIAL_CERTIFICATES[0].id);
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 hover:underline flex items-center justify-center gap-1 pt-0.5 transition-colors"
                >
                  <RotateCcw className="w-3 h-3 text-slate-400" />
                  <span>คืนค่าเริ่มต้น ๑๒ รายชื่อเดิม</span>
                </button>
              </div>
            </>
          ) : (
            <div className="py-4 flex flex-col items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
                title="เปิดแถบรายชื่อ"
              >
                <Users className="w-5 h-5 text-emerald-700" />
              </button>
            </div>
          )}
        </aside>

        {/* CENTER PREVIEW WORKSPACE */}
        <main className="flex-1 flex flex-col overflow-hidden bg-slate-200/60">
          {/* Action Ribbon & Navigation Toolbar */}
          <div className="no-print h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between gap-4 shrink-0 shadow-xs">
            {/* Left: Previous / Next & Sidebar Toggle */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-medium flex items-center gap-1.5"
                title={sidebarOpen ? 'ซ่อนรายชื่อ' : 'แสดงรายชื่อ'}
              >
                <Users className="w-4 h-4 text-slate-500" />
                <span className="hidden sm:inline">
                  {sidebarOpen ? 'ซ่อนรายชื่อ' : 'แสดงรายชื่อ'}
                </span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200 mx-1" />

              <button
                onClick={handlePrevCert}
                disabled={activeIndex <= 0}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                title="ใบประกาศก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="text-xs font-sarabun text-slate-600 font-medium px-1">
                ลำดับที่ <span className="font-bold text-slate-900">{activeIndex + 1}</span> / {certificates.length}
              </span>

              <button
                onClick={handleNextCert}
                disabled={activeIndex >= certificates.length - 1}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                title="ใบประกาศถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Center: Zoom Controls */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-100 rounded-lg p-1 border border-slate-200">
              <button
                onClick={() => setZoomScale((prev) => Math.max(prev - 0.1, 0.4))}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white"
                title="ย่อขนาด"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs font-mono font-medium text-slate-700 px-2 select-none min-w-[50px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                onClick={() => setZoomScale((prev) => Math.min(prev + 0.1, 1.25))}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white"
                title="ขยายขนาด"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomScale(0.85)}
                className="p-1 rounded text-slate-600 hover:text-slate-900 hover:bg-white text-[11px] font-prompt px-1.5"
                title="ปรับขนาดพอดีหน้าจอ"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Right: Export & Edit Actions */}
            <div className="flex items-center gap-2">
              {/* International Calendar Quick Picker */}
              <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-sarabun text-slate-700 shadow-2xs">
                <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="text-slate-500 text-[11px] whitespace-nowrap">ให้ไว้ ณ วันที่:</span>
                <input
                  type="date"
                  value={activeCert.issuedDateIso || parseThaiDateToIso(activeCert.issuedDateText)}
                  onChange={(e) => {
                    if (e.target.value) {
                      const formatted = formatThaiCertificateDate(e.target.value, activeCert.useThaiDigits ?? true);
                      handleApplyDateToAll(formatted, e.target.value);
                    }
                  }}
                  className="bg-transparent text-slate-900 font-medium text-xs focus:outline-none cursor-pointer border-none p-0"
                  title="เปลี่ยนวันที่มอบของทุกใบประกาศด้วยปฏิทินสากล"
                />
              </div>

              {/* Signature Mode Quick Toggle */}
              <button
                onClick={() => {
                  const newStyle = activeCert.signatureStyle === 'line-only' ? 'digital' : 'line-only';
                  // Update all certificates so user gets consistent output
                  setCertificates((prev) =>
                    prev.map((c) => ({ ...c, signatureStyle: newStyle }))
                  );
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors shadow-2xs ${
                  activeCert.signatureStyle === 'line-only'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="คลิกเพื่อสลับระหว่างเว้นช่องเซ็นจริงด้วยปากกา กับแสดงลายเซ็นจำลอง"
              >
                <PenTool className="w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden sm:inline">
                  {activeCert.signatureStyle === 'line-only' ? 'เว้นที่เซ็นจริงด้วยปากกา' : 'ลายเซ็นจำลอง'}
                </span>
              </button>

              {/* Edit button */}
              <button
                onClick={() => setIsEditorOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                <span>แก้ไขข้อความ</span>
              </button>

              {/* Delete button */}
              <button
                onClick={() => setCertToDelete(activeCert)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-red-600 bg-red-50/80 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors shadow-2xs"
                title="ลบใบประกาศฉบับนี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">ลบฉบับนี้</span>
              </button>

              {/* Print button */}
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-2xs"
                title="สั่งพิมพ์ A4 ทางเครื่องพิมพ์"
              >
                <Printer className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">พิมพ์ (Print)</span>
              </button>

              {/* Download PNG button */}
              <button
                onClick={handleDownloadSinglePNG}
                disabled={isExportingSingle}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-800 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors shadow-2xs disabled:opacity-50"
                title="ดาวน์โหลดรูปภาพ PNG 300 DPI"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">บันทึกรูป PNG</span>
              </button>

              {/* Download PDF button */}
              <button
                onClick={handleDownloadSinglePDF}
                disabled={isExportingSingle}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 rounded-lg hover:bg-emerald-800 transition-colors shadow-2xs disabled:opacity-50"
                title="ดาวน์โหลดไฟล์ PDF ขนาด A4 แนวนอน"
              >
                <Download className="w-3.5 h-3.5" />
                <span>โหลด PDF (A4)</span>
              </button>
            </div>
          </div>

          {/* Certificate Live View Area */}
          <div
            ref={previewContainerRef}
            className="flex-1 overflow-auto p-8 flex items-center justify-center print:p-0 print:m-0 print:overflow-visible"
          >
            <div className="transition-transform duration-150 flex flex-col items-center">
              {/* Primary Active Certificate Preview */}
              <CertificateCanvas
                cert={activeCert}
                scale={zoomScale}
                id="certificate-canvas"
              />

              {/* Recipient Quick Summary Tag below canvas */}
              <div className="no-print mt-6 flex items-center gap-3 bg-white/80 backdrop-blur-xs px-4 py-2 rounded-full border border-slate-300/80 shadow-2xs text-xs font-sarabun text-slate-600">
                <span className="font-bold text-emerald-900">{activeCert.recipientName}</span>
                <span className="text-slate-400">·</span>
                <span className="text-blue-900">{activeCert.awardCategorySubtitle}</span>
                <span className="text-slate-400">·</span>
                <span>{activeCert.recipientPosition}</span>
              </div>
            </div>
          </div>
        </main>
      </div>



      {/* CERTIFICATE EDIT DRAWER */}
      <CertificateEditor
        cert={activeCert}
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        onUpdate={handleUpdateCertificate}
        onReset={handleResetCertificate}
        onApplyDateToAll={handleApplyDateToAll}
      />

      {/* BATCH EXPORT MODAL */}
      <BatchExportModal
        isOpen={isBatchModalOpen}
        onClose={() => setIsBatchModalOpen(false)}
        certificates={certificates}
      />

      {/* ADD RECIPIENT MODAL */}
      <AddRecipientModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddRecipient}
        existingCount={certificates.length}
      />

      {/* DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={Boolean(certToDelete)}
        onClose={() => setCertToDelete(null)}
        onConfirm={handleConfirmDelete}
        cert={certToDelete}
      />
    </div>
  );
}
