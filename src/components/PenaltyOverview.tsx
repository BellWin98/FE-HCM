import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { PenaltyPayment, PenaltyRecord, RoomMember } from '@/types';

interface PenaltyOverviewProps {
  roomId: number;
  roomMembers: RoomMember[];
  currentUserId: number;
}

type WeekKey = string; // yyyy-MM-dd~yyyy-MM-dd

export const PenaltyOverview: React.FC<PenaltyOverviewProps> = ({ roomId, roomMembers, currentUserId }) => {
  const [records, setRecords] = useState<PenaltyRecord[]>([]);
  const [paymentsMap, setPaymentsMap] = useState<Record<number, PenaltyPayment[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const [selectedYear, setSelectedYear] = useState<string>('');
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // 01~12
  const [selectedWeek, setSelectedWeek] = useState<WeekKey | ''>('');
  const [memberFilter, setMemberFilter] = useState<string>('ALL'); // ALL | ME | userId

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const recs = await api.getPenaltyRecords(roomId) as PenaltyRecord[];
        setRecords(recs);

        // Load payments for all records in parallel
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
  }, [roomId]);

  // 년/월/주 옵션 계산
  const { yearOptions, monthOptions, weekOptions } = useMemo(() => {
    const yearSet = new Set<string>();
    const monthSetByYear = new Map<string, Set<string>>();
    const weeksByYearMonth = new Map<string, Set<WeekKey>>();

    for (const r of records) {
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
  }, [records, selectedYear, selectedMonth]);

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

  const filtered = useMemo(() => {
    const [s, e] = selectedWeek ? selectedWeek.split('~') : ['', ''];
    return records.filter(r => {
      const byYear = selectedYear ? r.weekStartDate.startsWith(selectedYear) : true;
      const byMonth = selectedMonth ? r.weekStartDate.substring(5, 7) === selectedMonth : true;
      const byWeek = selectedWeek ? r.weekStartDate.startsWith(s) && r.weekEndDate.startsWith(e) : true;
      if (!(byYear && byMonth && byWeek)) return false;
      if (memberFilter === 'ALL') return true;
      if (memberFilter === 'ME') return String(r.userId) === String(currentUserId);
      return String(r.userId) === String(memberFilter);
    });
  }, [records, selectedYear, selectedMonth, selectedWeek, memberFilter, currentUserId]);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="space-y-3">
          <div className="text-base sm:text-lg">벌금 현황 (주차/멤버별)</div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full">
            <Select value={selectedYear} onValueChange={(v) => { setSelectedYear(v); setSelectedMonth(''); setSelectedWeek(''); }}>
              <SelectTrigger className="w-full sm:w-36 h-10 text-sm" aria-label="연도 선택">
                <SelectValue placeholder="연도" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(y => (
                  <SelectItem key={y} value={y}>{y}년</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedMonth} onValueChange={(v) => { setSelectedMonth(v); setSelectedWeek(''); }}>
              <SelectTrigger className="w-full sm:w-32 h-10 text-sm" aria-label="월 선택">
                <SelectValue placeholder="월" />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map(m => (
                  <SelectItem key={m} value={m}>{Number(m)}월</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedWeek} onValueChange={setSelectedWeek}>
              <SelectTrigger className="w-full sm:flex-1 h-10 text-sm" aria-label="주차 선택" disabled={!selectedMonth}>
                <SelectValue placeholder="주차" />
              </SelectTrigger>
              <SelectContent>
                {weekOptions.map(week => (
                  <SelectItem key={week} value={week}>{week}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={memberFilter} onValueChange={setMemberFilter}>
              <SelectTrigger className="w-full sm:w-44 h-10 text-sm" aria-label="멤버 필터">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">전체 멤버</SelectItem>
                <SelectItem value="ME">나</SelectItem>
                {roomMembers.map(m => (
                  <SelectItem key={m.id} value={String(m.id)}>{m.nickname}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 요약 영역 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-3 sm:mb-4">
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-[11px] sm:text-xs text-gray-500">벌금합계</div>
            <div className="text-sm sm:text-base font-semibold">{totals.penalty.toLocaleString()}원</div>
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-[11px] sm:text-xs text-gray-500">납부합계</div>
            <div className="text-sm sm:text-base font-semibold">{totals.paid.toLocaleString()}원</div>
          </div>
          <div className="rounded-md bg-gray-50 p-3 text-center">
            <div className="text-[11px] sm:text-xs text-gray-500">잔여합계</div>
            <div className={`text-sm sm:text-base font-semibold ${totals.remain > 0 ? 'text-red-600' : ''}`}>{totals.remain.toLocaleString()}원</div>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
            <div className="h-20 bg-gray-100 rounded animate-pulse" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-8 text-gray-500">해당 조건의 데이터가 없습니다.</div>
        ) : (
          <div className="space-y-2 sm:space-y-3">
            {filtered
              .sort((a, b) => Number(a.userId) - Number(b.userId))
              .map(r => {
                const paid = calcPaid(r.id);
                const remain = Math.max(0, r.penaltyAmount - paid);
                const nickname = memberMap.get(String(r.userId)) || `회원 ${r.userId}`;
                const status: { text: string; variant: 'default' | 'secondary' | 'destructive' } =
                  r.penaltyAmount === 0
                    ? { text: '벌금 없음', variant: 'secondary' }
                    : paid >= r.penaltyAmount
                    ? { text: '납부완료', variant: 'default' }
                    : paid > 0
                    ? { text: '부분납부', variant: 'secondary' }
                    : { text: '미납부', variant: 'destructive' };

                return (
                  <button key={r.id} className="w-full text-left border rounded-lg p-3 sm:p-4 active:opacity-90">
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5 sm:space-y-1">
                        <div className="font-medium text-sm sm:text-base truncate max-w-[70vw] sm:max-w-none">{nickname}</div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {r.weekStartDate.substring(0, 10)} ~ {r.weekEndDate.substring(0, 10)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          목표 {r.requiredWorkouts}회 / 실제 {r.actualWorkouts}회
                        </div>
                      </div>
                      <Badge variant={status.variant}>{status.text}</Badge>
                    </div>

                    <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-3">
                      <div>
                        <div className="text-[11px] sm:text-xs text-gray-500">벌금</div>
                        <div className="text-sm sm:text-base font-semibold">{r.penaltyAmount.toLocaleString()}원</div>
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs text-gray-500">납부합계</div>
                        <div className="text-sm sm:text-base font-semibold">{paid.toLocaleString()}원</div>
                      </div>
                      <div>
                        <div className="text-[11px] sm:text-xs text-gray-500">잔여</div>
                        <div className={`text-sm sm:text-base font-semibold ${remain > 0 ? 'text-red-600' : ''}`}>{remain.toLocaleString()}원</div>
                      </div>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PenaltyOverview;


