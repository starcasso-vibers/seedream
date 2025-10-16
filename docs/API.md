# API Routes Documentation

## Configuration

Set the following environment variables in `.env.local`:

```env
SEEDREAM_API_URL=https://api.seedream.io/v1/generate
SEEDREAM_API_KEY=your_seedream_api_key_here
```

## Projects API

### GET /api/projects
List all projects.

**Response:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Project Name",
      "description": "Optional description",
      "createdAt": "ISO-8601 timestamp",
      "updatedAt": "ISO-8601 timestamp",
      "imageCount": 0
    }
  ]
}
```

### POST /api/projects
Create a new project.

**Request Body:**
```json
{
  "name": "Project Name",
  "description": "Optional description"
}
```

**Response:** (201 Created)
```json
{
  "id": "uuid",
  "name": "Project Name",
  "description": "Optional description",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp",
  "imageCount": 0
}
```

## Project Detail API

### GET /api/projects/[id]
Get project details by ID.

**Response:**
```json
{
  "id": "uuid",
  "name": "Project Name",
  "description": "Optional description",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp",
  "imageCount": 5
}
```

### PATCH /api/projects/[id]
Update project details.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "description": "Updated description",
  "createdAt": "ISO-8601 timestamp",
  "updatedAt": "ISO-8601 timestamp",
  "imageCount": 5
}
```

### DELETE /api/projects/[id]
Delete project and all associated images.

**Response:**
```json
{
  "message": "Project deleted successfully"
}
```

## Image Generation API

### POST /api/generate
Generate images using Seedream API.

**Request:** (multipart/form-data)
- `prompt` (required): Text prompt for image generation
- `projectId` (required): Project UUID
- `size` (optional): Image size (default: "1024x1024")
- `numImages` (optional): Number of images to generate (default: 1)
- `watermark` (optional): Add watermark (default: false)
- `referenceImages` (optional): Reference images for style transfer

**Response:** (201 Created)
```json
{
  "images": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "filename": "uuid.png",
      "url": "/generated-images/projects/uuid/images/uuid.png",
      "prompt": "Generated prompt",
      "size": "1024x1024",
      "width": 1024,
      "height": 1024,
      "createdAt": "ISO-8601 timestamp",
      "metadata": {
        "seedreamRequestId": "request-id",
        "watermark": false
      }
    }
  ],
  "project": {
    "id": "uuid",
    "name": "Project Name",
    "description": "Description",
    "createdAt": "ISO-8601 timestamp",
    "updatedAt": "ISO-8601 timestamp",
    "imageCount": 5
  }
}
```

## Images Listing API

### GET /api/images
List images for a project with pagination.

**Query Parameters:**
- `projectId` (required): Project UUID
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response:**
```json
{
  "images": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "filename": "uuid.png",
      "url": "/generated-images/projects/uuid/images/uuid.png",
      "prompt": "Generated prompt",
      "size": "1024x1024",
      "width": 1024,
      "height": 1024,
      "createdAt": "ISO-8601 timestamp",
      "metadata": {
        "seedreamRequestId": "request-id",
        "watermark": false
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "totalImages": 45,
    "totalPages": 3,
    "hasNextPage": true,
    "hasPreviousPage": false
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad Request (invalid parameters)
- `404` - Not Found
- `500` - Internal Server Error

## File Structure

Generated images are stored in:
```
public/generated-images/
├── projects.json              # Projects list
└── projects/
    └── [project-id]/
        ├── metadata.json      # Image metadata
        └── images/
            └── [image-id].png # Generated images
```
