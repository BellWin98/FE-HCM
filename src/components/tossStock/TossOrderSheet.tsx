import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  TossMarketCountry,
  TossOrderMode,
  TossOrderSide,
  TossPlaceOrderRequest,
  TossSecurityType,
} from '@/types/tossStock';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Minus, Plus, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { STOCK_BORDER, STOCK_TEXT_MUTED } from '@/lib/stockTheme';
import { formatMoney, formatQuantity } from '@/lib/tossFormat';
import { createClientOrderId } from '@/lib/tossOrderId';
import { stepPrice } from '@/lib/tossTick';
import { useTossOrderable } from '@/hooks/useTossOrderable';
import { api } from '@/lib/api';

/** 1억원 이상 주문은 토스가 별도 확인 플래그를 요구한다. */
const HIGH_VALUE_THRESHOLD_KRW = 100_000_000;

/**
 * 확인 화면에 들어온 직후 제출 버튼을 잠가 두는 시간.
 * 모바일에서 "확인"을 누른 손가락이 그대로 같은 자리의 "주문하기"에 떨어지는 사고를 막는다.
 */
const SUBMIT_ARM_DELAY_MS = 800;

export interface TossOrderTarget {
  symbol: string;
  name: string;
  marketCountry: TossMarketCountry;
  securityType: TossSecurityType;
  locSupported: boolean;
}

interface TossOrderSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  owner: string;
  target: TossOrderTarget | null;
  initialSide: TossOrderSide;
  /** 주문이 접수되면 미체결 목록과 자산을 다시 받게 한다. */
  onOrderPlaced: () => void;
}

/**
 * 주문 시트.
 *
 * **입력 → 확인 2단계**다. 돈이 실제로 움직이는 동작이라 한 번의 탭으로 끝나면 안 된다.
 *
 * 시트 상태를 목록 항목 안이 아니라 <b>페이지</b>가 들고 있어야 한다는 점이 중요하다 —
 * 목록이 리렌더될 때 항목이 언마운트되면 열려 있던 시트가 함께 사라진다.
 */
