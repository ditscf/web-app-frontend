'use client';

import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getUserFacingMessage, toApiError } from '@/lib/api/errors';
import { createEvent } from '@/lib/api/events';

interface CreateEventDialogProps {
  open: boolean;
  onClose: () => void;
  onCreated: (result: Awaited<ReturnType<typeof createEvent>>) => void;
}

export function CreateEventDialog({
  open,
  onClose,
  onCreated,
}: CreateEventDialogProps) {
  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen && !isSaving) {
      setName('');
      setVenue('');
      onClose();
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Enter the event name.');
      return;
    }

    setIsSaving(true);
    try {
      const result = await createEvent({
        name: trimmedName,
        venue: venue.trim() || undefined,
      });
      setName('');
      setVenue('');
      onCreated(result);
    } catch (error) {
      const apiError = toApiError(error);
      if (apiError.kind === 'unauthenticated') return;
      toast.error("We couldn't create the event", {
        description: getUserFacingMessage(error),
      });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Create event</AlertDialogTitle>
        <AlertDialogDescription>
          The event starts ACTIVE. Appoint the committee from the event page.
        </AlertDialogDescription>
        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="event-name">Name</Label>
            <Input
              id="event-name"
              value={name}
              onChange={(change) => setName(change.target.value)}
              disabled={isSaving}
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="event-venue">Venue (optional)</Label>
            <Input
              id="event-venue"
              value={venue}
              onChange={(change) => setVenue(change.target.value)}
              disabled={isSaving}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSaving}>Cancel</AlertDialogCancel>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? 'Creating…' : 'Create'}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
