from rest_framework import serializers
from .models import Document, Image


class ImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Image
        fields = ['id', 'image', 'order', 'brightness', 'contrast']


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
