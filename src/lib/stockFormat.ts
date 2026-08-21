export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);

export const formatPercentage = (rate: number): string =>
  `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}%`;

/** 국내 증시 관례에 따라 이익은 빨강, 손실은 파랑으로 표시한다. */
export const getProfitLossColor = (amount: number): string => {
  if (amount > 0) return 'text-red-500 dark:text-red-400';
  if (amount < 0) return 'text-blue-500 dark:text-blue-400';
  return 'text-gray-400 dark:text-gray-500';
};

export const getInitials = (stockName: string): string => {
  if (!stockName?.length) return '?';
  return stockName.replace(/\s/g, '').slice(0, 2).toUpperCase();
};
