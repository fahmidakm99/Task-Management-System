import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './service/auth.service'; // import your AuthService

@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  async canActivate(): Promise<boolean> {
    try {
      const authenticated = await this.authService.isAuthenticated();
      if (!authenticated) {
        console.log('🔴 Not authenticated, redirecting to login');
        this.router.navigate(['/login']);
        return false;
      }
      console.log('🟢 Authenticated, access granted');
      return true;
    } catch (err) {
      console.error('AuthGuard Error:', err);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
