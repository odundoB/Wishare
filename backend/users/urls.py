from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

# Create router for ViewSets
router = DefaultRouter()
router.register(r'manage', views.UserManagementViewSet, basename='user-management')

urlpatterns = [
    # Authentication endpoints
    path('register/', views.UserRegisterView.as_view(), name='user-register'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('logout/', views.UserLogoutView.as_view(), name='user-logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    
    # User profile endpoints
    path('profile/', views.user_profile_view, name='user-profile'),
    # path('profile/update/', views.UserProfileView.as_view(), name='user-profile-update'),
    path('profile/photo/', views.ProfilePhotoView.as_view(), name='profile-photo'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change-password'),
    
    # Student profile endpoints
    path('student-profile/', views.StudentProfileDetailView.as_view(), name='student-profile'),
    path('student-profile/update/', views.StudentProfileUpdateView.as_view(), name='student-profile-update'),
    
    # Admin endpoints
    path('stats/', views.UserStatsView.as_view(), name='user-stats'),
    
    # Role-based example endpoints
    path('teacher-only/', views.TeacherOnlyView.as_view(), name='teacher-only'),
    path('student-only/', views.StudentOnlyView.as_view(), name='student-only'),
    path('teacher-or-student/', views.TeacherOrStudentView.as_view(), name='teacher-or-student'),
    path('admin-or-teacher/', views.AdminOrTeacherView.as_view(), name='admin-or-teacher'),
    
    # Include router URLs
    path('', include(router.urls)),
]
