import { isSameDay, format, differenceInDays } from 'date-fns';

export const genId = () => '_' + Math.random().toString(36).substring(2, 9);

export const getUserIdOrder = (...uuids: string[]) => {
  const [userId1, userId2] = uuids.sort();

  return { userId1, userId2 };
};

export function dtStr(date: Date) {
  const now = new Date();
  if (isSameDay(date, now)) {
    return format(date, 'h:MM a');
  }

  if (differenceInDays(now, date) < 7) {
    return format(date, 'E h:MM a');
  }

  return format(date, 'mm yy hh');
}
