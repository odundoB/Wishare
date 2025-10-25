"""
Custom file upload handlers for optimized resource uploads.
"""
import os
import tempfile
from django.core.files.uploadhandler import TemporaryFileUploadHandler
from django.core.files.uploadedfile import TemporaryUploadedFile
from django.conf import settings


class OptimizedFileUploadHandler(TemporaryFileUploadHandler):
    """
    Optimized file upload handler for large file uploads.
    Uses temporary files and streaming for better memory efficiency.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.file = None
        self.file_size = 0
        
    def new_file(self, *args, **kwargs):
        """
        Create a new temporary file for the upload.
        """
        super().new_file(*args, **kwargs)
        
        # Set maximum file size (50MB)
        self.content_length = int(self.content_length or 0)
        max_size = getattr(settings, 'MAX_UPLOAD_SIZE', 50 * 1024 * 1024)  # 50MB
        
        if self.content_length > max_size:
            raise Exception(f"File too large. Maximum size is {max_size // (1024*1024)}MB")
    
    def receive_data_chunk(self, raw_data, start):
        """
        Process data chunks as they arrive.
        """
        self.file.write(raw_data)
        self.file_size += len(raw_data)
        
        # Optional: Add progress tracking here if needed
        return None
    
    def file_complete(self, file_size):
        """
        Called when file upload is complete.
        """
        self.file.seek(0)
        return TemporaryUploadedFile(
            name=self.file_name,
            content_type=self.content_type,
            size=file_size,
            charset=self.charset,
            file=self.file
        )


class ProgressTrackingUploadHandler(TemporaryFileUploadHandler):
    """
    Upload handler that can track upload progress.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.bytes_received = 0
        
    def receive_data_chunk(self, raw_data, start):
        """
        Track progress as chunks are received.
        """
        self.bytes_received += len(raw_data)
        
        # Calculate progress percentage
        if self.content_length:
            progress = (self.bytes_received / self.content_length) * 100
            
            # Store progress in cache or session if needed
            # This could be used for real-time progress updates
            
        return super().receive_data_chunk(raw_data, start)