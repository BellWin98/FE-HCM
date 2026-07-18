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
          {penaltyEnabled ? `벌금제도 사용 중 (회당 ${penaltyPerMiss?.toLocaleString()}원)` : '벌금제도 미사용'}
        </Badge>
      </div>

      {hasPendingChange && (
        <Alert>
          <AlertDescription>
            {penaltyChangeEffectiveDate} 부터 벌금제도가{' '}
            {pendingPenaltyEnabled ? `켜짐(회당 ${pendingPenaltyPerMiss?.toLocaleString()}원)` : '꺼짐'}으로 전환될
            예정입니다.
          </AlertDescription>
        </Alert>
      )}

      {isOwner && (
        <Button type="button" variant="outline" onClick={onOpenSchedule}>
          벌금제도 전환 예약
        </Button>
      )}
    </div>
  );
};
