import { AvatarUploadComponent } from './../avatar-upload/avatar-upload.component';
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { User } from '../../../core/models/user.model';
import { UserProfileService } from '../../../core/services/user-profile.service';
import { ProfileEditComponent } from '../profile-edit/profile-edit.component';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ProfileEditComponent, AvatarUploadComponent],
  standalone:true,
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent {
 @Input() user: User | null = null;
  @Input() canEdit: boolean = true;
  @Input() autoLoad: boolean = true; // Auto-load profile on init
  @Output() profileUpdated = new EventEmitter<User>();
  @Output() profileLoaded = new EventEmitter<User>();

  loading = false;
  error: string | null = null;
  showEditModal = false;
  showAvatarModal = false;
  avatarUploading = false;

  constructor(private userProfileService: UserProfileService) {}

  ngOnInit() {
    if (this.autoLoad && !this.user) {
      this.loadProfile();
    }
  }

  loadProfile() {
    this.loading = true;
    this.error = null;

    this.userProfileService.getProfile().subscribe({
      next: (profile) => {
        this.user = profile;
        this.loading = false;
        this.profileLoaded.emit(profile);
      },
      error: (err) => {
        this.error = 'Failed to load profile. Please try again.';
        this.loading = false;
        console.error('Profile load error:', err);
      }
    });
  }

  updateUserProfile(updatedUser: User) {
    this.loading = true;
    this.error = null;

    this.userProfileService.updateProfile(updatedUser).subscribe({
      next: (response) => {
        this.user = response;
        this.showEditModal = false;
        this.loading = false;
        this.profileUpdated.emit(response);
      },
      error: (err) => {
        this.error = 'Failed to update profile. Please try again.';
        this.loading = false;
        console.error('Profile update error:', err);
      }
    });
  }

  uploadUserAvatar(file: File) {
    this.avatarUploading = true;
    this.error = null;

    this.userProfileService.uploadAvatar(file).subscribe({
      next: (response) => {
        if (this.user) {
          this.user.avatar = response.avatar || response.imageUrl;
        }
        this.showAvatarModal = false;
        this.avatarUploading = false;
        this.profileUpdated.emit(this.user!);
      },
      error: (err) => {
        this.error = 'Failed to upload avatar. Please try again.';
        this.avatarUploading = false;
        console.error('Avatar upload error:', err);
      }
    });
  }
}
