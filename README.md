# 🤖 AI/ML To Do List

A smart todo list application built with React, featuring AI-powered categorization, priority prediction, sentiment analysis, and comprehensive user management.

## 🌟 Features

### 🧠 AI/ML Capabilities
- **Smart Categorization**: Automatically categorizes tasks using TensorFlow.js and machine learning
- **Priority Prediction**: Intelligent priority assignment based on task content and urgency keywords
- **Sentiment Analysis**: Analyzes task sentiment and displays mood indicators
- **Time Estimation**: Predicts completion time for tasks based on complexity
- **Smart Suggestions**: Autocomplete suggestions based on existing tasks and fuzzy matching

### 👥 User Management
- **Multi-user Authentication**: Email/password based user accounts
- **Admin Dashboard**: Comprehensive admin panel for user and todo management
- **Real-time Sync**: Automatic profile updates across sessions
- **User Roles**: Admin and regular user permissions

### ☁️ Cloud Integration
- **AWS DynamoDB**: Secure cloud storage for all user data and todos
- **Real-time Updates**: Automatic synchronization across devices
- **Scalable Architecture**: Production-ready cloud infrastructure

### 📱 Mobile Optimized
- **Responsive Design**: Mobile-first approach with touch-friendly interactions
- **PWA Ready**: Progressive Web App capabilities
- **Cross-platform**: Works seamlessly on desktop, tablet, and mobile

## 🛠️ Technologies Used

- **Frontend**: React with Vite, modern CSS with responsive design
- **AI/ML**: TensorFlow.js, Universal Sentence Encoder
- **NLP**: Compromise.js for natural language processing, Sentiment analysis
- **Search**: Fuse.js for fuzzy string matching
- **Cloud**: AWS DynamoDB, S3 static hosting
- **Authentication**: Custom JWT-like session management

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ and npm
- AWS account with DynamoDB access

### Installation

1. Clone the repository:
```bash
git clone https://github.com/theogyeezy/ai-ml-todo-list.git
cd ai-ml-todo-list
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Edit `.env` and add your AWS credentials:
```
VITE_AWS_ACCESS_KEY_ID=your_aws_access_key_here
VITE_AWS_SECRET_ACCESS_KEY=your_aws_secret_key_here
```

5. Start the development server:
```bash
npm run dev
```

6. Open your browser and navigate to the displayed local server URL.

### AWS Setup

1. Create DynamoDB tables:
   - `TodoApp` (Partition key: `userId`, Sort key: `todoId`)
   - `TodoUsers` (Partition key: `email`)

2. Configure IAM permissions for DynamoDB access

See `aws-setup.md` for detailed AWS configuration instructions.

## 🏗️ Building for Production

```bash
npm run build
```

Deploy the `dist` folder to your preferred static hosting service.

## 🌐 Live Demo

The application is deployed on AWS S3: [Live Demo](http://ai-todo-app-matthew-1757183940.s3-website-us-east-1.amazonaws.com)

## 🤖 AI Features in Detail

### Smart Categorization
Automatic categorization into:
- **Work**: Professional tasks and meetings
- **Personal**: Life management and personal goals
- **Shopping**: Purchases and errands
- **Health**: Fitness, medical, and wellness
- **Learning**: Education and skill development
- **Other**: Miscellaneous tasks

### Priority Detection
- **Urgent**: "urgent", "ASAP", "emergency", "critical"
- **High**: Time-sensitive language, deadlines, important keywords
- **Normal**: Standard task language
- **Low**: Casual language, non-urgent items

### Sentiment Analysis
- Emotional tone analysis with mood indicators
- Sentiment scores from -1 (negative) to +1 (positive)
- Visual feedback with emojis: 😊 😐 😟

### Time Estimation
- **Quick** (15-30 min): Simple, straightforward tasks
- **Medium** (1-2 hours): Moderate complexity tasks
- **Long** (3+ hours): Complex, involved tasks

## 👨‍💼 Admin Features

### User Management
- View all registered users
- Edit user details (name, status)
- Activate/deactivate user accounts
- Reset user passwords
- Delete users (except self)

### Todo Management
- View all todos across all users
- Edit and delete any user's todos
- Toggle completion status
- Real-time statistics and analytics

### Access Control
- Admin role assignment: `matt.sam.yee@gmail.com`
- Protected admin routes and functions
- Crown indicator (👑) for admin users

## 📊 Architecture

```
Frontend (React + Vite)
├── Authentication Layer
├── AI/ML Processing (TensorFlow.js)
├── State Management (React Hooks)
└── UI Components (Mobile-First)

Backend Services
├── AWS DynamoDB (Data Storage)
├── IAM (Access Control)
└── S3 (Static Hosting)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🏆 Acknowledgments

- Built as a learning exercise for AI/ML integration in web applications
- Demonstrates modern React patterns and AWS cloud integration
- Showcases practical machine learning applications in productivity tools