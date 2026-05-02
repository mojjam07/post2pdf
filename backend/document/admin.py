from django.contrib import admin
from .models import Document, Image


class ImageInline(admin.TabularInline):
    model = Image
    extra = 0


@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'user', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'user__username', 'source_url')
    inlines = [ImageInline]
