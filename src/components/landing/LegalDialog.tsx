import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import type { LegalSection } from './legalContent';

type LegalDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  effectiveDate: string;
  sections: LegalSection[];
};

export const LegalDialog = ({ open, onOpenChange, title, effectiveDate, sections }: LegalDialogProps) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>시행일자 {effectiveDate}</DialogDescription>
      </DialogHeader>
      <div className="space-y-5 text-sm leading-relaxed text-slate-600">
        {sections.map((section) => (
          <section key={section.heading}>
            <h3 className="mb-1.5 font-semibold text-slate-900">{section.heading}</h3>
            {section.body.map((paragraph, index) => (
              <p key={`${section.heading}-${index}`} className="whitespace-pre-line">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </DialogContent>
  </Dialog>
);
