"use client";

import { useEffect, useState } from "react";
import { Bell, Check, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

import {
  listNotificationsAction,
  markNotificationAsReadAction,
} from "@/app/actions/notifications";
import { NotificationComposer } from "@/components/notifications/notification-composer";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import type { Notification } from "@/lib/types/notifications";

const PAGE_SIZE = 10;

function formatNotificationDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("es-GT", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

export function NotificationBell({ canSend = false }: { canSend?: boolean }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | "all" | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);

  function applyPage(nextPage: number, data: { notifications: Notification[]; unreadCount: number }) {
    setPage(nextPage);
    setNotifications(data.notifications);
    setUnreadCount(data.unreadCount);
  }

  async function load(nextPage = page) {
    setLoading(true);
    setError(null);
    const result = await listNotificationsAction(nextPage);
    setLoading(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    applyPage(nextPage, result.data);
  }

  useEffect(() => {
    let active = true;
    void listNotificationsAction(1).then((result) => {
      if (!active) return;
      setLoading(false);
      if (!result.ok) {
        setError(result.message);
        return;
      }
      applyPage(1, result.data);
    });
    return () => {
      active = false;
    };
  }, []);

  async function markRead(notification: Notification) {
    if (notification.isRead || pendingId) return;
    setPendingId(notification.id);
    const result = await markNotificationAsReadAction(notification.id);
    setPendingId(null);
    if (!result.ok) {
      toast.error(result.message);
      return;
    }
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? result.notification : item
      )
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  async function markAllRead() {
    const unread = notifications.filter((notification) => !notification.isRead);
    if (unread.length === 0 || pendingId) return;
    setPendingId("all");
    const results = await Promise.all(
      unread.map((notification) => markNotificationAsReadAction(notification.id))
    );
    setPendingId(null);
    const failed = results.find((result) => !result.ok);
    if (failed && !failed.ok) {
      toast.error(failed.message);
      await load(page);
      return;
    }
    setNotifications((current) =>
      current.map((notification) => ({ ...notification, isRead: true }))
    );
    setUnreadCount((current) => Math.max(0, current - unread.length));
  }

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={
              unreadCount > 0
                ? `Notificaciones, ${unreadCount} sin leer`
                : "Notificaciones"
            }
            className="relative"
          >
            <Bell />
            {unreadCount > 0 ? (
              <span className="bg-destructive text-destructive-foreground absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-4">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            ) : null}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)]">
        <PopoverHeader className="flex-row items-center justify-between">
          <div>
            <PopoverTitle>Notificaciones</PopoverTitle>
            <PopoverDescription>
              {unreadCount > 0
                ? `${unreadCount} sin leer`
                : "Todo está al día"}
            </PopoverDescription>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={pendingId !== null || unreadCount === 0}
            onClick={() => void markAllRead()}
          >
            {pendingId === "all" ? <Loader2 className="animate-spin" /> : <Check />}
            Marcar todas
          </Button>
        </PopoverHeader>

        {loading ? (
          <div className="text-muted-foreground flex items-center justify-center gap-2 py-8 text-sm">
            <Loader2 className="animate-spin" />
            Cargando notificaciones…
          </div>
        ) : error ? (
          <ErrorState
            description={error}
            onRetry={() => void load(page)}
            className="py-4"
          />
        ) : notifications.length === 0 ? (
          <EmptyState
            title="No tienes notificaciones"
            description="Aquí aparecerán los avisos importantes del club."
            icon={Bell}
            className="py-8"
          />
        ) : (
          <div className="flex max-h-96 flex-col gap-1 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                className="hover:bg-muted/70 flex items-start gap-3 rounded-md p-3 text-left transition-colors"
                onClick={() => void markRead(notification)}
                disabled={pendingId !== null}
              >
                <span
                  className={`mt-1.5 size-2 shrink-0 rounded-full ${
                    notification.isRead ? "bg-muted" : "bg-primary"
                  }`}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{notification.title}</span>
                  <span className="text-muted-foreground mt-0.5 block text-xs">
                    {notification.message}
                  </span>
                  <span className="text-muted-foreground mt-1 block text-[11px]">
                    {formatNotificationDate(notification.createdAt)}
                  </span>
                </span>
                {pendingId === notification.id ? (
                  <Loader2 className="text-muted-foreground mt-1 size-4 shrink-0 animate-spin" />
                ) : null}
              </button>
            ))}
            {page > 1 || notifications.length === PAGE_SIZE ? (
              <div className="flex items-center justify-between border-t pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading || page === 1}
                  onClick={() => void load(page - 1)}
                >
                  Anteriores
                </Button>
                <span className="text-muted-foreground text-xs">Página {page}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading || notifications.length < PAGE_SIZE}
                  onClick={() => void load(page + 1)}
                >
                  Siguientes
                </Button>
              </div>
            ) : null}
          </div>
        )}

        {canSend ? (
          <div className="border-t pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => {
                setPopoverOpen(false);
                setComposerOpen(true);
              }}
            >
              <Send />
              Enviar aviso
            </Button>
          </div>
        ) : null}
        </PopoverContent>
      </Popover>

      {composerOpen ? (
        <NotificationComposer
          open
          onOpenChange={setComposerOpen}
          onSent={() => void load(1)}
        />
      ) : null}
    </>
  );
}
