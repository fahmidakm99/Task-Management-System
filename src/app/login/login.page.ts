
import { Component } from '@angular/core';
import {
  NavController,
  LoadingController,
  AlertController,
  Platform,
} from '@ionic/angular';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import firebase from 'firebase/compat/app';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email: string = '';
  password: string = '';
  phoneNumber: string = '';
  otpCode: string = '';
  verificationId: string = '';
  showPassword: boolean = false;
  showOTP: boolean = false;
  isLoading: boolean = false; // Controls button loading state
  showPasswordInput: boolean = false;

  constructor(
    private afAuth: AngularFireAuth,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController,
    private platform: Platform
  ) 
  {

  }
 
  
 async login() {
  if (!this.email || !this.password) {
    this.showAlert('Error', 'Please enter email and password.');
    return;
  }

  this.isLoading = true;
  this.email = this.email.trim(); // Trim whitespace

  try {
    await this.afAuth.signInWithEmailAndPassword(this.email, this.password);
    this.isLoading = false;
    this.navCtrl.navigateRoot('/home'); // Navigate on success
  } catch (error: any) {
    this.isLoading = false;
    console.error('Login Error:', error);
    this.showAlert('Login Failed', error.message || 'Incorrect email or password.');
  }
}

  

  
  loginUser(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  async googleLogin() {
    const provider = new firebase.auth.GoogleAuthProvider();

    if (this.isWebPlatform()) {
      // Web-based authentication (for browsers)
      try {
        const result = await this.afAuth.signInWithPopup(provider);
        if (result?.user) {
          console.log('Web Login Successful:', result.user);
          this.navCtrl.navigateRoot('/home');
        }
      } catch (error: any) {
        console.error('Web Login Error:', error);
        this.showAlert('Error', error.message);
      }
    } else {
      // Mobile-based authentication (for Android/iOS)
      try {
        await this.afAuth.signInWithRedirect(provider);
        const result = await this.afAuth.getRedirectResult();
        if (result?.user) {
          console.log('Mobile Login Successful:', result.user);
          this.navCtrl.navigateRoot('/home');
        }
      } catch (error: any) {
        console.error('Mobile Login Error:', error);
        this.showAlert('Error', error.message);
      }
    }
  }

  // Helper function to detect web vs mobile
  isWebPlatform(): boolean {
    return !('cordova' in window || 'Capacitor' in window);
  }

  // Helper Function: Show Alert
  async showAlert(header: string, message: string) {
    const alert = await this.alertCtrl.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }
}
