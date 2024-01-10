export const genId = () => "_" + Math.random().toString(36).substring(2, 9);

export const getUserIdOrder = (...uuids: string[]) => {
  const [userId1, userId2] = uuids.sort();

  return { userId1, userId2 };
};
