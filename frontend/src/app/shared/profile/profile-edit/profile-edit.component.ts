import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-profile-edit',
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-edit.component.html',
  styleUrl: './profile-edit.component.css'
})
export class ProfileEditComponent {
  @Input() user!: User;
  @Input() saving: boolean = false;
  @Input() error: string | null = null;
  @Output() save = new EventEmitter<User>();
  @Output() cancel = new EventEmitter<void>();

  editUser!: User;

  ngOnInit() {
    // Create a copy to avoid mutating the original
    this.editUser = { ...this.user };
  }

  onSave() {
    if (this.editUser.firstName && this.editUser.lastName && this.editUser.email) {
      this.save.emit(this.editUser);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
