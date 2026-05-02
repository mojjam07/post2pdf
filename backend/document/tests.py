from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

User = get_user_model()


class DocumentAPITest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='secret')
        self.client.login(username='tester', password='secret')

    def test_upload_images_creates_document(self):
        file1 = SimpleUploadedFile('img1.jpg', b'abc', content_type='image/jpeg')
        file2 = SimpleUploadedFile('img2.jpg', b'def', content_type='image/jpeg')

        response = self.client.post('/api/document/upload/', {'images': [file1, file2], 'title': 'My Doc'}, format='multipart')

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data['title'], 'My Doc')
        self.assertEqual(response.data['status'], 'pending')
        self.assertIn('id', response.data)
        self.assertEqual(len(response.data['images']), 2)

    def test_list_documents_returns_user_documents(self):
        file1 = SimpleUploadedFile('img1.jpg', b'abc', content_type='image/jpeg')
        self.client.post('/api/document/upload/', {'images': [file1], 'title': 'List Doc'}, format='multipart')

        response = self.client.get('/api/document/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'List Doc')

    def test_fetch_document_from_url_rejects_missing_source_url(self):
        response = self.client.post('/api/document/fetch/', {}, format='json')
        self.assertEqual(response.status_code, 400)
        self.assertIn('source_url', response.data['error'] if isinstance(response.data, dict) else response.data)
