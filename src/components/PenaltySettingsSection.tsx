import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface PenaltySettingsSectionProps {
  penaltyEnabled: boolean;
  penaltyPerMiss: number | null;
  pendingPenaltyEnabled?: boolean | null;
  pendingPenaltyPerMiss?: number | null;
  penaltyChangeEffectiveDate?: string | null;
  isOwner: boolean;
  onOpenSchedule: () => void;
}

export const PenaltySettingsSection = ({
  penaltyEnabled,
  penaltyPerMiss,
  pendingPenaltyEnabled,
  pendingPenaltyPerMiss,
  penaltyChangeEffectiveDate,
  isOwner,
  onOpenSchedule,
}: PenaltySettingsSectionProps) => {
  const hasPendingChange = pendingPenaltyEnabled !== null && pendingPenaltyEnabled !== undefined;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Badge variant={penaltyEnabled ? 'default' : 'outline'}>
          {penaltyEnabled ? `벌금이 부과되는 운동방이에요. (회당 ${penaltyPerMiss?.toLocaleString()}원)` : '벌금 없이 운영되는 운동방이에요.'}
        </Badge>
      </div>

      {hasPendingChange && (
        <Alert>
          <AlertDescription>
            {penaltyChangeEffectiveDate} 부터 벌금이{' '}
            {pendingPenaltyEnabled ? `부과돼요.(회당 ${pendingPenaltyPerMiss?.toLocaleString()}원)` : '부과되지 않아요.'}
          </AlertDescription>
        </Alert>
      )}

      {isOwner && (
        <Button type="button" variant="outline" onClick={onOpenSchedule}>
          운영 방식 바꾸기
        </Button>
      )}
    </div>
  );
};
