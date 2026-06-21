/**
 * Shared AuthContext object — kept in its own file so that
 * AuthContext.jsx (which exports AuthProvider component) satisfies
 * the react-refresh/only-export-components rule.
 */
import { createContext } from 'react';

export const AuthContext = createContext(null);
