import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { api } from '@/lib/api';
import { formatDateToYmd, getTodayYmd } from '@/lib/workoutRoomRules';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { PenaltyPayment, PenaltyRecord, RoomMember } from '@/types';

interface PenaltyOverviewProps {
  roomId: number;
  roomMembers: RoomMember[];
  currentUserId: number;
}

type WeekKey = string; // yyyy-MM-dd~yyyy-MM-dd
type PeriodType = 'year' | 'month' | 'week' | 'custom';

const getDefaultCustomRange = (): { start: string; end: string } => {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start: formatDateToYmd(first), end: getTodayYmd() };
};

export const PenaltyOverview: React.FC<PenaltyOverviewProps> = ({ roomId, roomMembers, currentUserId }) => {
  const [optionRecords, setOptionRecords] = useState<PenaltyRecord[]>([]);
  const [records, setRecords] = useState<PenaltyRecord[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<number, PenaltyPayment[]>>({});
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const [periodType, setPeriodType] = useState<PeriodType>('week');
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // 01~12
  const [selectedWeek, setSelectedWeek] = useState<WeekKey | ''>('');
  const [customStartDate, setCustomStartDate] = useState<string>(() => getDefaultCustomRange().start);
  const [customEndDate, setCustomEndDate] = useState<string>(() => getDefaultCustomRange().end);
  const [memberFilter, setMemberFilter] = useState<string>('ALL'); // ALL | ME | userId

  // 서버에 넘길 기간: 선택에 따라 startDate/endDate 계산
  const requestRange = useMemo((): { startDate: string; endDate: string } | null => {
    if (periodType === 'year' && selectedYear) {
      return { startDate: `${selectedYear}-01-01`, endDate: `${selectedYear}-12-31` };
    }
    if (periodType === 'month' && selectedYear && selectedMonth) {
      const y = Number(selectedYear);
      const m = Number(selectedMonth);
      const lastDay = new Date(y, m, 0).getDate();
      return {
        startDate: `${selectedYear}-${selectedMonth}-01`,
        endDate: `${selectedYear}-${selectedMonth}-${String(lastDay).padStart(2, '0')}`,
      };
    }
    if (periodType === 'week' && selectedWeek) {
      const [s, e] = selectedWeek.split('~');
      if (s && e) return { startDate: s, endDate: e };
    }
    if (periodType === 'custom' && customStartDate && customEndDate) {
      return { startDate: customStartDate, endDate: customEndDate };
    }
    return null;
  }, [periodType, selectedYear, selectedMonth, selectedWeek, customStartDate, customEndDate]);

  // 옵션용 전체 조회 (연/월/주 드롭다운용)
  useEffect(() => {
    const load = async () => {
      setIsLoadingOptions(true);
      try {
        const recs = await api.getPenaltyRecords(roomId) as PenaltyRecord[];
        setOptionRecords(recs);
      } finally {
        setIsLoadingOptions(false);
      }
    };
    load();
  }, [roomId]);

  // 기간별 목록 조회 (서버에 startDate/endDate 전달)
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const recs = (requestRange
          ? await api.getPenaltyRecords(roomId, requestRange)
          : await api.getPenaltyRecords(roomId)) as PenaltyRecord[];
        setRecords(recs);

        const entries: Array<[number, PenaltyPayment[]]> = await Promise.all(
          recs.map(async (r) => {
            try {
              const pays = await api.getPenaltyPayments(r.id) as PenaltyPayment[];
              return [r.id, pays] as [number, PenaltyPayment[]];
            } catch {
              return [r.id, [] as PenaltyPayment[]];
            }
          })
        );
        const map: Record<number, PenaltyPayment[]> = {};
        for (const [rid, pays] of entries) map[rid] = pays;
        setPaymentsMap(map);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [roomId, requestRange]);

  // 년/월/주 옵션 계산 (optionRecords 기준)
  const { yearOptions, monthOptions, weekOptions } = useMemo(() => {
    const yearSet = new Set<string>();
    const monthSetByYear = new Map<string, Set<string>>();
    const weeksByYearMonth = new Map<string, Set<WeekKey>>();

    for (const r of optionRecords) {
      const start = new Date(r.weekStartDate);
      const y = String(start.getFullYear());
      const m = String(start.getMonth() + 1).padStart(2, '0');
      const ym = `${y}-${m}`;
      const weekKey: WeekKey = `${r.weekStartDate.substring(0, 10)}~${r.weekEndDate.substring(0, 10)}`;

      yearSet.add(y);
      if (!monthSetByYear.has(y)) monthSetByYear.set(y, new Set<string>());
      monthSetByYear.get(y)!.add(m);

      if (!weeksByYearMonth.has(ym)) weeksByYearMonth.set(ym, new Set<WeekKey>());
      weeksByYearMonth.get(ym)!.add(weekKey);
    }

    const years = Array.from(yearSet).sort((a, b) => Number(b) - Number(a));
    const months = selectedYear
      ? Array.from(monthSetByYear.get(selectedYear) || new Set<string>())
          .sort((a, b) => Number(b) - Number(a))
      : [];
    const ymKey = selectedYear && selectedMonth ? `${selectedYear}-${selectedMonth}` : '';
    const weeks = ymKey
      ? Array.from(weeksByYearMonth.get(ymKey) || new Set<WeekKey>()).sort().reverse()
      : [];

    return { yearOptions: years, monthOptions: months, weekOptions: weeks };
  }, [optionRecords, selectedYear, selectedMonth]);

  // 초기/연쇄 선택값 세팅
  useEffect(() => {
    if (!selectedYear && yearOptions.length) {
      setSelectedYear(yearOptions[0]);
    }
  }, [yearOptions, selectedYear]);

  useEffect(() => {
    if (selectedYear && !selectedMonth && monthOptions.length) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [selectedYear, monthOptions, selectedMonth]);

  useEffect(() => {
    if (selectedYear && selectedMonth) {
      if (!selectedWeek && weekOptions.length) {
        setSelectedWeek(weekOptions[0]);
      }
      // 선택된 월이 바뀌면 기존 주차가 범위를 벗어날 수 있으므로 보정
      if (selectedWeek && !weekOptions.includes(selectedWeek)) {
        setSelectedWeek(weekOptions[0] || '');
      }
    } else if (selectedWeek) {
      setSelectedWeek('');
    }
  }, [selectedYear, selectedMonth, weekOptions, selectedWeek]);

  // 서버가 이미 기간으로 필터링한 records에
  // 연도/월(weekStartDate 기준) + 멤버 필터를 적용
  const filtered = useMemo(() => {
    return records.filter((r) => {
      const start = new Date(r.weekStartDate);
      const startYear = String(start.getFullYear());
      const startMonth = String(start.getMonth() + 1).padStart(2, '0');

      if (periodType === 'year' && selectedYear) {
        if (startYear !== selectedYear) return false;
      }

      if (periodType === 'month' && selectedYear && selectedMonth) {
        if (startYear !== selectedYear || startMonth !== selectedMonth) return false;
      }

      if (memberFilter === 'ALL') return true;
      if (memberFilter === 'ME') return String(r.workoutRoomMemberId) === String(currentUserId);
      return String(r.workoutRoomMemberId) === String(memberFilter);
    });
  }, [records, memberFilter, currentUserId, periodType, selectedYear, selectedMonth]);

  const memberMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of roomMembers) map.set(String(m.id), m.nickname);
    return map;
  }, [roomMembers]);

  const calcPaid = useCallback((recordId: number) => {
    const pays = paymentsMap[recordId] || [];
    return pays.reduce((s, p) => s + p.amount, 0);
  }, [paymentsMap]);

  const totals = useMemo(() => {
    const penalty = filtered.reduce((s, r) => s + r.penaltyAmount, 0);
    const paid = filtered.reduce((s, r) => s + calcPaid(r.id), 0);
    const remain = Math.max(0, penalty - paid);
    return { penalty, paid, remain };
  }, [filtered, calcPaid]);

  // 멤버별 그룹: workoutRoomMemberId 기준으로 묶고, 닉네임 순 정렬
  const groupedByMember = useMemo(() => {
    const map = new Map<string, PenaltyRecord[]>();
    for (const r of filtered) {
      const key = String(r.workoutRoomMemberId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }
    const result: Array<{ memberId: string; nickname: string; records: PenaltyRecord[] }> = [];
    for (const [memberId, recs] of map) {
      const nickname = memberMap.get(memberId) ?? `회원 ${memberId}`;
      const sorted = [...recs].sort(
        (a, b) => new Date(b.weekStartDate).getTime() - new Date(a.weekStartDate).getTime()
      );
      result.push({ memberId, nickname, records: sorted });
    }
    result.sort((a, b) => a.nickname.localeCompare(b.nickname, 'ko'));
    return result;
  }, [filtered, memberMap]);

  const handleCustomStartSelect = (date: Date | undefined) => {
    if (!date) return;
    const ymd = formatDateToYmd(date);
    setCustomStartDate(ymd);
    if (ymd > customEndDate) setCustomEndDate(ymd);
  };

  const handleCustomEndSelect = (date: Date | undefined) => {
    if (!date) return;
    setCustomEndDate(formatDateToYmd(date));
  };

  const customStartDateObj = useMemo(() => {
    if (!customStartDate) return undefined;
    const [y, m, d] = customStartDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [customStartDate]);

  const customEndDateObj = useMemo(() => {
    if (!customEndDate) return undefined;
    const [y, m, d] = customEndDate.split('-').map(Number);
    return new Date(y, m - 1, d);
  }, [customEndDate]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="space-y-3">
          <div className="text-base sm:text-xl font-bold">벌금 현황</div>

          <Tabs value={periodType} onValueChange={(v) => setPeriodType(v as PeriodType)} aria-label="조회 기간 타입">
            <TabsList className="grid w-full grid-cols-4 h-10">
              <TabsTrigger value="year" className="text-xs sm:text-sm">연간</TabsTrigger>
              <TabsTrigger value="month" className="text-xs sm:text-sm">월간</TabsTrigger>
              <TabsTrigger value="week" className="text-xs sm:text-sm">주간</TabsTrigger>
              <TabsTrigger value="custom" className="text-xs sm:text-sm">기간 지정</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            {periodType === 'custom' ? (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full sm:w-40 justify-start text-left font-normal h-10 text-sm',
                        !customStartDate && 'text-muted-foreground'
                      )}
                      aria-label="조회 시작일 선택"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {customStartDate ? format(customStartDateObj!, 'PPP', { locale: ko }) : '시작일'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customStartDateObj}
                      onSelect={handleCustomStartSelect}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full sm:w-40 justify-start text-left font-normal h-10 text-sm',
                        !customEndDate && 'text-muted-foreground'
                      )}
                      aria-label="조회 종료일 선택"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
                      {customEndDate ? format(customEndDateObj!, 'PPP', { locale: ko }) : '종료일'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={customEndDateObj}
                      onSelect={handleCustomEndSelect}
                      disabled={(date) => {
                        const ymd = formatDateToYmd(date);
                        return ymd < customStartDate;
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </>
            ) : (
              <>
                <Select
                  value={selectedYear}
                  onValueChange={(v) => {
                    setSelectedYear(v);
                    setSelectedMonth('');
                    setSelectedWeek('');
                  }}
                >
                  <SelectTrigger className="w-full sm:w-36 h-10 text-sm" aria-label="연도 선택" disabled={isLoadingOptions}>
                    <SelectValue placeholder="연도" />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={y}>{y}년</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {(periodType === 'month' || periodType === 'week') && (
                  <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); setSelectedWeek(''); }}>
                    <SelectTrigger className="w-full sm:w-32 h-10 text-sm" aria-label="월 선택" disabled={isLoadingOptions}>
                      <SelectValue placeholder="월" />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((m) => (
                        <SelectItem key={m} value={m}>{Number(m)}월</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {periodType === 'week' && (
                  <Select value={selectedWeek} onValueChange={setSelectedWeek}>
                    <SelectTrigger className="w-full sm:flex-1 h-10 text-sm" aria-label="주차 선택" disabled={!selectedMonth}>
                      <SelectValue placeholder="주차" />
                    </SelectTrigger>
                    <SelectContent>
                      {weekOptions.map((week) => (
                        <SelectItem key={week} value={week}>{week}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 요약 영역 */}
        <div className="grid grid-cols-1 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-[11px] sm:text-xs text-gray-500">벌금합계</div>
            <div className="text-sm sm:text-base font-semibold">{totals.penalty.toLocaleString()}원</div>
          </div>
          {/* <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-[11px] sm:text-xs text-gray-500">납부합계</div>
            <div className="text-sm sm:text-base font-semibold">{totals.paid.toLocaleString()}원</div>
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-[11px] sm:text-xs text-gray-500">잔여합계</div>
            <div className={`text-sm sm:text-base font-semibold ${totals.remain > 0 ? 'text-red-600' : ''}`}>{totals.remain.toLocaleString()}원</div>
          </div> */}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : groupedByMember.length === 0 ? (
          <div className="text-center py-8 text-gray-500">벌금 내역이 없습니다.</div>
        ) : (
          <div className="space-y-6">
            {groupedByMember.map(({ memberId, nickname, records }) => {
              const memberPenaltySum = records.reduce((s, r) => s + r.penaltyAmount, 0);
              return (
                <section
                  key={memberId}
                  className="rounded-lg border bg-gray-50/50 p-3 sm:p-4 space-y-2 sm:space-y-3"
                  aria-label={`${nickname} 벌금 내역`}
                >
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-200">
                    <h3 className="font-semibold text-sm sm:text-base truncate max-w-[70vw] sm:max-w-none">
                      {nickname}
                    </h3>
                    <span className="text-xs sm:text-sm text-gray-600 shrink-0">
                      기간 내 합계 <strong>{memberPenaltySum.toLocaleString()}원</strong>
                    </span>
                  </div>
                  <div className="space-y-2">
                    {records.map((r) => (
                        <button
                          key={r.id}
                          className="w-full text-left border rounded-lg p-3 sm:p-4 bg-white active:opacity-90"
                          type="button"
                          aria-label={`${r.weekStartDate.substring(0, 10)} ~ ${r.weekEndDate.substring(0, 10)} 주차 벌금 ${r.penaltyAmount.toLocaleString()}원`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5 sm:space-y-1">
                              <div className="text-xs sm:text-sm text-gray-500">
                                {r.weekStartDate.substring(0, 10)} ~ {r.weekEndDate.substring(0, 10)}
                              </div>
                              <div className="text-xs sm:text-sm text-gray-500">
                                목표 {r.requiredWorkouts}회 / 실제 {r.actualWorkouts}회
                              </div>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:gap-4 mt-3">
                            <div>
                              <div className="text-[11px] sm:text-xs text-gray-500">벌금</div>
                              <div className="text-sm sm:text-base font-semibold">{r.penaltyAmount.toLocaleString()}원</div>
                            </div>
                          </div>
                        </button>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PenaltyOverview;


