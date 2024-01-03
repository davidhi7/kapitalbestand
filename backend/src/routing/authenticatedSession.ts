import { Request } from 'express';
import { User } from '../database/db.js';

export type AuthenticatedRequest = {
    session: {
        authenticated: boolean,
        user: User
    }
} & Request
