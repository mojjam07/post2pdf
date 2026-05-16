import os
import tempfile
import uuid
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup
from PIL import Image as PILImage

from reportlab.lib.pagesizes import letter
from reportlab.platypus import (
    SimpleDocTemplate,
    Image as RLImage,
    PageBreak,
    Spacer,
)

# Social media platforms and their patterns
SOCIAL_MEDIA_PATTERNS = {
    'facebook': ['facebook.com', 'fb.com'],
    'instagram': ['instagram.com'],
    'twitter': ['twitter.com', 'x.com'],
    'linkedin': ['linkedin.com'],
    'tiktok': ['tiktok.com'],
    'youtube': ['youtube.com', 'youtu.be'],
}


def detect_platform(url):
    """Detect which social media platform the URL belongs to."""
    parsed = urlparse(url)
    domain = parsed.netloc.lower().replace('www.', '')

    for platform, patterns in SOCIAL_MEDIA_PATTERNS.items():
        for pattern in patterns:
            if pattern in domain:
                return platform

    return 'unknown'


def fetch_images_from_url(url):
    """
    Fetch all image files referenced by a web page
    and return local temporary file paths.
    """
    image_paths = []
    seen_urls = set()
    temp_dir = tempfile.mkdtemp()

    headers = {
        'User-Agent': (
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) '
            'AppleWebKit/537.36 (KHTML, like Gecko) '
            'Chrome/91.0.4472.124 Safari/537.36'
        )
    }

    try:
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        soup = BeautifulSoup(response.content, 'html.parser')
        page_url = response.url

        img_tags = soup.find_all('img')

        for img_item in img_tags:
            src = (
                img_item.get('src')
                or img_item.get('data-src')
                or img_item.get('data-image')
            )

            if not src:
                continue

            src = urljoin(page_url, src)

            if src in seen_urls:
                continue

            seen_urls.add(src)

            if not src.startswith('http'):
                continue

            try:
                img_response = requests.get(
                    src,
                    headers=headers,
                    timeout=15,
                )
                img_response.raise_for_status()

            except Exception:
                continue

            content_type = img_response.headers.get(
                'Content-Type',
                '',
            )

            if 'image' not in content_type:
                continue

            ext = os.path.splitext(
                urlparse(src).path
            )[1].lower()

            if ext not in [
                '.jpg',
                '.jpeg',
                '.png',
                '.gif',
                '.webp',
                '.bmp',
            ]:
                ext = '.jpg'

            temp_path = os.path.join(
                temp_dir,
                f'image_{uuid.uuid4().hex[:12]}{ext}',
            )

            with open(temp_path, 'wb') as tmp_file:
                tmp_file.write(img_response.content)

            image_paths.append(temp_path)

        # Extract og:image
        og_image = soup.find('meta', property='og:image')

        if og_image and og_image.get('content'):
            og_url = urljoin(page_url, og_image['content'])

            if og_url not in seen_urls:
                try:
                    og_response = requests.get(
                        og_url,
                        headers=headers,
                        timeout=15,
                    )

                    og_response.raise_for_status()

                    if 'image' in og_response.headers.get(
                        'Content-Type',
                        '',
                    ):
                        ext = (
                            os.path.splitext(
                                urlparse(og_url).path
                            )[1].lower()
                            or '.jpg'
                        )

                        if ext not in [
                            '.jpg',
                            '.jpeg',
                            '.png',
                            '.gif',
                            '.webp',
                            '.bmp',
                        ]:
                            ext = '.jpg'

                        temp_path = os.path.join(
                            temp_dir,
                            f'image_{uuid.uuid4().hex[:12]}{ext}',
                        )

                        with open(temp_path, 'wb') as tmp_file:
                            tmp_file.write(og_response.content)

                        image_paths.append(temp_path)

                except Exception:
                    pass

    except Exception as exc:
        cleanup_temp_files(image_paths)

        if os.path.isdir(temp_dir):
            try:
                os.rmdir(temp_dir)
            except OSError:
                pass

        raise RuntimeError(f'Error fetching URL images: {exc}')

    return image_paths


