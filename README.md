# post2pdf

A web application for creating documents (PDFs) from uploaded images or source URLs. Users can upload multiple images, adjust brightness/contrast, and generate professional PDF documents.

## Tech Stack

### Backend
- **Django 5.0** - Python web framework
- **Django REST Framework** - RESTful API
- **SQLite** - Database

### Frontend
- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **TanStack React Query** - Data fetching
- **Framer Motion** - Animations

## Features

- User authentication (register/login)
- Document creation with title and source URL
- Multiple image upload support
- Image adjustments (brightness/contrast)
- PDF generation from images
- Document management (view, create, delete)
- Responsive UI with modern design
- Session-based authentication

## Prerequisites

- Python 3.8+
- Node.js 18+
- npm or yarn

## Installation

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment (if not already created):
```bash
python -m venv .venv
```

3. Activate the virtual environment:
```bash
source .venv/bin/activate  # On macOS/Linux
.venv\Scripts\activate     # On Windows
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Run migrations:
```bash
python manage.py migrate
```

6. Create a superuser (optional):
```bash
python manage.py createsuperuser
```

7. Start the development server:
```bash
python manage.py runserver
```

The backend will run at `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run at `http://localhost:5173`

## Running the Application

1. Start the backend server (port 8000):
```bash
cd backend && python manage.py runserver
```

2. In a new terminal, start the frontend server:
```bash
cd frontend && npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/register/` - Register new user
- `POST /api/login/` - Login user
- `POST /api/logout/` - Logout user

### Documents
- `GET /api/documents/` - List all documents
- `POST /api/documents/` - Create new document
- `GET /api/documents/{id}/` - Get document details
- `DELETE /api/documents/{id}/` - Delete document
- `POST /api/documents/{id}/generate-pdf/` - Generate PDF

### Images
- `POST /api/documents/{id}/images/` - Upload images
- `DELETE /api/images/{id}/` - Delete image
- `PATCH /api/images/{id}/` - Update image adjustments

## Project Structure

```
post2df/
├── backend/
│   ├── core/              # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── document/          # Document app
│   │   ├── models.py      # Document & Image models
│   │   ├── views.py       # API views
│   │   ├── urls.py        # URL routing
│   │   ├── serializers.py # DRF serializers
│   │   └── utils.py       # Utility functions
│   ├── media/            # Uploaded files
│   ├── requirements.txt   # Python dependencies
│   └── manage.py         # Django management
│
├── frontend/
│   ├── src/
│   │   ├── components/   # React components
│   │   │   ├── layout/   # Layout components
���   │   │   │   ├── MainLayout.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Topbar.tsx
│   │   │   └── ui/       # UI components
│   │   │       ├── Button.tsx
│   │   │       ├── Card.tsx
│   │   │       └── Input.tsx
│   │   ├── context/      # React context
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx       # Main app component
│   │   └── main.tsx      # Entry point
│   ├── package.json      # Node dependencies
│   └── vite.config.ts    # Vite configuration
│
├── README.md             # This file
└── TODO.md              # TODO items
```

## License

MIT License
