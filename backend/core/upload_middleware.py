"""
Middleware for handling file uploads and optimization.
"""
import time
from django.http import JsonResponse
from django.conf import settings
from django.core.exceptions import RequestDataTooBig


class FileUploadMiddleware:
    """
    Middleware to handle file upload optimization and errors.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Store upload start time
        if request.content_type and 'multipart/form-data' in request.content_type:
            request._upload_start_time = time.time()
        
        response = self.get_response(request)
        return response
    
    def process_exception(self, request, exception):
        """
        Handle upload-related exceptions.
        """
        if isinstance(exception, RequestDataTooBig):
            return JsonResponse({
                'error': 'File too large',
                'message': f'Maximum upload size is {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB',
                'code': 'FILE_TOO_LARGE'
            }, status=413)
        
        # Handle file upload timeout
        if hasattr(request, '_upload_start_time'):
            upload_time = time.time() - request._upload_start_time
            timeout = getattr(settings, 'UPLOAD_TIMEOUT', 300)
            
            if upload_time > timeout:
                return JsonResponse({
                    'error': 'Upload timeout',
                    'message': f'Upload took too long (>{timeout} seconds)',
                    'code': 'UPLOAD_TIMEOUT'
                }, status=408)
        
        return None


class ProgressTrackingMiddleware:
    """
    Middleware to track upload progress.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Add progress tracking for file uploads
        if (request.method == 'POST' and 
            request.content_type and 
            'multipart/form-data' in request.content_type):
            
            # Set up progress tracking
            request._upload_progress = {
                'bytes_received': 0,
                'total_bytes': int(request.META.get('CONTENT_LENGTH', 0)),
                'start_time': time.time()
            }
        
        response = self.get_response(request)
        return response