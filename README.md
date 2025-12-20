# AHP Form Interface

An automated system for expert form evaluation with acceptance/rejection functionality and aggregated calculation display.



## Overview

This project automates the Analytic Hierarchy Process (AHP) form evaluation workflow. The interface streamlines expert form submissions, evaluation processes, and provides automated acceptance or rejection decisions. Additionally, the system calculates and displays aggregated results with complete calculation breakdowns for transparency and verification.

## Features

- **Expert Form Automation**: Streamlined process for expert form submissions
- **Evaluation System**: Automated evaluation of submitted forms
- **Acceptance/Rejection Logic**: Built-in decision-making system for form approval
- **Aggregated Calculations**: Comprehensive calculation of results from multiple experts
- **Complete Calculation Display**: Transparent view of all calculation steps and methodologies
- **Real-time Processing**: Immediate feedback on form submissions and evaluations

## Live Demo

Check out the live application: **[https://v0-ahp-form-interface-ajao.vercel.app/](https://v0-ahp-form-interface-ajao.vercel.app/)**

## How It Works

1. Experts submit their evaluation forms through the interface
2. The system processes and evaluates the submissions
3. Automated acceptance or rejection decisions are made based on defined criteria
4. Aggregated calculations are performed across all expert inputs
5. Complete calculation breakdowns are displayed for verification
6. Results are presented in an intuitive and transparent manner

## Installation

To run this project locally:

1. Clone the repository:
   ```bash
   git clone https://github.com/[your-username]/v0-ahp-form-interface.git
   cd v0-ahp-form-interface
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Set up environment variables (if any):
   ```bash
   cp .env.example .env.local
   # Then update the .env.local file with your configuration
   ```

4. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Technologies Used

- Next.js
- TypeScript
- Tailwind CSS
- Supabase (for database and authentication)
- Vercel (for deployment)

## Contributing

Feel free to contribute to this project by submitting issues or pull requests. For major changes, please open an issue first to discuss what you would like to change.
