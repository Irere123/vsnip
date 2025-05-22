import { db } from '../db';
import { users } from '../schema';
import { eq, ne } from 'drizzle-orm';
import createHttpError from 'http-errors';
import type { User } from '../schema';

export type SafeUser = Omit<User, 'tokenVersion' | 'googleId' | 'email'> & {
  email?: string;
};

export const findUserById = async (userId: string): Promise<User | null> => {
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId));
  return userRecord || null;
};

export const findUserByGoogleId = async (
  googleId: string,
): Promise<User | null> => {
  const [userRecord] = await db
    .select()
    .from(users)
    .where(eq(users.googleId, googleId));
  return userRecord || null;
};

export const getFeedProfiles = async (
  loggedInUserId: string,
): Promise<SafeUser[]> => {
  const feedProfiles = await db
    .select()
    .from(users)
    .where(ne(users.id, loggedInUserId));
  return feedProfiles.map((p) => {
    const { tokenVersion, googleId, email, ...safeProfile } = p;
    return safeProfile as SafeUser;
  });
};

export const updateUserDetails = async (
  userId: string,
  data: { email: string; username: string },
): Promise<SafeUser | null> => {
  try {
    const [updatedUser] = await db
      .update(users)
      .set({ email: data.email.trim(), username: data.username.trim() })
      .where(eq(users.id, userId))
      .returning();

    if (!updatedUser) return null;
    const { tokenVersion, googleId, ...safeUser } = updatedUser;
    return safeUser as SafeUser;
  } catch (error: any) {
    if (error.code === '23505') {
      throw createHttpError(409, 'Email already in use.');
    }
    console.error('Error in updateUserDetails service:', error);
    throw createHttpError(500, 'Database error during user update.');
  }
};

export const createDevelopmentUser = async (userData: {
  email: string;
  username: string;
  bio?: string;
  avatar?: string;
}): Promise<SafeUser> => {
  try {
    const [newUser] = await db
      .insert(users)
      .values({
        username: userData.username,
        email: userData.email,
        bio: userData.bio,
        avatar: userData.avatar,
      })
      .returning();
    if (!newUser) throw new Error('Dev user creation failed in service');
    const { tokenVersion, googleId, ...safeUser } = newUser;
    return safeUser as SafeUser;
  } catch (error: any) {
    if (error.code === '23505') {
      throw createHttpError(
        409,
        'User with this email or username already exists.',
      );
    }
    console.error('Error in createDevelopmentUser service:', error);
    throw createHttpError(500, 'Database error during dev user creation.');
  }
};
