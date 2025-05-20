import { isSameDay, format, differenceInDays } from 'date-fns';

export const genId = (): string =>
  `_${Math.random().toString(36).substring(2, 9)}`;

export const getUserIdOrder = (
  ...uuids: string[]
): { userId1: string; userId2: string } => {
  const [userId1, userId2] = uuids.sort();

  return { userId1, userId2 };
};

export const dtStr = (date: Date): string => {
  const now = new Date();
  if (isSameDay(date, now)) {
    return format(date, 'h:mm a');
  }

  if (differenceInDays(now, date) < 7) {
    return format(date, 'E h:mm a');
  }

  return format(date, 'MM/dd/yy h:mm a');
};
