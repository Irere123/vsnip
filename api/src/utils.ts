export const getUserIdOrder = (...uuids: string[]) => {
  const [userId1, userId2] = uuids.sort();

  return { userId1, userId2 };
};
