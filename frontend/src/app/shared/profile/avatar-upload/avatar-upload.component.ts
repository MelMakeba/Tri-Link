import { Component, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar-upload',
  imports: [CommonModule],
  standalone: true,
  templateUrl: './avatar-upload.component.html',
  styleUrl: './avatar-upload.component.css'
})
export class AvatarUploadComponent {
  @Input() uploading: boolean = false;
  @Input() error: string | null = null;
  @Output() upload = new EventEmitter<File>();
  @Output() cancel = new EventEmitter<void>();

  selectedFile: File | null = null;
  previewUrl: string | null = null;
  private maxFileSize = 5 * 1024 * 1024; // 5MB
  private allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];

  onFileSelected(event: any) {
    const file = event.target.files[0];
    this.processFile(file);
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.processFile(files[0]);
    }
  }

  private processFile(file: File) {
    if (!file) return;

    // Reset error
    this.error = null;

    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      this.error = 'Please select a valid image file (PNG, JPG, JPEG)';
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      this.error = 'File size must be less than 5MB';
      return;
    }

    this.selectedFile = file;
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewUrl = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  onUpload() {
    if (this.selectedFile) {
      this.upload.emit(this.selectedFile);
    }
  }

  onCancel() {
    this.cancel.emit();
  }
}
