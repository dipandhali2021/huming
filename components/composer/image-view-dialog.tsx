'use client';

import { motion } from 'motion/react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

export function ImageViewDialog({
  url,
  onClose,
}: {
  url: string | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={Boolean(url)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[min(92vw,900px)] border-none bg-transparent p-0 shadow-none">
        <DialogTitle className="sr-only">Attachment preview</DialogTitle>
        {url ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden rounded-2xl border border-white/14 bg-ink"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt="Attachment preview"
              className="max-h-[80vh] w-full object-contain"
            />
          </motion.div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
