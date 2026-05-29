import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { ChatMessage, RoomMember } from '@/types';
import { isSystemChatType } from '@/types';
import { AdminStateBlock } from '@/components/admin/AdminStateBlock';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';

type AdminRoomChatTabProps = {
  roomId: number;
  members: RoomMember[];
  active: boolean;
};

type ChatMessageWithDisplay = ChatMessage & {
  displayTime?: string;
  displayDate?: string;
  isFirstOfGroup?: boolean;
  showAvatar?: boolean;
  showNickname?: boolean;
  profileUrl?: string;
};

const formatTimestamp = (timestamp?: string | number | Date | null): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const period = hours < 12 ? '오전' : '오후';
    const hour12 = hours % 12 === 0 ? 12 : hours % 12;
    return `${period} ${hour12}:${minutes}`;
  } catch {
    return '';
  }
};

const formatDateLabel = (timestamp?: string | number | Date | null): string => {
  if (!timestamp) return '';
  try {
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return '';
    const today = new Date();
    const isSameDay =
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate();

    if (isSameDay) return '오늘';

    const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const weekday = weekdayNames[date.getDay()];
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${weekday}`;
  } catch {
    return '';
  }
};

const decorateMessages = (
  rawMessages: ChatMessageWithDisplay[],
  memberByNickname: Map<string, RoomMember>,
): ChatMessageWithDisplay[] => {
  return rawMessages.map((msg, index, arr) => {
    const prev = arr[index - 1];
    const currentDateLabel = formatDateLabel(msg.timestamp);
    const prevDateLabel = prev ? formatDateLabel(prev.timestamp) : undefined;
    const isDifferentSender = !prev || prev.sender !== msg.sender;
    const isDifferentDate = !prev || currentDateLabel !== prevDateLabel;
    const isFirstOfGroup = isDifferentSender || isDifferentDate;
    const memberInfo = memberByNickname.get(msg.sender);

    return {
      ...msg,
      displayTime: msg.displayTime ?? formatTimestamp(msg.timestamp),
      displayDate: currentDateLabel,
      isFirstOfGroup,
      showAvatar: isFirstOfGroup,
      showNickname: isFirstOfGroup,
      profileUrl: memberInfo?.profileUrl,
    };
  });
};

export const AdminRoomChatTab = ({ roomId, members, active }: AdminRoomChatTabProps) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessageWithDisplay[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [enlargedImageUrl, setEnlargedImageUrl] = useState<string | null>(null);

  const memberByNickname = useMemo(
    () => new Map(members.map((m) => [m.nickname, m])),
    [members],
  );

  const visibleMessages = useMemo(
    () => messages.filter((msg) => !isSystemChatType(msg.type)),
    [messages],
  );

  const loadInitial = useCallback(async () => {
    if (!Number.isFinite(roomId)) return;
    setIsInitialLoading(true);
    setLoadError(null);
    try {
      const { messages: initialMessages, nextCursorId, hasNext } = await api.getAdminChatHistory(roomId);
      const mapped = (initialMessages ?? []).map((msg) => ({
        ...msg,
        displayTime: formatTimestamp(msg.timestamp),
        displayDate: formatDateLabel(msg.timestamp),
      }));
      setMessages(decorateMessages(mapped, memberByNickname));
      setNextCursor(nextCursorId);
      setHasMore(hasNext);
      setHasFetched(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '채팅 내역을 불러오지 못했습니다.';
      setLoadError(msg);
      setHasFetched(true);
    } finally {
      setIsInitialLoading(false);
    }
  }, [roomId, memberByNickname]);

  useEffect(() => {
    if (!active || hasFetched) return;
    void loadInitial();
  }, [active, hasFetched, loadInitial]);

  useEffect(() => {
    setMessages([]);
    setNextCursor(null);
    setHasMore(false);
    setLoadError(null);
    setHasFetched(false);
    setEnlargedImageUrl(null);
  }, [roomId]);

  useEffect(() => {
    if (!hasFetched || isInitialLoading || loadError) return;
    const scrollContainer = scrollContainerRef.current;
    if (scrollContainer) {
      scrollContainer.scrollTop = scrollContainer.scrollHeight;
    }
  }, [hasFetched, isInitialLoading, loadError, visibleMessages.length]);

  const fetchOlderMessages = useCallback(async () => {
    if (!hasMore || isLoadingOlder || nextCursor == null) return;

    setIsLoadingOlder(true);
    try {
      const { messages: olderMessages, nextCursorId, hasNext } = await api.getAdminChatHistory(
        roomId,
        nextCursor,
      );

      const scrollContainer = scrollContainerRef.current;
      const prevScrollHeight = scrollContainer?.scrollHeight ?? 0;

      const mappedOlder = (olderMessages ?? []).map((msg) => ({
        ...msg,
        displayTime: formatTimestamp(msg.timestamp),
        displayDate: formatDateLabel(msg.timestamp),
      }));

      setMessages((prev) => decorateMessages([...mappedOlder, ...prev], memberByNickname));
      setNextCursor(nextCursorId);
      setHasMore(hasNext);

      if (scrollContainer) {
        requestAnimationFrame(() => {
          scrollContainer.scrollTop = scrollContainer.scrollHeight - prevScrollHeight;
        });
      }
    } catch (err) {
      console.error('Failed to fetch older admin chat messages:', err);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [roomId, nextCursor, hasMore, isLoadingOlder, memberByNickname]);

  const handleScroll = useCallback(() => {
    const scrollTop = scrollContainerRef.current?.scrollTop ?? 0;
    if (scrollTop <= 20) {
      void fetchOlderMessages();
    }
  }, [fetchOlderMessages]);

  const handleImageKeyDown = useCallback((e: React.KeyboardEvent, url: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setEnlargedImageUrl(url);
    }
  }, []);

  if (!active) {
    return null;
  }

  if (isInitialLoading) {
    return <AdminStateBlock variant="loading" />;
  }

  if (loadError) {
    return (
      <AdminStateBlock
        variant="error"
        title="채팅 내역을 불러오지 못했습니다."
        description={loadError}
        onAction={() => setHasFetched(false)}
        actionLabel="다시 시도"
      />
    );
  }

  if (hasFetched && visibleMessages.length === 0) {
    return <AdminStateBlock variant="empty" description="채팅 내역이 없습니다." />;
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base md:text-lg">채팅 내역</CardTitle>
          <CardDescription>방 멤버들의 채팅 메시지를 읽기 전용으로 조회합니다.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          <div
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex min-h-[50vh] max-h-[60vh] flex-col overflow-x-hidden overflow-y-auto rounded-md bg-muted px-3 py-2 sm:min-h-[400px] sm:px-4 sm:py-3"
            role="log"
            aria-label="채팅 메시지 목록"
          >
            {isLoadingOlder && (
              <div className="flex items-center justify-center p-2">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
              </div>
            )}
            {!hasMore && visibleMessages.length > 0 && (
              <div className="mb-2 text-center text-[11px] text-muted-foreground">
                이전 대화가 더 이상 없습니다.
              </div>
            )}
            {visibleMessages.map((msg, index) => {
              const prev = visibleMessages[index - 1];
              const showDateDivider = !prev || prev.displayDate !== msg.displayDate;
              const isFirstOfGroup = msg.isFirstOfGroup ?? true;

              return (
                <div key={msg.id}>
                  {showDateDivider && msg.displayDate && (
                    <div className="my-3 flex items-center justify-center">
                      <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] text-muted-foreground">
                        {msg.displayDate}
                      </span>
                    </div>
                  )}
                  <div
                    className={`flex min-w-0 w-full justify-start ${isFirstOfGroup ? 'mt-2' : 'mt-0.5'}`}
                  >
                    <div className="mr-1.5 flex shrink-0 flex-col items-center">
                      {msg.showAvatar ? (
                        <Avatar className="h-8 w-8 shrink-0">
                          <AvatarImage src={msg.profileUrl} alt={msg.sender} />
                          <AvatarFallback className="text-xs">
                            {msg.sender?.slice(0, 2).toUpperCase() ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <div className="h-8 w-8" aria-hidden />
                      )}
                    </div>
                    <div className="flex min-w-0 max-w-[78%] flex-col items-start">
                      {msg.showNickname && (
                        <span className="mb-0.5 text-xs text-muted-foreground">{msg.sender}</span>
                      )}
                      <div className="flex min-w-0 items-end gap-1">
                        {msg.type === 'IMAGE' ? (
                          <button
                            type="button"
                            onClick={() => msg.imageUrl && setEnlargedImageUrl(msg.imageUrl)}
                            onKeyDown={(e) => msg.imageUrl && handleImageKeyDown(e, msg.imageUrl)}
                            className="cursor-pointer rounded-lg p-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            aria-label="이미지 크게 보기"
                          >
                            <img
                              src={msg.imageUrl}
                              alt="첨부 이미지"
                              className="max-h-40 max-w-[200px] rounded-lg"
                            />
                          </button>
                        ) : (
                          <span className="max-w-full whitespace-pre-wrap break-words rounded-2xl rounded-bl-md border border-border bg-card px-3 py-2 text-sm text-card-foreground shadow-sm">
                            {msg.content}
                          </span>
                        )}
                        <span className="shrink-0 pb-0.5 text-[10px] text-muted-foreground">
                          {msg.displayTime}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!enlargedImageUrl} onOpenChange={() => setEnlargedImageUrl(null)}>
        <DialogContent className="max-w-[min(100vw-2rem,42rem)] border-0 bg-transparent p-0 shadow-none">
          {enlargedImageUrl ? (
            <img
              src={enlargedImageUrl}
              alt="채팅 이미지 확대"
              className="max-h-[85vh] w-full rounded-lg object-contain"
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};
