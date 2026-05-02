from django.conf import settings
from django.db import models

User = settings.AUTH_USER_MODEL


class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=255, blank=True)
    source_url = models.URLField(blank=True, null=True)

    pdf_file = models.FileField(upload_to='pdfs/', null=True, blank=True)

    status = models.CharField(
        max_length=20,
        choices=[('pending', 'pending'), ('processing', 'processing'), ('done', 'done')],
        default='pending'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Document {self.id}"


class Image(models.Model):
    document = models.ForeignKey(Document, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='images/')
    order = models.IntegerField(default=0)
    brightness = models.FloatField(default=1.0)  # 1.0 = normal
    contrast = models.FloatField(default=1.0)  # 1.0 = normal

    def __str__(self):
        return f"Image {self.id}"

    def delete(self, *args, **kwargs):
        # Delete the image file when Image is deleted
        if self.image:
            try:
                self.image.delete(save=False)
            except Exception:
                pass
        super().delete(*args, **kwargs)
