const fs = require('fs');

const techDetails = {
  // Provided by User
  "HTML5": {
    "name": "HTML5",
    "category": "Markup Language",
    "description": "HTML5 is the standard markup language used to structure content on web pages.",
    "features": ["Semantic Elements", "Audio & Video Support", "Forms & Validation", "Accessibility Support"],
    "useCases": ["Website Structure", "Landing Pages", "Web Applications"]
  },
  "CSS3": {
    "name": "CSS3",
    "category": "Styling Language",
    "description": "CSS3 is used to style and design web pages, including layouts, colors, animations, and responsiveness.",
    "features": ["Flexbox", "Grid Layout", "Animations", "Media Queries"],
    "useCases": ["Responsive Design", "UI Development", "Animations"]
  },
  "JavaScript": {
    "name": "JavaScript",
    "category": "Programming Language",
    "description": "JavaScript is a scripting language used to create dynamic and interactive web applications.",
    "features": ["DOM Manipulation", "Event Handling", "Async Programming", "API Integration"],
    "useCases": ["Interactive Websites", "Frontend Logic", "Real-time Applications"]
  },
  "TypeScript": {
    "name": "TypeScript",
    "category": "Programming Language",
    "description": "TypeScript is a strongly typed superset of JavaScript that improves code quality and maintainability.",
    "features": ["Static Typing", "Interfaces", "Better IDE Support", "Scalable Codebase"],
    "useCases": ["Large Applications", "Enterprise Projects", "React Applications"]
  },
  "React.js": {
    "name": "React.js",
    "category": "Frontend Library",
    "description": "React is a JavaScript library used to build reusable UI components and single-page applications.",
    "features": ["Virtual DOM", "Component-Based Architecture", "Hooks", "State Management"],
    "useCases": ["Dashboards", "SaaS Products", "E-commerce Sites"]
  },
  "Next.js": {
    "name": "Next.js",
    "category": "React Framework",
    "description": "Next.js is a React framework that provides server-side rendering, static site generation, and API routes.",
    "features": ["SSR", "SSG", "SEO Optimization", "API Routes"],
    "useCases": ["Portfolio Websites", "SaaS Platforms", "Enterprise Applications"]
  },
  "Tailwind CSS": {
    "name": "Tailwind CSS",
    "category": "CSS Framework",
    "description": "Tailwind CSS is a utility-first CSS framework for rapidly building modern user interfaces.",
    "features": ["Utility Classes", "Responsive Design", "Dark Mode", "Fast Development"],
    "useCases": ["Portfolio Websites", "Dashboards", "Admin Panels"]
  },
  "Python": {
    "name": "Python",
    "category": "Programming Language",
    "description": "Python is a high-level programming language widely used for web development, AI/ML, automation, and data analysis.",
    "features": ["Easy Syntax", "Large Ecosystem", "Cross Platform", "AI/ML Support"],
    "useCases": ["Backend Development", "Machine Learning", "Automation"]
  },
  "Django": {
    "name": "Django",
    "category": "Backend Framework",
    "description": "Django is a high-level Python framework for building secure and scalable web applications.",
    "features": ["ORM", "Authentication", "Admin Panel", "Security"],
    "useCases": ["ERP Systems", "SaaS Products", "Healthcare Systems"]
  },
  "FastAPI": {
    "name": "FastAPI",
    "category": "API Framework",
    "description": "FastAPI is a modern Python framework used to build high-performance REST APIs.",
    "features": ["Fast Performance", "Async Support", "Swagger Documentation", "Type Hints"],
    "useCases": ["AI APIs", "Microservices", "Backend Services"]
  },
  "Node.js": {
    "name": "Node.js",
    "category": "Runtime Environment",
    "description": "Node.js allows JavaScript to run on the server side.",
    "features": ["Non-blocking I/O", "Event Driven", "High Performance"],
    "useCases": ["REST APIs", "Real-time Applications", "Microservices"]
  },
  "PostgreSQL": {
    "name": "PostgreSQL",
    "category": "Relational Database",
    "description": "PostgreSQL is an advanced open-source relational database known for reliability and performance.",
    "features": ["ACID Compliance", "JSON Support", "Complex Queries", "Scalability"],
    "useCases": ["Enterprise Systems", "Analytics Platforms", "ERP Solutions"]
  },
  "MySQL": {
    "name": "MySQL",
    "category": "Relational Database",
    "description": "MySQL is a popular open-source relational database management system.",
    "features": ["Fast Queries", "Easy Management", "Wide Adoption"],
    "useCases": ["Web Applications", "CMS Systems", "E-commerce Platforms"]
  },
  "Redis": {
    "name": "Redis",
    "category": "In-Memory Database",
    "description": "Redis is an in-memory data store used for caching and real-time applications.",
    "features": ["Extremely Fast", "Pub/Sub", "Caching", "Session Storage"],
    "useCases": ["Caching", "Real-time Chat", "Queue Systems"]
  },
  "TensorFlow": {
    "name": "TensorFlow",
    "category": "Machine Learning Framework",
    "description": "TensorFlow is an open-source platform for machine learning and deep learning development.",
    "features": ["Neural Networks", "GPU Support", "Model Deployment"],
    "useCases": ["Image Recognition", "NLP", "Recommendation Systems"]
  },
  "PyTorch": {
    "name": "PyTorch",
    "category": "Machine Learning Framework",
    "description": "PyTorch is a deep learning framework known for flexibility and research-friendly development.",
    "features": ["Dynamic Computation Graph", "GPU Acceleration", "Easy Debugging"],
    "useCases": ["Computer Vision", "NLP", "AI Research"]
  },
  "Scikit-Learn": {
    "name": "Scikit-Learn",
    "category": "Machine Learning Library",
    "description": "Scikit-learn is a Python library used for classical machine learning algorithms.",
    "features": ["Classification", "Regression", "Clustering", "Model Evaluation"],
    "useCases": ["Prediction Systems", "Analytics", "Data Science"]
  },
  "Docker": {
    "name": "Docker",
    "category": "Containerization Platform",
    "description": "Docker packages applications and dependencies into portable containers.",
    "features": ["Containerization", "Environment Consistency", "Easy Deployment"],
    "useCases": ["Deployment", "Microservices", "CI/CD"]
  },
  "Kubernetes": {
    "name": "Kubernetes",
    "category": "Container Orchestration",
    "description": "Kubernetes automates deployment, scaling, and management of containerized applications.",
    "features": ["Auto Scaling", "Load Balancing", "Self Healing"],
    "useCases": ["Enterprise Deployment", "Cloud Infrastructure"]
  },
  "AWS": {
    "name": "AWS",
    "category": "Cloud Platform",
    "description": "AWS is a cloud computing platform offering infrastructure, storage, and AI services.",
    "features": ["EC2", "S3", "RDS", "Lambda"],
    "useCases": ["Hosting", "Data Storage", "Cloud Applications"]
  },
  "Git": {
    "name": "Git",
    "category": "Version Control",
    "description": "Git is a distributed version control system used to track code changes.",
    "features": ["Branching", "Merging", "Collaboration"],
    "useCases": ["Source Code Management", "Team Collaboration"]
  },
  "GitHub": {
    "name": "GitHub",
    "category": "Code Hosting Platform",
    "description": "GitHub is a platform for hosting and managing Git repositories.",
    "features": ["Pull Requests", "Actions", "Issues", "Repository Hosting"],
    "useCases": ["Open Source", "Team Development", "CI/CD"]
  },
  
  // Auto-filled missing tech
  "Flask": {
    "name": "Flask",
    "category": "Backend Framework",
    "description": "Flask is a lightweight and extensible WSGI web application framework for Python.",
    "features": ["Microframework", "Jinja2 Templating", "Flexible Routing", "High Customizability"],
    "useCases": ["Small Web Apps", "API Development", "Prototyping"]
  },
  "REST APIs": {
    "name": "REST APIs",
    "category": "Architecture Style",
    "description": "REST is an architectural style for providing standards between computer systems on the web.",
    "features": ["Stateless", "Client-Server Architecture", "Cacheable", "Uniform Interface"],
    "useCases": ["Web Services", "Microservices Communication", "Mobile App Backends"]
  },
  "JWT Authentication": {
    "name": "JWT Authentication",
    "category": "Security Standard",
    "description": "JSON Web Tokens are an open standard for securely transmitting information between parties as a JSON object.",
    "features": ["Stateless", "Compact", "Self-contained", "Secure Verification"],
    "useCases": ["User Authentication", "Single Sign-On", "API Authorization"]
  },
  "Bootstrap": {
    "name": "Bootstrap",
    "category": "CSS Framework",
    "description": "Bootstrap is a popular open-source CSS framework directed at responsive, mobile-first front-end web development.",
    "features": ["Grid System", "Pre-built Components", "Responsive Design", "JavaScript Plugins"],
    "useCases": ["Rapid Prototyping", "Admin Dashboards", "Web Applications"]
  },
  "MongoDB": {
    "name": "MongoDB",
    "category": "NoSQL Database",
    "description": "MongoDB is a source-available cross-platform document-oriented database program classified as a NoSQL database.",
    "features": ["Document-oriented", "High Availability", "Horizontal Scalability", "Flexible Schema"],
    "useCases": ["Content Management", "Real-time Analytics", "IoT Data"]
  },
  "SQLite": {
    "name": "SQLite",
    "category": "Relational Database",
    "description": "SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine.",
    "features": ["Serverless", "Zero-configuration", "Cross-platform", "Compact"],
    "useCases": ["Mobile Apps", "Desktop Apps", "Embedded Systems"]
  },
  "Database Design": {
    "name": "Database Design",
    "category": "Concept",
    "description": "Database design is the organization of data according to a database model.",
    "features": ["Normalization", "Entity-Relationship Modeling", "Schema Definition", "Indexing"],
    "useCases": ["System Architecture", "Data Integrity", "Performance Optimization"]
  },
  "Query Optimization": {
    "name": "Query Optimization",
    "category": "Performance Tuning",
    "description": "The process of modifying database queries to execute efficiently and use minimal resources.",
    "features": ["Index Usage", "Execution Plans", "Caching", "Reduced I/O"],
    "useCases": ["Scaling Databases", "Improving App Speed", "Reducing Server Load"]
  },
  "Pandas": {
    "name": "Pandas",
    "category": "Data Analysis Library",
    "description": "Pandas is a fast, powerful, flexible and easy to use open source data analysis and manipulation tool.",
    "features": ["DataFrames", "Time Series Support", "Data Alignment", "Missing Data Handling"],
    "useCases": ["Data Cleaning", "Data Exploration", "Feature Engineering"]
  },
  "NumPy": {
    "name": "NumPy",
    "category": "Scientific Computing Library",
    "description": "NumPy is the fundamental package for scientific computing with Python.",
    "features": ["N-dimensional Arrays", "Mathematical Functions", "Linear Algebra", "Random Number Generation"],
    "useCases": ["Scientific Computing", "Machine Learning Data Prep", "Image Processing"]
  },
  "Matplotlib": {
    "name": "Matplotlib",
    "category": "Data Visualization Library",
    "description": "Matplotlib is a comprehensive library for creating static, animated, and interactive visualizations in Python.",
    "features": ["2D Plotting", "Customizable Figures", "Export Capabilities", "Integration with Pandas"],
    "useCases": ["Data Visualization", "Scientific Reporting", "Exploratory Analysis"]
  },
  "OpenAI APIs": {
    "name": "OpenAI APIs",
    "category": "AI Services",
    "description": "OpenAI's API provides access to state-of-models for natural language processing, image generation, and more.",
    "features": ["GPT Models", "Embeddings", "Fine-tuning", "Vision Models"],
    "useCases": ["Chatbots", "Content Generation", "Semantic Search"]
  },
  "LangChain": {
    "name": "LangChain",
    "category": "LLM Framework",
    "description": "LangChain is a framework designed to simplify the creation of applications using large language models.",
    "features": ["Chains", "Agents", "Memory", "Vector Store Integration"],
    "useCases": ["Q&A Systems", "Document Summarization", "Autonomous Agents"]
  },
  "FAISS / ChromaDB": {
    "name": "FAISS / ChromaDB",
    "category": "Vector Database",
    "description": "Vector databases and libraries optimized for efficient similarity search and clustering of dense vectors.",
    "features": ["Similarity Search", "Vector Embeddings", "High Performance", "Scalability"],
    "useCases": ["Semantic Search", "Recommendation Engines", "RAG Systems"]
  },
  "Whisper": {
    "name": "Whisper",
    "category": "AI Model",
    "description": "Whisper is an automatic speech recognition (ASR) system trained on hours of multilingual and multitask supervised data.",
    "features": ["Speech-to-Text", "Multilingual Support", "Translation", "Robustness"],
    "useCases": ["Transcription Services", "Voice Assistants", "Accessibility"]
  },
  "Ollama": {
    "name": "Ollama",
    "category": "LLM Runtime",
    "description": "Ollama allows you to get up and running with large language models locally.",
    "features": ["Local Execution", "Model Management", "API Support", "Privacy"],
    "useCases": ["Local AI Agents", "Offline Inference", "Prototyping"]
  },
  "RAG Systems": {
    "name": "RAG Systems",
    "category": "AI Architecture",
    "description": "Retrieval-Augmented Generation (RAG) improves LLM responses by grounding them in external knowledge bases.",
    "features": ["Document Retrieval", "Contextual Generation", "Reduced Hallucinations", "Dynamic Data"],
    "useCases": ["Enterprise Search", "Knowledge Bots", "Customer Support"]
  },
  "Linux": {
    "name": "Linux",
    "category": "Operating System",
    "description": "Linux is a family of open-source Unix-like operating systems based on the Linux kernel.",
    "features": ["Open Source", "Security", "Stability", "Command Line Interface"],
    "useCases": ["Server Hosting", "Development Environments", "Containerization"]
  },
  "Nginx": {
    "name": "Nginx",
    "category": "Web Server",
    "description": "Nginx is a web server that can also be used as a reverse proxy, load balancer, mail proxy and HTTP cache.",
    "features": ["High Performance", "Reverse Proxy", "Load Balancing", "SSL Termination"],
    "useCases": ["Web Hosting", "Microservices Routing", "Caching"]
  },
  "Playwright": {
    "name": "Playwright",
    "category": "Browser Automation",
    "description": "Playwright is a modern framework for reliable end-to-end testing and stealth browser automation across web browsers.",
    "features": ["Multi-browser Support", "Auto-wait API", "Network interception", "Stealth evasion support"],
    "useCases": ["Web Scraping", "End-to-End Testing", "Browser Automation"]
  },
  "Celery": {
    "name": "Celery",
    "category": "Task Queue",
    "description": "Celery is an asynchronous task queue/job queue based on distributed message passing to handle background processing.",
    "features": ["Asynchronous Execution", "Task Scheduling", "Real-time Processing", "Highly Available"],
    "useCases": ["Background Tasks", "Job Scheduling", "Microservices communication"]
  },
  "ML/AI": {
    "name": "ML/AI",
    "category": "Artificial Intelligence",
    "description": "Machine Learning and Artificial Intelligence algorithms for pattern recognition, prediction, and automation.",
    "features": ["Supervised Learning", "Unsupervised Learning", "Neural Networks", "Natural Language Processing"],
    "useCases": ["Predictive Analytics", "Object Detection", "Recommendation Engines"]
  },
  "LLM APIs": {
    "name": "LLM APIs",
    "category": "AI Services",
    "description": "APIs providing access to Large Language Models (such as OpenAI, Anthropic, Gemini) for processing natural language tasks.",
    "features": ["Text Generation", "Sentiment Analysis", "Language Translation", "Semantic Embeddings"],
    "useCases": ["Virtual Assistants", "Content Generation", "Automated Workflows"]
  }
};

['data/draft.json', 'data/published.json'].forEach(file => {
  if (fs.existsSync(file)) {
    let data = JSON.parse(fs.readFileSync(file, 'utf8'));
    data.techDetails = techDetails;
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
    console.log('Added tech details to ' + file);
  }
});
