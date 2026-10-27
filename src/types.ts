export interface CertificateData {
  id: string;
  orderNumber: number;
  certNumber: string;
  awardTitle: string;
  awardCategorySubtitle?: string;
  recipientName: string;
  recipientPosition: string;
  department?: string;
  hospitalName: string;
  provinceText: string;
  fiscalYear: string;
  descriptionText: string;
  issuedDateText: string;
  issuedDateIso?: string;
  useThaiDigits?: boolean;
  leftSignatoryName: string;
  leftSignatoryPosition: string;
  rightSignatoryName: string;
  rightSignatoryPosition: string;
  theme: 'pastel-green-blue' | 'pastel-emerald-navy' | 'pastel-mint-cyan';
  orientation: 'landscape' | 'portrait';
  showSeal: boolean;
  showWatermark: boolean;
  signatureStyle: 'digital' | 'line-only' | 'both';
}

export type ExportFormat = 'pdf' | 'png' | 'print';
