# Dishari: Gesture-Based Application for ASL Recognition

Dishari is an innovative web application that leverages MediaPipe's Gesture Recognizer to capture and interpret hand gestures in real-time. This project is designed to recognize American Sign Language (ASL) gestures, providing an accessible interface that translates these gestures into actionable commands or search queries. The application is built using Next.js for both the front-end and API functionalities, offering a seamless and responsive user experience.

## Features

- **Real-Time Gesture Recognition:** Utilizes MediaPipe's Gesture Recognizer for detecting and interpreting hand gestures with high accuracy.
- **ASL Support:** The model is trained on the American Sign Language (ASL) Alphabet Dataset from Kaggle, ensuring accurate recognition of ASL gestures.
- **Generative AI-Powered Search:** Integrates OpenAI's GPT models to generate search results based on recognized gestures, enhancing user interaction.
- **User-Friendly Interface:** Built with Next.js, providing a fast, responsive, and intuitive user interface.

## Prerequisites

Before running the project locally, ensure you have the following installed on your machine:

- [Node.js](https://nodejs.org/) (version 14 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Git](https://git-scm.com/)

## Installation

Follow the steps below to clone and run the project locally:

1. **Clone the repository:**

   ```bash
   git clone https://github.com/irshad-ali-md/dishari.git
   ```
2. **Run the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

