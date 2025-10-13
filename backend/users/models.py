from django.contrib.auth.models import AbstractUser
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class User(AbstractUser):
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('teacher', 'Teacher'),
    ]
    
    role = models.CharField(
        max_length=10,
        choices=ROLE_CHOICES,
        default='student',
        help_text='User role in the system'
    )
    
    profile_photo = models.ImageField(
        upload_to='profile_photos/',
        blank=True,
        null=True,
        help_text='Profile photo of the user'
    )
    
    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
    
    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'


class StudentProfile(models.Model):
    """
    Extended profile model for students with additional information
    """
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]
    
    YEAR_CHOICES = [
        (1, 'First Year'),
        (2, 'Second Year'),
        (3, 'Third Year'),
        (4, 'Fourth Year'),
        (5, 'Fifth Year'),
        (6, 'Sixth Year'),
    ]
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='student_profile',
        help_text='The user this profile belongs to'
    )
    
    full_name = models.CharField(
        max_length=100,
        help_text='Full name of the student'
    )
    
    email = models.EmailField(
        help_text='Email address of the student'
    )
    
    username = models.CharField(
        max_length=150,
        help_text='Username of the student'
    )
    
    gender = models.CharField(
        max_length=20,
        choices=GENDER_CHOICES,
        blank=True,
        null=True,
        help_text='Gender of the student'
    )
    
    date_of_birth = models.DateField(
        blank=True,
        null=True,
        help_text='Date of birth of the student'
    )
    
    bio = models.TextField(
        blank=True,
        null=True,
        max_length=500,
        help_text='Short biography or description of the student'
    )
    
    profile_picture = models.ImageField(
        upload_to='profile_pics/',
        blank=True,
        null=True,
        help_text='Profile picture of the student'
    )
    
    department = models.CharField(
        max_length=100,
        help_text='Department or field of study'
    )
    
    year_of_study = models.IntegerField(
        choices=YEAR_CHOICES,
        validators=[MinValueValidator(1), MaxValueValidator(6)],
        help_text='Current year of study'
    )
    
    contact = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='Contact number of the student'
    )
    
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text='When this profile was created'
    )
    
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text='When this profile was last updated'
    )
    
    def __str__(self):
        return f"{self.full_name} - {self.department} Year {self.year_of_study}"
    
    class Meta:
        verbose_name = 'Student Profile'
        verbose_name_plural = 'Student Profiles'
        ordering = ['-updated_at']
