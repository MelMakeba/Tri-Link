import { HttpException, HttpStatus } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

// Define the file filter callback type
type FileFilterCallback = (error: Error | null, acceptFile: boolean) => void;

// Define MulterFile interface
interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer?: Buffer;
}

// File filter function - allows only image files
export const imageFileFilter = (
  req: any,
  file: MulterFile,
  callback: FileFilterCallback,
) => {
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    callback(
      new HttpException(
        'Only image files are allowed (jpg, jpeg, png, gif)!',
        HttpStatus.BAD_REQUEST,
      ),
      false,
    );
    return;
  }
  callback(null, true);
};

// Max file size: 5MB
export const maxFileSize = 5 * 1024 * 1024;

// Multer options for memory storage (for Cloudinary upload)
export const multerOptionsForMemory: MulterOptions = {
  limits: {
    fileSize: maxFileSize,
  },
  fileFilter: imageFileFilter,
};
