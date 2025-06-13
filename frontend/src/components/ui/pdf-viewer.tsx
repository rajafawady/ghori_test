// "use client";

// import { useState } from 'react';
// import { Document, Page, pdfjs } from 'react-pdf';
// import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
// import { Button } from '@/components/ui/button';
// import { ChevronLeft, ChevronRight, X } from 'lucide-react';

// // Set up the worker for PDF.js
// pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// interface PDFViewerProps {
//   url: string;
//   isOpen: boolean;
//   onClose: () => void;
// }

// export function PDFViewer({ url, isOpen, onClose }: PDFViewerProps) {
//   const [numPages, setNumPages] = useState<number>(0);
//   const [pageNumber, setPageNumber] = useState<number>(1);

//   function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
//     setNumPages(numPages);
//   }

//   return (
//     <Dialog open={isOpen} onOpenChange={onClose}>
//       <DialogContent className="max-w-4xl h-[80vh]">
//         <DialogHeader>
//           <DialogTitle className="flex items-center justify-between">
//             <span>Resume Preview</span>
//             <Button variant="ghost" size="icon" onClick={onClose}>
//               <X className="h-4 w-4" />
//             </Button>
//           </DialogTitle>
//         </DialogHeader>
//         <div className="flex-1 overflow-auto">
//           <Document
//             file={url}
//             onLoadSuccess={onDocumentLoadSuccess}
//             className="flex flex-col items-center"
//           >
//             <Page
//               pageNumber={pageNumber}
//               width={800}
//               className="shadow-lg"
//             />
//           </Document>
//         </div>
//         <div className="flex items-center justify-center gap-4 mt-4">
//           <Button
//             variant="outline"
//             size="icon"
//             onClick={() => setPageNumber(page => Math.max(1, page - 1))}
//             disabled={pageNumber <= 1}
//           >
//             <ChevronLeft className="h-4 w-4" />
//           </Button>
//           <span className="text-sm">
//             Page {pageNumber} of {numPages}
//           </span>
//           <Button
//             variant="outline"
//             size="icon"
//             onClick={() => setPageNumber(page => Math.min(numPages, page + 1))}
//             disabled={pageNumber >= numPages}
//           >
//             <ChevronRight className="h-4 w-4" />
//           </Button>
//         </div>
//       </DialogContent>
//     </Dialog>
//   );
// } 