const TossOrderSheet: React.FC<TossOrderSheetProps> = ({
  open,
  onOpenChange,
  owner,
  target,
  initialSide,
  onOrderPlaced,
}) => {
  const [side, setSide] = useState<TossOrderSide>(initialSide);
  const [mode, setMode] = useState<TossOrderMode>('LIMIT');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [step, setStep] = useState<'form' | 'confirm'>('form');
  const [highValueConfirmed, setHighValueConfirmed] = useState(false);
  const [highValueRequired, setHighValueRequired] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitArmed, setSubmitArmed] = useState(false);

  /**
   * 멱등키. 주문 내용이 바뀌면 새로 발급한다 —
   * 같은 키로 다른 내용을 보내면 토스가 `422 idempotency-key-conflict` 를 낸다.
   */
  const [clientOrderId, setClientOrderId] = useState(createClientOrderId);

  /**
   * 현재가 자동 채움을 이미 한 종목.
   *
   * 이 값을 상태가 아니라 ref 로 두는 것이 요점이다 — "채웠는가"는 렌더에 영향을 주지 않는
   * 기록일 뿐이고, 무엇보다 <b>가격 입력값을 effect 의존성에 넣지 않기 위해서</b>다.
   * 의존성에 넣으면 사용자가 입력을 지우는 행위 자체가 effect 를 다시 실행시켜 곧바로 되채워진다.
   */
  const prefilledSymbolRef = useRef<string | null>(null);

  const { orderable, status } = useTossOrderable(owner, open ? (target?.symbol ?? null) : null, side);

  const currency = orderable?.currency ?? (target?.marketCountry === 'US' ? 'USD' : 'KRW');
  const marketCountry = target?.marketCountry ?? 'KR';
  const securityType = target?.securityType ?? 'STOCK';
  // LOC 은 토스가 미국 지정가에만 허용한다. 국내 종목에서는 아예 그리지 않는다(비활성이 아니라 미렌더).
  const locSupported = orderable?.locSupported ?? target?.locSupported ?? false;

  const quantityValue = Number(quantity) || 0;
  const priceValue = Number(price) || 0;
  const isLimitLike = mode === 'LIMIT' || mode === 'LOC';
  const estimatedAmount = isLimitLike ? quantityValue * priceValue : 0;

  // 화면이 1억을 넘겼다고 판단하면 먼저 확인을 받는다. 판단이 빗나가도(USD 주문 등)
  // 토스가 400 으로 알려 주므로 그때 같은 체크박스를 드러낸다.
  const highValueByEstimate = currency === 'KRW' && estimatedAmount >= HIGH_VALUE_THRESHOLD_KRW;
  const needsHighValueConfirm = highValueByEstimate || highValueRequired;

  // 시트를 열 때마다 입력을 초기화한다. 이전 종목의 수량이 남아 있으면 사고가 난다.
  useEffect(() => {
    if (!open) return;
    setSide(initialSide);
    setMode('LIMIT');
    setQuantity('');
    setPrice('');
    setStep('form');
    setHighValueConfirmed(false);
    setHighValueRequired(false);
    setSubmitError(null);
    setSubmitting(false);
    setClientOrderId(createClientOrderId());
    // 다른 종목으로 열렸다면 그 종목의 현재가로 다시 한 번 채워야 한다.
    prefilledSymbolRef.current = null;
  }, [open, target?.symbol, initialSide]);

  /**
   * 현재가를 가격 입력의 출발점으로 <b>딱 한 번</b> 채운다.
   *
   * "비어 있으면 채운다"로 두면 안 된다 — 그러면 사용자가 가격을 지우는 순간 다시 채워져,
   * 다른 가격을 입력하려고 지운 사람이 지울 수조차 없게 된다. 자동 채움은 편의이지 규칙이 아니므로
   * 한 번 제안한 뒤로는 입력값을 사용자에게 완전히 넘긴다.
   *
   * 그래서 판단 기준을 "지금 비었는가"가 아니라 "이 종목에 대해 이미 채웠는가"로 바꾼다.
   */
  useEffect(() => {
    const symbol = target?.symbol;
    if (!open || !symbol) return;
    if (prefilledSymbolRef.current === symbol) return;
    if (orderable?.lastPrice == null) return;

    prefilledSymbolRef.current = symbol;
    setPrice(String(orderable.lastPrice));
  }, [open, target?.symbol, orderable?.lastPrice]);

  // 주문 내용이 바뀌면 멱등키를 새로 발급한다(같은 키 + 다른 내용 = 422).
  useEffect(() => {
    setClientOrderId(createClientOrderId());
  }, [side, mode, quantity, price]);

  // 확인 화면에 들어온 직후에는 제출을 잠가 둔다.
  useEffect(() => {
    if (step !== 'confirm') {
      setSubmitArmed(false);
      return;
    }
    const timer = setTimeout(() => setSubmitArmed(true), SUBMIT_ARM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [step]);

  const modes: TossOrderMode[] = useMemo(
    () => (locSupported ? ['LIMIT', 'MARKET', 'LOC'] : ['LIMIT', 'MARKET']),
    [locSupported]
  );

  const modeLabel: Record<TossOrderMode, string> = {
    LIMIT: '지정가',
    MARKET: '시장가',
    LOC: 'LOC',
  };

  const handleStepPrice = (direction: 'up' | 'down'): void => {
    // 입력을 비워 둔 상태에서 누르면 0 에서 한 칸(국내 기준 1원)이 되어 쓸모가 없다.
    // 자동 채움을 한 번만 하도록 바꾼 뒤로는 비어 있는 상태가 정상적으로 존재하므로,
    // 그때는 현재가를 기준으로 삼아 다시 현재가 근처로 돌아올 길을 남긴다.
    const base = price === '' ? (orderable?.lastPrice ?? 0) : priceValue;
    setPrice(String(stepPrice(base, marketCountry, securityType, direction)));
  };

  const handleMax = (): void => {
    if (side === 'SELL') {
      if (orderable?.sellableQuantity != null) setQuantity(String(Math.floor(orderable.sellableQuantity)));
      return;
    }
    if (orderable?.cashBuyingPower != null && priceValue > 0) {
      setQuantity(String(Math.floor(orderable.cashBuyingPower / priceValue)));
    }
  };

  const formValid = quantityValue > 0 && (!isLimitLike || priceValue > 0);

  const handleSubmit = async (): Promise<void> => {
    if (!target) return;
    setSubmitting(true);
    setSubmitError(null);

    const request: TossPlaceOrderRequest = {
      owner,
      symbol: target.symbol,
      side,
      // LOC 은 별도 호가 유형이 아니라 지정가 + 종가 조건이다.
      orderType: mode === 'MARKET' ? 'MARKET' : 'LIMIT',
      timeInForce: mode === 'LOC' ? 'CLS' : 'DAY',
      quantity: String(quantityValue),
      ...(isLimitLike ? { price: String(priceValue) } : {}),
      clientOrderId,
      confirmHighValueOrder: needsHighValueConfirm ? highValueConfirmed : false,
    };

    try {
      await api.placeTossOrder(request);
      onOrderPlaced();
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : '주문에 실패했습니다.';
      // 시트를 닫지 않는다 — 입력을 되살릴 수 있어야 한다.
      if (message.includes('금액 확인')) {
        // 우리 추정이 빗나갔다(USD 주문 등). 같은 체크박스를 드러내고 다시 받는다.
        setHighValueRequired(true);
        // 본문이 바뀌므로 멱등키를 새로 발급해야 422 를 피한다.
        setClientOrderId(createClientOrderId());
      }
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!target) return null;

  const money = (amount: number): string => formatMoney(amount, currency);

  const sideLabel = side === 'BUY' ? '매수' : '매도';

  const summaryRow = (label: string, value: React.ReactNode) => (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className={cn('text-sm', STOCK_TEXT_MUTED)}>{label}</span>
      <span className="text-right font-medium tabular-nums text-gray-900 dark:text-gray-100">{value}</span>
    </div>
  );

  const formStep = (
    <div className="space-y-5">
      {/* 매수 / 매도 */}
      <div role="radiogroup" aria-label="매수 매도 선택" className={cn('grid grid-cols-2 overflow-hidden rounded-lg border', STOCK_BORDER)}>
        {(['BUY', 'SELL'] as TossOrderSide[]).map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={side === value}
            onClick={() => setSide(value)}
            className={cn(
              'min-h-[48px] text-sm font-semibold transition-colors',
              side === value
                ? value === 'BUY'
                  ? 'bg-red-500 text-white'
                  : 'bg-blue-500 text-white'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {value === 'BUY' ? '매수' : '매도'}
          </button>
        ))}
      </div>

      {/* 호가 유형. LOC 은 미국 종목에서만 목록에 들어간다. */}
      <div role="radiogroup" aria-label="주문 유형 선택" className={cn('flex overflow-hidden rounded-lg border', STOCK_BORDER)}>
        {modes.map((value) => (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={mode === value}
            onClick={() => setMode(value)}
            className={cn(
              'min-h-[44px] flex-1 text-sm font-medium transition-colors',
              mode === value
                ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900'
                : 'text-gray-600 dark:text-gray-400'
            )}
          >
            {modeLabel[value]}
          </button>
        ))}
      </div>

      {mode === 'LOC' && (
        <p className={cn('text-xs', STOCK_TEXT_MUTED)}>
          종가가 지정한 가격보다 유리할 때만 종가로 체결됩니다.
        </p>
      )}

      {/* 가격 — 시장가에는 없다 */}
      {isLimitLike && (
        <div className="space-y-1.5">
          <label htmlFor="toss-order-price" className={cn('text-sm', STOCK_TEXT_MUTED)}>
            주문 가격
          </label>
          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="icon" aria-label="가격 내리기" onClick={() => handleStepPrice('down')}>
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              id="toss-order-price"
              inputMode="decimal"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              className="min-h-[48px] text-right tabular-nums"
            />
            <Button type="button" variant="outline" size="icon" aria-label="가격 올리기" onClick={() => handleStepPrice('up')}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {orderable?.upperLimitPrice != null && orderable?.lowerLimitPrice != null && (
            <p className={cn('text-xs tabular-nums', STOCK_TEXT_MUTED)}>
              상한 {money(orderable.upperLimitPrice)} · 하한 {money(orderable.lowerLimitPrice)}
            </p>
          )}
        </div>
      )}

      {/* 수량 */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="toss-order-quantity" className={cn('text-sm', STOCK_TEXT_MUTED)}>
            주문 수량
          </label>
          <button
            type="button"
            onClick={handleMax}
            className="min-h-[32px] px-2 text-xs font-medium text-blue-600 dark:text-blue-400"
          >
            최대
          </button>
        </div>
        <Input
          id="toss-order-quantity"
          inputMode="numeric"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value.replace(/[^0-9]/g, ''))}
          placeholder="0"
          className="min-h-[48px] text-right tabular-nums"
        />
        {side === 'BUY' ? (
          <p className={cn('text-xs tabular-nums', STOCK_TEXT_MUTED)}>
            주문가능금액 {orderable?.cashBuyingPower != null ? money(orderable.cashBuyingPower) : '—'}
          </p>
        ) : (
          <p className={cn('text-xs tabular-nums', STOCK_TEXT_MUTED)}>
            매도가능수량{' '}
            {orderable?.sellableQuantity != null ? `${formatQuantity(orderable.sellableQuantity)}주` : '—'}
          </p>
        )}
      </div>

      {status === 'error' && (
        <p className={cn('text-xs', STOCK_TEXT_MUTED)}>
          시세를 불러오지 못했어요. 가격을 직접 입력하면 그대로 주문할 수 있습니다.
        </p>
      )}

      <div className={cn('border-t pt-4', STOCK_BORDER)}>
        {isLimitLike && summaryRow('예상 주문금액', money(estimatedAmount))}
        <Button
          type="button"
          className="mt-2 min-h-[52px] w-full text-base"
          disabled={!formValid}
          onClick={() => setStep('confirm')}
        >
          {sideLabel} 확인
        </Button>
      </div>
    </div>
  );

  const confirmStep = (
    <div className="space-y-5">
      <div className={cn('rounded-lg border p-4', STOCK_BORDER)}>
        {summaryRow('종목', `${target.name} (${target.symbol})`)}
        {summaryRow('구분', sideLabel)}
        {summaryRow('유형', modeLabel[mode])}
        {summaryRow('수량', `${formatQuantity(quantityValue)}주`)}
        {isLimitLike && summaryRow('가격', money(priceValue))}
        <div className={cn('mt-2 border-t pt-2', STOCK_BORDER)}>
          {isLimitLike
            ? summaryRow('예상 주문금액', money(estimatedAmount))
            : summaryRow('예상 주문금액', '시장가 — 체결 시점 가격')}
          {side === 'BUY'
            ? summaryRow(
                '주문가능금액',
                orderable?.cashBuyingPower != null ? money(orderable.cashBuyingPower) : '—'
              )
            : summaryRow(
                '매도가능수량',
                orderable?.sellableQuantity != null ? `${formatQuantity(orderable.sellableQuantity)}주` : '—'
              )}
        </div>
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
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : '주문하기'}
        </Button>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <span className="truncate">{target.name}</span>
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

export default TossOrderSheet;
