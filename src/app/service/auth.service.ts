
import { runInInjectionContext, EnvironmentInjector, Injectable, Injector } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { GoogleAuthProvider } from 'firebase/auth';
import { Router } from '@angular/router';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(
    private afAuth: AngularFireAuth,
    private router: Router,
    private firestore: AngularFirestore,
      private injector: Injector
  ) {}

  async googleLogin() {
    try {
      const result = await this.afAuth.signInWithPopup(new GoogleAuthProvider());
      if (result.user) {
        localStorage.setItem('user', JSON.stringify(result.user));
        this.router.navigateByUrl('/home', { replaceUrl: true });
      }
    } catch (error) {
      console.error('Google Sign-In Error:', error);
    }
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await this.afAuth.authState.pipe(take(1)).toPromise();
    return !!user;
  }

  checkUserLoginStatus() {
    this.afAuth.authState.subscribe((user) => {
      if (user) {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      }
    });
  }

  async logout() {
    await this.afAuth.signOut();
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

async registerUser(fullName: string, username: string, email: string, password: string): Promise<void> {
  console.log('Registering user with email:', email);

  try {
    const userCredential = await this.afAuth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    if (!user) throw new Error('No user found after registration');

    console.log('User created with UID:', user.uid);

    // Wrap Firestore call in injection context
    await runInInjectionContext(this.injector, async () => {
      await this.firestore.collection('users').doc(user.uid).set({
        fullName,
        username,
        email,
        userId: user.uid,
      });
    });

    console.log('✅ User saved to Firestore');
  } catch (error) {
    console.error('Error during registration:', error);
    throw error;
  }
}


  getCurrentUser() {
    return this.afAuth.authState.pipe(
      map((user) => user ? user.uid : null)
    );
  }

  getCurrentUserObject() {
    return this.afAuth.authState;
  }

  getCurrentUserObjFb(): Observable<firebase.User | null> {
    return this.afAuth.authState;
  }

  getUserData(uid: string): Observable<any> {
    return this.firestore.collection('users').doc(uid).valueChanges();
  }
}
