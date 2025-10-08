import React, { useState, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

const PDFViewer = ({ filePath, highlightedPages = [], onPageClick }) => {
  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [rotation, setRotation] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }) => {
    setNumPages(numPages);
    setLoading(false);
    setError(null);
  }, []);

  const onDocumentLoadError = useCallback((error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF');
    setLoading(false);
  }, []);

  const goToPrevPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const goToPage = (page) => {
    setPageNumber(Math.max(1, Math.min(page, numPages)));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96 bg-red-50 rounded-lg">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!filePath) {
    return (
      <div className="flex items-center justify-center h-96 bg-gray-100 rounded-lg">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No PDF selected</p>
          <p className="text-sm text-gray-500">Upload a PDF to view it here</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Controls */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <button
            onClick={goToPrevPage}
            disabled={pageNumber <= 1}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          
          <span className="text-sm text-gray-700">
            Page {pageNumber} of {numPages}
          </span>
          
          <button
            onClick={goToNextPage}
            disabled={pageNumber >= numPages}
            className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="p-2 rounded-md hover:bg-gray-100"
            title="Zoom Out"
          >
            <ZoomOut className="h-5 w-5" />
          </button>
          
          <span className="text-sm text-gray-700 min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={zoomIn}
            className="p-2 rounded-md hover:bg-gray-100"
            title="Zoom In"
          >
            <ZoomIn className="h-5 w-5" />
          </button>
          
          <button
            onClick={rotate}
            className="p-2 rounded-md hover:bg-gray-100"
            title="Rotate"
          >
            <RotateCw className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="overflow-auto max-h-[600px] p-4">
        <div className="flex justify-center">
          <Document
            file={filePath}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={<div className="text-center py-8">Loading PDF...</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              rotate={rotation}
              onClick={() => onPageClick && onPageClick(pageNumber)}
              className={`cursor-pointer transition-all duration-200 ${
                highlightedPages.includes(pageNumber)
                  ? 'ring-2 ring-blue-500 ring-opacity-50'
                  : ''
              }`}
              renderTextLayer={false}
              renderAnnotationLayer={false}
            />
          </Document>
        </div>
      </div>

      {/* Page Navigation */}
      {numPages > 1 && (
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center justify-center space-x-2">
            <button
              onClick={() => goToPage(1)}
              disabled={pageNumber === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              First
            </button>
            <button
              onClick={goToPrevPage}
              disabled={pageNumber === 1}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Previous
            </button>
            <input
              type="number"
              min="1"
              max={numPages}
              value={pageNumber}
              onChange={(e) => goToPage(parseInt(e.target.value))}
              className="w-16 px-2 py-1 text-sm border rounded text-center"
            />
            <button
              onClick={goToNextPage}
              disabled={pageNumber === numPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Next
            </button>
            <button
              onClick={() => goToPage(numPages)}
              disabled={pageNumber === numPages}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50"
            >
              Last
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PDFViewer;
