# 🎨 DoodleDrop Backend

A completely **FREE** local backend for image upload and processing! No cloud services, no subscriptions - everything runs on your local server.

## Features

- 📤 **Image Upload**: Upload any image format (JPEG, PNG, GIF, WebP, BMP)
- 🎨 **4-Color Grayscale Processing**: Automatically converts images to artistic 4-shade grayscale
- 💾 **Local Storage**: Files stored locally in `storage/` directory
- 🗄️ **SQLite Database**: Metadata stored in local SQLite file
- 🌐 **REST API**: Complete API for upload, list, get, and delete operations
- 🆓 **100% Free**: No external services or costs

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Server

```bash
npm start
```

Or for development with auto-restart:

```bash
npm run dev
```

### 3. Test the Upload

Open `test.html` in your browser or use the API endpoints directly.

## API Endpoints

### Upload Image
```
POST /upload
```
- **Body**: Form data with `image` file and optional `uploader` name
- **Returns**: Upload result with original and processed image URLs

### List All Doodles
```
GET /upload/list
```
- **Returns**: Array of all uploaded doodles with metadata

### Get Specific Doodle
```
GET /upload/:id
```
- **Returns**: Single doodle details

### Delete Doodle
```
DELETE /upload/:id
```
- **Returns**: Success confirmation

### Serve Files
```
GET /files/original/:filename
GET /files/processed/:filename
```
- **Returns**: The actual image files

### Health Check
```
GET /health
```
- **Returns**: Server status

## File Structure

```
backend/
├── models/
│   └── Doodle.js          # SQLite database model
├── routes/
│   └── upload.js          # Upload endpoint logic
├── utils/
│   ├── storage.js         # Local file storage helper
│   └── imageProcess.js    # Sharp image processing
├── storage/               # Local file storage (auto-created)
│   ├── original/          # Original uploaded images
│   └── processed/         # 4-color grayscale versions
├── uploads/               # Temporary upload directory
├── app.js                 # Express server entry point
├── test.html             # Test interface
├── database.sqlite       # SQLite database (auto-created)
└── package.json
```

## How It Works

1. **Upload**: User uploads an image via POST to `/upload`
2. **Validation**: Server validates the image format
3. **Processing**: Image is converted to 4-color grayscale using Sharp
4. **Storage**: Both original and processed images saved locally
5. **Database**: Metadata stored in SQLite database
6. **Response**: URLs returned to access the files

## Image Processing

The server uses Sharp to create a unique 4-color grayscale effect:
- **Black** (0) - darkest pixels
- **Dark Gray** (85) - dark-medium pixels  
- **Light Gray** (170) - light-medium pixels
- **White** (255) - lightest pixels

## Configuration

Edit `.env` file to customize:
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment mode

## Testing

1. Start the server: `npm start`
2. Open `test.html` in your browser
3. Upload an image and see the processing results!

## Deployment

### 🐳 Docker Deployment (Recommended)

**Quick Start:**
```bash
# Clone and deploy in one command
git clone https://github.com/ahmed-tkhan/InkLink-backend.git
cd InkLink-backend
./deploy.sh deploy
```

**Manual Docker Deployment:**
```bash
# Production
docker compose up -d --build

# Development with hot reload
docker compose -f docker-compose.dev.yml up -d --build
```

**Features:**
- 🐳 Containerized deployment
- 🔒 Security best practices
- 📊 Built-in health checks
- 🔄 Easy updates and backups
- 📖 Complete self-hosting guide

👉 **See [SELF_HOSTING.md](./SELF_HOSTING.md) for complete documentation**

### Traditional Deployment

For manual/traditional deployment:
1. Set `NODE_ENV=production` in `.env`
2. Use a process manager like PM2
3. Set up nginx reverse proxy (optional)
4. Ensure proper file permissions for storage directory

## Dependencies

- **express**: Web server framework
- **multer**: File upload handling
- **sharp**: Image processing
- **sqlite3**: Local database
- **cors**: Cross-origin requests
- **dotenv**: Environment variables

## Why This Approach?

✅ **No monthly costs** - everything runs locally  
✅ **No cloud dependencies** - works offline  
✅ **Full data control** - your images stay on your server  
✅ **Easy to deploy** - just copy files and run  
✅ **Scalable** - can handle many concurrent uploads  

Perfect for personal projects, learning, or when you want full control over your data!

## License

ISC License - free to use and modify!
