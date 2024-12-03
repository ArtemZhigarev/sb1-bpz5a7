import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageViewerProps {
  images: string[];
  currentIndex: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  images,
  currentIndex,
  onClose,
  onNext,
  onPrevious,
}) => {
  if (images.length === 0) return null;

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowRight') onNext();
    if (e.key === 'ArrowLeft') onPrevious();
  };

  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCloseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <button
          onClick={handleCloseClick}
          className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors z-50"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="relative w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPrevious();
                }}
                className="absolute left-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={currentIndex === 0}
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onNext();
                }}
                className="absolute right-4 text-white p-2 hover:bg-white/10 rounded-full transition-colors"
                disabled={currentIndex === images.length - 1}
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          <motion.img
            key={images[currentIndex]}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            src={images[currentIndex]}
            alt=""
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>

        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};