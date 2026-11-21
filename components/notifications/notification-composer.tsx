"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CircleAlert, Search, Send, X } from "lucide-react";
import { toast } from "sonner";

import {
  searchNotificationRecipientsAction,
  sendNotificationAction,
} from "@/app/actions/notifications";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import {
  NOTIFICATION_MESSAGE_MAX,
  NOTIFICATION_RECIPIENTS_MAX,
  NOTIFICATION_SOURCES,
  NOTIFICATION_TITLE_MAX,
  type NotificationRecipient,
  type NotificationSource,
} from "@/lib/types/notifications";

const SEARCH_DEBOUNCE_MS = 300;

const SOURCE_LABELS: Record<NotificationSource, string> = {
  MEMBRESIA: "Membresía",
  CLASES: "Clases",
  PAGOS: "Pagos",
  EQUIPAMIENTO: "Equipamiento",
};

const REFERENCE_HINTS: Record<NotificationSource, string> = {
  MEMBRESIA: "ID de la membresía (opcional).",
  CLASES: "ID de la clase o de la sesión personal (opcional).",
  PAGOS: "ID del cobro (opcional).",
  EQUIPAMIENTO: "ID de la máquina (opcional).",
};

export interface NotificationComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Se invoca después de un envío exitoso para refrescar la campana. */
  onSent: () => void;
}