def cleanup_temp_files(paths):
    """Remove temporary image files."""
    for path in paths:
        try:
            if os.path.exists(path):
                os.remove(path)
        except Exception:
            pass


def fetch_and_generate_pdf(url, output_dir):
    """
    Fetch images from a URL and generate a PDF.
    """
    temp_image_paths = []

    try:
        temp_image_paths = fetch_images_from_url(url)

        if not temp_image_paths:
            raise ValueError(
                'No images found on the provided URL'
            )

        output_filename = (
            f'doc_{uuid.uuid4().hex[:8]}.pdf'
        )

        output_path = os.path.join(
            output_dir,
            output_filename,
        )

        generate_pdf(temp_image_paths, output_path)

        return output_path

    finally:
        cleanup_temp_files(temp_image_paths)

        if temp_image_paths:
            temp_dir = os.path.dirname(
                temp_image_paths[0]
            )

            if os.path.isdir(temp_dir):
                try:
                    os.rmdir(temp_dir)
                except OSError:
                    pass


def get_resized_dimensions(
    original_width,
    original_height,
    max_width,
    max_height,
):
    """
    Calculate safe proportional dimensions.
    """

    width_ratio = max_width / original_width
    height_ratio = max_height / original_height

    scale_ratio = min(width_ratio, height_ratio)

    new_width = original_width * scale_ratio
    new_height = original_height * scale_ratio

    return new_width, new_height


def generate_pdf(image_paths, output_path):
    """
    Generate PDF safely without LayoutError.
    """

    os.makedirs(
        os.path.dirname(output_path),
        exist_ok=True,
    )

    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    PAGE_WIDTH, PAGE_HEIGHT = letter

    # Safe drawable area
    MAX_WIDTH = PAGE_WIDTH - 100
    MAX_HEIGHT = PAGE_HEIGHT - 120

    elements = []

    temp_generated_images = []

    for idx, image_path in enumerate(image_paths):

        if not os.path.exists(image_path):
            continue

        try:
            with PILImage.open(image_path) as img:

                # Convert unsupported modes
                if img.mode != 'RGB':
                    img = img.convert('RGB')

                original_width = float(img.width)
                original_height = float(img.height)

                # Normalize image
                temp_img_path = os.path.join(
                    os.path.dirname(output_path),
                    f'_pdf_img_{idx}_{uuid.uuid4().hex}.jpg',
                )

                img.save(
                    temp_img_path,
                    format='JPEG',
                    quality=85,
                    optimize=True,
                )

                temp_generated_images.append(
                    temp_img_path
                )

                # Compute safe dimensions
                width, height = get_resized_dimensions(
                    original_width,
                    original_height,
                    MAX_WIDTH,
                    MAX_HEIGHT,
                )

                # Final safety clamp
                width = min(width, MAX_WIDTH)
                height = min(height, MAX_HEIGHT)

                # EXTRA SAFETY
                if height >= MAX_HEIGHT:
                    ratio = MAX_HEIGHT / height
                    width *= ratio
                    height *= ratio

                if width >= MAX_WIDTH:
                    ratio = MAX_WIDTH / width
                    width *= ratio
                    height *= ratio

                rl_img = RLImage(
                    temp_img_path,
                    width=width,
                    height=height,
                )

                elements.append(rl_img)

                # Add spacing
                elements.append(Spacer(1, 20))

                # One image per page
                if idx < len(image_paths) - 1:
                    elements.append(PageBreak())

        except Exception as exc:
            print(f'Image processing failed: {exc}')
            continue

    if not elements:
        raise ValueError(
            'No valid images available to create PDF'
        )

    try:
        doc.build(elements)

    finally:
        cleanup_temp_files(temp_generated_images)