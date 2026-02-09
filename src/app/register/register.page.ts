import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../service/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: false,
})
export class RegisterPage {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group({
      fullName: ['', Validators.required],
      username: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  async register() {
    if (this.registerForm.invalid) {
      this.errorMessage = 'Please fill all fields correctly!';
      return;
    }

    const { fullName, username, email, password } = this.registerForm.value;

    try {
      await this.authService.registerUser(fullName, username, email, password);
      this.router.navigate(['/login']); // Redirect to login after successful registration
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }
}
