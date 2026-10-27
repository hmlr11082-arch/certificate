import React from 'react';
import { CertificateData } from '../types';

interface CertificateCanvasProps {
  cert: CertificateData;
  scale?: number;
  id?: string;
  className?: string;
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  cert,
  scale = 1,
  id = 'certificate-canvas',
  className = '',
}) => {
  // Theme color schemes (All centered around pastel green, white, pastel navy/blue)
  const getThemeStyles = () => {
    switch (cert.theme) {
      case 'pastel-emerald-navy':
        return {
          bgGradient: 'from-emerald-50/70 via-white to-sky-50/70',
          outerBorder: 'border-emerald-700/80',
          innerBorder: 'border-sky-800/60',
          accentColor: '#1e3a8a', // deep navy
          secondaryAccent: '#047857', // emerald green
          cornerFill: '#065f46',
          headerText: 'text-slate-800',
          titleColor: 'text-emerald-950',
          awardBadgeBg: 'bg-gradient-to-r from-emerald-100/90 via-sky-100/90 to-teal-100/90 border-emerald-300',
          recipientColor: 'text-slate-900',
        };
      case 'pastel-mint-cyan':
        return {
          bgGradient: 'from-teal-50/70 via-white to-blue-50/70',
          outerBorder: 'border-teal-700/80',
          innerBorder: 'border-blue-700/60',
          accentColor: '#1d4ed8',
          secondaryAccent: '#0f766e',
          cornerFill: '#0f766e',
          headerText: 'text-slate-800',
          titleColor: 'text-slate-900',
          awardBadgeBg: 'bg-gradient-to-r from-teal-100/90 via-white to-blue-100/90 border-teal-300',
          recipientColor: 'text-slate-900',
        };
      case 'pastel-green-blue':
      default:
        return {
          bgGradient: 'from-emerald-50/80 via-white to-blue-50/80',
          outerBorder: 'border-emerald-600/80',
          innerBorder: 'border-blue-800/60',
          accentColor: '#1e40af', // royal navy
          secondaryAccent: '#059669', // green
          cornerFill: '#1b4d3e',
          headerText: 'text-slate-800',
          titleColor: 'text-blue-950',
          awardBadgeBg: 'bg-gradient-to-r from-emerald-100/80 via-white to-blue-100/80 border-emerald-300/80',
          recipientColor: 'text-slate-900',
        };
    }
  };

  const theme = getThemeStyles();
  const isLandscape = cert.orientation !== 'portrait';

  // Base canvas dimension: Standard A4 ratio
  // Landscape: 1123 x 794 px
  // Portrait: 794 x 1123 px
  const baseWidth = isLandscape ? 1123 : 794;
  const baseHeight = isLandscape ? 794 : 1123;

  return (
    <div
      style={{
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top center',
        width: `${baseWidth}px`,
        height: `${baseHeight}px`,
      }}
      className={`relative select-none print:transform-none certificate-page ${className}`}
    >
      <div
        id={id}
        style={{
          width: `${baseWidth}px`,
          height: `${baseHeight}px`,
        }}
        className={`relative overflow-hidden bg-white text-slate-800 shadow-xl print:shadow-none flex flex-col justify-between`}
      >
        {/* Background Soft Pastel Gradient Mesh */}
        <div className={`absolute inset-0 bg-gradient-to-br ${theme.bgGradient} pointer-events-none opacity-90`} />

        {/* Delicate Certificate Guilloche / Decorative Background Ring */}
        <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="cert-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 40 M 0 0 L 40 40" fill="none" stroke="#2563eb" strokeWidth="0.3" strokeOpacity="0.25" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#cert-grid)" />
            <circle cx="50%" cy="50%" r="320" fill="none" stroke="#059669" strokeWidth="1" strokeDasharray="6,4" opacity="0.4" />
            <circle cx="50%" cy="50%" r="350" fill="none" stroke="#1d4ed8" strokeWidth="0.75" opacity="0.3" />
          </svg>
        </div>

        {/* Center Watermark Logo (Optional) */}
        {cert.showWatermark && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.045]">
            <img
              src="/assets/aistudio/image_ce36f912.png"
              alt="Watermark"
              className="w-[440px] h-[440px] object-contain filter grayscale contrast-125"
            />
          </div>
        )}

        {/* Outer Frame (Multi-line Thai Civil Service Style Frame) */}
        <div className="absolute inset-4 sm:inset-5 border-[3px] border-emerald-800/70 pointer-events-none rounded-[2px]" />
        <div className="absolute inset-6 sm:inset-7 border border-blue-900/50 pointer-events-none" />
        <div className="absolute inset-7 sm:inset-8 border-[0.75px] border-emerald-600/40 pointer-events-none" />

        {/* 4 Corner Ornaments (Thai Classical Kanok Motif SVGs) */}
        {/* Top-Left Corner */}
        <div className="absolute top-5 left-5 pointer-events-none w-16 h-16 text-emerald-800">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full">
            <path d="M 2 2 L 60 2 M 2 2 L 2 60" strokeWidth="4" />
            <path d="M 12 12 L 45 12 M 12 12 L 12 45" strokeWidth="1.5" stroke="#1e3a8a" />
            <path d="M 20 20 Q 30 20 35 15 Q 40 10 40 2" strokeWidth="1" fill="#047857" fillOpacity="0.1" />
            <path d="M 20 20 Q 20 30 15 35 Q 10 40 2 40" strokeWidth="1" fill="#1e3a8a" fillOpacity="0.1" />
            <circle cx="8" cy="8" r="4" fill="#047857" />
            <circle cx="20" cy="8" r="2" fill="#1e3a8a" />
            <circle cx="8" cy="20" r="2" fill="#1e3a8a" />
          </svg>
        </div>

        {/* Top-Right Corner */}
        <div className="absolute top-5 right-5 pointer-events-none w-16 h-16 text-emerald-800 rotate-90">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full">
            <path d="M 2 2 L 60 2 M 2 2 L 2 60" strokeWidth="4" />
            <path d="M 12 12 L 45 12 M 12 12 L 12 45" strokeWidth="1.5" stroke="#1e3a8a" />
            <circle cx="8" cy="8" r="4" fill="#047857" />
            <circle cx="20" cy="8" r="2" fill="#1e3a8a" />
            <circle cx="8" cy="20" r="2" fill="#1e3a8a" />
          </svg>
        </div>

        {/* Bottom-Left Corner */}
        <div className="absolute bottom-5 left-5 pointer-events-none w-16 h-16 text-emerald-800 -rotate-90">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full">
            <path d="M 2 2 L 60 2 M 2 2 L 2 60" strokeWidth="4" />
            <path d="M 12 12 L 45 12 M 12 12 L 12 45" strokeWidth="1.5" stroke="#1e3a8a" />
            <circle cx="8" cy="8" r="4" fill="#047857" />
            <circle cx="20" cy="8" r="2" fill="#1e3a8a" />
            <circle cx="8" cy="20" r="2" fill="#1e3a8a" />
          </svg>
        </div>

        {/* Bottom-Right Corner */}
        <div className="absolute bottom-5 right-5 pointer-events-none w-16 h-16 text-emerald-800 rotate-180">
          <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" className="w-full h-full">
            <path d="M 2 2 L 60 2 M 2 2 L 2 60" strokeWidth="4" />
            <path d="M 12 12 L 45 12 M 12 12 L 12 45" strokeWidth="1.5" stroke="#1e3a8a" />
            <circle cx="8" cy="8" r="4" fill="#047857" />
            <circle cx="20" cy="8" r="2" fill="#1e3a8a" />
            <circle cx="8" cy="20" r="2" fill="#1e3a8a" />
          </svg>
        </div>

        {/* Certificate Number (Top Right inside frame) */}
        <div className="absolute top-10 right-14 text-xs font-sarabun text-slate-500 z-10 flex items-center gap-1.5 whitespace-nowrap select-none">
          <span className="text-slate-400">เลขที่</span>
          <span className="font-semibold text-emerald-900 tracking-wider">{cert.certNumber}</span>
        </div>

        {/* Main Content Flow */}
        <div className="relative z-10 h-full flex flex-col justify-between px-16 pt-9 pb-10">
          {/* HEADER SECTION: LOGO + INSTITUTION */}
          <div className="flex flex-col items-center text-center">
            {/* FIXED 100% UNTOUCHED LOGO AS REQUESTED */}
            <div className="relative mb-2.5">
              <img
                src="/assets/aistudio/image_ce36f912.png"
                alt="ตราสัญลักษณ์โรงพยาบาลท่าคันโท"
                className="h-[105px] w-auto object-contain drop-shadow-sm select-none"
              />
            </div>

            {/* Institution Line */}
            <h3 className="font-prompt font-semibold text-lg sm:text-xl tracking-wide text-slate-800 whitespace-nowrap">
              {cert.hospitalName}
            </h3>
            <p className="font-sarabun text-xs sm:text-sm text-slate-500 mt-0.5 tracking-normal whitespace-nowrap">
              {cert.provinceText} • กระทรวงสาธารณสุข
            </p>

            {/* Certificate Header Banner */}
            <div className="mt-2.5 flex items-center justify-center gap-3">
              <div className="h-[1.5px] w-14 bg-gradient-to-r from-transparent via-emerald-600 to-transparent" />
              <h1 className="font-serif-thai text-2xl sm:text-3xl font-bold tracking-wide text-emerald-900 whitespace-nowrap">
                ใบประกาศเกียรติคุณ
              </h1>
              <div className="h-[1.5px] w-14 bg-gradient-to-r from-transparent via-blue-600 to-transparent" />
            </div>

            <p className="font-sarabun text-sm text-slate-600 mt-1 font-medium whitespace-nowrap">
              ขอมอบใบประกาศเกียรติคุณฉบับนี้ให้ไว้เพื่อแสดงว่า
            </p>
          </div>

          {/* BODY SECTION: RECIPIENT & HONORS */}
          <div className="flex flex-col items-center text-center -mt-1">
            {/* Recipient Name */}
            <div className="relative inline-block my-1">
              <span className="font-serif-thai text-3xl sm:text-4xl font-bold text-slate-900 tracking-wide px-4 py-1 whitespace-nowrap">
                {cert.recipientName}
              </span>
              <div className="h-[2px] w-4/5 mx-auto mt-0.5 bg-gradient-to-r from-transparent via-emerald-700/60 to-transparent" />
            </div>

            {/* Position */}
            <p className="font-sarabun text-base font-semibold text-emerald-800 mt-0.5 whitespace-nowrap">
              ตำแหน่ง {cert.recipientPosition}
              {cert.department ? ` (${cert.department})` : ''}
            </p>

            {/* Award Category Card */}
            <div className="mt-3.5 max-w-2xl w-full">
              <div className="p-2.5 rounded-lg border border-emerald-300/60 bg-gradient-to-r from-emerald-50/70 via-sky-50/60 to-teal-50/70 shadow-xs">
                <span className="text-xs uppercase tracking-wider font-prompt font-medium text-slate-600 block mb-0.5 whitespace-nowrap">
                  ได้รับการคัดเลือกให้เป็น
                </span>
                <div className="font-serif-thai text-xl sm:text-2xl font-bold text-blue-950 whitespace-nowrap">
                  {cert.awardTitle}
                </div>
                {cert.awardCategorySubtitle && (
                  <div className="font-prompt text-lg sm:text-xl font-bold text-emerald-800 mt-0.5 whitespace-nowrap">
                    {cert.awardCategorySubtitle}
                  </div>
                )}
                <div className="text-xs font-sarabun font-medium text-slate-600 mt-1 whitespace-nowrap">
                  ประจำปีงบประมาณ พ.ศ. {cert.fiscalYear}
                </div>
              </div>
            </div>

            {/* Commendation Citation Text */}
            <p className="font-sarabun text-xs sm:text-sm text-slate-600 mt-3 max-w-2xl leading-relaxed text-center">
              {cert.descriptionText}
            </p>

            {/* Issued Date */}
            <p className="font-sarabun text-xs sm:text-sm font-medium text-slate-700 mt-2 whitespace-nowrap">
              {cert.issuedDateText}
            </p>
          </div>

          {/* FOOTER SECTION: SIGNATURES & SEAL */}
          <div className="relative pt-2">
            <div className="grid grid-cols-2 gap-12 sm:gap-20 items-end px-12">
              {/* LEFT SIGNATURE: พนมพร พลเสนา */}
              <div className="flex flex-col items-center text-center">
                {/* Blank space for real pen signature */}
                <div className="h-16 flex flex-col justify-end items-center relative w-64 pb-1">
                  {cert.signatureStyle === 'digital' ? (
                    <span className="font-charm text-2xl font-bold text-blue-900 tracking-wider select-none transform -rotate-2 mb-1">
                      พนมพร พลเสนา
                    </span>
                  ) : (
                    /* Blank signature line for real pen signing */
                    <div className="w-full flex items-center justify-center text-slate-500 font-sarabun text-xs select-none mb-1">
                      <span className="text-slate-600 mr-1.5 text-[12px] font-medium">ลงชื่อ</span>
                      <span className="border-b border-dotted border-slate-500 w-44 inline-block translate-y-[-2px]"></span>
                    </div>
                  )}
                </div>

                <p className="font-sarabun text-sm font-semibold text-slate-900 mt-1 whitespace-nowrap">
                  ({cert.leftSignatoryName})
                </p>
                <p className="font-sarabun text-xs text-slate-600 mt-0.5 whitespace-nowrap">
                  {cert.leftSignatoryPosition}
                </p>
              </div>

              {/* RIGHT SIGNATURE: นพ.พุทธรักษ์ ดีสิน */}
              <div className="flex flex-col items-center text-center">
                {/* Blank space for real pen signature */}
                <div className="h-16 flex flex-col justify-end items-center relative w-64 pb-1">
                  {cert.signatureStyle === 'digital' ? (
                    <span className="font-charm text-2xl font-bold text-blue-900 tracking-wider select-none transform -rotate-1 mb-1">
                      พุทธรักษ์ ดีสิน
                    </span>
                  ) : (
                    /* Blank signature line for real pen signing */
                    <div className="w-full flex items-center justify-center text-slate-500 font-sarabun text-xs select-none mb-1">
                      <span className="text-slate-600 mr-1.5 text-[12px] font-medium">ลงชื่อ</span>
                      <span className="border-b border-dotted border-slate-500 w-44 inline-block translate-y-[-2px]"></span>
                    </div>
                  )}
                </div>

                <p className="font-sarabun text-sm font-semibold text-slate-900 mt-1 whitespace-nowrap">
                  ({cert.rightSignatoryName})
                </p>
                <p className="font-sarabun text-xs text-slate-600 mt-0.5 whitespace-nowrap">
                  {cert.rightSignatoryPosition}
                </p>
              </div>
            </div>

            {/* Official Center Gold/Teal Seal Medallion (Optional) */}
            {cert.showSeal && (
              <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 pointer-events-none flex flex-col items-center">
                <div className="w-16 h-16 rounded-full border-2 border-amber-400 bg-gradient-to-tr from-amber-100 via-emerald-100 to-sky-100 shadow-md flex items-center justify-center p-1 text-center">
                  <div className="w-full h-full rounded-full border border-dashed border-emerald-600/70 flex flex-col items-center justify-center p-0.5">
                    <span className="text-[7.5px] font-prompt font-bold text-emerald-900 leading-tight">
                      รพ.ท่าคันโท
                    </span>
                    <span className="text-[8px] font-sarabun font-extrabold text-blue-900">
                      ๒๕๖๙
                    </span>
                    <span className="text-[6.5px] font-sarabun text-emerald-800">
                      ดีเด่น
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
