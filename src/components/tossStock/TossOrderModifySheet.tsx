import React, { useEffect, useState } from 'react';
import type { TossModifyOrderRequest, TossOpenOrder, TossOrderType } from '@/types/tossStock';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Loader2, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STOCK_BORDER, STOCK_TEXT_MUTED } from '@/lib/stockTheme';
import { formatMoney, formatQuantity } from '@/lib/tossFormat';
import { stepPrice } from '@/lib/tossTick';
import {
  HIGH_VALUE_THRESHOLD_KRW,
  NUMBER_INPUT_MAX_LENGTH,
  SUBMIT_ARM_DELAY_MS,
  US_PRICE_SCALE,
  sanitizeNumberInput,
} from '@/lib/tossOrderInput';
import { useTossOrderable } from '@/hooks/useTossOrderable';
import { api } from '@/lib/api';

interface TossOrderModifySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  order: TossOpenOrder | null;
  /** 정정이 접수되면 미체결 목록을 다시 받게 한다(정정된 주문은 새 주문번호로 바뀐다). */
  onModified: () => void;
}

const MODE_LABEL: Record<TossOrderType, string> = {
  LIMIT: '지정가',
  MARKET: '시장가',
};

/**
 * 미체결 주문 정정 시트.
 *
 * 주문 시트와 같이 <b>입력 → 확인 2단계</b>이고, 확인 화면 진입 직후에는 제출을 잠가 둔다 — 정정도 돈을 움직인다.
 *
 * 토스의 정정 규칙을 화면에서 먼저 지킨다(서버도 다시 거른다):
 * - 국내는 가격과 수량을 정정한다. 수량은 정정 후 수량이고 양의 정수다.
 * - 미국은 <b>가격만</b> 정정할 수 있다. 수량 입력을 아예 그리지 않는다.
 * - LOC 은 지정가 + 종가 조건이라 시장가로 바꿀 수 없다. 호가 유형 선택을 그리지 않는다.
 *
 * 입력은 <b>원주문</b>(가격·미체결 잔량)에서 출발한다. 현재가로 채우면 의도와 다른 가격으로 정정하기 쉽다.
 * 호가 단위·국가·통화는 주문 시트가 쓰는 {@link useTossOrderable} 응답에서 받는다.
 */
