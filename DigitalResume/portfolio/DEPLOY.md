# How to Deploy to Vercel

You have a modern React + Tailwind CSS application ready to be deployed.

## Option 1: Deploy with Vercel CLI (Recommended if installed)

If you have the `vercel` CLI installed and authenticated:

1.  Open your terminal in the `portfolio` directory:
    ```bash
    cd portfolio
    ```
2.  Run the deploy command:
    ```bash
    vercel
    ```
3.  Follow the prompts:
    -   Set up and deploy? **Yes**
    -   Which scope? (Select your account)
    -   Link to existing project? **No**
    -   Project name? **portfolio** (or your choice)
    -   Directory? **.** (Current directory)
    -   It will auto-detect settings (Vite). Default settings are usually correct.
    -   Want to modify settings? **No**

## Option 2: Deploy via Vercel Dashboard (Git)

1.  Push this `portfolio` directory to a GitHub/GitLab/Bitbucket repository.
2.  Log in to [Vercel](https://vercel.com).
3.  Click **Add New...** -> **Project**.
4.  Import your repository.
5.  Vercel will detect it's a Vite project.
6.  Click **Deploy**.

## Deployment Settings (If asked)

-   **Framework Preset**: Vite
-   **Root Directory**: `portfolio` (if your repo has `portfolio` as a subdirectory) or `.` (if repo root is the project)
-   **Build Command**: `npm run build`
-   **Output Directory**: `dist`
-   **Install Command**: `npm install`
