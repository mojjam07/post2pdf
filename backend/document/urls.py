from django.urls import path
from django.contrib.auth import views as auth_views
from .views import (
    UploadImagesView, 
    GeneratePDFView, 
    FetchDocumentFromUrlView, 
    DocumentListView, 
    DocumentDetailView,
    DeleteDocumentView,
    DeleteImageView,
    ReorderImagesView,
    DownloadPDFView,
    AdjustImageView,
    RegisterView,
    LoginAPIView,
    LogoutAPIView,
    CurrentUserView,
    DashboardStatsView,
)

urlpatterns = [
    # Document management
    path('', DocumentListView.as_view(), name='document-list'),
    path('upload/', UploadImagesView.as_view(), name='upload-images'),
    path('fetch/', FetchDocumentFromUrlView.as_view(), name='fetch-document'),
    path('dashboard/', DashboardStatsView.as_view(), name='dashboard-stats'),
    path('<int:doc_id>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<int:doc_id>/generate/', GeneratePDFView.as_view(), name='generate-pdf'),
    
    # Delete endpoints
    path('<int:doc_id>/delete/', DeleteDocumentView.as_view(), name='delete-document'),
    path('<int:doc_id>/images/<int:img_id>/delete/', DeleteImageView.as_view(), name='delete-image'),
    
    # Reorder images
    path('<int:doc_id>/reorder/', ReorderImagesView.as_view(), name='reorder-images'),
    
    # Download PDF
    path('<int:doc_id>/download/', DownloadPDFView.as_view(), name='download-pdf'),
    
    # Image adjustments
    path('<int:doc_id>/images/<int:img_id>/adjust/', AdjustImageView.as_view(), name='adjust-image'),
    
    # User registration
    path('register/', RegisterView.as_view(), name='register'),
    
    # Authentication (REST API)
    path('login/', LoginAPIView.as_view(), name='login-api'),
    path('logout/', LogoutAPIView.as_view(), name='logout-api'),
    path('me/', CurrentUserView.as_view(), name='current-user'),
]
