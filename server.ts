import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AWS Bedrock Client
  const getBedrockClient = () => {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    const region = process.env.AWS_REGION || 'us-east-1';

    if (!accessKeyId || !secretAccessKey) {
      return null;
    }

    return new BedrockRuntimeClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  };

  // API Routes
  app.get('/api/config-status', (req, res) => {
    res.json({
      awsConfigured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      region: process.env.AWS_REGION || 'us-east-1',
      modelId: process.env.AWS_BEDROCK_MODEL_ID || 'amazon.titan-text-express-v1'
    });
  });

  app.post('/api/generate-posts', async (req, res) => {
    const { event, demo } = req.body;

    if (demo) {
      // Return realistic mock data for demo purposes
      return res.json({
        marketingPlan: `Our primary strategy for ${event.eventName} focuses on high-impact engagement across ${event.channels.join(', ')}. Targetting ${event.primaryTargetAudience} primarily, we will leverage a ${event.tone} tone to build excitement and drive conversions. Our goal is to ${event.goals} within a budget of ${event.budget}.`,
        posts: [
          { id: '1', interval: "4 weeks before", channel: event.channels[0] || 'Facebook', content: `Get ready for ${event.eventName}! 🏃‍♂️\n\nRegistration is now officially open. Join ${event.companyName} at ${event.location} for an unforgettable day.\n\nTickets: ${event.ticketPrices}\n\n#Promotion #Event`, suggestedImageUrl: "A vibrant photo of runners at the starting line during sunrise.", scheduledDate: "2024-05-01", scheduledTime: "10:00 AM" },
          { id: '2', interval: "2 weeks before", channel: event.channels[1] || 'Instagram', content: "Training update! 👟 14 days until the big day. Our sponsors are helping us make this the best event yet.\n\nLast few spots at the early price!", suggestedImageUrl: "Close up of high-quality running shoes on a paved path.", scheduledDate: "2024-05-15", scheduledTime: "02:00 PM" },
          { id: '3', interval: "1 week before", channel: event.channels[0] || 'Facebook', content: "Only 7 days to go! 🗓️ Check out the official route for ${event.eventName}. We can't wait to see you all on the track.\n\nPrices: ${event.ticketPrices}", suggestedImageUrl: "A map illustration of the event route with colorful markers.", scheduledDate: "2024-05-22", scheduledTime: "09:00 AM" },
        ]
      });
    }

    const client = getBedrockClient();

    if (!client) {
      return res.status(400).json({ 
        error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in the Secrets panel.' 
      });
    }

    const modelId = process.env.AWS_BEDROCK_MODEL_ID || 'amazon.titan-text-express-v1';

    const prompt = `
      You are an expert social media manager. Generate a comprehensive marketing plan and a series of promotional posts for the following event:
      
      Event Name: ${event.eventName}
      Company: ${event.companyName}
      Description: ${event.eventDescription}
      Location: ${event.location}
      Start Date: ${event.startDate}
      End Date: ${event.endDate}
      Ticket Prices/Earning Strategy: ${event.ticketPrices}
      Sponsors: ${event.sponsors.map((s: any) => s.name).join(', ')}
      
      Marketing Strategy Context:
      Primary Target Audience: ${event.primaryTargetAudience}
      Secondary Audiences: ${event.secondaryAudiences.join(', ')}
      Channels: ${event.channels.join(', ')}
      Tone/Vibe: ${event.tone}
      Marketing Goals: ${event.goals}
      Total Budget: ${event.budget}
      Target Post Count: ${event.postCount}
      
      Requirements:
      1. Create a "marketingPlan" summary (approx 200 words) outlining the strategy.
      2. Generate exactly ${event.postCount} promotional posts distributed across the selected channels (${event.channels.join(', ')}).
      3. For each post, include:
         - "interval": Timing (e.g., "4 weeks before", "3 days before")
         - "channel": Which channel this post is for
         - "content": Engaging text with emojis
         - "suggestedImageUrl": Descriptive image suggestion
         - "scheduledDate": A simulated date based on the event start date
         - "scheduledTime": A simulated time of day
      
      Format the response STRICTLY as a JSON object with:
      "marketingPlan": string
      "posts": array of objects with keys ["id", "interval", "channel", "content", "suggestedImageUrl", "scheduledDate", "scheduledTime"]
    `;

    try {
      const input = {
        modelId,
        contentType: "application/json",
        accept: "application/json",
        body: JSON.stringify({
          inputText: prompt,
          textGenerationConfig: {
            maxTokenCount: 3072,
            temperature: 0.7,
            topP: 0.9,
          },
        }),
      };

      const command = new InvokeModelCommand(input);
      const response = await client.send(command);
      
      const responseBody = JSON.parse(new TextDecoder().decode(response.body));
      const rawOutput = responseBody.results[0].outputText;
      
      // Attempt to extract JSON object
      const jsonMatch = rawOutput.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
          console.error("Failed to parse JSON from Bedrock output:", rawOutput);
          throw new Error("Invalid AI response format");
      }
      
      const result = JSON.parse(jsonMatch[0]);
      res.json(result);

    } catch (error: any) {
      console.error('Bedrock Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
