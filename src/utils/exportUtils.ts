import * as htmlToImage from 'html-to-image';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { CertificateData } from '../types';

/**
 * Clean filename generator
 */
export const sanitizeFilename = (text: string): string => {
  return text.replace(/[\\/:*?"<>|]/g, '_').trim();
};

/**
 * Wait for all images inside an element to be loaded
 */
const waitForImages = async (element: HTMLElement): Promise<void> => {
  const images = element.querySelectorAll('img');
  await Promise.all(
    Array.from(images).map((img) => {
      if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });
    })
  );
};

/**
 * Capture an element as high-res PNG or JPEG data URL using html-to-image
 * (Native SVG foreignObject rendering: fully supports Tailwind v4 oklch colors!)
 */
export const captureCertificateDataUrl = async (
  element: HTMLElement,
  format: 'png' | 'jpeg' = 'png',
  pixelRatio = 2.5
): Promise<string | null> => {
  try {
    // Wait for web fonts and images to be fully loaded
    if (document.fonts) {
      await document.fonts.ready;
    }
    await waitForImages(element);

    const options = {
      pixelRatio,
      backgroundColor: '#ffffff',
      cacheBust: false,
      skipFonts: true, // Prevents cross-origin cssRules SecurityError on Google Fonts stylesheets
    };

    if (format === 'jpeg') {
      return await htmlToImage.toJpeg(element, { ...options, quality: 0.96 });
    }
    return await htmlToImage.toPng(element, options);
  } catch (err) {
    console.error('Error in captureCertificateDataUrl:', err);
    return null;
  }
};

/**
 * Export single certificate to PDF (Exact A4 Landscape)
 */
export const downloadCertificateAsPDF = async (
  elementId: string,
  cert: CertificateData
): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element #${elementId} not found`);
      return false;
    }

    const imgData = await captureCertificateDataUrl(element, 'jpeg', 2.5);
    if (!imgData) return false;

    const orientation = cert.orientation === 'portrait' ? 'p' : 'l';
    
    // A4 dimensions in mm: 297 x 210
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = orientation === 'l' ? 297 : 210;
    const pdfHeight = orientation === 'l' ? 210 : 297;

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    
    const filename = `ใบประกาศ_${cert.orderNumber}_${sanitizeFilename(cert.awardCategorySubtitle || cert.awardTitle)}_${sanitizeFilename(cert.recipientName)}.pdf`;
    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('Error generating PDF:', err);
    return false;
  }
};

/**
 * Export single certificate to high-res PNG image
 */
export const downloadCertificateAsPNG = async (
  elementId: string,
  cert: CertificateData
): Promise<boolean> => {
  try {
    const element = document.getElementById(elementId);
    if (!element) {
      console.error(`Element #${elementId} not found`);
      return false;
    }

    const dataUrl = await captureCertificateDataUrl(element, 'png', 2.5);
    if (!dataUrl) return false;

    const link = document.createElement('a');
    link.download = `ใบประกาศ_${cert.orderNumber}_${sanitizeFilename(cert.awardCategorySubtitle || cert.awardTitle)}_${sanitizeFilename(cert.recipientName)}.png`;
    link.href = dataUrl;
    link.click();
    return true;
  } catch (err) {
    console.error('Error generating PNG:', err);
    return false;
  }
};

/**
 * Export all certificates into a single unified multi-page A4 PDF file
 */
export const downloadAllAsCombinedPDF = async (
  certificates: CertificateData[],
  onProgress?: (current: number, total: number) => void
): Promise<boolean> => {
  try {
    const pdf = new jsPDF({
      orientation: 'l',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    for (let i = 0; i < certificates.length; i++) {
      if (onProgress) {
        onProgress(i + 1, certificates.length);
      }

      const cert = certificates[i];
      // Target the unscaled canvas inner element
      const targetEl =
        document.getElementById(`cert-canvas-${cert.id}`) ||
        document.getElementById(`cert-item-${cert.id}`);

      if (targetEl) {
        const imgData = await captureCertificateDataUrl(targetEl, 'jpeg', 2.2);
        if (imgData) {
          if (i > 0) pdf.addPage('a4', 'l');
          pdf.addImage(imgData, 'JPEG', 0, 0, 297, 210, undefined, 'FAST');
        }
      }
    }

    pdf.save(`รวมใบประกาศ_บุคลากรดีเด่น_รพ_ท่าคันโท_๒๕๖๙.pdf`);
    return true;
  } catch (err) {
    console.error('Error batch PDF:', err);
    return false;
  }
};

/**
 * Export all certificates as a ZIP archive of individual PNG files
 */
export const downloadAllAsZip = async (
  certificates: CertificateData[],
  onProgress?: (current: number, total: number) => void
): Promise<boolean> => {
  try {
    const zip = new JSZip();
    const folder = zip.folder('ใบประกาศ_รพ_ท่าคันโท_2569');

    for (let i = 0; i < certificates.length; i++) {
      if (onProgress) {
        onProgress(i + 1, certificates.length);
      }

      const cert = certificates[i];
      // Target the unscaled canvas inner element
      const targetEl =
        document.getElementById(`cert-canvas-${cert.id}`) ||
        document.getElementById(`cert-item-${cert.id}`);

      if (targetEl) {
        const dataUrl = await captureCertificateDataUrl(targetEl, 'png', 2.2);
        if (dataUrl) {
          const base64Data = dataUrl.split(',')[1];
          const filename = `${String(cert.orderNumber).padStart(2, '0')}_${sanitizeFilename(cert.awardCategorySubtitle || cert.awardTitle)}_${sanitizeFilename(cert.recipientName)}.png`;
          folder?.file(filename, base64Data, { base64: true });
        }
      }
    }

    const content = await zip.generateAsync({ type: 'blob' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(content);
    link.download = `ชุดใบประกาศเกียรติคุณ_รพ_ท่าคันโท_๒๕๖๙.zip`;
    link.click();
    return true;
  } catch (err) {
    console.error('Error generating ZIP:', err);
    return false;
  }
};