const TossOrderModifySheet: React.FC<TossOrderModifySheetProps> = ({ open, onOpenChange, owner, order, onModified }) => {
  const { orderable } = useTossOrderable(owner, open ? order?.symbol ?? null : null, order?.side ?? 'BUY');

  const [mode, setMode] = useState<TossOrderType>('LIMIT');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [highValueConfirmed, setHighValueConfirmed] = useState(false);
  const [highValueRequired, setHighValueRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitArmed, setSubmitArmed] = useState(false);

  // 시트를 열 때마다 원주문으로 되돌린다. 이전에 보던 주문의 입력이 남아 있으면 사고가 난다.
  useEffect(() => {
    if (!open || !order) return;
    setMode('LIMIT');
    setPrice(order.price != null ? String(order.price) : '');
    setQuantity(String(order.remainingQuantity));
    setStep('form');
    setHighValueConfirmed(false);
    setHighValueRequired(false);
    setSubmitError(null);
    setSubmitting(false);
  }, [open, order]);

  useEffect(() => {
    if (step !== 'confirm') {
      setSubmitArmed(false);
      return;
    }
    const timer = setTimeout(() => setSubmitArmed(true), SUBMIT_ARM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step]);

  if (!order) return null;

  // 시세를 아직 못 받았어도 통화로 국가를 알 수 있다 — 원화 주문이면 국내다.
  const marketCountry = orderable?.marketCountry ?? (order.currency === 'USD' ? 'US' : 'KR');
  const securityType = orderable?.securityType ?? 'STOCK';
  const korean = marketCountry === 'KR';
  const priceScale = korean ? 0 : US_PRICE_SCALE;
  const isLimit = mode === 'LIMIT';
  const sideLabel = order.side === 'BUY' ? '매수' : '매도';
  const money = (amount: number): string => formatMoney(amount, order.currency);

  const priceValue = Number(price) || 0;
  const quantityValue = Number(quantity) || 0;
  // 미국은 수량을 바꾸지 않으므로 잔량 그대로가 정정 후 수량이다.
  const resultingQuantity = korean ? quantityValue : order.remainingQuantity;
  const estimatedAmount = isLimit ? priceValue * resultingQuantity : 0;

  // 주문 시트와 같은 규칙 — 화면이 1억을 넘겼다고 보면 먼저 확인을 받고, 빗나가면 토스의 400 을 보고 드러낸다.
  const needsHighValueConfirm =
    (order.currency === 'KRW' && estimatedAmount >= HIGH_VALUE_THRESHOLD_KRW) || highValueRequired;

  const formValid = (!isLimit || priceValue > 0) && (!korean || (quantityValue > 0 && Number.isInteger(quantityValue)));

  const handleStepPrice = (direction: 'up' | 'down'): void => {
    const base = price === '' ? (orderable?.lastPrice ?? order.price ?? 0) : priceValue;
    setPrice(String(stepPrice(base, marketCountry, securityType, direction)));
  };

  const handleSubmit = async (): Promise<void> => {
    setSubmitting(true);
    setSubmitError(null);

    const request: TossModifyOrderRequest = {
      owner,
      symbol: order.symbol,
      orderType: mode,
      ...(korean ? { quantity: String(quantityValue) } : {}),
      ...(isLimit ? { price: String(priceValue) } : {}),
      confirmHighValueOrder: needsHighValueConfirm ? highValueConfirmed : false,
    };

    try {
      await api.modifyTossOrder(order.orderId, request);
      onModified();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '주문을 정정하지 못했습니다.';
      // 우리 추정이 빗나갔다(USD 정정 등). 같은 체크박스를 드러내고 다시 받는다.
      if (message.includes('금액 확인')) {
        setHighValueRequired(true);
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const summaryRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className={cn('text-sm', STOCK_TEXT_MUTED)}>{label}</span>
      <span className="text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );

  const originalPrice = order.price != null ? money(order.price) : '시장가';

  const formStep = (
    <div className="space-y-5">
      <p className={cn('text-sm tabular-nums', STOCK_TEXT_MUTED)}>
        {sideLabel} · 원주문 {originalPrice} · 미체결 {formatQuantity(order.remainingQuantity)}주
      </p>

      {/* LOC 은 지정가 + 종가 조건이라 시장가로 바꾸면 LOC 이 아니게 된다. 유형 선택을 그리지 않는다. */}
      {!order.loc && (
        <div role="radiogroup" aria-label="주문 유형 선택" className={cn('flex overflow-hidden rounded-lg border', STOCK_BORDER)}>
          {(['LIMIT', 'MARKET'] as TossOrderType[]).map((value) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={mode === value}
              onClick={() => setMode(value)}
              className={cn(
                'min-h-[44px] flex-1 text-sm font-medium transition-colors',
                mode === value ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-600 dark:text-gray-400'
              )}
            >
              {MODE_LABEL[value]}
            </button>
          ))}
        </div>
      )}

      {isLimit && (
        <div className="space-y-1.5">
          <label htmlFor="toss-modify-price" className={cn('text-sm', STOCK_TEXT_MUTED)}>
            정정 가격
          </label>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="가격 내리기"
              onClick={() => handleStepPrice('down')}
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="toss-modify-price"
              inputMode={korean ? 'numeric' : 'decimal'}
              autoComplete="off"
              value={price}
              maxLength={NUMBER_INPUT_MAX_LENGTH}
              onChange={(event) => setPrice(sanitizeNumberInput(event.target.value, priceScale))}
              placeholder="0"
              className="min-h-[48px] flex-1 text-right tabular-nums"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="가격 올리기"
              onClick={() => handleStepPrice('up')}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {orderable?.lastPrice != null && (
            <p className={cn('text-xs tabular-nums', STOCK_TEXT_MUTED)}>현재가 {money(orderable.lastPrice)}</p>
          )}
        </div>
      )}

      {korean ? (
        <div className="space-y-1.5">
          <label htmlFor="toss-modify-quantity" className={cn('text-sm', STOCK_TEXT_MUTED)}>
            정정 수량
          </label>
          <Input
            id="toss-modify-quantity"
            inputMode="numeric"
            autoComplete="off"
            value={quantity}
            maxLength={NUMBER_INPUT_MAX_LENGTH}
            onChange={(event) => setQuantity(sanitizeNumberInput(event.target.value, 0))}
            placeholder="0"
            className="min-h-[48px] text-right tabular-nums"
          />
        </div>
      ) : (
        <p className={cn('text-xs', STOCK_TEXT_MUTED)}>미국 주식은 가격만 정정할 수 있어요</p>
      )}

      <div className={cn('border-t pt-4', STOCK_BORDER)}>
        {isLimit && summaryRow('정정 후 주문금액', money(estimatedAmount))}
        <Button
          type="button"
          className="mt-2 min-h-[52px] w-full text-base"
          disabled={!formValid}
          onClick={() => setStep('confirm')}
        >
          정정 확인
        </Button>
      </div>
    </div>
  );

  const confirmStep = (
    <div className="space-y-5">
      <div className={cn('rounded-lg border p-4', STOCK_BORDER)}>
        {summaryRow('종목', `${order.name} (${order.symbol})`)}
        {summaryRow('구분', sideLabel)}
        {summaryRow('유형', order.loc ? 'LOC' : MODE_LABEL[mode])}
        {summaryRow('가격', `${originalPrice} → ${isLimit ? money(priceValue) : '시장가'}`)}
        {summaryRow(
          '수량',
          `${formatQuantity(order.remainingQuantity)}주 → ${formatQuantity(resultingQuantity)}주`
        )}
        {isLimit && (
          <div className={cn('mt-2 border-t pt-2', STOCK_BORDER)}>
            {summaryRow('정정 후 주문금액', money(estimatedAmount))}
          </div>
        )}
      </div>

      {needsHighValueConfirm && (
        <div className="flex items-start gap-3 rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">1억원 이상 주문입니다.</p>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={highValueConfirmed}
                onCheckedChange={(checked) => setHighValueConfirmed(checked === true)}
                aria-label="금액을 확인했습니다"
              />
              금액을 확인했습니다
            </label>
          </div>
        </div>
      )}

      {submitError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">
          {submitError}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          className="min-h-[52px] flex-1"
          disabled={submitting}
          onClick={() => setStep('form')}
        >
          뒤로
        </Button>
        <Button
          type="button"
          className="min-h-[52px] flex-[2] text-base"
          disabled={submitting || !submitArmed || (needsHighValueConfirm && !highValueConfirmed)}
          onClick={handleSubmit}
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '정정하기'}
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="truncate">{order.name} 정정</span>
            <span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
              {marketCountry}
            </span>
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4">{step === 'form' ? formStep : confirmStep}</div>
      </SheetContent>
    </Sheet>
  );
};

export default TossOrderModifySheet;
