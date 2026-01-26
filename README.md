<div align="center">
  <img src="./public/apple-touch-icon.png" alt="Dropdawn Logo" width="100" style="border-radius: 18px" />
</div>

# Dropdawn

AI-powered chat workspace featuring some integrated tools like web search, PDF generation, and more. Built for speed and flexibility.

## Tech Stack

- **Framework**: Next.js 14+, TypeScript
- **Styling**: Tailwind CSS, Framer Motion, Shadcn UI
- **AI**: Vercel AI SDK (Google, Mistral, Cohere, OpenAI)
- **Backend & Auth**: Supabase
- **Tools**: Tavily (Search), Cloudinary (Images)

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js**: Version 20.x or later recommended (LTS). [Download Node.js](https://nodejs.org/)
- **Git**: To clone the repository. [Download Git](https://git-scm.com/)
- **npm** (comes with Node.js) or **yarn** / **pnpm** package managers.

## Getting Started

Follow these steps to get a local copy up and running.

### 1. Clone the Repository

Open your terminal and run the following command to clone the repo:

```bash
git clone https://github.com/bikash1376/dawn.git
cd dawn
```

> **Note**: Replace the URL with the specific repository URL if different.

### 2. Install Dependencies

Install the project dependencies using npm:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Configure Environment Variables

Create a copy of the environment file to set up your keys.

1. Create a file named `.env` in the root directory.
2. Add the following variables (you will need API keys from the respective providers):

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Model Providers
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_key
MISTRAL_API_KEY=your_mistral_key
COHERE_API_KEY=your_cohere_key
OPENAI_API_KEY=your_openai_key

# External Tools
TAVILY_API_KEY=your_tavily_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### 4. Run the Development Server

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Contributing

We welcome contributions! usage guide:

1.  **Fork the Project**: Click the 'Fork' button at the top right of the repository page.
2.  **Create your Feature Branch**:
    ```bash
    git checkout -b feature/AmazingFeature
    ```
3.  **Commit your Changes**:
    ```bash
    git commit -m 'Add some AmazingFeature'
    ```
4.  **Push to the Branch**:
    ```bash
    git push origin feature/AmazingFeature
    ```
5.  **Open a Pull Request**: Go to the original repository and click "New Pull Request".

## License

Distributed under the MIT License. See `LICENSE` for more information.
