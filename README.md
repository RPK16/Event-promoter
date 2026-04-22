# PromoPulse

PromoPulse is an intelligent event marketing and campaign generation platform. It helps event organizers, small businesses, and marketing specialists automate the creation of professional marketing strategies and social media content tailored to their specific audience and goals.

## Core Features

- **Automated Marketing Strategy**: Generates a comprehensive executive summary outlining the campaign approach.
- **Multi-Channel Content**: Creates platform-specific posts for Instagram, Facebook, Email, and Twitter.
- **Targeted Messaging**: Optimizes content based on primary and alternative target audiences.
- **Custom Tone & Vibe**: Tailors the language to match your brand personality (e.g., Professional, Energetic, Formal).
- **Campaign Timeline**: Provides a structured schedule of posts with simulated dates and times leading up to the event.
- **Visual Asset Management**: Allows easy management of event imagery and sponsor logos.

## How to Run Locally

### Prerequisites

- **Node.js** (v18 or higher recommended)
- **AWS Credentials**: The app uses AWS Bedrock for content generation. Ensure you have access to a supported model (e.g., Amazon Titan).

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env` file in the root directory (using `.env.example` as a template) and add your AWS credentials:

```env
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=amazon.titan-text-express-v1
```

### 3. Start the Development Server

```bash
npm run dev
```

The app will be accessible at [http://localhost:3000](http://localhost:3000).

---

## Run with Docker

If you prefer to use Docker, follow these steps:

### 1. Build the Image

```bash
docker build -t promopulse-app .
```

### 2. Run the Container

```bash
docker run -p 3000:3000 \
  -e AWS_ACCESS_KEY_ID=your_access_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret_key \
  -e AWS_REGION=us-east-1 \
  -e AWS_BEDROCK_MODEL_ID=amazon.titan-text-express-v1 \
  promopulse-app
```