export function NotificationComposer({
  open,
  onOpenChange,
  onSent,
}: NotificationComposerProps) {
  const [query, setQuery] = useState("");
  const [recipients, setRecipients] = useState<NotificationRecipient[]>([]);
  const [selected, setSelected] = useState<NotificationRecipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [recipientsError, setRecipientsError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sourceModule, setSourceModule] =
    useState<NotificationSource>("MEMBRESIA");
  const [referenceId, setReferenceId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const requestId = useRef(0);
  const skipQuery = useRef(true);

  const loadRecipients = useCallback(async (search: string) => {
    const current = ++requestId.current;
    setLoadingRecipients(true);
    const result = await searchNotificationRecipientsAction(search);
    if (current !== requestId.current) return;
    setLoadingRecipients(false);
    if (!result.ok) {
      setRecipientsError(result.message);
      return;
    }
    setRecipientsError(null);
    setRecipients(result.recipients);
  }, []);

  useEffect(() => {
    if (!open) return;
    skipQuery.current = true;
    // El fetch inicial se difiere para no encadenar renders dentro del efecto.
    const timer = setTimeout(() => void loadRecipients(""), 0);
    return () => clearTimeout(timer);
  }, [open, loadRecipients]);

  useEffect(() => {
    if (!open) return;
    if (skipQuery.current) {
      skipQuery.current = false;
      return;
    }
    const timer = setTimeout(() => void loadRecipients(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [open, query, loadRecipients]);

  const selectedIds = new Set(selected.map((recipient) => recipient.id));

  function toggleRecipient(recipient: NotificationRecipient) {
    setFormError(null);
    if (selectedIds.has(recipient.id)) {
      setSelected((current) =>
        current.filter((item) => item.id !== recipient.id)
      );
      return;
    }
    if (selected.length >= NOTIFICATION_RECIPIENTS_MAX) {
      setFormError(
        `Puedes enviar a un máximo de ${NOTIFICATION_RECIPIENTS_MAX} personas por aviso.`
      );
      return;
    }
    setSelected((current) => [...current, recipient]);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (selected.length === 0) {
      setFormError("Selecciona al menos un destinatario.");
      return;
    }
    if (!title.trim()) {
      setFormError("El título es obligatorio.");
      return;
    }
    if (!message.trim()) {
      setFormError("El mensaje es obligatorio.");
      return;
    }

    setSending(true);
    const result = await sendNotificationAction({
      recipientIds: selected.map((recipient) => recipient.id),
      title,
      message,
      sourceModule,
      referenceId,
    });
    setSending(false);

    if (!result.ok) {
      setFormError(result.message);
      return;
    }

    toast.success(result.message);
    onSent();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !sending && onOpenChange(next)}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Enviar aviso</DialogTitle>
          <DialogDescription>
            Cada destinatario recibe una notificación propia en su campana.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel htmlFor="notification-recipient-search">
                Destinatarios
              </FieldLabel>
              <div className="flex gap-2">
                <Input
                  id="notification-recipient-search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Buscar por nombre, carné o correo"
                  autoComplete="off"
                  disabled={sending}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label="Buscar destinatarios"
                  disabled={sending || loadingRecipients}
                  onClick={() => void loadRecipients(query)}
                >
                  {loadingRecipients ? <Spinner /> : <Search />}
                </Button>
              </div>

              {selected.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {selected.map((recipient) => (
                    <span
                      key={recipient.id}
                      className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                    >
                      {recipient.name}
                      <button
                        type="button"
                        className="hover:text-destructive"
                        aria-label={`Quitar a ${recipient.name}`}
                        onClick={() => toggleRecipient(recipient)}
                        disabled={sending}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="max-h-56 overflow-y-auto rounded-lg border">
                {recipientsError ? (
                  <p className="text-destructive flex items-center gap-2 p-3 text-sm">
                    <CircleAlert className="size-4 shrink-0" />
                    {recipientsError}
                  </p>
                ) : loadingRecipients && recipients.length === 0 ? (
                  <p className="text-muted-foreground flex items-center gap-2 p-3 text-sm">
                    <Spinner /> Cargando destinatarios…
                  </p>
                ) : recipients.length === 0 ? (
                  <p className="text-muted-foreground p-3 text-sm">
                    No se encontraron miembros con ese criterio.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {recipients.map((recipient) => {
                      const checked = selectedIds.has(recipient.id);
                      return (
                        <li key={recipient.id}>
                          <label className="hover:bg-muted/60 flex cursor-pointer items-center gap-3 p-2.5">
                            <Checkbox
                              checked={checked}
                              disabled={
                                sending ||
                                (!checked &&
                                  selected.length >= NOTIFICATION_RECIPIENTS_MAX)
                              }
                              onCheckedChange={() => toggleRecipient(recipient)}
                            />
                            <span className="flex min-w-0 flex-col">
                              <span className="truncate text-sm">
                                {recipient.name}
                              </span>
                              <span className="text-muted-foreground truncate text-xs">
                                {[recipient.cardNumber, recipient.email]
                                  .filter(Boolean)
                                  .join(" · ") || "Sin carné ni correo"}
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
              <FieldDescription>
                {selected.length} de {NOTIFICATION_RECIPIENTS_MAX} seleccionados.
              </FieldDescription>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="notification-title">Título</FieldLabel>
                <Input
                  id="notification-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  maxLength={NOTIFICATION_TITLE_MAX}
                  placeholder="Membresía por vencer"
                  disabled={sending}
                  required
                />
                <FieldDescription>
                  {title.trim().length}/{NOTIFICATION_TITLE_MAX}
                </FieldDescription>
              </Field>

              <Field className="sm:col-span-2">
                <FieldLabel htmlFor="notification-message">Mensaje</FieldLabel>
                <Textarea
                  id="notification-message"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  maxLength={NOTIFICATION_MESSAGE_MAX}
                  placeholder="Tu membresía vence en 3 días."
                  rows={4}
                  disabled={sending}
                  required
                />
                <FieldDescription>
                  {message.trim().length}/{NOTIFICATION_MESSAGE_MAX}
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="notification-source">Módulo</FieldLabel>
                <Select
                  value={sourceModule}
                  onValueChange={(value) =>
                    setSourceModule(value as NotificationSource)
                  }
                  disabled={sending}
                >
                  <SelectTrigger id="notification-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTIFICATION_SOURCES.map((source) => (
                      <SelectItem key={source} value={source}>
                        {SOURCE_LABELS[source]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="notification-reference">
                  Referencia
                </FieldLabel>
                <Input
                  id="notification-reference"
                  value={referenceId}
                  onChange={(event) => setReferenceId(event.target.value)}
                  maxLength={100}
                  placeholder="ID del recurso relacionado"
                  disabled={sending}
                />
                <FieldDescription>
                  {REFERENCE_HINTS[sourceModule]}
                </FieldDescription>
              </Field>
            </div>

            {formError ? (
              <p className="text-destructive flex items-start gap-2 text-sm" role="alert">
                <CircleAlert className="mt-0.5 size-4 shrink-0" />
                {formError}
              </p>
            ) : null}
          </FieldGroup>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={sending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={sending || selected.length === 0}>
              {sending ? <Spinner /> : <Send />}
              Enviar aviso
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
