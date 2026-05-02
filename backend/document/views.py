import io
import os

from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.pagination import PageNumberPagination
from PIL import Image as PILImage

from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.views.decorators.http import require_POST

from .models import Document, Image
from .serializers import DocumentSerializer, DocumentListSerializer, ImageReorderSerializer
from .utils import fetch_and_generate_pdf, generate_pdf


class DocumentPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class DocumentListView(generics.ListAPIView):
    """List documents with pagination, filtering, sorting, and search"""
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentListSerializer
    pagination_class = DocumentPagination

    def get_queryset(self):
        queryset = Document.objects.filter(user=self.request.user)
        
        # Filtering by status
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Search by title
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(title__icontains=search)
        
        # Sorting
        sort_by = self.request.query_params.get('sort_by', '-created_at')
        allowed_sorts = ['created_at', '-created_at', 'title', '-title']
        if sort_by in allowed_sorts:
            queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-created_at')
        
        return queryset

    def get_serializer_class(self):
        # Use full serializer for single document, lightweight for list
        if self.request.query_params.get('detail') == 'true':
            return DocumentSerializer
        return DocumentListSerializer


class DocumentDetailView(generics.RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = DocumentSerializer
    lookup_url_kwarg = 'doc_id'

    def get_object(self):
        return get_object_or_404(Document, id=self.kwargs['doc_id'], user=self.request.user)


class UploadImagesView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        files = request.FILES.getlist('images')
        title = request.data.get('title', '').strip()

        if not files:
            return Response({"error": "No images uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        document = Document.objects.create(user=request.user, title=title or 'Untitled Document', status='pending')

        for i, file in enumerate(files):
            Image.objects.create(
                document=document,
                image=file,
                order=i
            )

        serializer = DocumentSerializer(document, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class GeneratePDFView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, doc_id):
        document = get_object_or_404(Document, id=doc_id, user=request.user)

        images = document.images.all().order_by('order')
        if not images.exists():
            return Response({"error": "Document has no uploaded images"}, status=status.HTTP_400_BAD_REQUEST)

        document.status = 'processing'
        document.save()

        pdf_dir = os.path.join(settings.MEDIA_ROOT, 'pdfs')
        os.makedirs(pdf_dir, exist_ok=True)
        output_path = os.path.join(pdf_dir, f'doc_{doc_id}.pdf')

        image_paths = [img.image.path for img in images]
        generate_pdf(image_paths, output_path)

        document.pdf_file.name = os.path.relpath(output_path, settings.MEDIA_ROOT)
        document.status = 'done'
        document.save()

        return Response({"pdf_url": document.pdf_file.url}, status=status.HTTP_200_OK)


class FetchDocumentFromUrlView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        source_url = request.data.get('source_url', '').strip()
        title = request.data.get('title', '').strip() or 'Untitled Document'

        if not source_url:
            return Response({"error": "source_url is required"}, status=status.HTTP_400_BAD_REQUEST)

        document = Document.objects.create(
            user=request.user,
            title=title,
            source_url=source_url,
            status='processing'
        )

        pdf_dir = os.path.join(settings.MEDIA_ROOT, 'pdfs')
        os.makedirs(pdf_dir, exist_ok=True)

        try:
            output_path = fetch_and_generate_pdf(source_url, pdf_dir)
        except Exception as exc:
            document.status = 'pending'
            document.save()
            return Response(
                {"error": "Unable to generate PDF from the provided URL", "details": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        document.pdf_file.name = os.path.relpath(output_path, settings.MEDIA_ROOT)
        document.status = 'done'
        document.save()

        serializer = DocumentSerializer(document, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ============================================================
# NEW FEATURES IMPLEMENTATION
# ============================================================

class DeleteDocumentView(APIView):
    """Delete a document and all its images"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, doc_id):
        document = get_object_or_404(Document, id=doc_id, user=request.user)
        
        # Delete all images first
        images = document.images.all()
        for img in images:
            img.delete()  # This will also delete the image file
        
        # Delete PDF file if exists
        if document.pdf_file:
            try:
                document.pdf_file.delete(save=False)
            except Exception:
                pass
        
        document.delete()
        return Response({"message": "Document deleted successfully"}, status=status.HTTP_200_OK)


class DeleteImageView(APIView):
    """Delete a single image from a document"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, doc_id, img_id):
        document = get_object_or_404(Document, id=doc_id, user=request.user)
        image = get_object_or_404(Image, id=img_id, document=document)
        
        image.delete()
        
        # Reorder remaining images
        remaining_images = document.images.all().order_by('order')
        for i, img in enumerate(remaining_images):
            if img.order != i:
                img.order = i
                img.save()
        
        return Response({"message": "Image deleted successfully"}, status=status.HTTP_200_OK)


class ReorderImagesView(APIView):
    """Reorder images in a document"""
    permission_classes = [IsAuthenticated]

    def post(self, request, doc_id):
        document = get_object_or_404(Document, id=doc_id, user=request.user)
        
        serializer = ImageReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        image_ids = serializer.validated_data['image_ids']
        
        # Validate all images belong to this document
        images = []
        for img_id in image_ids:
            img = Image.objects.filter(id=img_id, document=document).first()
            if not img:
                return Response(
                    {"error": f"Image {img_id} not found in this document"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            images.append(img)
        
        # Update order
        for i, img in enumerate(images):
            img.order = i
            img.save()
        
        return Response({"message": "Images reordered successfully"}, status=status.HTTP_200_OK)


class DownloadPDFView(APIView):
    """Download PDF file"""
    permission_classes = [IsAuthenticated]

    def get(self, request, doc_id):
        document = get_object_or_404(Document, id=doc_id, user=request.user)
        
        if not document.pdf_file:
            return Response(
                {"error": "No PDF available for this document"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not document.pdf_file.path or not os.path.exists(document.pdf_file.path):
            return Response(
                {"error": "PDF file not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Return the file path/URL
        return Response({
            "pdf_url": document.pdf_file.url,
            "filename": os.path.basename(document.pdf_file.name)
        }, status=status.HTTP_200_OK)


class AdjustImageView(APIView):
    """Adjust image brightness and contrast"""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, doc_id, img_id):
        document = get_object_or_404(Document, id=doc_id, user=request.user)
        image = get_object_or_404(Image, id=img_id, document=document)
        
        brightness = request.data.get('brightness')
        contrast = request.data.get('contrast')
        width = request.data.get('width')
        height = request.data.get('height')
        
        try:
            if brightness:
                image.brightness = float(brightness)
            if contrast:
                image.contrast = float(contrast)
            
            # Process the image
            img_path = image.image.path
            with PILImage.open(img_path) as img:
                original_mode = img.mode
                # Convert to RGB if needed
                if img.mode != 'RGB':
                    img = img.convert('RGB')
                
                # Apply brightness and contrast using PIL ImageEnhance
                from PIL import ImageEnhance
                
                if brightness and float(brightness) != 1.0:
                    enhancer = ImageEnhance.Brightness(img)
                    img = enhancer.enhance(float(brightness))
                
                if contrast and float(contrast) != 1.0:
                    enhancer = ImageEnhance.Contrast(img)
                    img = enhancer.enhance(float(contrast))
                
                # Resize if requested
                if width or height:
                    new_width = int(width) if width else img.width
                    new_height = int(height) if height else img.height
                    img = img.resize((new_width, new_height), PILImage.Resampling.LANCZOS)
                
                # Save the processed image
                img.save(img_path, original_mode if original_mode == 'RGB' else 'PNG')
            
            image.save()
            
            from .serializers import ImageSerializer
            serializer = ImageSerializer(image)
            return Response(serializer.data, status=status.HTTP_200_OK)
        
        except Exception as exc:
            return Response(
                {"error": f"Error processing image: {str(exc)}"},
                status=status.HTTP_400_BAD_REQUEST
            )


class RegisterView(APIView):
    """User registration"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        email = request.data.get('email', '').strip()
        password = request.data.get('password', '')
        confirm_password = request.data.get('confirm_password', '')

        if not username or not email or not password:
            return Response(
                {"error": "Username, email, and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if password != confirm_password:
            return Response(
                {"error": "Passwords do not match"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if username exists
        if User.objects.filter(username=username).exists():
            return Response(
                            {"error": "Username already exists"},
                            status=status.HTTP_400_BAD_REQUEST
                        )

        # Check if email exists
        if User.objects.filter(email=email).exists():
            return Response(
                {"error": "Email already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate password
        try:
            validate_password(password)
        except Exception as exc:
            return Response(
                {"error": str(exc)},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create user
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password
        )

        return Response({
            "message": "User created successfully",
            "user_id": user.id
        }, status=status.HTTP_201_CREATED)


class LoginAPIView(APIView):
    """User login - session-based authentication"""
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')

        if not username or not password:
            return Response(
                {"error": "Username and password are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            return Response({
                "message": "Login successful",
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email
                }
            }, status=status.HTTP_200_OK)
        else:
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutAPIView(APIView):
    """User logout"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logout(request)
        return Response({"message": "Logout successful"}, status=status.HTTP_200_OK)


class CurrentUserView(APIView):
    """Get current authenticated user"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        return Response({
            "id": user.id,
            "username": user.username,
            "email": user.email
        }, status=status.HTTP_200_OK)


class DashboardStatsView(APIView):
    """Get dashboard statistics"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        documents = Document.objects.filter(user=user)
        
        total = documents.count()
        pending = documents.filter(status='pending').count()
        processing = documents.filter(status='processing').count()
        done = documents.filter(status='done').count()
        
        # Get recent documents (last 5)
        recent_docs = documents.order_by('-created_at')[:5]
        from .serializers import DocumentListSerializer
        recent_serializer = DocumentListSerializer(recent_docs, many=True)
        
        return Response({
            "total": total,
            "pending": pending,
            "processing": processing,
            "done": done,
            "recent_documents": recent_serializer.data
        }, status=status.HTTP_200_OK)
