import React, { useState } from 'react';
import type { TossOpenOrder } from '@/types/tossStock';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STOCK_BORDER, STOCK_TEXT_MUTED } from '@/lib/stockTheme';
import { formatMoney, formatQuantity } from '@/lib/tossFormat';

interface TossOpenOrdersSectionProps {
  orders: TossOpenOrder[];
  onCancel: (orderId: string) => void;
  cancelingOrderId: string | null;
}

/**
 * 체결을 기다리는 주문.
 *
 * 자산 화면의 <b>맨 위</b>에 둔다 — 이 화면에서 가장 시간에 민감한 정보이고, 아래로 밀리면
 * 사용자는 자기 주문이 살아 있는지 모른 채 같은 주문을 한 번 더 낸다.
 *
 * 미체결이 없으면 섹션 자체를 그리지 않는다. 빈 카드가 상시로 자리를 차지하면
 * 정작 주문이 걸렸을 때의 신호가 묻힌다.
 */
const TossOpenOrdersSection: React.FC<TossOpenOrdersSectionProps> = ({
  orders,
  onCancel,
  cancelingOrderId,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [pendingCancel, setPendingCancel] = useState<TossOpenOrder | null>(null);

  if (orders.length === 0) return null;

  const handleConfirmCancel = (): void => {
    if (!pendingCancel) return;
    onCancel(pendingCancel.orderId);
    setPendingCancel(null);
  };

  return (
    <section
      aria-label="미체결 주문"
      className={cn('rounded-lg border bg-white dark:bg-gray-800/50', STOCK_BORDER)}
    >
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((current) => !current)}
        className="flex min-h-[52px] w-full items-center justify-between px-4 py-3"
      >
        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
          미체결 주문 {orders.length}건
        </span>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>

      {expanded && (
        <ul className={cn('divide-y', STOCK_BORDER)}>
          {orders.map((order) => {
            const buying = order.side === 'BUY';
            const partiallyFilled = order.filledQuantity > 0;

            return (
              <li key={order.orderId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span
                      className={cn(
                        'text-sm font-semibold',
                        buying ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
                      )}
                    >
                      {buying ? '매수' : '매도'}
                    </span>
                    <span className="truncate font-medium text-gray-900 dark:text-gray-100">
                      {order.name}
                    </span>
                    {order.loc && (
                      <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                        LOC
                      </span>
                    )}
                  </div>
                  <p className={cn('mt-0.5 text-xs tabular-nums', STOCK_TEXT_MUTED)}>
                    {/* 부분 체결은 "몇 주 중 몇 주"가 보여야 잔량을 짐작할 수 있다. */}
                    {partiallyFilled
                      ? `${formatQuantity(order.quantity)}주 중 ${formatQuantity(order.filledQuantity)}주 체결`
                      : `${formatQuantity(order.quantity)}주`}
                    {order.price != null && ` · ${formatMoney(order.price, order.currency)}`}
                  </p>
                </div>

                {order.cancelable ? (
                  <button
                    type="button"
                    onClick={() => setPendingCancel(order)}
                    disabled={cancelingOrderId === order.orderId}
                    className={cn(
                      'min-h-[36px] shrink-0 rounded-md border px-3 text-sm font-medium',
                      'text-gray-700 disabled:opacity-50 dark:text-gray-300',
                      STOCK_BORDER
                    )}
                  >
                    {cancelingOrderId === order.orderId ? '취소 중' : '취소'}
                  </button>
                ) : (
                  <span className={cn('shrink-0 text-xs', STOCK_TEXT_MUTED)}>취소 요청됨</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {/* 취소도 돈에 관한 결정이다. 목록에서 바로 실행되지 않게 한 단계를 둔다. */}
      <AlertDialog open={pendingCancel !== null} onOpenChange={(open) => !open && setPendingCancel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>주문을 취소할까요?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingCancel &&
                `${pendingCancel.name} ${pendingCancel.side === 'BUY' ? '매수' : '매도'} ${formatQuantity(
                  pendingCancel.remainingQuantity
                )}주가 취소됩니다.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>닫기</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCancel}>주문 취소</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

export default TossOpenOrdersSection;
