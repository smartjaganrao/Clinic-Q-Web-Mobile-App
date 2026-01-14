/**
 * Authentication Service - Complete Supabase Integration
 * Handles: Patient Auth, Staff Auth, Doctor Auth, Session Management
 */

import { createClient, SupabaseClient, Session } from '@supabase/supabase-js';
import { UserRole } from '../types';

interface AuthUser {
  id: string;
  email: string;
  phone?: string;
  name: string;
  role: UserRole;
  clinic_id?: string;
  clinicId?: string;
  isVerified: boolean;
  createdAt: string;
  metadata?: Record<string, any>;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface SignupData extends LoginCredentials {
  name: string;
  phone: string;
  role: UserRole;
  clinicId?: string;
}

class AuthService {
  private supabase: SupabaseClient | null = null;
  private currentUser: AuthUser | null = null;
  private session: Session | null = null;
  private authStateChangeListeners: ((user: AuthUser | null) => void)[] = [];

  /**
   * Initialize with Supabase credentials
   * Call this on app startup with proper env variables
   */
  initialize(supabaseUrl: string, supabaseKey: string) {
    try {
      this.supabase = createClient(supabaseUrl, supabaseKey);
      this.setupAuthStateListener();
      this.restoreSession();
    } catch (error) {
      console.error('Failed to initialize Supabase Auth:', error);
    }
  }

  /**
   * Setup Supabase auth state listener
   */
  private setupAuthStateListener() {
    if (!this.supabase) return;

    this.supabase.auth.onAuthStateChange(async (event, session) => {
      this.session = session;
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
      } else {
        this.currentUser = null;
      }
      this.notifyListeners();
    });
  }

  /**
   * Restore session from Supabase (auto-login on page refresh)
   */
  private async restoreSession() {
    if (!this.supabase) return;

    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session?.user) {
        this.session = session;
        await this.loadUserProfile(session.user.id);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }

  /**
   * Load user profile from database, create if doesn't exist
   */
  private async loadUserProfile(userId: string) {
    if (!this.supabase) return;

    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.log('Profile not found, creating new profile for user:', userId);
        // Profile doesn't exist, try to create it from auth metadata
        await this.createUserProfile(userId);
        
        // Wait a moment for the insert to complete
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Retry loading
        const { data: newData, error: newError } = await this.supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .single();

        if (newError) {
          console.error('Failed to load newly created profile:', newError);
          // Fallback: create a basic user object from auth data
          const { data: authUser } = await this.supabase.auth.getUser();
          if (authUser.user) {
            console.log('Using fallback user profile from auth metadata');
            this.currentUser = {
              id: authUser.user.id,
              email: authUser.user.email || '',
              phone: authUser.user.user_metadata?.phone,
              name: authUser.user.user_metadata?.name || 'User',
              role: authUser.user.user_metadata?.role || 'PATIENT',
              clinic_id: authUser.user.user_metadata?.clinic_id,
              clinicId: authUser.user.user_metadata?.clinic_id,
              isVerified: !!authUser.user.email_confirmed_at,
              createdAt: authUser.user.created_at,
              metadata: authUser.user.user_metadata
            };
          }
          return;
        }
        
        console.log('Successfully loaded newly created profile:', newData);
        // Use newData for the rest of the function
        this.currentUser = {
          id: newData.id,
          email: newData.email,
          phone: newData.phone,
          name: newData.name,
          role: newData.role,
          clinic_id: newData.clinic_id,
          clinicId: newData.clinic_id,
          isVerified: newData.is_verified,
          createdAt: newData.created_at,
          metadata: newData.metadata
        };
        return;
      }

