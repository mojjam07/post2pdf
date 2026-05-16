from rest_framework import serializers
from .models import Document, Image


class ImageSerializer(serializers.ModelSerializer):
    # Always provide a URL that frontend can directly use in <img src="..." />
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Image
        # Keep `image` for backward compatibility, but frontend should use `image_url`.
        fields = ['id', 'image', 'image_url', 'order', 'brightness', 'contrast']

    def get_image_url(self, obj: Image):
        # Uses Django's MEDIA_URL mapping; request is available via serializer context.
        request = self.context.get('request')
        if not obj.image:
            return None
        url = obj.image.url
        return request.build_absolute_uri(url) if request is not None else url



class DocumentSerializer(serializers.ModelSerializer):
    images = ImageSerializer(many=True, read_only=True)

    class Meta:
        model = Document
        fields = ['id', 'title', 'source_url', 'status', 'pdf_file', 'images', 'created_at']
        read_only_fields = ['status', 'pdf_file', 'created_at']


class DocumentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for document listing"""
    image_count = serializers.SerializerMethodField()

    class Meta:
        model = Document
        fields = ['id', 'title', 'source_url', 'status', 'pdf_file', 'image_count', 'created_at']
        read_only_fields = ['status', 'pdf_file', 'created_at']

    def get_image_count(self, obj):
        return obj.images.count()


class ImageReorderSerializer(serializers.Serializer):
    """Serializer for reordering images"""
    image_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
