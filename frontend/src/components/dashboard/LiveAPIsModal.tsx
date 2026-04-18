import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { LiveAPIsPanel } from './LiveAPIsPanel';

interface LiveAPIsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LiveAPIsModal({ open, onOpenChange }: LiveAPIsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Live API Tools</DialogTitle>
          <DialogDescription>
            Access live emission factors, grid intensity, and other advanced tools
          </DialogDescription>
        </DialogHeader>
        <LiveAPIsPanel />
      </DialogContent>
    </Dialog>
  );
}