      console.log('Profile loaded successfully:', data);
      // Profile exists, set currentUser
      this.currentUser = {
        id: data.id,
        email: data.email,
        phone: data.phone,
        name: data.name,
        role: data.role,
        clinic_id: data.clinic_id,
        clinicId: data.clinic_id,
        isVerified: data.is_verified,
        createdAt: data.created_at,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  /**
   * Create user profile from auth user metadata
   */
  private async createUserProfile(userId: string) {
    if (!this.supabase) return;

    try {
      const { data: authUser, error: authError } = await this.supabase.auth.getUser();
      if (authError) throw authError;
      if (!authUser.user) throw new Error('Failed to get user data');

      const userMetadata = authUser.user.user_metadata || {};
      
      console.log('Creating user profile with metadata:', userMetadata);

      const profileData = {
        id: userId,
        email: authUser.user.email,
        name: userMetadata.name || 'Unknown User',
        phone: userMetadata.phone || null,
        role: userMetadata.role || 'PATIENT',
        clinic_id: userMetadata.clinic_id || null,
        is_verified: authUser.user.email_confirmed_at ? true : false,
        created_at: new Date().toISOString(),
        metadata: userMetadata
      };
      
      console.log('Inserting profile data:', profileData);

      const { error } = await this.supabase
        .from('user_profiles')
        .insert(profileData);

      if (error) {
        console.error('Profile creation error:', error);
        throw error;
      }
      
      console.log('User profile created successfully');
    } catch (error) {
      console.error('Failed to create user profile:', error);
      throw error;
    }
  }

  /**
   * Sign up new user (Patient, Staff, Doctor)
   */
  async signup(data: SignupData): Promise<{ success: boolean; error?: string; user?: AuthUser; requiresConfirmation?: boolean }> {
    if (!this.supabase) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      console.log('Starting signup process for:', data.email);
      
      const redirectUrl = typeof window !== 'undefined' ? `${window.location.origin}/login/patient` : undefined;
      
      // 1. Create Supabase auth user with email confirmation
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: data.name,
            phone: data.phone,
            role: data.role,
            clinic_id: data.clinicId
          }
        }
      });

      if (authError) {
        console.error('Signup error:', authError);
        throw authError;
      }
      
      if (!authData.user) {
        console.error('No user data returned from signup');
        throw new Error('User creation failed');
      }
      
      console.log('Signup successful, user ID:', authData.user.id);
      console.log('Email confirmed:', !!authData.user.email_confirmed_at);
      console.log('Has session:', !!authData.session);

      // 2. If user is confirmed and has session, load/create profile
      if (authData.session) {
        console.log('User is auto-confirmed, creating profile...');
        this.session = authData.session;
        await this.loadUserProfile(authData.user.id);
        return {
          success: true,
          user: this.currentUser || undefined
        };
      } else {
        console.log('Email confirmation required');
        // Email confirmation required - profile will be created on first login
        return {
          success: true,
          requiresConfirmation: true,
          error: 'Please check your email to confirm your account before logging in.'
        };
      }
    } catch (error: any) {
      console.error('Signup failed:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Signup failed';
      if (error.message?.includes('User already registered')) {
        errorMessage = 'An account with this email already exists. Please login instead.';
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = 'Password must be at least 6 characters long';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    if (!this.supabase) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      console.log('Attempting login for:', credentials.email);
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('Supabase login error:', error);
        throw error;
      }
      
      if (!data.user) {
        console.error('No user data returned from login');
        throw new Error('Login failed - no user data');
      }
      
      console.log('Login successful, user ID:', data.user.id);
      console.log('Email confirmed:', !!data.user.email_confirmed_at);

      this.session = data.session;
      
      // Load user profile
      console.log('Loading user profile...');
      await this.loadUserProfile(data.user.id);

      if (!this.currentUser) {
        console.error('Failed to load user profile after login');
        return { success: false, error: 'Failed to load user profile. Please try again.' };
      }
      
      console.log('Login completed successfully for user:', this.currentUser.name);

      return {
        success: true,
        user: this.currentUser
      };
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Login failed';
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password';
      } else if (error.message?.includes('Email not confirmed')) {
        errorMessage = 'Please check your email and click the confirmation link before logging in';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please wait a moment and try again';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Login with phone (OTP-based) - Optional for patients
   */
  async loginWithPhone(phone: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.supabase.auth.signInWithOtp({
        phone: phone
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Phone login failed'
      };
    }
  }

  /**
   * Verify OTP for phone auth
   */
  async verifyOtp(phone: string, token: string): Promise<{ success: boolean; error?: string; user?: AuthUser }> {
    if (!this.supabase) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { data, error } = await this.supabase.auth.verifyOtp({
        phone: phone,
        token: token,
        type: 'sms'
      });

      if (error) throw error;
      if (!data.user) throw new Error('OTP verification failed');

      this.session = data.session;
      await this.loadUserProfile(data.user.id);

      return {
        success: true,
        user: this.currentUser!
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'OTP verification failed'
      };
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: Partial<AuthUser>): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase || !this.currentUser) {
      return { success: false, error: 'Not authenticated' };
    }

    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({
          name: updates.name,
          phone: updates.phone,
          metadata: updates.metadata
        })
        .eq('id', this.currentUser.id);

      if (error) throw error;

      // Reload profile
      await this.loadUserProfile(this.currentUser.id);

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Update failed'
      };
    }
  }

  /**
   * Change password
   */
  async changePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Password change failed'
      };
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Password reset failed'
      };
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ success: boolean; error?: string }> {
    if (!this.supabase) {
      return { success: false, error: 'Auth service not initialized' };
    }

    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;

      this.currentUser = null;
      this.session = null;
      this.notifyListeners();

      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Logout failed'
      };
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  /**
   * Get current session
   */
  getSession(): Session | null {
    return this.session;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.currentUser && !!this.session;
  }

  /**
   * Get access token for API requests
   */
  getAccessToken(): string | null {
    return this.session?.access_token || null;
  }

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChange(callback: (user: AuthUser | null) => void): () => void {
    this.authStateChangeListeners.push(callback);
    // Return unsubscribe function
    return () => {
      this.authStateChangeListeners = this.authStateChangeListeners.filter(
        listener => listener !== callback
      );
    };
  }

  /**
   * Notify all listeners of auth state change
   */
  private notifyListeners() {
    this.authStateChangeListeners.forEach(listener => {
      listener(this.currentUser);
    });
  }

  /**
   * Get Supabase client instance (for advanced queries)
   */
  getSupabase(): SupabaseClient | null {
    return this.supabase;
  }
}

// Export singleton instance
export const authService = new AuthService();

export type { AuthUser, LoginCredentials, SignupData };
